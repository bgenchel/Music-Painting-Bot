from PyCmdMessenger import ArduinoBoard, CmdMessenger
import threading
from glob import glob
from serial.serialutil import SerialException
import time


class SerialClient:
    """Handles communication an Arduino(s).
    Uses the CmdMessenger protocol to send labeled arguments to the connected Arduinos. This object defines
    the callback functions for all of the expected messages coming from the Arduninos.
    """

    def __init__(self, device_path=None):
        """Initializes a SerialClient.
        """
        self.device_path = device_path
        self._commands = [  # The order of this array **MUST** be the same as the enum in the Arduino code.
            ["moveMotor", "iff"],  # Refers to the type signature of the message, i is for integer, f float, etc.
            ["error", "s"]
        ]

        self._callbacks = {
            "error": print
        }

        self._arduino = None

        if device_path is None:
            arduino_paths = glob("/dev/cu.usbmodem*")
            device_path = arduino_paths[0]
            print("No device path specified, defaulting to %s" % device_path)

        self._arduino = ArduinoClient(device_path, self._commands, self._callbacks)

    def send(self, address, args):
        """Sends arguments to a specified address at an Arduino.
        Args:
            address: The address of the message to send.
            args: One, or a list of arguments to send.
        """
        self._arduino.send(address, args)

    # def _on_command(self, arduino, args):
    #     """Callback for handling the "command" message.
    #     Args:
    #         arduino: The ArduinoClient sent the message.
    #         args: A list of arguments.
    #     """
    #     pass


class ArduinoClient:
    """Handles the direct reading and sending to an Arduino via the CmdMessender protocol.
    Reading of the serial connection happens as fast as possible on its own thread.
    """

    def __init__(self, device_path, commands, callbacks, baud_rate=9600):
        """Initializes an ArduinoClient."""
        self._device_path = device_path
        self._commands = commands
        self._baud_rate = baud_rate
        self._device = ArduinoBoard(self._device_path, baud_rate=self._baud_rate)
        self._client = CmdMessenger(self._device, self._commands)
        self._connected = True
        self._callbacks = callbacks

        self._read_thread = threading.Thread(target=self._read).start()  # Read from the connection on a new thread.

    def send(self, address, args):
        """
        Sends a message through the serial connection.
        Args:
            address: The address of the message to send.
            args: One, or a list of arguments to send.
        """
        if isinstance(args, list):
            send_args = tuple(args)
        else:
            send_args = (args,)

        if self._connected:
            try:
                self._client.send(address, *send_args)
            except SerialException as e:
                print("Arduino error (Device: %s):" % self._device_path, e)
                threading.Thread(target=self._reconnect_serial).start()

    def _read(self):
        """Reads from the serial connection forever.
        Also calls callbacks in their own thread as to not block further reading.
        """
        while self._connected:
            try:
                message = self._client.receive()
                if message is not None:
                    address = message[0]
                    args = message[1]

                    if address in self._callbacks.keys():
                        threading.Thread(target=self._callbacks[address], args=(self, args)).start()
                    else:
                        print("Address not understood: %s from device %s" % (address, self._device_path))
            except SerialException as e:
                print("Arduino error (Device: %s):" % self._device_path, e)
                threading.Thread(target=self._reconnect_serial).start()

    def _reconnect_serial(self):
        """Continually attempts to connect to the previously connected Arduino."""
        self._connected = False
        print("Reconnecting Arduino (Device: %s)..." % self._device_path)

        def _reconnect(arduino_obj):
            try:
                arduino_obj._device = ArduinoBoard(arduino_obj._device_path, baud_rate=arduino_obj._baud_rate)
                arduino_obj._client = CmdMessenger(arduino_obj._device, arduino_obj._commands)
                arduino_obj._connected = True
                arduino_obj._read_thread = threading.Thread(target=arduino_obj._read).start()
            except:
                pass  # No idea how long it may take to reconnect, so don't want to print anything

        while not self._connected:
            _reconnect(self)
            time.sleep(0.5)


if __name__ == '__main__':
    s = SerialClient()
