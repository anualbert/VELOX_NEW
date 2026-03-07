
import numpy as np
import joblib
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
import os

# CONFIG
MODEL_FILE = "emotion_svm.pkl"
LE_FILE = "label_encoder.pkl"
BACKEND_DIR = "backend"

def main():
    print("Generating Dummy EMOVELO Models for Testing...")
    
    # 1. Create Dummy Data
    # HOG feature length depends on params. 
    # In engagement_engine.py: pixels_per_cell=(16, 16), cells_per_block=(2, 2), orient=9, img=(128,128)
    # 128/16 = 8 cells. Block stride 1 cell? 
    # Let's just blindly train on a random size and hope the engine handles it?
    # Actually, the SVM expects a specific input size. 
    # If I train it on X, it expects X.
    # The engine calculates HOG features of size N.
    # I need to match that N.
    
    # Let's calculate N:
    # img_size = 128
    # pixels_per_cell = 16
    # cells = 128/16 = 8
    # cells_per_block = 2
    # blocks = (8 - 2) + 1 = 7 (if stride 1)
    # 7x7 blocks.
    # features = 7 * 7 * 2 * 2 * 9 = 1764
    
    EXPECTED_FEATURES = 1764 
    
    X_train = np.random.rand(10, EXPECTED_FEATURES)
    y_train = ["Neutral", "Happy", "Surprised", "Neutral", "Happy", "Surprised", "Neutral", "Happy", "Focus", "Focus"]
    
    # 2. Encode Labels
    le = LabelEncoder()
    y_enc = le.fit_transform(y_train)
    
    # 3. Train SVM
    clf = SVC(kernel='linear', probability=True)
    clf.fit(X_train, y_enc)
    
    # 4. Save
    if not os.path.exists(BACKEND_DIR):
        os.makedirs(BACKEND_DIR)
        
    joblib.dump(clf, os.path.join(BACKEND_DIR, MODEL_FILE))
    joblib.dump(le, os.path.join(BACKEND_DIR, LE_FILE))
    
    print(f"Saved {MODEL_FILE} and {LE_FILE} to {BACKEND_DIR}")
    print(f"Classes: {le.classes_}")

if __name__ == "__main__":
    main()
