# Painting Robot
by Benjie Genchel, Richard Yang, and Ryan Rose

## Motor Control Installation
Controlling the painting robot motors requires both Python 3 and Arduino. The dependencies for each are listed below:

**Python**
- [PyCmdMessenger](https://github.com/harmsm/PyCmdMessenger)

**Arduino**
- [CmdMessenger](https://github.com/thijse/Arduino-CmdMessenger)

## Running Motor Control
First, upload the `painting_robot_motors.ino` sketch onto the Arduino. The five motors and their PWM pin numbers are as follows:

| Motor Name   | Pin Number |
| ------------ | ---------- |
| `elbow`      | `2`		|
| `wrist` 	   | `3`		|
| `finger` 	   | `4`		|
| `baseRotate` | `5`		|
| `baseLinear` | `6`		|

Then, run `python -i motor_control.py`. This will by default connect to the first Arduino it finds connected. You can then use the `s` object in the interpreter to send commands to the Arduino. 

The list of commands implemented thus far are:

| Command Name		| Type Signature		| Description						|
| ----------------- | --------------------- | --------------------------------- |
| `moveMotor`		| `int, float, float`	| Motor ID (`int`), Position [deg] (`float`), Duration [s] (`float`) |


