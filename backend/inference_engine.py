import torch
from torchvision import models, transforms
from PIL import Image
import cv2

classes = ['High','Low','VeryHigh','VeryLow']

model = models.efficientnet_b0(weights=None)
model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features,4)

model.load_state_dict(
    torch.load("model/best_efficientnet_model.pth", map_location="cpu")
)

model.eval()

transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
])


def predict_engagement(frame):

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    img = Image.fromarray(rgb)

    img = transform(img).unsqueeze(0)

    with torch.no_grad():

        output = model(img)

        probs = torch.softmax(output, dim=1)

        confidence, pred = torch.max(probs,1)

    label = classes[pred.item()]
    confidence = confidence.item()

    return label, confidence