let numBalls = 500;
let spring = 0.05;
let gravity = 0.03;
let friction = -0.8;
let ballDiam = 40;
let balls = [];

let totalAvgMotion = 0; // average of magnitude of ball velocity

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

let painting = false; // true if mouse held down

let streamRate = 200; // for streaming data, only send every 100ms
let lastStream = 0;
let okToStream = false;

let maxOSCClient = new OSCClient("ws://localhost:8081");

function setup() {
    baseColor = color(0, 0, 0);
    prevMouseColor = currMouseColor = nextMouseColor = getRandomColor();

    createCanvas(window.innerWidth, window.innerHeight);
    for (let i = 0; i < numBalls; i++)
        balls[i] = new Ball(random(width), random(height), ballDiam, i, balls);

    noStroke();
    fill(baseColor); 
}

function draw() {
    if (millis() > lastStream + streamRate) {
        okToStream = true;
        lastStream = millis();
    }

    updateTrailViz();
    background(255, trailViz);

    dMouseX = min(maxMouseVel, max(-maxMouseVel, (mouseX - prevMouseX) / 2));
    dMouseY = min(maxMouseVel, max(-maxMouseVel, (mouseY - prevMouseY) / 2));
    
    avgOverallMotion = 0;
    balls.forEach((ball, index) => {
        ball.collide();
        if (painting)
            ball.mouseCollide();
        ball.move();
        ball.display();
        avgOverallMotion += ball.getVelocityMagnitude();
    });
    avgOverallMotion /= balls.length;
    if (okToStream)
        maxOSCClient.send('/collider/avgOverallMotion', [avgOverallMotion]);

    prevMouseX = mouseX;
    prevMouseY = mouseY;
    
    if (millis() > prevChange + changeTime) {
        prevMouseColor = nextMouseColor;
        nextMouseColor = getRandomColor();
        prevChange = millis();
    }
    
    currMouseColor = lerpColor(prevMouseColor, nextMouseColor, (millis() - prevChange) / changeTime);
    if (painting && okToStream){
        maxOSCClient.send('/collider/cursorInfo', [
            mouseX / width, mouseY / height,
            red(currMouseColor) / 255,
            blue(currMouseColor) / 255,
            green(currMouseColor) / 255
        ]);
    }

    let feathering = 3;
    for (var i = 0; i < feathering; ++i) {
        currMouseColor.setAlpha(100 * (1 - (i / feathering)));
        fill(currMouseColor);
        ellipse(mouseX, mouseY, mouseDiam * (i / feathering) , mouseDiam * (i / feathering));
    }
    currMouseColor.setAlpha(255);

    okToStream = false;
}

function mousePressed() {
    painting = true;
    return false;
}

function mouseReleased() {
    painting = false;
    return false;
}

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
    maxOSCClient.send('/collider/visDensity', [trailViz]);
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

    getVelocityMagnitude() {
        return sqrt(pow(this.vx, 2) + pow(this.vy, 2));
    }

    collide(index) {
        // let collideColor = color(10, 150, 210);
        for (let i = this.id + 1; i < numBalls; i++) {
            // console.log(others[i]);
            let dx = this.others[i].x - this.x;
            let dy = this.others[i].y - this.y;
            let distance = sqrt(dx * dx + dy * dy);
            let minDist = this.others[i].diameter / 2 + this.diameter / 2;
            //     console.log(distance);
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

                let velMag = sqrt(pow(this.vx, 2) + pow(this.vy, 2));
                if (velMag > 5) {
                    this.others[i].color = this.color;
                    if (okToStream) {
                        maxOSCClient.send('/collider/collisionColorTransfer', [
                            (this.x + this.others[i].x) / 2,
                            (this.y + this.others[i].y) / 2,
                            velMag,
                            red(this.color) / 255,
                            blue(this.color) / 255,
                            green(this.color) / 255
                        ]);
                    }
                }
            }
        }
    }

    mouseCollide() {
        let dx = (mouseX - this.x);
        let dy = (mouseY - this.y);
        let distance = sqrt(dx * dx + dy * dy);
        let minDist = 2 * ballDiam;
        //     console.log(distance);
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

            let velMag = sqrt(pow(dMouseX, 2) + pow(dMouseY, 2));
            if (velMag > 3) {
                this.color = currMouseColor;
                if (okToStream) {
                    maxOSCClient.send('/collider/cursorColorTransfer', [
                        (this.x + mouseX) / 2,
                        (this.y + mouseY) / 2,
                        velMag,
                        red(this.color) / 255,
                        blue(this.color) / 255,
                        green(this.color) / 255
                    ]);
                }
            }
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
