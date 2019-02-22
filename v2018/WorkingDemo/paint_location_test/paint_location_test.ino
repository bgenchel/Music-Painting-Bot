#include <Servo.h>


Servo servo1;
Servo servo2;
Servo servo3;
Servo servo4;

int i1ServoPin = 5;
int i2ServoPin = 6;
int i3ServoPin = 9;

float step_size = 2;
int num_steps = 0;
const float steps = 20;


int Mid1 = 130;
int Mid2 = 60;
int Mid3 = 135;

int Left1 = 100;
int Left2 = 100;
int Left3 = 165;

int Right1 = 100;
int Right2 = 100;
int Right3 = 105;

int init1 = Mid1;
int init2 = Mid2;
int init3 = Mid3;

int initdir1 = 0;
int initdir2 = 0;
int initdir3 = 0;

int num_init_steps = 20;
float step_size_ratio21 = 1.8;

int iPosS1=init1;
int iPosS2=init2;
int iPosS3=init3;

int PrevLoc1= init1;
int PrevLoc2= init2;
int PrevLoc3 = init3;

int iModeS3 = 1;
int PModeS3 = 1;


int S1_LB = 70;
int S1_UB = 150;
const int S2_LB = 50;
const int S2_UB = 150;
const int S3_UB = 180;
const int S3_LB = 110;

int i;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(57600);
  servo1.attach(i1ServoPin);
  servo2.attach(i2ServoPin);
  servo3.attach(i3ServoPin);

//  if (iPotS2 < S2_LB)
//  {
//    iPotS2 = S2_LB;
//  }
//  if (iPotS2 > S2_UB)
//  {
//    iPotS2 = S2_UB;
//  }
//
//  S1_UB = 220 - iPotS2;
//  if (iPotS1 < S1_LB)
//  {
//    iPotS1 = S1_LB;
//  }
//  if (iPotS1 > S1_UB)
//  {
//    iPotS1 = S1_UB;
//  }
//
//  if (iPotS3 < S3_LB)
//  {
//    iPotS3 = S3_LB;
//  }
//  if (iPotS3 > S3_UB)
//  {
//    iPotS3 = S3_UB;
//  }

  servo1.write(init1);
  servo2.write(init2);
  servo3.write(init3);
}

void loop() {

  Serial.print(PrevLoc2);
  Serial.println(PrevLoc1);
  if (Serial.available())
  {
    iPosS1 = Serial.read();
    iPosS2 = Serial.read();
    iModeS3 = Serial.read();
  }

  
  if (iPosS2 != PrevLoc2)
  {
    // get number of steps
    num_steps = (abs(iPosS2 - PrevLoc2))/step_size;

    //iPosS1 = PrevLoc1 + (PrevLoc2 - iPosS2) / 2;
    // draw upper half
    if (iPosS2 >= init2)
    {
      // stroke up
      if (iPosS2 > PrevLoc2)
      {
        iPosS1 =  (iPosS2-PrevLoc2 ) / 10 * 2;
        for (i = 0; i<num_steps; i++)
        {
          servo1.write(PrevLoc1 - step_size_ratio21*step_size);
          PrevLoc1 = PrevLoc1 - step_size_ratio21*step_size;
          servo2.write(PrevLoc2 + step_size);
          PrevLoc2 = PrevLoc2 + step_size;
          delay(10);
        }
        iPosS1 = PrevLoc1 + iPosS1;
        
      }
      // stroke down
      else
      {
        iPosS1 =  (PrevLoc2 - iPosS2) / 10 * 3;
        for (i = 0; i<num_steps; i++)
        {
          servo2.write(PrevLoc2 - step_size);
          PrevLoc2 = PrevLoc2 - step_size;
          servo1.write(PrevLoc1 + step_size_ratio21*step_size);
          PrevLoc1 = PrevLoc1 + step_size_ratio21*step_size;
          delay(10);
        }
        iPosS1 = PrevLoc1 + iPosS1;
      }
    }
    // equals center value
//    else if (iPosS2 == init2){
//      servo1.write(init1);
//      servo2.write(init2);
//      servo3.write(init3);
//      
//    }
    // draw lower half
    else 
    {
//      // stroke up
//      if (iPosS2 > PrevLoc2)
//      {
//        for (i = 0; i<num_steps; i++)
//        {
//          servo1.write(PrevLoc1 - step_size);
//          PrevLoc1 = PrevLoc1 - step_size;
//          servo2.write(PrevLoc2 - step_size);
//          PrevLoc2 = PrevLoc2 - step_size;
//          delay(10);
//        }
//      }
//      // stroke down
//      else
//      {
//        for (i = 0; i<num_steps; i++)
//        {
//
//          servo2.write(PrevLoc2 + step_size);
//          PrevLoc2 = PrevLoc2 + step_size;        
//          servo1.write(PrevLoc1 + step_size);
//          PrevLoc1 = PrevLoc1 + step_size;
//          delay(10);
//        }
//      }
    }
    Serial.print(PrevLoc1);
    Serial.print(" ");
    Serial.println(iPosS1);
    servo2.write(iPosS2);
    servo1.write(iPosS1);
    PrevLoc2 = iPosS2;
    PrevLoc1 = iPosS1;
  }
  
  if (iModeS3 != PModeS3)
  {

   
        
    if (iModeS3 == 0)
    {
      init1 = Left1;
      init2 = Left2;
      init3 = Left3;
    }
    else if (iModeS3 == 2)
      {
        init1 = Right1;
        init2 = Right2;
        init3 = Right3;
      }
      else
      {
        init1 = Mid1;
        init2 = Mid2;
        init3 = Mid3;
      }

    
 
    for (i = 0; i < num_init_steps; i++)
    {
      //bug
      initdir1 = (init1 - PrevLoc1) / (num_init_steps-i);
      initdir2 = (init2 - PrevLoc2) / (num_init_steps-i);
      initdir3 = (init3 - PrevLoc3) / (num_init_steps-i);
      
        
      if (iModeS3 == 1)
      {
        
        servo2.write(PrevLoc2 + initdir2);
        servo3.write(PrevLoc3 + initdir3);
        servo1.write(PrevLoc1 + initdir1);
        //Serial.println(PrevLoc1);
    
    
      
      }else{
        
        servo1.write(PrevLoc1 + initdir1);
        servo2.write(PrevLoc2 + initdir2);
        servo3.write(PrevLoc3 + initdir3);
      }
      delay(10);
      
      PrevLoc1 = PrevLoc1 + initdir1;
      PrevLoc2 = PrevLoc2 + initdir2;
      PrevLoc3 = PrevLoc3 + initdir3;
      delay(10);
    }
    
    servo1.write(init1);
    PrevLoc1 = init1;
    servo2.write(init2);
    PrevLoc2 = init2;
    servo3.write(init3);
    PrevLoc3 = init3;
    PModeS3 = iModeS3;
      
  }
  
  delay(100);
}
