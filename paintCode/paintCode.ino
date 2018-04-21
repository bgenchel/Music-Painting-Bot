
#include <Servo.h>

Servo servo1;
Servo servo2;
Servo servo3;
Servo servo4;
int iVal;
const int i1ServoPin = 5;
const int i2ServoPin = 6;
const int i3ServoPin = 9;
const int i4ServoPin = 10;
const int iPotPin = A0;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(57600);
  servo1.attach(i3ServoPin);
//  servo2.attach(i2ServoPin);
//  servo3.attach(i3ServoPin);
//  servo4.attach(i4ServoPin);
}

void loop() {
  // put your main code here, to run repeatedly:
  iVal = analogRead(iPotPin);
  Serial.println(iVal);

  // code for servo 1
  
//  servo4.write(70);

  // code for servo 4
  if(iVal < 400){
    servo1.write(0);
  } else if ((iVal > 400) && (iVal < 700)){
    servo1.write(90);
  } else {
    Serial.println("entered else clause");
    servo1.write(180);
  }
  delay(500);
}
