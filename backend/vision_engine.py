import mediapipe as mp
import numpy as np
import cv2

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    max_num_faces=1,
    min_detection_confidence=0.3,
    min_tracking_confidence=0.3
)

# Counters to avoid flickering per student
eye_closed_frames = {}
yawn_frames = {}
away_frames = {}
down_frames = {}


def eye_aspect_ratio(eye):

    A = np.linalg.norm(eye[1] - eye[5])
    B = np.linalg.norm(eye[2] - eye[4])
    C = np.linalg.norm(eye[0] - eye[3])

    return (A + B) / (2.0 * C)


def mouth_ratio(mouth):

    left = mouth[0]
    right = mouth[1]
    top = mouth[2]
    bottom = mouth[3]

    horizontal = np.linalg.norm(left - right)
    vertical = np.linalg.norm(top - bottom)

    return vertical / horizontal


def analyze_face(frame, student_id="default"):

    # Initialize state for this student if missing
    if student_id not in eye_closed_frames:
        eye_closed_frames[student_id] = 0
        yawn_frames[student_id] = 0
        away_frames[student_id] = 0
        down_frames[student_id] = 0

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return {
        "score": 0,
        "status": "no_face",
        "sleepy": False,
        "yawning": False,
        "looking_away": False,
        "looking_down": False
        }

    face = results.multi_face_landmarks[0]

    h, w, _ = frame.shape
    pts = []

    for lm in face.landmark:
        pts.append((int(lm.x * w), int(lm.y * h)))

    pts = np.array(pts)

    # ---------------------------
    # Eye detection (Sleepy)
    # ---------------------------
    left_eye = pts[[33,160,158,133,153,144]]
    right_eye = pts[[362,385,387,263,373,380]]
    ear = (eye_aspect_ratio(left_eye) + eye_aspect_ratio(right_eye)) / 2

    sleepy = False
    if ear < 0.25:
        eye_closed_frames[student_id] += 1
    else:
        eye_closed_frames[student_id] = 0

    if eye_closed_frames[student_id] >= 2:  # 2 seconds at 1 FPS
        sleepy = True

    # ---------------------------
    # Yawning detection
    # ---------------------------
    mouth = pts[[78,308,13,14]]
    mar = mouth_ratio(mouth)

    yawning = False
    if mar > 0.30:  # Adjust threshold slightly if still too sensitive
        yawn_frames[student_id] += 1
    else:
        yawn_frames[student_id] = 0

    if yawn_frames[student_id] >= 2:  # 2 seconds at 1 FPS requirement
        yawning = True

    # ---------------------------
    # Head orientation
    # ---------------------------
    nose = pts[1]
    left_face = pts[234]
    right_face = pts[454]
    chin = pts[152]
    top_head = pts[10]

    # Calculate basic face dimensions to make thresholds proportion-based
    face_width = np.linalg.norm(right_face - left_face)
    face_height = np.linalg.norm(chin - top_head)
    
    if face_width == 0 or face_height == 0:
        face_width, face_height = 1, 1

    center_x = (left_face[0] + right_face[0]) / 2

    # looking sideways logic (offset relative to face width)
    offset_x = abs(nose[0] - center_x)
    is_looking_away = (offset_x / face_width) > 0.25

    if is_looking_away:
        away_frames[student_id] += 1
    else:
        away_frames[student_id] = 0
    
    looking_away = (away_frames[student_id] >= 1) # 1 second/frame instant trigger

    # looking down logic (nose to chin distance relative to face height)
    nose_to_chin = np.linalg.norm(chin - nose)
    is_looking_down = (nose_to_chin / face_height) < 0.38

    if is_looking_down:
        down_frames[student_id] += 1
    else:
        down_frames[student_id] = 0

    looking_down = (down_frames[student_id] >= 1) # 1 second/frame instant trigger

    return {
        "ear": ear,
        "mar": mar,
        "sleepy": sleepy,
        "yawning": yawning,
        "looking_away": looking_away,
        "looking_down": looking_down
    }