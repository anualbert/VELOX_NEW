import cv2
import numpy as np
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from infer_emotion import EngagementAnalyzer

def test_analyzer():
    print("Initializing Analyzer...")
    analyzer = EngagementAnalyzer()
    
    if not analyzer.model_loaded:
        print("FAILED: Models not loaded.")
        return

    print("Models loaded. Creating dummy image...")
    # Create a black image
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Run analysis
    print("Running analysis on dummy frame...")
    score, label, state = analyzer.analyze_frame(dummy_frame)
    
    print(f"Result: Score={score}, Label={label}")
    
    if label == "No Face":
        print("SUCCESS: Correctly identified no face.")
    else:
        print(f"WARNING: Unexpected label for empty frame: {label}")

if __name__ == "__main__":
    test_analyzer()
