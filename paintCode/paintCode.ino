
#include <Servo.h>

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
//  iVal2 = analogRead(iPotPin);
  

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
//  }
  delay(500);
}

