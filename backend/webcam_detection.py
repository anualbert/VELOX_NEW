import cv2
import torch
import mediapipe as mp
from torchvision import models, transforms
from PIL import Image

# Engagement classes
classes = ['High', 'Low', 'VeryHigh', 'VeryLow']

# Load model
model = models.efficientnet_b0(pretrained=False)
model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, 4)

model.load_state_dict(torch.load("model/best_efficientnet_model.pth", map_location="cpu"))
model.eval()

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor()
])

# Face detector
mp_face = mp.solutions.face_detection
face_detection = mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5)
# Webcam
cap = cv2.VideoCapture(0)

while True:

    ret, frame = cap.read()
    if not ret:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_detection.process(rgb)

    if results.detections:

        for detection in results.detections:

            bbox = detection.location_data.relative_bounding_box

            h, w, _ = frame.shape

            x = int(bbox.xmin * w)
            y = int(bbox.ymin * h)
            width = int(bbox.width * w)
            height = int(bbox.height * h)

            face = frame[y:y+height, x:x+width]

            if face.size != 0:

                image = Image.fromarray(cv2.cvtColor(face, cv2.COLOR_BGR2RGB))
                image = transform(image).unsqueeze(0)

                with torch.no_grad():
                    output = model(image)
                    _, pred = torch.max(output,1)

                label = classes[pred.item()]

                cv2.rectangle(frame,(x,y),(x+width,y+height),(0,255,0),2)
                cv2.putText(frame,label,(x,y-10),
                            cv2.FONT_HERSHEY_SIMPLEX,1,(0,255,0),2)

    cv2.imshow("VELOX Engagement Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("Detection complete.")
