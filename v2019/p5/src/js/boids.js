let flock;
let boidColor;
let idCounter;
let virtualArm;
let samples;

let maxBoids = 250;
let maxCollisions = 25;

let looping = true;

let cursorX = cursorY = 0;
let painting = false;

let next = 100;

let oscClient = new OSCClient("ws://localhost:8081")
// let botOSCClient = new OSCClient("ws://localhost:8082")
// let bot_addresses = ['/elbow', '/wrist', '/finger'];

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    // createP("Drag the mouse to generate new boids.");
    console.log('setting up');
    idCounter = 0;
    flock = new Flock();
    // Add an initial set of boids into the system
    newColor();
    for (let i = 0; i < 50; i++) {
        let b = new Boid(width / 2 + random(100), height / 2 + random(100), boidColor, idCounter);
        flock.addBoid(b);
    }
    newColor();

    oscClient.map('/cursorOn', (path, args) => {
        cursorX = map(1 - args[0], 0, 1, 0, width);
        cursorY = map(args[1], 0, 1, 0, height);
        console.log('received cursorOn message');
        if (!painting)
            cursorOn();
    });

    oscClient.map('/cursorOff', (args) => {
        if (painting)
            cursorOff();
    });
    // Create the arm
    // virtualArm = new VirtualArm();
    // botOSCClient.send('/test', [1, 2, 3]);
}

function draw() {
    background(51);
    if (painting) 
        cursorDragged();
    flock.run();
    // virtualArm.run();
}

function cursorOn() {
    newColor();
    idCounter += 1;
    painting = true;
}

function cursorOff() {
    painting = false;
}

function cursorDragged() {
    if (millis() > next) {
        flock.addBoid(new Boid(cursorX, cursorY, boidColor, idCounter));
        next = millis() + random(10);
    }
}

// function mouseClicked() {
//     // sample.play();
//     newColor();
//     idCounter += 1;
// }

// // Add a new boid into the System
// function mouseDragged() {
//     flock.addBoid(new Boid(mouseX, mouseY, boidColor, idCounter));
// }

function keyPressed() {
    if (keyCode === ENTER && looping) {
        noLoop();
        looping = false;
    } else if (keyCode === ENTER && !looping) {
        loop();
        looping = true;
    }
}

function newColor() {
    boidColor = color(random(255),random(255),random(255));
}

function VirtualArm() {
    this.numSegments = 3
    this.x = [],
    this.y = [],
    this.angle = [],
    this.segLength = window.innerHeight / 3 - 10,
    this.targetX,
    this.targetY;

    for (let i = 0; i < this.numSegments; i++) {
        this.x[i] = 0;
        this.y[i] = 0;
        this.angle[i] = 0;
    }

    this.x[this.x.length - 1] = window.innerWidth / 2; // Set base x-coordinate
    this.y[this.x.length - 1] = window.innerHeight; // Set base y-coordinate

    // this.sendTimer = 0;
    // this.sendFreq = 60;
}

VirtualArm.prototype.run = function() {
    this.reachSegment(0, cursorX, cursorY);
    for (let i = 1; i < this.numSegments; i++) {
        this.reachSegment(i, this.targetX, this.targetY);
    }
    for (let j = this.x.length - 1; j >= 1; j--) {
        this.positionSegment(j, j - 1);
    }
    for (let k = 0; k < this.x.length; k++) {
        this.segment(this.x[k], this.y[k], this.angle[k], (k + 1) * 2);
    }
    this.reachSegment(0, cursorX, cursorY);
    for (let i = 1; i < this.numSegments; i++) {
        this.reachSegment(i, this.targetX, this.targetY);
    }
    for (let j = this.x.length - 1; j >= 1; j--) {
        this.positionSegment(j, j - 1);
    }
    for (let k = 0; k < this.x.length; k++) {
        this.segment(this.x[k], this.y[k], this.angle[k], (k + 1) * 2);
    }

    // this.sendTimer++;
    // if (this.sendTimer >= this.sendFreq) {
    //     this.sendTimer = 0;
    //     for (let s = 0; s < this.numSegments; s++) {
    //         console.log('segment: ' + s + 'angle: ' + this.angle[s]);
    //         botOSCClient.send(bot_addresses[s], [s, -this.angle[s] * (180 / 3.14159), 0.5]);
    //     }
    // }
}


VirtualArm.prototype.positionSegment = function(a, b) {
    this.x[b] = this.x[a] + cos(this.angle[a]) * this.segLength;
    this.y[b] = this.y[a] + sin(this.angle[a]) * this.segLength;
}

VirtualArm.prototype.reachSegment = function(i, xin, yin) {
    const dx = xin - this.x[i];
    const dy = yin - this.y[i];
    this.angle[i] = atan2(dy, dx);
    this.targetX = xin - cos(this.angle[i]) * this.segLength;
    this.targetY = yin - sin(this.angle[i]) * this.segLength;
}

