#include <Servo.h>

const int FAST_LEFT = 0;
const int SLOW_LEFT = 52;
const int STOP = 70;
const int SLOW_RIGHT = 82;
const int FAST_RIGHT = 180;
const int LEFT_BOUNDARY = 230;
const int RIGHT_BOUNDARY = 1000;

Servo servo1; // top arm joint
Servo servo2; // bottom arm joint
Servo servo3; // rotating base plate
Servo servo4; // l-r axis

// servo positions (0, 180)
int iPosS1;
int iPosS2;
int iPosS3;

const int i1ServoPin = 5;
const int i2ServoPin = 6;
const int i3ServoPin = 9;
const int i4ServoPin = 10;
const int iPotPinS1 = A3;
const int iPotPinS2 = A2;
const int iPotPinS3 = A0; 

int S1_LB = 70;
int S1_UB = 150;

const int S2_LB = 50;
const int S2_UB = 85;
const int S3_UB = 180;
const int S4_LB = 110;

const float step_size = 2; // step size is constant 2 degrees 
float adj_step_size_12 = 1; 
float adj_step_size_23 = 1;

float num_steps;

int PL1 = 160; // PL - previous location
int PL2 = 70;
int PL3 = 145;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(57600);
  servo1.attach(i1ServoPin);
  servo2.attach(i2ServoPin);
  servo3.attach(i3ServoPin);
  servo1.write(PL1);
  servo2.write(PL2);
  servo3.write(PL3);
  //iPosS1 = PL1;
}

void loop() {
    // scale values
  iPosS1 = (analogRead(iPotPinS1))/6 + 5; // 1024/5 ~ 200 which is close to 0 to 180
  iPosS2 = (analogRead(iPotPinS2))/6 + 5;
  iPosS3 = (analogRead(iPotPinS3))/6 + 5;

    // keep servo 2 in bounds
  if (iPosS2 < S2_LB)
  {
    iPosS2 = S2_LB;
  }
  if (iPosS2 > S2_UB)
  {
    iPosS2 = S2_UB;
  }

  S1_UB = 200 - iPosS2; // adjust servo1 upper bound based on servo2 position
    // keep servo 1 in bounds
  if (iPosS1 < S1_LB)
  {
    iPosS1 = S1_LB;
  }
  if (iPosS1 > S1_UB)
  {
    iPosS1 = S1_UB;
  }

    // keep servo 3 in bounds
  if (iPosS3 < S3_LB)
  {
    iPosS3 = S3_LB;
  }
  if (iPosS3 > S3_UB)
  {
    iPosS3 = S3_UB;
  }

//  Serial.print("S1: ");
//  Serial.print(iPosS1);
//  Serial.print("\t");
//  Serial.print("S2: ");
//  Serial.print(iPosS2);
//  Serial.print("\t");
//  Serial.print("S3: ");
//  Serial.print(iPosS3);
//  Serial.print("\t");
//  Serial.print("S1_LB: ");
//  Serial.print(S1_LB);
//  Serial.print("\t");
//  Serial.print("S1_UB: ");
//  Serial.print(S1_UB);
//  Serial.print("\t");
//  Serial.print("S2_LB: ");
//  Serial.print(S2_LB);
//  Serial.print("\t");
//  Serial.print("S2_UB: ");
//  Serial.print(S2_UB);
//  Serial.print("\t");
//  Serial.print("S3_LB: ");
//  Serial.print(S3_LB);
//  Serial.print("\t");
//  Serial.print("S3_UB: ");
//  Serial.println(S3_UB);

  if (abs(PL2 - iPosS2) > 3)
  {
    //num_steps1 = (iPosS1 - PL1)/step_size;
  //  num_steps3 = (iPosS3 - PL3)/steps;
    num_steps = (iPosS2 - PL2)/step_size;
    for (int i = 0; i < num_steps; i++)
    {
      servo2.write(PL2 + step_size);
      PL2 = PL2 + step_size;

      servo1.write(PL1 + step_size);
      PL1 = PL1 + step_size;

      delay(10);
    }

    servo2.write(iPosS2);
    PL2 = iPosS2;
    servo1.write(iPosS1);
    PL1 = iPosS1;
  }
  if (abs(PL3 - iPosS3) > 3)
  {
    num_steps3 = (iPosS3 - PL3)/steps;
    num_steps2 = (abs(iPosS3 - 145))/steps;
    if (abs(iPosS3 - 145) < abs(PL3 - 145))
    {
      num_steps2 = - num_steps2;
    }

    for (int i=0; i<steps; i++)
    {
      servo3.write(PL3 + num_steps3);
      PL3 = PL3 + num_steps3;
      if ((PL2 + num_steps2) < S2_UB && (PL2 + num_steps2) > S2_LB)
      {
        servo2.write(PL2 + num_steps2);
        PL2 = PL2 + num_steps2;
      }

      delay(10);
    }
    servo3.write(iPosS3);
    PL3 = iPosS3;
    servo2.write(iPosS2);
    PL2 = iPosS2;
  }

  Serial.print(num_steps2);
  Serial.print("\t");
  Serial.println(num_steps3);
  delay(100);
  iPosS1 = PL1;
}

