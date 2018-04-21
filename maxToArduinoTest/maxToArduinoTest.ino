const int iLedPin = 13;
int value = 0;

void setup() {
  // put your setup code here, to run once:
  pinMode(iLedPin, OUTPUT);
  Serial.begin(57600);
}

void loop() {
  // put your main code here, to run repeatedly:

  if (Serial.available())
  {
    value = Serial.read();
    digitalWrite(iLedPin,value);
  }
}
