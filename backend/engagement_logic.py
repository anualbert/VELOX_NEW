def calculate_score(label, confidence, ear, mar, sleepy, yawning, looking_away,looking_down):

    # Base score determined by CNN dynamically using confidence
    # Assuming confidence is a float between 0.0 and 1.0
    conf_percent = int(confidence * 100) if confidence <= 1.0 else int(confidence)
    
    # Scale within ranges so it feels dynamic
    if label in ["Very High", "VeryHigh"]:
        score = 90 + int((conf_percent / 100) * 10)  # 90 to 100
    elif label == "High":
        score = 70 + int((conf_percent / 100) * 19)  # 70 to 89
    elif label == "Low":
        score = 30 + int((conf_percent / 100) * 20)  # 30 to 50
    elif label in ["Very Low", "VeryLow"]:
        score = 0 + int((conf_percent / 100) * 20)   # 0 to 20
    else:
        score = 50 + int((conf_percent / 100) * 15)  # 50 to 65

    # Overrides based on extreme behaviors detected by Mediapipe
    if sleepy:
        score = min(score, 10)
    elif yawning:
        score = min(score, 30)
    elif looking_away:
        score = min(score, 20)
    elif looking_down:
        score = min(score, 15)

    return score