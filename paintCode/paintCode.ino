
#include <Servo.h>

const int FAST_LEFT = 0;
const int SLOW_LEFT = 52;
const int STOP = 70;
const int SLOW_RIGHT = 82;
const int FAST_RIGHT = 180;

const int LEFT_BOUNDARY = 230;
const int RIGHT_BOUNDARY = 1000;

//Servo servo1;
//Servo servo2;
Servo baseplate_servo;
Servo axis_servo;
int pot_val;

//const int i1ServoPin = 5;
//const int i2ServoPin = 6;
const int baseplate_servo_pin = 9;
const int axis_servo_pin = 10;
int pot_pin = A1;

int curr_speed_dir;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(57600);
  baseplate_servo.attach(baseplate_servo_pin);
  baseplate_servo.write(STOP);
  axis_servo.attach(axis_servo_pin);
  axis_servo.write(STOP);
//  servo2.attach(i2ServoPin);
//  servo3.attach(i3ServoPin);
//  servo4.attach(i4ServoPin);
  curr_speed_dir = FAST_RIGHT;
}

void loop() {
  // put your main code here, to run repeatedly:
  pot_val = analogRead(pot_pin);
  Serial.println(pot_val);
  if(pot_val > RIGHT_BOUNDARY){
    curr_speed_dir = FAST_LEFT;
  }
  else if(pot_val < LEFT_BOUNDARY){
    curr_speed_dir = FAST_RIGHT;
  }
  axis_servo.write(curr_speed_dir);

  // code for servo 1
  
//  servo4.write(70);

  // code for servo 4
//  if(iVal < 400){
//    servo4.write(0);
//  } else if ((iVal > 400) && (iVal < 700)){
//    servo4.write(90);
//  } else {
//    Serial.println("entered else clause");
//    servo4.write(180);
//  }
  delay(500);
}
