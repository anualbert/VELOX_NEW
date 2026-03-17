try:
    import mediapipe.python.solutions as solutions
    print("Success: import mediapipe.python.solutions")
except ImportError:
    print("Failed: import mediapipe.python.solutions")

try:
    from mediapipe import solutions
    print("Success: from mediapipe import solutions")
except ImportError:
    print("Failed: from mediapipe import solutions")
