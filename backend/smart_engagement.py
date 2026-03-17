from inference_engine import predict_engagement
from vision_engine import analyze_face
from engagement_logic import calculate_score


def process_frame(frame, student_id="default"):

    face_data = analyze_face(frame, student_id)

    if face_data.get("status") == "no_face":
        return {
            "status": "STUDENT ABSENT",
            "score": 0,
            "emotion": "Unknown",
            "ear": 0,
            "mar": 0
        }

    label, confidence = predict_engagement(frame)

    score = calculate_score(
        label,
        confidence,
        face_data["ear"],
        face_data["mar"],
        face_data["sleepy"],
        face_data["yawning"],
        face_data["looking_away"],
        face_data["looking_down"]
    )

    # Behaviour priority
    if face_data["yawning"]:
        status = "yawning"

    elif face_data["sleepy"]:
        status = "Sleeping"

    elif face_data["looking_down"]:
        status = "Using Phone"

    elif face_data["looking_away"]:
        status = "Looking Away"

    else:
        # Use ML label to give a more accurate default state
        if label in ["High", "VeryHigh"]:
            status = "Focused"
        else:
            status = "Distracted"

    return {
        "status": status,
        "score": score,
        "ear": face_data["ear"],
        "mar": face_data["mar"],
        "emotion": label,
        "sleepy": face_data["sleepy"],
        "yawning": face_data["yawning"],
        "looking_away": face_data["looking_away"],
        "looking_down": face_data["looking_down"]
    }