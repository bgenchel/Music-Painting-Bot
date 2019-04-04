let flock;
let boidColor;
let idCounter;
let virtualArm;
let samples;

let maxBoids = 250;
let maxCollisions = 25;

var fft, lowPass;

// center clip nullifies samples below a clip amount
var doCenterClip = false;
var centerClipThreshold = 0.0;

// normalize pre / post autocorrelation
var preNormalize = true;
var postNormalize = true;

// height of fft == height/divisions
var divisions = 5;
var cnv;
var speed = 1;

var mic, soundFile;
var amplitude;
var mapMax = 1.0;

var prevLevels = new Array(60);

var level_buff = new Array(30);
var freq_buff = new Array(30);

function setup() {
    cnv = createCanvas(windowWidth, windowHeight);
    createCanvas(window.innerWidth, window.innerHeight);
    // createP("Drag the mouse to generate new boids.");
    console.log('setting up');
    idCounter = 0;
    flock = new Flock();
    // Add an initial set of boids into the system
    newColor();
    for (let i = 0; i < 100; i++) {
        let b = new Boid(width / 2 + random(100), height / 2 + random(100), boidColor, idCounter);
        flock.addBoid(b);
    }
    newColor();
    // Create the arm
    virtualArm = new VirtualArm();
    mic = new p5.AudioIn();
    mic.start();

      // soundFile.play();

    amplitude = new p5.Amplitude();
    amplitude.setInput(mic);
    amplitude.smooth(0.6);

    // fft
    lowPass = new p5.LowPass();
    lowPass.disconnect();
    mic.connect(lowPass);

    fft = new p5.FFT();
    fft.setInput(lowPass);
}

function draw() {
    
    background(51);
    // // fft draw
    
    // var h = height/divisions;
    // var spectrum = fft.analyze();
    // var newBuffer = [];

    // var scaledSpectrum = splitOctaves(spectrum, 12);
    // var len = scaledSpectrum.length;

    // background(200, 200, 200, 1);
    // // copy before clearing the background
    // copy(cnv,0,0,width,height,0,speed,width,height);

    // // draw shape
    // beginShape();

    // // one at the far corner
    // curveVertex(0, h);

    // for (var i = 0; i < len; i++) {
    //   var point = smoothPoint(scaledSpectrum, i, 2);
    //   var x = map(i, 0, len-1, 0, width);
    //   var y = map(point, 0, 255, h, 0);
    //   curveVertex(x, y);
    // }

    // // one last point at the end
    // curveVertex(width, h);

    // endShape();
    ////

    // pitch detect

    // array of values from -1 to 1
    var timeDomain = fft.waveform(1024, 'float32');
    var corrBuff = autoCorrelate(timeDomain);

    // beginShape();
    // for (var i = 0; i < corrBuff.length; i++) {
    //     var w = map(i, 0, corrBuff.length, 0, width);
    //     var h = map(corrBuff[i], -1, 1, height, 0);
    //     curveVertex(w, h);
    // }
    // endShape();

    fill(0);
    text ('Center Clip: ' + centerClipThreshold, 20, 20); 
    line (0, height/2, width, height/2);

    var freq = findFrequency(corrBuff);
    text ('Fundamental Frequency: ' + freq.toFixed(2), 20, 50); 
    freq_buff.push(freq);
    freq_buff.splice(0, 1);

    // plot amp
    // background(20, 20);
    // fill(255, 255);
    var level = amplitude.getLevel();
    text('Amplitude: ' + level, 20, 80);
    level_buff.push(level);
    level_buff.splice(0, 1);

    // rectangle variables
    var spacing = 15;
    var w = width/ (prevLevels.length * spacing);

    var minHeight = 2;
    var roundness = 20;

    // add new level to end of array
    prevLevels.push(level);

    // remove first item in array
    prevLevels.splice(0, 1);

    // loop through all the previous levels
    for (var i = 0; i < prevLevels.length; i++) {

    var x = map(i, prevLevels.length, 0, width/2, width);
    var h = map(prevLevels[i], 0, 0.5, minHeight, height);

    var alphaValue = map(i, 0, prevLevels.length, 1, 250);

    var hueValue = map(h, minHeight, height, 200, 255);

    fill(hueValue, 0, 0, alphaValue);

    rect(x, height/2, w, -h);
    rect(width - x, height/2, w, -h);
    rect(x, height/2, w, h);
    rect(width - x, height/2, w, h);
    }

    var arm_level = level_buff.sum() / level_buff.length;
    text('arm_Amplitude: ' + arm_level, 20, 110);
    
    var arm_freq = freq_buff.sum() / freq_buff.length;
    text('arm_Freq: ' + arm_freq, 20, 140);
    // arm stuff
    flock.run();
    virtualArm.run(arm_level*1000, arm_freq);
    



}

