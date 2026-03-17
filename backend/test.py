from backend.inference import predict

image_path = "test.jpg"

result = predict(image_path)

print("Predicted Engagement Level:", result)