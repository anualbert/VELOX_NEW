import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from pydantic import BaseModel
import cv2
import numpy as np
import time
import secrets
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# DATABASE
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Float, DateTime, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

from passlib.context import CryptContext

# VELOX MODEL
from vision_engine import analyze_face
from engagement_logic import calculate_score
from smart_engagement import process_frame


LEVEL_NAMES = {
    0: "Very Low",
    1: "Low",
    2: "High",
    3: "Very High"
}

# ---------------- CONFIG ----------------

DATABASE_URL = "sqlite:///./velox.db"

engine_db = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine_db, autoflush=False)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

active_sessions = {}

# ---------------- DATABASE MODELS ----------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_classes = relationship("Classroom", back_populates="teacher")
    enrollments = relationship("Enrollment", back_populates="student")


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    code = Column(String, unique=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    active_meeting_link = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("User", back_populates="created_classes")
    enrollments = relationship("Enrollment", back_populates="classroom")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    joined_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="enrollments")
    classroom = relationship("Classroom", back_populates="enrollments")


class SessionLog(Base):
    __tablename__ = "session_logs"

    id = Column(Integer, primary_key=True)
    classroom_id = Column(Integer)
    student_id = Column(Integer)
    participant_name = Column(String, nullable=True)
    engagement_score = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine_db)

# Lightweight SQLite migration for existing DBs (create_all doesn't alter tables)
try:
    with engine_db.connect() as conn:
        cols = conn.execute(text("PRAGMA table_info(session_logs)")).fetchall()
        col_names = {c[1] for c in cols}  # (cid, name, type, notnull, dflt_value, pk)
        if "participant_name" not in col_names:
            conn.execute(text("ALTER TABLE session_logs ADD COLUMN participant_name VARCHAR"))
            conn.commit()
except Exception as e:
    print("DB migration warning (session_logs.participant_name):", e)


def _normalize_name(name: Optional[str]) -> Optional[str]:
    if not name:
        return None
    n = " ".join(str(name).strip().split())
    return n if n else None


def resolve_student_id_by_name(db: Session, class_id: int, participant_name: str) -> Optional[int]:
    """
    Best-effort mapping: match Meet display name to enrolled student's full_name (case-insensitive).
    """
    participant_name_norm = _normalize_name(participant_name)
    if not participant_name_norm:
        return None

    # Only match against students who are enrolled in this class
    enrolled = (
        db.query(User.id, User.full_name)
        .join(Enrollment, Enrollment.student_id == User.id)
        .filter(Enrollment.classroom_id == class_id)
        .all()
    )

    target = participant_name_norm.casefold()
    for sid, full_name in enrolled:
        if not full_name:
            continue
        if _normalize_name(full_name).casefold() == target:
            return int(sid)

    return None

# ---------------- AUTH HELPERS ----------------

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(p, h):
    return pwd_context.verify(p, h)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- SCHEMAS ----------------

class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class ClassroomCreate(BaseModel):
    name: str
    teacher_id: int

class JoinClass(BaseModel):
    code: str
    student_id: int

class EngagementPayload(BaseModel):
    engagement_score: float
    status: str
    emotion: Optional[str] = "Neutral"
    student_id: int
    class_id: int

class LeaveClassDBPayload(BaseModel):
    student_id: int
    class_id: int

class LeaveClassPayload(BaseModel):
    student_id: int

# ---------------- FASTAPI ----------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("VELOX Backend Started")
    yield

app = FastAPI(lifespan=lifespan)

# ---------------- CORS ----------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- WEBSOCKET ----------------

class ConnectionManager:

    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, class_id: int):
        await websocket.accept()

        if class_id not in self.active_connections:
            self.active_connections[class_id] = []

        self.active_connections[class_id].append(websocket)

    def disconnect(self, websocket: WebSocket, class_id: int):
        if class_id in self.active_connections:
            if websocket in self.active_connections[class_id]:
                self.active_connections[class_id].remove(websocket)

    async def broadcast(self, class_id: int, message: dict):

        if class_id in self.active_connections:
            for connection in self.active_connections[class_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

@app.websocket("/ws/teacher/{class_id}")
async def websocket_endpoint(websocket: WebSocket, class_id: int):

    await manager.connect(websocket, class_id)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket, class_id)

