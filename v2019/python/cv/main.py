'''
Largely borrowed from: http://pastebin.com/WVhfmphS
'''
import cv2
import imutils
import numpy as np
import json
from pythonosc import osc_message_builder
from pythonosc import udp_client

SAMPLE_EVERY = 1 # Frame Reads

COLOR_THRESHOLD = {'lower': (65, 45, 200), 'upper': (95, 75, 255)}
DISPLAY_COLORS = {'target': (255, 255, 255)}

circle_ds = {"target": {"center": [0, 0], "area": 0}}

def conform(value, threshold, min):
    if (value - min) <= threshold:
        print(value - min)
        return True
    else:
        return False


def lab_contrast_increase(frame):
    # blurred = cv2.boxFilter(frame, (3, 3), normalized=False) # , 0, normalize=False)
    median = cv2.medianBlur(frame, 13)
    final = cv2.blur(median, (5, 5))
    final2 = cv2.medianBlur(final, 7)
    return final2


def process_data(cblobs_list):
    print([cb['color'] for cb in cblobs_list])

def main(camera_num):
    camera = cv2.VideoCapture(camera_num)
    client = udp_client.SimpleUDPClient('127.0.0.1', 6000)

    frame_count = 0
    sendOn = False
    while True:
        grabbed, frame = camera.read()
        frame = imutils.resize(frame, width=500)
        height, width = frame.shape[:-1]
        lab = lab_contrast_increase(frame)
        # cv2.imshow('lab', lab)

        color_blobs = []
        # for color, thresholds in COLOR_THRESHOLDS.items():
        kernel = np.ones((9, 9), np.uint8)
        mask = cv2.inRange(lab, COLOR_THRESHOLD["lower"], COLOR_THRESHOLD["upper"])
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        cnts = cv2.findContours(mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[-2]
        center = None
        cv2.drawContours(lab, cnts, -1, (0, 255, 0), 3)
        # cv2.imshow('mask', lab)
        if len(cnts) > 0:
            sendOn = True
            c = max(cnts, key=cv2.contourArea)
            # for c in cnts:
            ((x, y), radius) = cv2.minEnclosingCircle(c)
            # print(radius)
            M = cv2.moments(c)
            center = (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))
            if radius > 10:
                # draw the circle and centroid on the frame,
                # then update the list of tracked points
                circle_ds["target"] = {"center": [x / width, y / height], "area": 3.14 * (radius**2)}
                cv2.circle(frame, (int(x), int(y)), int(radius), DISPLAY_COLORS["target"], 2)
                # cv2.circle(frame, center, int(radius)/4, colors[key], 1)
                cv2.putText(frame, "target", (int(x - radius), int(y - radius)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, DISPLAY_COLORS["target"], 2)

                # color_blobs.append({'color': "target", "center": center, "area": M["m00"], "radius": radius})
        else:
            sendOn = False

        # color_blobs = sorted(color_blobs, key=lambda x: x['center'][1], reverse=True)
        frame_count += 1
        if frame_count == SAMPLE_EVERY:
            if sendOn:
                print('sendOn: {}'.format(circle_ds['target']['center']))
                client.send_message('/cursorOn', circle_ds['target']['center'])
            else:
                print('sendOff')
                client.send_message('/cursorOff', [])
            frame_count = 0

        cv2.imshow("Frame", frame)
        key = cv2.waitKey(1) & 0xFF
        # if the 'q' key is pressed, stop the loop
        if key == ord("q"):
            break

    # cleanup the camera and close any open windows
    camera.release()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("-c", "--camera", type=int, help="which camera to use")
    args = parser.parse_args()
    main(args.camera)
