from backend.inference_engine import predict_engagement
from backend.vision_engine import analyze_face
from backend.engagement_logic import calculate_score


def process_frame(frame):

    face_data = analyze_face(frame)

    if face_data is None:
        return {
            "status": "No Person",
            "score": 0
        }

    label, confidence = predict_engagement(frame)

    score = calculate_score(
        label,
        confidence,
        face_data["ear"],
        face_data["mar"],
        face_data["sleepy"],
        face_data["yawning"],
        face_data["looking_away"]
    )

    # Behaviour priority
    if face_data["sleepy"]:
        status = "Sleeping"

    elif face_data["yawning"]:
        status = "Yawning"

    elif face_data["looking_down"]:
        status = "Using Phone"

    elif face_data["looking_away"]:
        status = "Looking Away"

    else:
        status = "Focused"

    return {
        "status": status,
        "score": score,
        "ear": face_data["ear"],
        "mar": face_data["mar"]
    }