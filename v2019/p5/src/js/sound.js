let width, height;

let virtualArm;
let samples;

let midiOSCClient = new OSCClient("ws://localhost:8081")
let botOSCClient = new OSCClient("ws://localhost:8082")

let bot_addresses = ['/elbow', '/wrist', '/finger', '/base'];

let fft, lowPass, peakDetect;
let mic, soundFile;
let amplitude;
let mapMax = 1.0;

let prevLevels = new Array(60);
let levelBuff = new Array(30);
let freqBuff = new Array(30);

let preNormalize = true;
let postNormalize = true;
let doCenterClip = false;
let centerClipThreshold = 0.0;

let prevPointCalc = 0;
let pointCalcPeriod = 1000; // 3 sec
let currPoint;
let nextPoint;
let controlPointA, controlPointB;
let currStep = 0;
let numSteps = 10;
let prevStepTime = 0;
let stepPeriod = 50;

let numPeaksBuff = new Array(20).fill(0);
let baseAngle;
let prevBaseAngle = 0;

function setup() {
    width = window.innerWidth;
    height = window.innerHeight;
    createCanvas(width, height);
    console.log('setting up');

    // Create the arm
    virtualArm = new VirtualArm();

    // initial mic input
    mic = new p5.AudioIn();
    mic.start();

    // get amplitude and smooth
    amplitude = new p5.Amplitude();
    amplitude.setInput(mic);
    amplitude.smooth(0.6);
    
    // fft
    // lowPass = new p5.LowPass();
    // lowPass.disconnect();
    // mic.connect(lowPass);
    fft = new p5.FFT();
    fft.setInput(mic);
    peakDetect = new p5.PeakDetect();

    currPoint = createVector(width / 4, height / 4);
    controlPointA = createVector(random(width / 2), random(height / 2));
    controlPointB = createVector(random(width / 2), random(height / 2));
    nextPoint = createVector(3 * width / 4, 3 * height / 4);
    botOSCClient.send('/test', [1, 2, 3]);
    frameRate(60);
}

function draw() {
    background(51);

    let freq = getFreq();
    let amplitude = getAmp();

    let spectrum = fft.analyze();
    peakDetect.update(fft);

    let bands = fft.getOctaveBands(12, 27.5);
    let logAvgs = fft.logAverages(bands).slice(0, 88);
    let regionLevels = getAvgRegionLevels(logAvgs, 4);

    let specPeaks = findPeaks(logAvgs, 4, 20);
    numPeaksBuff.push(specPeaks.length);
    numPeaksBuff.splice(0, 1);

    // let centroid = fft.getCentroid() / bands[87]; // normalize between 0 and 1
    // let centroid = fft.getCentroid();
    // let centroidEnergy = fft.getEnergy(centroid);

    if (currStep >= numSteps && (millis() > prevPointCalc + pointCalcPeriod || peakDetect.isDetected)) {
        // getNextPoint(centroid, centroidEnergy, logAvgs, specPeaks, regionLevels, freq, amplitude, peakDetect.isDetected);
        getNextPoint(logAvgs, specPeaks, regionLevels, freq, amplitude, peakDetect.isDetected);
        prevPointCalc = millis();
        currStep = 0;
    }

    // virtualArm.run(map(amplitude, 0, .5, 0, height), map(freq, 0, 7000, 0, width));
    stroke(color(255, 50, 50));
    noFill();
    bezier(currPoint.x, currPoint.y, controlPointA.x, controlPointA.y, controlPointB.x, controlPointB.y, nextPoint.x, nextPoint.y);
    let x = bezierPoint(currPoint.x, controlPointA.x, controlPointB.x, nextPoint.x, currStep / numSteps);
    let y = bezierPoint(currPoint.y, controlPointA.y, controlPointB.y, nextPoint.y, currStep / numSteps);
    if (millis() > prevStepTime + stepPeriod && currStep < numSteps) {
        currStep += 1;
        prevStepTime = millis();
    }
    virtualArm.run(y, x);
}