VirtualArm.prototype.segment = function(x, y, a, sw) {
    strokeWeight(sw);
    stroke(255, 100);
    noFill();
    push();
    translate(x, y);
    rotate(a);
    line(0, 0, this.segLength, 0);
    pop();
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids
function Flock() {
    // An array for all the boids
    this.boids = []; // Initialize the array
    this.collisions = [];

    this.sequenceIndex = 0;
    this.sequenceTimer = 0;
    this.sequenceTempo = 30;
}

function collCompare(a, b) {
    if (a.position.x < b.position.x) return -1;
    if (a.position.x > b.position.x) return 1;
    return 0;
}

Flock.prototype.run = function() {
    let boidKillList = [];
    let collisionKillList = [];
    
    for (let i = 0; i < this.boids.length; i++) {
        let curr = this.boids[i];
        // Passing the entire list of boids to each boid individually, along with index
        curr.run(this.boids, i);
        if (curr.time > curr.lifespan) {
            boidKillList.push(i);
        }
    }

    for (let idx in boidKillList) {
        this.boids.splice(boidKillList[idx], 1);
    }
    
    for (let i = 0; i < this.collisions.length; i++) {
        let curr = this.collisions[i];
        curr.run();
        if (curr.time > curr.lifespan) {
            collisionKillList.push(i);
        }
    }
    
    for (let idx in collisionKillList) {
        this.collisions.splice(collisionKillList[idx], 1);
    }

    this.sequenceTimer++;
    this.collisions.sort(collCompare);
    if (this.collisions.length > 0) {
        if (this.sequenceIndex >= this.collisions.length) this.sequenceIndex = 0;
        if (this.sequenceTimer === this.sequenceTempo) {
            this.collisions[this.sequenceIndex].replay();
            this.sequenceIndex++;
        }
    }
    if (this.sequenceTimer === this.sequenceTempo) {
        this.sequenceTimer = 0;
    }
}

Flock.prototype.addBoid = function(b) {
    if (this.boids.length > maxBoids) {
        this.boids.shift();
    }
    this.boids.push(b);
}

Flock.prototype.addCollision = function(c) {
    if (this.collisions.length > maxCollisions) {
        this.collisions.shift();
    }
    this.collisions.push(c);
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y, color, gID) {
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.position = createVector(x, y);
    this.r = 3.0;
    this.maxspeed = 1.5;        // Maximum speed
    this.maxforce = 0.2; // Maximum steering force
        
    this.gid = gID; // group ID
    this.color = color;
    
    this.time = 0;
    this.lifespan = 600;

    this.collided = false;
}

Boid.prototype.run = function(boids, cid) {  // cid = current index
    this.flock(boids, cid);
    this.update();
    this.borders();
    this.render();
    this.time += 1;
}

Boid.prototype.applyForce = function(force) {
    // We could add mass here if we want A = F / M
    this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function(boids, cid) {
    let sep = this.separate(boids);     // Separation
    let ali = this.align(boids);            // Alignment
    let coh = this.cohesion(boids);     // Cohesion
    // Arbitrarily weight these forces
    sep.mult(1.5);
    ali.mult(1.0);
    coh.mult(1.0);
    // Add the force vectors to acceleration
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
    // Play sounds
    this.handleCollisions(boids, cid);
}

// Method to update location
Boid.prototype.update = function() {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // if (this.collided) { 
        // console.log('position: ' + this.position);
        // console.log('velocity: ' + this.velocity);
    // }
    // Reset accelertion to 0 each cycle
    this.acceleration.mult(0.1); // this can be a fun parameter to mess around with
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target) {
    let desired = p5.Vector.sub(target, this.position);    // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);
    // Steering = Desired minus Velocity
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);    // Limit to maximum steering force
    return steer;
}

Boid.prototype.render = function() {
    // Draw a triangle rotated in the direction of velocity
    let theta = this.velocity.heading() + radians(90);
    let alpha = 255 - 255 * (this.time / this.lifespan);
    this.color.setAlpha(alpha);
    fill(this.color);
    strokeWeight(1);
    // stroke(255, alpha);
    stroke(this.color);
    push();
    translate(this.position.x, this.position.y);
    rotate(theta);
    beginShape();
    // circle(this.r, this.r, this.r);
    vertex(0, -this.r * 2);
    vertex(-this.r, this.r * 2);
    vertex(this.r, this.r * 2);
    endShape(CLOSE);
    pop();
}

// Wraparound
Boid.prototype.borders = function() {
    if (this.position.x < -this.r)    this.position.x = width + this.r;
    if (this.position.y < -this.r)    this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function(boids) {
    let desiredseparation = 25.0;
    let steer = createVector(0, 0);
    let count = 0;
    // For every boid in the system, check if it's too close
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
        if ((d > 0) && (d < desiredseparation) && (this.gid === boids[i].gid)) {
            // Calculate vector pointing away from neighbor
            let diff = p5.Vector.sub(this.position, boids[i].position);
            diff.normalize();
            diff.div(d);                // Weight by distance
            steer.add(diff);
            count++;                        // Keep track of how many
        }
    }
    // Average -- divide by how many
    if (count > 0) {
        steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
        // Implement Reynolds: Steering = Desired - Velocity
        steer.normalize();
        steer.mult(this.maxspeed);
        steer.sub(this.velocity);
        steer.limit(this.maxforce);
    }
    return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function(boids) {
    let neighbordist = 50;
    let sum = createVector(0,0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < neighbordist) && (this.gid == boids[i].gid)) {
            sum.add(boids[i].velocity);
            count++;
        }
    }
    if (count > 0) {
        sum.div(count);
        sum.normalize();
        sum.mult(this.maxspeed);
        let steer = p5.Vector.sub(sum, this.velocity);
        steer.limit(this.maxforce);
        return steer;
    } else {
        return createVector(0, 0);
    }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function(boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0);     // Start with empty vector to accumulate all locations
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < neighbordist) && (this.gid === boids[i].gid)) {
            sum.add(boids[i].position); // Add location
            count++;
        }
    }
    if (count > 0) {
        sum.div(count);
        return this.seek(sum);    // Steer towards the location
    } else {
        return createVector(0, 0);
    }
}

