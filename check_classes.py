import joblib
import sys
import os

sys.path.append(os.getcwd())

try:
    le = joblib.load('VELOEMO/label_encoder.pkl')
    print("Classes found:", le.classes_)
except Exception as e:
    print("Error loading:", e)