# ---------------- HEALTH CHECK ----------------

@app.get("/")
def health():
    return {"status": "ok", "message": "VELOX Backend Running"}

# ---------------- AUTH ----------------

@app.post("/auth/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):

    existing = db.query(User).filter(User.username == user.username).first()

    if existing:
        raise HTTPException(status_code=400, detail="User exists")

    new_user = User(
        username=user.username,
        hashed_password=get_password_hash(user.password),
        role=user.role,
        full_name=user.full_name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"id": new_user.id, "username": new_user.username}

@app.post("/auth/login")
def login(data: UserLogin, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.username == data.username).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401)

    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name
    }

# ---------------- CLASSROOM ----------------

@app.post("/classroom/create")
def create_class(data: ClassroomCreate, db: Session = Depends(get_db)):

    code = secrets.token_hex(3).upper()

    new_class = Classroom(
        name=data.name,
        code=code,
        teacher_id=data.teacher_id
    )

    db.add(new_class)
    db.commit()
    db.refresh(new_class)

    return {"id": new_class.id, "code": new_class.code}

@app.post("/classroom/join")
def join_class(data: JoinClass, db: Session = Depends(get_db)):

    classroom = db.query(Classroom).filter(Classroom.code == data.code).first()

    if not classroom:
        raise HTTPException(status_code=404)

    enroll = Enrollment(
        student_id=data.student_id,
        classroom_id=classroom.id
    )

    db.add(enroll)
    db.commit()

    return {"message": "Joined", "class_id": classroom.id}

@app.get("/classroom/teacher/{teacher_id}")
def get_teacher_classes(teacher_id: int, db: Session = Depends(get_db)):
    classes = db.query(Classroom).filter(Classroom.teacher_id == teacher_id).all()
    return classes

@app.get("/classroom/student/{student_id}")
def get_student_classes(student_id: int, db: Session = Depends(get_db)):
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    classes = []
    for enr in enrollments:
        cls = enr.classroom
        if cls:
            teacher = db.query(User).filter(User.id == cls.teacher_id).first()
            teacher_name = teacher.full_name if teacher else "Unknown"
            classes.append({
                "id": cls.id,
                "name": cls.name,
                "code": cls.code,
                "active_meeting_link": cls.active_meeting_link,
                "teacher_name": teacher_name
            })
    return classes

@app.get("/classroom/{class_id}/students")
def get_class_students(class_id: int, db: Session = Depends(get_db)):
    enrollments = db.query(Enrollment).filter(Enrollment.classroom_id == class_id).all()
    students = []
    for enr in enrollments:
        student = enr.student
        if student:
            students.append({
                "id": student.id,
                "full_name": student.full_name,
                "username": student.username,
                "joined_at": enr.joined_at
            })
    return students