Boid.prototype.handleCollisions = function(boids, cid) {
    if (this.collided === true) return;
    let collDist = 3;
    let spring = 2;
    for (let i = cid; i < boids.length; i++) {
        let age = this.time / this.lifespan;
        let other_age = boids[i].time / boids[i].lifespan;
        if (boids[i].collided === true || i === cid || age < 0.05 || other_age < 0.05 || this.gid === boids[i].gid) continue;
        let d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < collDist)) {
                let coll_pos = p5.Vector.add(this.position, boids[i].position).mult(0.5);
                let newColl = new Collision(coll_pos.x, coll_pos.y, int(random(8)));
                newColl.setAge((age + other_age) / 2);
                flock.addCollision(newColl);

                this.color = color(255, 255, 255);
                boids[i].color = color(255, 255, 255);
                
                let dx = boids[i].position.x - this.position.x;
                let dy = boids[i].position.y - this.position.y;
                let angle = atan2(dy, dx);
                let targetX = this.position.x + cos(angle) * collDist;
                let targetY = this.position.y + sin(angle) * collDist;
                let ax = (targetX - boids[i].position.x) * spring;
                let ay = (targetY - boids[i].position.y) * spring;
                this.velocity.x -= ax;
                this.velocity.y -= ay;
                this.position.x += 10 * this.velocity.x;
                this.position.y += 10 * this.velocity.y;
                boids[i].velocity.x += ax;
                boids[i].velocity.y += ay;
                boids[i].position.x += 10 * boids[i].velocity.x;
                boids[i].position.y += 10 * boids[i].velocity.y;
            
                newColl.play();

                this.collided = true;
                boids[i].collided = true;
                // let sample = samples[int(random(samples.length))]
                // sample.setVolume(0.7 * (1 - (0.5 * age + 0.5 * other_age)));
                // sample.play();
        }
    }
}

//// Collision object
function Collision(x, y, sendNum) {
    this.position = createVector(x, y);
    this.r = 4.0;

    this.color = color(255, 255, 255);
    
    this.time = 0;
    this.lifespan = 1500;

    this.animating = false;
    this.animateClock = 0;
    this.animateTime = 50;
    this.animateStartRadius = this.r;
    this.animateMaxRadius = this.r * 4;
    this.animateColor = color(255, 255, 255);

    this.sendNum = sendNum; // the number to send out when being "played"
}

Collision.prototype.animate = function() {
    this.animateClock++;
    let age = (this.animateClock / this.animateTime);
    if (age > 1) {
        this.endAnimation();
        return;
    }
    let radius = this.animateStartRadius + age * (this.animateMaxRadius - this.animateStartRadius);
    this.animateColor.setAlpha(255 - 255 * age);
    stroke(this.animateColor);
    strokeWeight(1);
    fill(this.animateColor);
    push();
    translate(this.position.x, this.position.y);
    beginShape();
    circle(0, 0, radius);
    endShape(CLOSE);
    pop();
}

Collision.prototype.endAnimation = function() {
    this.animating = false;
    this.animateClock = 0;
}

Collision.prototype.run = function(){
    this.update();
    if (this.animating) {
        this.animate();
    }
    this.time += 1;
}

Collision.prototype.play = function() {
    this.animating = true;
    oscClient.send('/boids', [this.position.x, this.position.y, this.sendNum, 1 - this.getAge()]);
}

Collision.prototype.replay = function() {
    console.log('entered replay function');
    // if (this.time > 30) this.time -= 30;
    this.animating = true;
    oscClient.send('/boids', [this.position.x, this.position.y, this.sendNum, 1 - this.getAge()]);
    // os.log(this.getAge());
}

// Method to update fading basically
Collision.prototype.update = function() {
    // render
    let alpha = 255 - 255 * (this.time / this.lifespan);
    this.color.setAlpha(alpha);
    fill(this.color);
    stroke(this.color);
    strokeWeight(1);
    push(); // start a new drawing state
    translate(this.position.x, this.position.y);
    beginShape();
    circle(0, 0, this.r);
    endShape(CLOSE);
    pop();
}

Collision.prototype.setAge = function(pct) {
    // input is percentage of life over
    this.time = int(this.lifespan * pct);
}

Collision.prototype.getAge = function() {
    return this.time / this.lifespan;
}
