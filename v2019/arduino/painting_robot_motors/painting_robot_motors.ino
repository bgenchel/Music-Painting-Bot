#include <CmdMessenger.h>
#include <Servo.h>

// Motor pin definitions
int fingerPin = 2;
int wristPin = 3;
int elbowPin = 4;
int baseRotatePin = 5;
int baseLinearPin = 6;

// Servo object definitions
Servo elbowMotor;
Servo wristMotor;
Servo fingerMotor;
Servo baseRotateMotor;
Servo baseLinearMotor;

// Default position definitions
int elbowDefault = 90;
int wristDefault = 90;
int fingerDefault = 90;
int baseRotateDefault = 90;
int baseLinearDefault = 90;

// Motor state
float currentPositions[5] = {0, 0, 0, 0, 0};
float goalPositions[5] = {0, 0, 0, 0, 0};
float speeds[5] = {0, 0, 0, 0, 0};

// Motor reference
enum motorId {
  elbow,
  wrist,
  finger,
  baseRotate,
  baseLinear
};

// Global update frequency
unsigned long updateFreq = 10; // ms

// Motors
Servo motors[5] = {elbowMotor, wristMotor, fingerMotor, baseRotateMotor, baseLinearMotor};

// CmdMessenger command definitions
enum {
  moveMotor,
  error
};

// Loop start counter
unsigned long loopStart = 0;

// Last update counter
unsigned long lastUpdate = 0;

// Serial client
CmdMessenger cm = CmdMessenger(Serial, ',', ';', '/');


/*
   Utility functions
*/
void move(int motorId, float pos, float dur) {
  // pos [degrees]
  // dur [seconds]
//  Serial.print("moving motor ");
//  Serial.print(motorId);
//  Serial.print("to position ");
//  Serial.println(pos);
  float currentPosition = motors[motorId].read();
//  Serial.print("motors[motorId] current position: ");
//  Serial.println(currentPosition);
  currentPositions[motorId] = currentPosition;
  float durMs = dur * 1000.0;
  float numUpdates = durMs / (float) updateFreq;
  float newSpeed = abs(currentPosition - pos) / numUpdates;
  goalPositions[motorId] = pos;
  speeds[motorId] = newSpeed;
}

/*
   CmdMessenger command callbacks
*/
void onUnknownCommand(void) {
  cm.sendCmd(error, "Command without callback.");
}

void printOnMoveMotor(int motorId, float pos, float dur) {
//   Serial.println("onMoveMotor invoked.");
//   Serial.print("received motorId: ");
//   Serial.println(motorId);
//   Serial.print("received position: ");
//   Serial.println(pos);
//   Serial.print("received duration (ms): ");
//   Serial.println(dur);
}

void onMoveMotor(void) {
  int motorId = cm.readBinArg<int>();
  float pos = cm.readBinArg<float>();
  float dur = cm.readBinArg<float>();
  
  printOnMoveMotor(motorId, pos, dur);
  move(motorId, pos, dur);
}


/*
   Main functions
*/
void setup() {
  Serial.begin(9600);

  // Register CmdMessenger callbacks
  cm.attach(onUnknownCommand);
  cm.attach(moveMotor, onMoveMotor);

  // Attach servo objects to pins
  elbowMotor.attach(elbowPin);
  wristMotor.attach(wristPin);
  fingerMotor.attach(fingerPin);
  baseRotateMotor.attach(baseRotatePin);
  baseLinearMotor.attach(baseLinearPin);

  // Set to default positions
  move(elbow, elbowDefault, 1.0);
  move(wrist, wristDefault, 1.0);
  move(finger, fingerDefault, 1.0);
  move(baseRotate, baseRotateDefault, 1.0);
  move(baseLinear, baseLinearDefault, 1.0);
}

void loop() {
  loopStart = millis();

  // Check to see if it's time to update the motors
  if (loopStart - lastUpdate >= updateFreq) {
    for (int i = 0; i < 5; i++) {
      float newPos;
      if (goalPositions[i] > currentPositions[i]) 
        newPos = currentPositions[i] + speeds[i];
      else 
        newPos = currentPositions[i] - speeds[i];
      motors[i].write(newPos);
      currentPositions[i] = newPos;
    }
    lastUpdate = millis();
  }

  // Look for Serial messages through CmdMessenger
  cm.feedinSerialData();
}