Array.prototype.sum = function() {
    return this.reduce(function(a,b){return a+b;});
};

function mouseClicked() {
    // sample.play();
    newColor();
    idCounter += 1;
}

// Add a new boid into the System
function mouseDragged() {
    flock.addBoid(new Boid(mouseX, mouseY, boidColor, idCounter));
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
}

VirtualArm.prototype.run = function(level, freq) {
    


    this.reachSegment(0, freq, level);
    for (let i = 1; i < this.numSegments; i++) {
        this.reachSegment(i, this.targetX, this.targetY);
    }
    for (let j = this.x.length - 1; j >= 1; j--) {
        this.positionSegment(j, j - 1);
    }
    for (let k = 0; k < this.x.length; k++) {
        this.segment(this.x[k], this.y[k], this.angle[k], (k + 1) * 2);
    }
    this.reachSegment(0, freq, level);
    for (let i = 1; i < this.numSegments; i++) {
        this.reachSegment(i, this.targetX, this.targetY);
    }
    for (let j = this.x.length - 1; j >= 1; j--) {
        this.positionSegment(j, j - 1);
    }
    for (let k = 0; k < this.x.length; k++) {
        this.segment(this.x[k], this.y[k], this.angle[k], (k + 1) * 2);
    }
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
}

Flock.prototype.run = function() {
    let boidKillList = [];
    let collisionKillList = [];
    
    for (let i = 0; i < this.boids.length; i++) {
        let curr = this.boids[i];
        // Passing the entire list of boids to each boid individually
        curr.run(this.boids);
        if (curr.time > curr.lifespan) {
            boidKillList.push(i);
        }
    }
    
    for (let i = 0; i < this.collisions.length; i++) {
        let curr = this.collisions[i];
        curr.run();
        if (curr.time > curr.lifespan) {
            collisionKillList.push(i);
        }
    }
    
    for (let idx in boidKillList) {
        this.boids.splice(boidKillList[idx], 1);
    }
    
    for (let idx in collisionKillList) {
        this.collisions.splice(collisionKillList[idx], 1);
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
}

Boid.prototype.run = function(boids) {
    this.flock(boids);
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
Boid.prototype.flock = function(boids) {
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
    this.playSounds(boids);
}

// Method to update location
Boid.prototype.update = function() {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // Reset accelertion to 0 each cycle
    this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target) {
    let desired = p5.Vector.sub(target,this.position);    // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);
    // Steering = Desired minus Velocity
    let steer = p5.Vector.sub(desired,this.velocity);
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
        let d = p5.Vector.dist(this.position,boids[i].position);
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
        let d = p5.Vector.dist(this.position,boids[i].position);
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

// Sounds
// randomly kill one of two boids that intersect
Boid.prototype.playSounds = function(boids) {
    let neighbordist = 1;
    for (let i = 0; i < boids.length; i++) {
        let age = this.time / this.lifespan;
        let other_age = boids[i].time / boids[i].lifespan;
        if (this === boids[i] || age < 0.2 || this.gid == boids[i].gid) continue;
        let d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < neighbordist)) {
                let coll_pos = p5.Vector.add(this.position, boids[i].position).mult(0.5);
                let newColl = new Collision(coll_pos.x, coll_pos.y);
                newColl.setAge((age + other_age) / 2);
                flock.addCollision(newColl);

                this.color = color(255, 255, 255);
                boids[i].color = color(255, 255, 255);
            
                let sample = samples[int(random(samples.length))]
                sample.setVolume(0.7 * (1 - (0.5 * age + 0.5 * other_age)));
                sample.play();
        }
    }
}

//// Collision object
function Collision(x, y) {
    this.position = createVector(x, y);
    this.r = 4.0;

    this.color = color(255, 255, 255);
    
    this.time = 0;
    this.lifespan = 800;
}

Collision.prototype.run = function(){
    this.update();
    this.time += 1;
}

// Method to update fading basically
Collision.prototype.update = function() {
    // render
    let alpha = 255 - 255 * (this.time / this.lifespan);
    this.color.setAlpha(alpha);
    fill(this.color);
    strokeWeight(1);
    stroke(255, alpha);
    push(); // start a new drawing state
    translate(this.position.x, this.position.y);
    beginShape();
    circle(this.r, this.r, this.r);
    endShape(CLOSE);
    pop();
}

Collision.prototype.setAge = function(pct) {
    // input is percentage of life over
    this.time = int(this.lifespan * pct);
}


/////// fft plot /////////

function splitOctaves(spectrum, slicesPerOctave) {
  var scaledSpectrum = [];
  var len = spectrum.length;

  // default to thirds
  var n = slicesPerOctave|| 3;
  var nthRootOfTwo = Math.pow(2, 1/n);

  // the last N bins get their own 
  var lowestBin = slicesPerOctave;

  var binIndex = len - 1;
  var i = binIndex;


  while (i > lowestBin) {
    var nextBinIndex = round( binIndex/nthRootOfTwo );

    if (nextBinIndex === 1) return;

    var total = 0;
    var numBins = 0;

    // add up all of the values for the frequencies
    for (i = binIndex; i > nextBinIndex; i--) {
      total += spectrum[i];
      numBins++;
    }

    // divide total sum by number of bins
    var energy = total/numBins;
    scaledSpectrum.push(energy);

    // keep the loop going
    binIndex = nextBinIndex;
  }

  // add the lowest bins at the end
  for (var j = i; j > 0; j--) {
    scaledSpectrum.push(spectrum[j]);
  }

  // reverse so that array has same order as original array (low to high frequencies)
  scaledSpectrum.reverse();

  return scaledSpectrum;
}


// average a point in an array with its neighbors
function smoothPoint(spectrum, index, numberOfNeighbors) {

  // default to 2 neighbors on either side
  var neighbors = numberOfNeighbors || 2;
  var len = spectrum.length;

  var val = 0;

  // start below the index
  var indexMinusNeighbors = index - neighbors;
  var smoothedPoints = 0;

  for (var i = indexMinusNeighbors; i < (index+neighbors) && i < len; i++) {
    // if there is a point at spectrum[i], tally it
    if (typeof(spectrum[i]) !== 'undefined') {
      val += spectrum[i];
      smoothedPoints++;
    }
  }

  val = val/smoothedPoints;

  return val;
}

/////// Auto corr pitch track /////////


// accepts a timeDomainBuffer and multiplies every value
function autoCorrelate(timeDomainBuffer) {
  
  var nSamples = timeDomainBuffer.length;

  // pre-normalize the input buffer
  if (preNormalize){
    timeDomainBuffer = normalize(timeDomainBuffer);
  }

  // zero out any values below the centerClipThreshold
  if (doCenterClip) {
    timeDomainBuffer = centerClip(timeDomainBuffer);
  }

  var autoCorrBuffer = [];
  for (var lag = 0; lag < nSamples; lag++){
    var sum = 0; 
    for (var index = 0; index < nSamples-lag; index++){
      var indexLagged = index+lag;
      var sound1 = timeDomainBuffer[index];
      var sound2 = timeDomainBuffer[indexLagged];
      var product = sound1 * sound2;
      sum += product;
    }

    // average to a value between -1 and 1
    autoCorrBuffer[lag] = sum/nSamples;
  }

  // normalize the output buffer
  if (postNormalize){
    autoCorrBuffer = normalize(autoCorrBuffer);
  }

  return autoCorrBuffer;
}


// Find the biggest value in a buffer, set that value to 1.0,
// and scale every other value by the same amount.
function normalize(buffer) {
  var biggestVal = 0;
  var nSamples = buffer.length;
  for (var index = 0; index < nSamples; index++){
    if (abs(buffer[index]) > biggestVal){
      biggestVal = abs(buffer[index]);
    }
  }
  for (var index = 0; index < nSamples; index++){

    // divide each sample of the buffer by the biggest val
    buffer[index] /= biggestVal;
  }
  return buffer;
}

// Accepts a buffer of samples, and sets any samples whose
// amplitude is below the centerClipThreshold to zero.
// This factors them out of the autocorrelation.
function centerClip(buffer) {
  var nSamples = buffer.length;

  // center clip removes any samples whose abs is less than centerClipThreshold
  centerClipThreshold = map(mouseY, 0, height, 0,1); 

  if (centerClipThreshold > 0.0) {
    for (var i = 0; i < nSamples; i++) {
      var val = buffer[i];
      buffer[i] = (Math.abs(val) > centerClipThreshold) ? val : 0;
    }
  }
  return buffer;
}

// Calculate the fundamental frequency of a buffer
// by finding the peaks, and counting the distance
// between peaks in samples, and converting that
// number of samples to a frequency value.
function findFrequency(autocorr) {

  var nSamples = autocorr.length;
  var valOfLargestPeakSoFar = 0;
  var indexOfLargestPeakSoFar = -1;

  for (var index = 1; index < nSamples; index++){
    var valL = autocorr[index-1];
    var valC = autocorr[index];
    var valR = autocorr[index+1];

    var bIsPeak = ((valL < valC) && (valR < valC));
    if (bIsPeak){
      if (valC > valOfLargestPeakSoFar){
        valOfLargestPeakSoFar = valC;
        indexOfLargestPeakSoFar = index;
      }
    }
  }
  
  var distanceToNextLargestPeak = indexOfLargestPeakSoFar - 0;

  // convert sample count to frequency
  var fundamentalFrequency = sampleRate() / distanceToNextLargestPeak;
  return fundamentalFrequency;
}