// function getNextPoint(specCent, specCentEnergy, eqTempLevels, spectralPeaks, avgRegionLevels, freq, amp, isPeak) {
function getNextPoint(eqTempLevels, spectralPeaks, avgRegionLevels, freq, amp, isPeak) {
    const limitWidth = w => min(width - 20, max(20, w));
    const limitHeight = h => min(height - 20, max(20, h));
    currPoint = nextPoint;
    nextPoint = createVector(
        limitWidth(currPoint.x + random([-1, 1]) * map(freq, 0, 5000, 0, width * 0.3)), 
        limitHeight(currPoint.y + random([-1, 1]) * map(amp, 0, .5, 0, height * 0.3))
    );
    controlPointA = createVector( 
        limitWidth(Math.sign(nextPoint.x - currPoint.x) * (currPoint.x + 0.75 * avgRegionLevels[3])),
        limitWidth(Math.sign(nextPoint.y - currPoint.y) * (currPoint.y + 0.75 * avgRegionLevels[1]))
    );

    controlPointB = createVector(
        limitWidth(Math.sign(currPoint.x - nextPoint.x) * (nextPoint.x + 0.75 * avgRegionLevels[0])),
        limitWidth(Math.sign(currPoint.y - nextPoint.y) * (nextPoint.y + 0.75 * avgRegionLevels[2]))
    );

    // numSteps = int(nextPoint.dist(currPoint)) / 20 + spectralPeaks.length * 2;
    numSteps = int(numPeaksBuff.sum() / numPeaksBuff.length) * 6 + 10;
    // nextPoint.x = currPoint.x + map(freq, 0, 70000, -avgRegionLevels[3], avgRegionLevels[3]);
    // nextPoint.y = currPoint.y + random([1, -1]) * map(amplitude, 0, 0.5, -avgRegionLevels[1], avgRegionLevels[1]);
}

function findPeaks(spectrogram, width, thresh) {
    let peaks = [];
    let halfwidth = int(width / 2);
    for (var i = halfwidth + 1; i < spectrogram.length - width; i++) {
        if (spectrogram[i] - thresh > spectrogram[i - halfwidth] && 
            spectrogram[i] - thresh > spectrogram[i + halfwidth]) {
            peaks.push(i);
        }
    }
    return peaks;
}

function getAvgRegionLevels(spectrogram, numRegions){
    let regLen = int(spectrogram.length / numRegions);
    let regionLevels = [];
    for (var i = 0; i < numRegions; i++) {
        let region = spectrogram.slice(regLen * i, regLen * (i + 1));
        regionLevels.push(region.sum() / region.length);
    }
    return regionLevels;
}

function getFreq() {
    let timeDomain = fft.waveform(1024, 'float32');
    // console.log(Array.from(timeDomain).sum());
    let corrBuff = autoCorrelate(timeDomain);
    let freq = findFrequency(corrBuff);
    freqBuff.push(freq);
    freqBuff.splice(0, 1); // delete oldest freq

    const sum = arr => arr.reduce((a, b) => a + b, 0);
    let arm_freq = freqBuff.sum() / freqBuff.length;
    fill(color(0, 0, 255));
    text('arm_Freq: ' + arm_freq, 20, 80);
    // console.log(arm_freq);
    return arm_freq;
}

function getAmp() {
    // level detect
    let level = amplitude.getLevel();
    levelBuff.push(level);
    levelBuff.splice(0, 1);

    let arm_level = levelBuff.sum() / levelBuff.length;
    fill(color(255, 0, 0));
    text('arm_Amplitude: ' + arm_level, 20, 50);
    return arm_level;
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

mapToRange = val => map(val, 0, 255, height, 0);

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

Array.prototype.sum = function() {
    return this.reduce(function(a,b){return a+b;});
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

    this.sendTimer = 0;
    this.sendFreq = 10;
}

// Virtual Arm Stuff
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

    this.sendTimer++;
    const limitAngle = (angle) => min(max(angle, 20), 160)
    const radToDeg = (radians) => radians * (180 / Math.PI)
    if (this.sendTimer >= this.sendFreq) {
        this.sendTimer = 0;

        let segment = 0;
        let angleZero = min(max(130 - radToDeg(-this.angle[segment]), 40), 140);
        console.log('segment ' + segment + ' angle: ' + angleZero);
        botOSCClient.send(bot_addresses[segment], [segment, angleZero, 0.1]);

        segment = 1;
        let angleOne = min(max(130 - radToDeg(-this.angle[segment]), 40), 140);
        console.log('segment ' + segment + ' angle: ' + angleOne);
        botOSCClient.send(bot_addresses[segment], [segment, angleOne, 0.1]);

        segment = 2;
        let angleTwo = min(max(130 - radToDeg(-this.angle[segment]), 20), 160);
        console.log('segment ' + segment + ' angle: ' + angleTwo);
        botOSCClient.send(bot_addresses[segment], [segment, angleTwo, 0.1]);

        // segment = 3;
        // baseAngle = prevBaseAngle +  random([1,-1]) *random(10);
        // baseAngle = (angleTwo + angleOne) / 2;
        // console.log('segment ' + segment + ' angle: ' + baseAngle);
        // botOSCClient.send(bot_addresses[segment], [segment, baseAngle, 0.1]);
        // for (let s = 0; s < this.numSegments; s++) {
            // console.log('segment: ' + s + ' angle: ' + limitAngle(radToDeg(-this.angle[s])));
            // botOSCClient.send(bot_addresses[s], [s, limitAngle(radToDeg(-this.angle[s])), 0.1]);
        // }
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
