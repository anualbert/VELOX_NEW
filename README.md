VELOX: AI-Based Engagement Monitoring System



Overview

VELOX is a real-time AI-powered engagement monitoring system designed for digital environments
such as
detect behavioral
The framework
score in real time.
online learning, meetings, and productivity monitoring. The system analyzes webcam video to
cues such as eye movement, yawning, and head pose to estimate a person's engagement level.
combines computer vision, deep learning, and behavioral analysis to produce an engagement


System Architecture

Webcam Frame → MediaPipe FaceMesh → Face Crop → EfficientNet Engagement Model →
Eye Aspect Ratio (Blink/Sleep Detection) → Mouth Aspect Ratio (Yawn Detection) →
Head Pose Estimation → Behaviour Logic Engine → Final Engagement Score →
FastAPI Backend → Chrome Extension / Dashboard


Key Features

• Real-time engagement monitoring
• Eye blink and sleep detection
• Yawn detection
• Head pose detection (looking away)
• Deep learning based engagement classification
• Behaviour-aware scoring system
• FastAPI backend for real-time inference
• Chrome extension integration


Technologies Used

Backend API: FastAPI
Computer Vision: OpenCV
Face Landmark Detection: MediaPipe FaceMesh
Deep Learning Model: EfficientNet
Framework: PyTorch
Frontend: Chrome Extension
Language: Python


Dataset

This project uses the DAiSEE dataset.
Download from: https://iith.ac.in/~daisee-dataset/
After downloading, extract it into the project directory: VELOX_NEW/DAiSEE/


Installation

git clone https://github.com/anualbert/VELOX_NEW.git
cd VELOX_NEW
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt


Running the Backend API

uvicorn backend.api_server:app --port 8000
API runs at: http://127.0.0.1:8000


Running the Demo

python demo/webcam_demo.py
This will display engagement score, behaviour detection, and live webcam analysis.


API Endpoint

POST /predict
Example response:
{ "status": "Focused", "score": 82 }
