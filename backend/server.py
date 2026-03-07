import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from pydantic import BaseModel
import cv2
import numpy as np
import time
import secrets
from datetime import datetime
from typing import List, Optional, Dict
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# DATABASE
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Float, DateTime
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
    engagement_score = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine_db)

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
    student_id: int = Form(...),
    class_id: int = Form(...)
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

        result = process_frame(frame)

        if result is None:
            return {
                "status": "no_face",
                "score": 0
            }

        return result

    except Exception as e:
        print("VELOX ERROR:", e)

        return {
            "status": "offline",
            "score": 0
        }