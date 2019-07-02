let numBalls = 600;
let spring = 0.05;
let gravity = 0.03;
let friction = -0.5;
let ballDiam = 40;
let balls = [];

let prevMouseX = 0;
let prevMouseY = 0;
let dMouseX;
let dMouseY;

let baseColor;
let mouseDiam = ballDiam * 0.5;
let maxMouseVel = 3;
let prevMouseColor;
let currMouseColor;
let nextMouseColor;
let changeTime = 8000;
let prevChange = 0;

let increasing = true;
let trailViz = 5;
let trailVizUpdateIncr = 0.1;
let tra

function getRandomColor() {
  return color(random(255), random(255), random(255));
}

function updateTrailViz() {
  if (increasing) {
    trailViz += 0.1;
    if (trailViz > 30) 
      increasing = false;
  } else {
    trailViz -= 2;
    if (trailViz < 8) 
      increasing = true;
  }
}
    

function setup() {
  baseColor = color(0, 0, 0);
  prevMouseColor = currMouseColor = nextMouseColor = getRandomColor();

  createCanvas(window.innerWidth, window.innerHeight);
  for (let i = 0; i < numBalls; i++) {
    balls[i] = new Ball(
      random(width),
      random(height),
      ballDiam,
      i,
      balls
    );
  }

  noStroke();
  fill(baseColor); 
}

function draw() {
  updateTrailViz();
  background(255, trailViz);
  //background(255, 100);
  dMouseX = min(maxMouseVel, max(-maxMouseVel, (mouseX - prevMouseX) / 2));
  dMouseY = min(maxMouseVel, max(-maxMouseVel, (mouseY - prevMouseY) / 2));
  
  balls.forEach((ball, index) => {
    ball.collide();
    ball.mouseCollide();
    ball.move();
    ball.display();
  });

  prevMouseX = mouseX;
  prevMouseY = mouseY;
  
  if (millis() > prevChange + changeTime) {
    prevMouseColor = nextMouseColor;
    nextMouseColor = getRandomColor();
    prevChange = millis();
  }
  
  currMouseColor = lerpColor(prevMouseColor, nextMouseColor, (millis() - prevChange) / changeTime);
  let feathering = 3;
  for (var i = 0; i < feathering; ++i) {
    currMouseColor.setAlpha(100 * (1 - (i / feathering)));
    fill(currMouseColor);
    ellipse(mouseX, mouseY, mouseDiam * (i / feathering) , mouseDiam * (i / feathering));
  }
  currMouseColor.setAlpha(255);
}

class Ball {
  constructor(xin, yin, din, idin, oin) {
    this.x = xin;
    this.y = yin;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.diameter = din;
    this.id = idin;
    this.others = oin;

    this.color = baseColor;
  }

  collide(index) {
    // let collideColor = color(10, 150, 210);
    for (let i = this.id + 1; i < numBalls; i++) {
      // console.log(others[i]);
      let dx = this.others[i].x - this.x;
      let dy = this.others[i].y - this.y;
      let distance = sqrt(dx * dx + dy * dy);
      let minDist = this.others[i].diameter / 2 + this.diameter / 2;
      //   console.log(distance);
      //console.log(minDist);
      if (distance < minDist) {
        //console.log("2");
        let angle = atan2(dy, dx);
        let targetX = this.x + cos(angle) * minDist;
        let targetY = this.y + sin(angle) * minDist;
        let ax = (targetX - this.others[i].x) * spring;
        let ay = (targetY - this.others[i].y) * spring;
        this.vx -= ax;
        this.vy -= ay;
        this.others[i].vx += ax;
        this.others[i].vy += ay;

        let totalVel = sqrt(pow(this.vx, 2), pow(this.vy, 2));
        if (totalVel > 5)
            this.others[i].color = this.color;
      }
    }
  }

  mouseCollide() {
    let dx = (mouseX - this.x);
    let dy = (mouseY - this.y);
    let distance = sqrt(dx * dx + dy * dy);
    let minDist = 2 * ballDiam;
    //   console.log(distance);
    //console.log(minDist);
    if (distance < minDist) {
      //console.log("2");
      let angle = atan2(dy, dx);
      let targetX = this.x + cos(angle) * minDist;
      let targetY = this.y + sin(angle) * minDist;
      let ax = (targetX - mouseX) * spring;
      let ay = (targetY - mouseY) * spring;
      this.vx -= ax;
      this.vy -= ay;
      
      if (abs(dMouseX) > 2) 
        this.vx = (dMouseX + this.vx) / 2 + Math.sign(this.vx) * 0.5;
      if (abs(dMouseY) > 2)
        this.vy = (dMouseY + this.vy) / 2 + Math.sign(this.vy) * 0.5;

      // if (abs(dMouseX) > 2 || abs(dMouseY) > 2)
      this.color = currMouseColor;
    }
  }

  move() {
    //this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x + this.diameter / 2 > width) {
      this.x = width - this.diameter / 2;
      this.vx *= friction;
    } else if (this.x - this.diameter / 2 < 0) {
      this.x = this.diameter / 2;
      this.vx *= friction;
    }
    if (this.y + this.diameter / 2 > height) {
      this.y = height - this.diameter / 2;
      this.vy *= friction;
    } else if (this.y - this.diameter / 2 < 0) {
      this.y = this.diameter / 2;
      this.vy *= friction;
    }
  }

  display() {
    fill(this.color);
    ellipse(this.x, this.y, this.diameter, this.diameter);
  }
}
