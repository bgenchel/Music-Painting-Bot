// All the paths
let paths = [];
// Are we painting?
let painting = false;
// How long until the next circle
let next = 50;
// Where are we now and where were we?
let current;
let previous;

let hitHeight;

let looping = true;

let cursorX = cursorY = 0;

let oscClient = new OSCClient("ws://localhost:8081")

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    current = createVector(0,0);
    previous = createVector(0,0);
    hitHeight = 0.1 * height;

    oscClient.map('/cursor', (args) => {
        cursorX = args[0];
        cursorY = args[1];
    });
}

function draw() {
    background(136, 206, 250);
    
    // draw limit line
    stroke(color(255, 255, 255));
    line(width / 5, hitHeight, width * 4 / 5, hitHeight);
    noStroke

    // If it's time for a new point
    if (millis() > next && painting) {

        // Grab mouse position            
        current.x = mouseX;
        current.y = mouseY;

        // New particle's force is based on mouse movement
        var force = p5.Vector.sub(current, previous);
        force.mult(0.05);

        // Add new particle
        paths[paths.length - 1].add(current, force);
        
        // Schedule next circle
        next = millis() + random(5);

        // Store mouse values
        previous.x = current.x;
        previous.y = current.y;
    }

    // Draw all paths
    for( var i = 0; i < paths.length; i++) {
        paths[i].update();
        paths[i].display();
    }
}

// Start it up
function mousePressed() {
    next = 0;
    painting = true;
    previous.x = mouseX;
    previous.y = mouseY;
    paths.push(new Path());
}

// Stop
function mouseReleased() {
    painting = false;
}

function keyPressed() {
    if (keyCode === ENTER && looping) {
        noLoop();
        looping = false;
    } else if (keyCode === ENTER && !looping) {
        loop();
        looping = true;
    }
}

// A Path is a list of particles
function Path() {
    this.particles = [];
    this.hue = random(50);
}

Path.prototype.add = function(position, force) {
    // Add a new particle with a position, force, and hue
    this.particles.push(new Particle(position, force, this.hue));
}

// Display plath
Path.prototype.update = function() {    
    for (var i = 0; i < this.particles.length; i++) {
        this.particles[i].update();
    }
}    

// Display plath
Path.prototype.display = function() {
    
    // Loop through backwards
    for (var i = this.particles.length - 1; i >= 0; i--) {
        // If we shold remove it
        if (this.particles[i].lifespan <= 0) {
            this.particles.splice(i, 1);
        // Otherwise, display it
        } else {
            this.particles[i].display(this.particles[i+1]);
        }
    }

}    

// Particles along the path
function Particle(position, force, hue) {
    this.position = createVector(position.x, position.y);
    this.velocity = createVector(force.x, force.y);
    this.drag = 0.95;
    this.lifespan = 350;
    this.age = 0;
    this.size = 10;

    this.hasHit = false;
}

Particle.prototype.update = function() {
    // Move it
    this.position.add(this.velocity);
    // Slow it down
    this.velocity.mult(this.drag);
    // Fade it out
    this.lifespan = this.lifespan;
    this.age += 1;
    this.size += 0.25;

    if (this.position.y - (this.age * 2) < hitHeight && !this.hasHit) {
        let alpha = max(0, (1 - 1.2 * this.age / this.lifespan));
        oscClient.send('/cloud', [this.position.x, this.position.y, this.size, alpha]);
        this.hasHit = true;
    }
}

// Draw particle and connect it with a line
// Draw a line to another
Particle.prototype.display = function(other) {
    noStroke();
    fill(255, 255 * max(0, (1 - 1.2 * this.age / this.lifespan)));        
    ellipse(this.position.x, this.position.y - (this.age * 2), this.size + this.age / 8, this.size);        
    // println(this.lifespan);
     // If we need to draw a line
    // if (other) {
        // line(this.position.x, this.position.y, other.position.x, other.position.y);
    // }
}
