
#include <Servo.h>

Servo grid_servo;
Servo platform_servo;
Servo arm_base_servo;
Servo arm_joint_servo;

int val;
const int grid_servo_pin = 10;
const int platform_servo_pin = 9;
const int arm_base_servo_pin = 6;
const int arm_joint_servo_pin = 5;
const int pot_pin = A0;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(57600);
  grid_servo.attach(grid_servo_pin);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  // put your main code here, to run repeatedly:
//  val = analogRead(pot_pin);
//  Serial.println(val);
//  if(val < 400){
//    servo.write(140);
//    delay(500);
//    servo.write(70);
//  } else if ((val > 400) && (val < 700)){
//    servo.write(70);
//  } else {
//    Serial.println("entered else clause");
//    servo.write(30);
//    delay(500);
//    servo.write(70);
//  }
  digitalWrite(LED_BUILTIN, HIGH);
  grid_servo.write(100);
  delay(100);
  grid_servo.write(70);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
  grid_servo.write(30);
  delay(50);
  grid_servo.write(70);
  delay(200);
  grid_servo.write(30);
  delay(50);
}
