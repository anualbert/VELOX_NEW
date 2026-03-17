import sys
import os

print("="*50)
print("VELOX SYSTEM DIAGNOSTIC TOOL")
print("="*50)

def check_import(module_name):
    try:
        __import__(module_name)
        print(f"[PASS] Found module: {module_name}")
        return True
    except ImportError as e:
        print(f"[FAIL] MISSING module: {module_name} ({e})")
        return False

print("\n1. CHECKING DEPENDENCIES...")
deps = [
    "cv2", "numpy", "joblib", "fastapi", "uvicorn", 
    "skimage", "sklearn", "mediapipe", "websockets"
]
missing = []
for dep in deps:
    if not check_import(dep):
        missing.append(dep)

if missing:
    print("\n[CRITICAL] You are missing the following libraries:")
    print(f"   {', '.join(missing)}")
    print("\nPLEASE RUN THIS COMMAND TO FIX:")
    print(f"   pip install {' '.join(missing)}")
else:
    print("\n[SUCCESS] All Python dependencies are installed.")

print("\n2. CHECKING MODEL FILES...")
model_files = ["emotion_svm.pkl", "label_encoder.pkl"]
model_path = os.path.join(os.getcwd(), "backend")

# Check current dir or backend subdir
if os.path.exists(os.path.join(os.getcwd(), "emotion_svm.pkl")):
     model_path = os.getcwd()

found_models = True
for f in model_files:
    path = os.path.join(model_path, f)
    if os.path.exists(path):
        print(f"[PASS] Found model file: {path}")
    else:
        print(f"[FAIL] MISSING model file: {path}")
        found_models = False

if not found_models:
    print("\n[CRITICAL] Model files are missing from the backend folder!")

print("\n" + "="*50)
if not missing and found_models:
    print("DIAGNOSIS: SYSTEM IS READY. YOU CAN RUN.")
else:
    print("DIAGNOSIS: ENVIRONMENT ISSUES FOUND. PLEASE FIX ABOVE ERRORS.")
print("="*50)
