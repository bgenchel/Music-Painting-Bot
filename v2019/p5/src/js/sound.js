let width, height;

let virtualArm;
let samples;

let midiOSCClient = new OSCClient("ws://localhost:8081")
let botOSCClient = new OSCClient("ws://localhost:8082")

let bot_addresses = ['/elbow', '/wrist', '/finger'];

let fft, lowPass, peakDetect;
let mic, soundFile;
let amplitude;
let mapMax = 1.0;

let prevLevels = new Array(60);
let level_buff = new Array(30);
let freq_buff = new Array(30);

let preNormalize = true;
let postNormalize = true;
let doCenterClip = false;
let centerClipThreshold = 0.0;

let prevPointCalc = 0;
let pointCalcPeriod = 1000; // 1 sec
let prevPoint;
let currPoint;

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
    lowPass = new p5.LowPass();
    lowPass.disconnect();
    mic.connect(lowPass);
    fft = new p5.FFT();
    peakDetect = new p5.PeakDetect();

    currPoint = createVector(width / 2, height / 2);
    botOSCClient.send('/test', [1, 2, 3]);
    frameRate(60);
}

function draw() {
    background(51);

    let spectrum = fft.analyze();
    peakDetect.update(fft);

    let bands = fft.getOctaveBands(12, 27.5);
    let logAvgs = fft.logAverages(bands).slice(0, 88);

    let specPeaks = findPeaks(logAvgs);

    const third = logAvgs.length / 3;
    let low = logAvgs.slice(0, int(third));
    let med = logAvgs.slice(int(third), int(2 * third));
    let high = logAvgs.slice(int(2 * third), logAvgs.length);

    let centroid = fft.getCentroid() / bands[87]; // normalize between 0 and 1
    let centroidEnergy = fft.getEnergy(centroid);

    let freq = getFreq();
    let amplitude = getAmp();

    if (millis() > prevPointCalc + pointCalcPeriod || peakDetect.isDetected)
        getNextPoint(specCentroid, logAvgs, low, med, high, freq, amplitude, peakDetect.isDetected);
    virtualArm.run(arm_level * 200, arm_freq);
}

function getNextPoint(specCent, specCentEnergy, eqTempLevels, lowLevel, medLevel, highLevel, freq, amp, isPeak) {

}

function getFreq() {
    let timeDomain = fft.waveform(1024, 'float32');
    let corrBuff = autoCorrelate(timeDomain);
    let freq = findFrequency(corrBuff);
    freq_buff.push(freq);
    freq_buff.splice(0, 1); // delete oldest freq

    let arm_freq = freq_buff.sum() / freq_buff.length;
    fill(color(0, 0, 255));
    text('arm_Freq: ' + arm_freq, 20, 80);
    return arm_freq;
}

function getAmp() {
    // level detect
    let level = amplitude.getLevel();
    level_buff.push(level);
    level_buff.splice(0, 1);

    let arm_level = level_buff.sum() / level_buff.length;
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

Array.prototype.sum = function(){
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
    this.sendFreq = 60;
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
    if (this.sendTimer >= this.sendFreq) {
        this.sendTimer = 0;
        for (let s = 0; s < this.numSegments; s++) {
            console.log('segment: ' + s + 'angle: ' + this.angle[s]);
            botOSCClient.send(bot_addresses[s], [s, -this.angle[s] * (180 / 3.14159), 0.5]);
        }
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
