#incude
from fastapi import FastAPI,UploadFile
import cv2
import numpy as np
from backend.smart_engagement import process_frame

app = FastAPI()

@app.post("/predict")

async def predict(file:UploadFile):

    contents = await file.read()

    nparr = np.frombuffer(contents,np.uint8)
    frame = cv2.imdecode(nparr,cv2.IMREAD_COLOR)

    result = process_frame(frame)

    return result
