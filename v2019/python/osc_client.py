import time
from subprocess import Popen, PIPE
import threading
import random

from pythonosc import osc_server, dispatcher, udp_client
from motor_control import SerialClient

BASEPLATE = 3
ELBOW = 2
WRIST = 1
FINGER = 0
# from motor_control import SerialClient

serial_client = SerialClient()

def base_handler(address, *args):
    print('_base_handler')
    # args = args*
    serial_client.send('moveMotor', list(args))
    # serial_client.send('moveMotor', [0, 0, 0])

def elbow_handler(address, *args):
    print('_elbow_handler')
    # args = args*
    serial_client.send('moveMotor', list(args))
    # serial_client.send('moveMotor', [0, 0, 0])

def wrist_handler(address, *args):
    print('_wrist_handler')
    # args.append(0.5);
    serial_client.send('moveMotor', list(args))
    # serial_client.send('moveMotor', [0, 0, 0])

def finger_handler(address, *args):
    print('_finger_handler')
    # args.append(0.5);
    serial_client.send('moveMotor', list(args))
    # serial_client.send('moveMotor', [0, 0, 0])

def test_handler(address, *args):
    """
    An example handler.
    :param address: the address of the OSC message, pretty redundant
    :param args: the arguments of the OSC message, N.B. MIGHT be a list (if > 1 arg) or MIGHT be a value (only 1 arg)
    :return:
    """
    print('_test_handler')
    print(address, args)

class OSCClient:
    def __init__(self, device_path=None):
        # self.serial_client = SerialClient(device_path)
        # Dispatches received messages to callbacks
        self.dispatcher = dispatcher.Dispatcher()

        # TODO create functions to listen from the webpage, and map them here
        #   handler functions need to take 2 arguments, first the address, then the arguments
        self.dispatcher.map("/test", test_handler)
        self.dispatcher.map("/base", base_handler)
        self.dispatcher.map("/elbow", elbow_handler)
        self.dispatcher.map("/wrist", wrist_handler)
        self.dispatcher.map("/finger", finger_handler)

        # Server for listening for OSC messages
        self.local_address = "127.0.0.1"
        self.local_port = 6003
        self.osc_server = osc_server.ThreadingOSCUDPServer((self.local_address, self.local_port), self.dispatcher)

        # Listen (in a separate thread as to not block)
        threading.Thread(target=self.osc_server.serve_forever).start()

        # Client for sending OSC messages
        self.remote_address = "127.0.0.1"
        self.remote_port = 6004
        self.osc_client = udp_client.SimpleUDPClient(self.remote_address, self.remote_port)


        # self._send("/test", [random.random()])

if __name__ == "__main__":
    c = OSCClient()
    # try:
        # Uncommenting this will show you the unbridled power of messages being sent back and forth infinitely :)
        # c._send("/test", [random.random()])
        # while True:
            # pass
    # except KeyboardInterrupt:
        # c.chrome.quit()
