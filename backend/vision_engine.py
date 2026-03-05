import mediapipe as mp
import numpy as np
import cv2

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    max_num_faces=1,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

# Counters to avoid flickering
eye_closed_frames = 0
yawn_frames = 0


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


def analyze_face(frame):

    global eye_closed_frames
    global yawn_frames

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return None

    face = results.multi_face_landmarks[0]

    h, w, _ = frame.shape
    pts = []

    for lm in face.landmark:
        pts.append((int(lm.x * w), int(lm.y * h)))

    pts = np.array(pts)

    # ---------------------------
    # Eye detection
    # ---------------------------

    left_eye = pts[[33,160,158,133,153,144]]
    right_eye = pts[[362,385,387,263,373,380]]

    ear = (eye_aspect_ratio(left_eye) + eye_aspect_ratio(right_eye)) / 2

    sleepy = False

    if ear < 0.22:
        eye_closed_frames += 1
    else:
        eye_closed_frames = 0

    if eye_closed_frames > 15:
        sleepy = True

    # ---------------------------
    # Yawning detection
    # ---------------------------

    mouth = pts[[78,308,13,14]]
    mar = mouth_ratio(mouth)

    yawning = False

    if mar > 0.45:
        yawn_frames += 1
    else:
        yawn_frames = 0

    if yawn_frames > 10:
        yawning = True

    # ---------------------------
    # Head orientation
    # ---------------------------

    nose = pts[1]
    left_face = pts[234]
    right_face = pts[454]
    chin = pts[152]

    center_x = (left_face[0] + right_face[0]) / 2

    # looking sideways
    looking_away = abs(nose[0] - center_x) > 30

    # looking down (phone usage)
    looking_down = nose[1] > chin[1] - 40

    return {
        "ear": ear,
        "mar": mar,
        "sleepy": sleepy,
        "yawning": yawning,
        "looking_away": looking_away,
        "looking_down": looking_down
    }