@app.post("/classroom/{class_id}/publish")
def publish_meeting_link(class_id: int, link: str, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    classroom.active_meeting_link = link
    db.commit()
    return {"status": "success"}

@app.post("/classroom/leave_db")
def leave_class_db(data: LeaveClassDBPayload, db: Session = Depends(get_db)):
    enroll = db.query(Enrollment).filter(
        Enrollment.student_id == data.student_id,
        Enrollment.classroom_id == data.class_id
    ).first()
    if enroll:
        db.delete(enroll)
        db.commit()
    return {"status": "left"}

@app.post("/classroom/leave")
def leave_class_session(data: LeaveClassPayload):
    if data.student_id in active_sessions:
        del active_sessions[data.student_id]
    return {"status": "left"}

@app.get("/classroom/{class_id}/live")
def get_live_class_data(class_id: int, db: Session = Depends(get_db)):
    enrollments = db.query(Enrollment).filter(Enrollment.classroom_id == class_id).all()
    students_data = []
    total_score = 0
    active_count = 0

    for enr in enrollments:
        student = enr.student
        if student:
            s_data = {
                "student_id": student.id,
                "name": student.full_name,
                "engagement_score": 0,
                "status": "Inactive",
                "emotion": "Neutral"
            }
            if student.id in active_sessions and active_sessions[student.id].get("class_id") == class_id:
                session = active_sessions[student.id]
                s_data["engagement_score"] = int(session.get("score", 0))
                s_data["status"] = session.get("status", "Active")
                s_data["emotion"] = session.get("emotion", "Neutral")
                total_score += s_data["engagement_score"]
                active_count += 1
            students_data.append(s_data)

    class_average = total_score / active_count if active_count > 0 else 0
    # Append unmatched (not enrolled / name mismatch) participants we are tracking live
    for key, session in list(active_sessions.items()):
        try:
            if not isinstance(key, int):
                continue
            if key > 0:
                continue  # enrolled students already represented above
            if session.get("class_id") != class_id:
                continue

            pname = session.get("participant_name") or "Unknown Participant"
            score = int(session.get("score", 0))
            status = session.get("status", "Active")
            emotion = session.get("emotion", "Neutral")

            students_data.append(
                {
                    "student_id": key,
                    "name": pname,
                    "engagement_score": score,
                    "status": status,
                    "emotion": emotion,
                }
            )
            total_score += score
            active_count += 1
        except Exception:
            continue

    class_average = total_score / active_count if active_count > 0 else 0
    return {
        "students": students_data,
        "class_average": int(class_average),
        "active_students": active_count
    }

@app.get("/classroom/{class_id}/report")
def get_class_report(class_id: int, db: Session = Depends(get_db)):
    """
    Report for teacher dashboard.
    Returns ALL enrolled students; if a student has no logs yet,
    average_engagement will be 0 (so UI doesn't look "broken").
    """
    from sqlalchemy import func

    # Enrolled students for the class
    enrolled_students = (
        db.query(User.id, User.full_name)
        .join(Enrollment, Enrollment.student_id == User.id)
        .filter(Enrollment.classroom_id == class_id)
        .all()
    )

    # Averages from session logs
    averages = dict(
        db.query(
            SessionLog.student_id,
            func.avg(SessionLog.engagement_score).label("average_engagement"),
        )
        .filter(SessionLog.classroom_id == class_id)
        .group_by(SessionLog.student_id)
        .all()
    )

    report = []
    for student_id, full_name in enrolled_students:
        avg = averages.get(student_id, 0) or 0
        report.append(
            {
                "student_id": student_id,
                "student_name": full_name or f"Student {student_id}",
                "average_engagement": round(float(avg), 2),
            }
        )

    # Include unmatched participants (teacher monitored, but name didn't match any enrolled student)
    unmatched = (
        db.query(
            SessionLog.participant_name,
            func.avg(SessionLog.engagement_score).label("average_engagement"),
        )
        .filter(
            SessionLog.classroom_id == class_id,
            SessionLog.student_id.is_(None),
            SessionLog.participant_name.isnot(None),
        )
        .group_by(SessionLog.participant_name)
        .all()
    )

    for pname, avg in unmatched:
        report.append(
            {
                "student_id": None,
                "student_name": f"{pname} (unmatched)",
                "average_engagement": round(float(avg or 0), 2),
            }
        )

    return report


@app.get("/classroom/{class_id}/db_status")
def get_db_status(class_id: int, db: Session = Depends(get_db)):
    """
    Quick sanity-check endpoint to confirm logs are being stored.
    """
    from sqlalchemy import func

    total_logs = (
        db.query(func.count(SessionLog.id))
        .filter(SessionLog.classroom_id == class_id)
        .scalar()
        or 0
    )
    latest = (
        db.query(func.max(SessionLog.timestamp))
        .filter(SessionLog.classroom_id == class_id)
        .scalar()
    )

    return {
        "class_id": class_id,
        "total_logs": int(total_logs),
        "latest_timestamp": latest.isoformat() if latest else None,
        "db_file_note": "Backend uses sqlite:///./velox.db relative to backend working directory.",
    }

# ---------------- SESSION ----------------

@app.post("/start_session")
def start_session(student_id: int, class_id: int):

    active_sessions[student_id] = {
        "score": 0,
        "class_id": class_id,
        "last_seen": time.time()
    }

    return {"status": "started"}

@app.post("/end_session")
def end_session(student_id: int):

    if student_id in active_sessions:
        del active_sessions[student_id]

    return {"status": "ended"}

# ---------------- AI INFERENCE ----------------

@app.post("/infer_engagement")
async def infer_engagement(
    file: UploadFile = File(...),
    class_id: int = Form(...),
    student_id: Optional[int] = Form(None),
    participant_name: Optional[str] = Form(None),
):
    try:
        contents = await file.read()

        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return {
                "status": "no_face",
                "score": 0
            }

        # Resolve student identity:
        # - student_id if explicitly provided
        # - else map Meet display name -> enrolled student_id
        resolved_student_id: Optional[int] = int(student_id) if student_id is not None else None
        participant_name_norm = _normalize_name(participant_name)

        if resolved_student_id is None and participant_name_norm:
            db_tmp = SessionLocal()
            try:
                resolved_student_id = resolve_student_id_by_name(db_tmp, class_id, participant_name_norm)
            finally:
                db_tmp.close()

        # Run inference (student_id is only used for face-tracking cache; fall back to "default")
        result = process_frame(frame, resolved_student_id if resolved_student_id is not None else "default")

        if result is None:
            return {
                "status": "no_face",
                "score": 0
            }

        # Update active sessions state for the get_live_class_data endpoint
        import time
        # Use stable key for live dashboard:
        # - mapped students: numeric user id
        # - unmatched participants: negative pseudo id derived from name
        live_key = resolved_student_id
        if live_key is None:
            # deterministic negative id for UI purposes (keeps TS types happy)
            try:
                import zlib
                live_key = -int(zlib.crc32((participant_name_norm or "Unknown").encode("utf-8")) & 0x7FFFFFFF)
            except Exception:
                live_key = -1

        active_sessions[live_key] = {
            "score": result.get("score", 0),
            "class_id": class_id,
            "last_seen": time.time(),
            "status": result.get("status", "Active"),
            "emotion": result.get("emotion", "Neutral"),
            "participant_name": participant_name_norm,
        }

        # Persist engagement snapshot for analytics / visualization
        db = SessionLocal()
        try:
            log = SessionLog(
                classroom_id=class_id,
                student_id=resolved_student_id,
                participant_name=participant_name_norm,
                engagement_score=float(result.get("score", 0)),
            )
            db.add(log)
            db.commit()
        except Exception as e:
            # Fail-soft: logging to stdout so API response is not blocked
            print("Failed to write SessionLog:", e)
            db.rollback()
        finally:
            db.close()

        # Broadcast live to teacher dashboard connected to this class_id
        await manager.broadcast(class_id, {
            "type": "student_update",
            "student_id": live_key,
            "name": participant_name_norm,
            "engagement_score": result.get("score", 0),
            "status": result.get("status", "Active"),
            "emotion": result.get("emotion", "Neutral")
        })

        return result

    except Exception as e:
        print("VELOX ERROR:", e)

        return {
            "status": "offline",
            "score": 0
        }


@app.get("/classroom/{class_id}/engagement_trend")
def get_engagement_trend(
    class_id: int,
    minutes: int = 30,
    db: Session = Depends(get_db)
):
    """
    Returns recent engagement snapshots for a class, to power
    time-series visualizations on the teacher dashboard.
    """
    cutoff = datetime.utcnow() - timedelta(minutes=minutes)

    logs = (
        db.query(SessionLog)
        .filter(
            SessionLog.classroom_id == class_id,
            SessionLog.timestamp >= cutoff,
        )
        .order_by(SessionLog.timestamp.asc())
        .all()
    )

    return [
        {
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "student_id": log.student_id,
            "engagement_score": log.engagement_score,
        }
        for log in logs
    ]