'''
Largely borrowed from: http://pastebin.com/WVhfmphS
'''
import cv2
import imutils
import numpy as np
import json
from pythonosc import osc_message_builder
from pythonosc import udp_client

camera = cv2.VideoCapture(1)
client = udp_client.SimpleUDPClient('127.0.0.1', 5005)
SAMPLE_EVERY = 10 # Frame Reads

# COLOR_THRESHOLDS = {'red': {'lower': (10, 0, 62), 'upper': (50, 43, 102)},
#                     'green': {'lower': (15, 95, 12), 'upper': (50, 140, 50)},
#                     'blue': {'lower': (80, 37, 6), 'upper': (117, 60, 40)},
#                     'orange': {'lower': (3, 0, 70), 'upper': (20, 30, 135)}}

COLOR_THRESHOLD = {'lower': (100, 200, 200), 'upper': (255, 255, 255)}

DISPLAY_COLORS = {'white': (255, 255, 255)}

circle_ds = {"red": {"center": [0, 0], "area": 0}, "green": {"center": [0, 0], "area": 0}, "blue": {"center": [0, 0], "area": 0},
        'orange': {"center": [0, 0], "area": 0}, "white": {"center": [0, 0], "area": 0}}


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

def main():
    frame_count = 0
    while True:
        grabbed, frame = camera.read()

        frame = imutils.resize(frame, width=500)
        lab = lab_contrast_increase(frame)
        cv2.imshow('lab', lab)

        color_blobs = []
        # for color, thresholds in COLOR_THRESHOLDS.items():
        kernel = np.ones((9, 9), np.uint8)
        mask = cv2.inRange(lab, COLOR_THRESHOLD["lower"], COLOR_THRESHOLD["upper"])
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        cnts = cv2.findContours(mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[-2]
        center = None
        cv2.drawContours(lab, cnts, -1, (0, 255, 0), 3)
        cv2.imshow('mask', lab)
        if len(cnts) > 0:
#            c = max(cnts, key=cv2.contourArea)
            for c in cnts:
                ((x, y), radius) = cv2.minEnclosingCircle(c)
                # print(radius)
                M = cv2.moments(c)
                center = (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))
                if radius > 10:
                    # draw the circle and centroid on the frame,
                    # then update the list of tracked points
                    circle_ds["white"] = {"center": [int(x), int(y)], "area": 3.14 * (radius**2)}
                    cv2.circle(frame, (int(x), int(y)), int(radius), DISPLAY_COLORS["white"], 2)
                    # cv2.circle(frame, center, int(radius)/4, colors[key], 1)
                    cv2.putText(frame, "white", (int(x - radius), int(y - radius)), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, DISPLAY_COLORS["white"], 2)

                    color_blobs.append({'color': "white", "center": center, "area": M["m00"], "radius": radius})

        color_blobs = sorted(color_blobs, key=lambda x: x['center'][1], reverse=True)
        frame_count += 1
        if frame_count == SAMPLE_EVERY:
            print(color_blobs)
        # print([cb['color'] for cb in color_blobs])

        # lineVerify = checkIfInLine(circle_ds, 20)
        # if lineVerify == True:
        #     for i in circle_ds.items():
        #         print(i[0], i[1])
        #         client.send_message('/{}'.format(i[0]), str(i[1]['area']))
        #         client.send_message('/{}/{}'.format(i[0], "center"), str(i[1]['center']))
        # show the frame to our screen
        cv2.imshow("Frame", frame)

        key = cv2.waitKey(1) & 0xFF
        # if the 'q' key is pressed, stop the loop
        if key == ord("q"):
            break

    # cleanup the camera and close any open windows
    camera.release()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    main()