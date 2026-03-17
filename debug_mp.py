import mediapipe as mp
print(f"MediaPipe Version: {mp.__version__}")
try:
    print(f"Solutions: {mp.solutions}")
    print("Success")
except AttributeError:
    print("AttributeError: solutions not found")
    print(f"Dir(mp): {dir(mp)}")
