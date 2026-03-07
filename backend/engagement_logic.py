def calculate_score(label, confidence, ear, mar, sleepy, yawning, looking_away,looking_down):

    score = 90

    if sleepy:
        score = 10

    elif yawning:
        score = 40

    elif looking_away:
        score = 30

    elif looking_down:
        score = False

    else:
        score = 85

    return score