
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
int iVal;
int iVal2 = 40;
int iRotation = 0;
const int i1ServoPin = 5;
const int i2ServoPin = 6;
const int i3ServoPin = 9;
const int i4ServoPin = 10;
const int iPotPin = A1;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(57600);
  servo1.attach(i1ServoPin);
  servo2.attach(i2ServoPin);
  servo3.attach(i3ServoPin);
  servo4.attach(i4ServoPin);
}

void loop() {
  // put your main code here, to run repeatedly:
  if (Serial.available())
  {
    iVal = Serial.read();
    iRotation = 10*(53 - iVal);
    if (iVal < 40)
    {
      iVal = 40;
      iRotation = 0;
    }
  }
  else
  {
    iRotation = 0;
    iVal = 40;
  }
  Serial.println(iVal);
  // code for servo 1
  
//  servo3.write(iVal/2);
//  servo2.write(iVal);
  // code for servo 4
<<<<<<< HEAD
//  if(iVal < 400){
//    servo4.write(0);
//  } else if ((iVal > 400) && (iVal < 700)){
//    servo4.write(90);
//  } else {
//    Serial.println("entered else clause");
//    servo4.write(180);
=======
//  servo1.write(iVal);
//  servo2.write(iVal2);

  servo1.write(iVal);
  servo2.write(iVal+60);
  servo3.write(145+iRotation);
  
  delay(500);
//  servo3.write(30);
//if ((iVal2 < 230) && (iVal2>1000)){
//    servo1.write(70);
//  }
//  else
//  {
//      if(iVal < 50){
//      servo1.write(0);
//      }
//      else {
//      Serial.println("entered else clause");
//      servo1.write(180);
//    }
>>>>>>> 121ee1c0c477a9396488503c3bde2d441350e299
//  }
  delay(500);
}

