
#include <Servo.h>

const int FAST_LEFT = 0;
const int SLOW_LEFT = 52;
const int STOP = 70;
const int SLOW_RIGHT = 82;
const int FAST_RIGHT = 180;

const int LEFT_BOUNDARY = 230;
const int RIGHT_BOUNDARY = 1000;

Servo servo1;
Servo servo2;
Servo servo3;
Servo servo4;
int iPotS1;
int iPotS2;
int iPotS3;
int iVal2 = 40;
int iRotation = 0;
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
const int S3_LB = 110;
const float steps = 20;
float stepSize1;
float stepSize2;
float stepSize3;

//int PL1 = 104;
int PL1 = 160;
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
  //iPotS1 = PL1;
}

void loop() {
  // put your main code here, to run repeatedly:
  iPotS1 = (analogRead(iPotPinS1))/5;
  iPotS2 = (analogRead(iPotPinS2))/5;
  iPotS3 = (analogRead(iPotPinS3))/5;

  if (iPotS2 < S2_LB)
  {
    iPotS2 = S2_LB;
  }
  if (iPotS2 > S2_UB)
  {
    iPotS2 = S2_UB;
  }

  S1_UB = 200 - iPotS2;
  if (iPotS1 < S1_LB)
  {
    iPotS1 = S1_LB;
  }
  if (iPotS1 > S1_UB)
  {
    iPotS1 = S1_UB;
  }

//  if (iPotS3 < S3_LB)
//  {
//    iPotS3 = S3_LB;
//  }
//  if (iPotS3 > S3_UB)
//  {
//    iPotS3 = S3_UB;
//  }
//
//  Serial.print("S1: ");
//  Serial.print(iPotS1);
//  Serial.print("\t");
//  Serial.print("S2: ");
//  Serial.print(iPotS2);
//  Serial.print("\t");
//  Serial.print("S3: ");
//  Serial.print(iPotS3);
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

  if (PL2 != iPotS2)
  {
    stepSize1 = (iPotS1 - PL1)/steps;
    stepSize2 = (iPotS2 - PL2)/steps;
//    Serial.print(stepSize1);
//    Serial.print(" ");
//    Serial.println(stepSize2);
  //  stepSize3 = (iPotS3 - PL3)/steps;
    for (int i=0; i<steps; i++)
    {
      servo2.write(PL2 + stepSize2);
      PL2 = PL2 + stepSize2;
  
      servo1.write(PL1 + stepSize1);
      PL1 = PL1 + stepSize1;
  
      delay(10);
    }
    PL2 = iPotS2;
    PL1 = iPotS1;
  }
  else
  {
    if (PL3 != iPotS3)
    {
      stepSize3 = (iPotS3 - PL3)/steps;
      stepSize2 = (abs(iPotS3 - 145))/steps;
      if (abs(iPotS3 -145) < abs(PL3 -145)){
          stepSize2 = -stepSize2;
      }
      
    
    for (int i=0; i<steps; i++)
    {
      servo3.write(PL3 + stepSize3);
      PL3 = PL3 + stepSize3;
      if ((PL2+stepSize2) < S2_UB && (PL2+stepSize2) > S2_LB )
      {
        servo2.write(PL2 + stepSize2);
        PL2 = PL2 + stepSize2;
      }
  
      delay(10);
    }
    PL3 = iPotS3;
    PL2 = iPotS2;
    }
  }

  Serial.print(stepSize2);
  Serial.print("\t");
  Serial.println(stepSize3);
  delay(100);
  iPotS1 = PL1;
}

