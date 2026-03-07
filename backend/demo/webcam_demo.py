import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cv2
from backend.smart_engagement import process_frame

cap = cv2.VideoCapture(0)

# store engagement scores
score_history = []
MAX_HISTORY = 60


# -------------------------------
# Dashboard UI
# -------------------------------
def draw_dashboard(frame, status, score):

    h, w, _ = frame.shape

    overlay = frame.copy()

    # dark transparent panel
    cv2.rectangle(overlay, (0,0), (w,120), (30,30,30), -1)
    frame = cv2.addWeighted(overlay,0.6,frame,0.4,0)

    # title
    cv2.putText(frame,"VELOX AI Engagement Monitor",
                (20,40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,(255,255,255),2)

    # status
    cv2.putText(frame,f"Status: {status}",
                (20,80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,(0,255,0),2)

    # engagement score
    cv2.putText(frame,f"Engagement Score: {score}%",
                (350,80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,(255,255,0),2)

    # engagement bar
    bar_x = 350
    bar_y = 100
    bar_w = int(score * 2)

    cv2.rectangle(frame,(bar_x,bar_y),(bar_x+200,bar_y+15),(100,100,100),2)
    cv2.rectangle(frame,(bar_x,bar_y),(bar_x+bar_w,bar_y+15),(0,255,0),-1)

    return frame


# -------------------------------
# Engagement Timeline Graph
# -------------------------------
def draw_graph(frame, scores):

    h, w, _ = frame.shape

    graph_height = 100
    graph_width = 300

    x_start = 20
    y_start = h - graph_height - 20

    # graph background
    cv2.rectangle(frame,
                  (x_start, y_start),
                  (x_start + graph_width, y_start + graph_height),
                  (40,40,40), -1)

    if len(scores) < 2:
        return frame

    step = graph_width / len(scores)

    for i in range(1, len(scores)):

        x1 = int(x_start + (i-1) * step)
        y1 = int(y_start + graph_height - scores[i-1])

        x2 = int(x_start + i * step)
        y2 = int(y_start + graph_height - scores[i])

        cv2.line(frame,(x1,y1),(x2,y2),(0,255,0),2)

    cv2.putText(frame,
                "Engagement Timeline",
                (x_start, y_start - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,(255,255,255),2)

    return frame


# -------------------------------
# Main Loop
# -------------------------------
while True:

    ret, frame = cap.read()
    if not ret:
        break

    result = process_frame(frame)

    status = result["status"]
    score = result["score"]

    # update history
    score_history.append(score)

    if len(score_history) > MAX_HISTORY:
        score_history.pop(0)

    # draw dashboard
    frame = draw_dashboard(frame, status, score)

    # draw graph
    frame = draw_graph(frame, score_history)

    # debugging values
    if "ear" in result and "mar" in result:

        cv2.putText(frame, f"EAR: {round(result['ear'],2)}",
                    (20,150),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,(255,255,255),2)

        cv2.putText(frame, f"MAR: {round(result['mar'],2)}",
                    (20,180),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,(255,255,255),2)

    cv2.imshow("VELOX Smart Engagement", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()