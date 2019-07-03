let t = 0; // time variable
let grid;
let base_color;

let baseEffectSpeedOut = 1;
let baseEffectSpeedIn = 10;
let effectSpeedOut = baseEffectSpeedOut;
let effectSpeedIn = baseEffectSpeedIn;
let effect_dist = 2;
let effect_max_size = 200;
let effectIncreasing = true;

let wave_intensity_x = 15;
let wave_intensity_y = 15;
let point_size = 8;
let spacing = 20;
let stroke_size = 25;
let stroke_dur = 2000;

let totalMarked;
let markedCenter;

let trailIntensity = 100;
let tiIncreasing = false;

let painting = false;

let streamRate = 200; // for streaming data, only send every 100ms
let lastStream = 0;
let okToStream = false;

let lastPaintedCoor;

let maxOSCClient = new OSCClient("ws://localhost:8081");

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    noStroke();
    // stroke(color(0, 0, 0));
    base_color = color(255, 255, 255);
    fill(base_color);

    lastPaintedCoor = createVector(0, 0);
    
    grid = new Grid(spacing);
}

function draw() {
    if (millis() > lastStream + streamRate) {
        okToStream = true;
        lastStream = millis();
    }

    updateTrailVis();
    background(150, trailIntensity); // translucent background (creates trails)

    updateEffect();
    if (okToStream) {
        let center = painting ? createVector(mouseX, mouseY) : lastPaintedCoor;
        maxOSCClient.send('/waves/effectInfo', [center.x / width, center.y / height, effect_dist]);
    }

    grid.run();

    if (okToStream)
        maxOSCClient.send('/waves/cursorInfo', [mouseX / width, mouseY / height, painting]);

    okToStream = false;
}

function mousePressed() {
    painting = true;
    return false;
}

function mouseReleased() {
    painting = false;
    lastPaintedCoor = createVector(mouseX, mouseY);
    return false;
}

function updateTrailVis() {
    if (tiIncreasing) {
        trailIntensity += 1;
        if (trailIntensity > 100)
            tiIncreasing = false;
    } else {
        trailIntensity -= 1;
        if (trailIntensity < 10)
            tiIncreasing = true;
    }
}

function updateEffect() {
    if (effectIncreasing) {
        effect_dist += effectSpeedOut;
        effect_dist = min(effect_dist, effect_max_size);
        if (!painting || effect_dist > effect_max_size)
            effectIncreasing = false;
    } else {
        if (effect_dist > 2) { 
            effect_dist -= effectSpeedIn;
            effect_dist = max(effect_dist, 2);
        } else if (painting) {
            effectIncreasing = true;
            effect_max_size = random(100, 800);
            effectSpeedIn = baseEffectSpeedIn + baseEffectSpeedIn * (effect_max_size - 100) / 700;
            effectSpeedOut = baseEffectSpeedOut + baseEffectSpeedOut * (effect_max_size - 100) / 700;
        }
    }
}

function Grid(space) {
    this.particles = [];
    for (let x = 0; x <= width; x = x + space) {
        for (let y = 0; y <= height; y = y + space) {
            this.particles.push(new Particle(x, y, 1));
        }
    }    
}

Grid.prototype.run = function() {
    totalMarked = 0;
    markedCenter = createVector(0, 0);
    this.particles.forEach(function(p) {
        p.run();
        if (p.isMarked()) {
            totalMarked += 1;
            markedCenter.add(p5.Vector.mult(p.getCenter(), p.getFade()));
        }
    });
    if (totalMarked > 0) 
        markedCenter.div(totalMarked)
    if (okToStream)
        maxOSCClient.send('/waves/paintInfo', [markedCenter.x, markedCenter.y, totalMarked / this.particles.length]);
    t += 0.01;
}

function Particle(x, y, init_freq) {
    this.center = createVector(x, y);
    this.init_freq = init_freq; // save a reference;
    this.freq = init_freq;

    this.markColor = base_color;
    this.color = base_color;
    this.fade_timer = 0;
    this.marked = false;
}

Particle.prototype.isMarked = function() {
    return this.marked;
}

Particle.prototype.getCenter = function() {
    return this.center;
}

Particle.prototype.getFade = function() {
    return 1 - this.fade_timer / stroke_dur;
}

Particle.prototype.run = function() {
    const curr_pos = this.get_position();
    
    const pdist = this.center.dist(createVector(mouseX, mouseY));
    this.set_effect(pdist);
    this.set_color(pdist);

    //console.log(this.freq);
    fill(this.color);
    ellipse(curr_pos.x, curr_pos.y, point_size); // draw particle
}

Particle.prototype.get_position = function() {
    // starting point of each circle depends on mouse position
    const xAngle = map(mouseX, 0, width, -4 * PI, 4 * PI, true);
    const yAngle = map(mouseY, 0, height, -4 * PI, 4 * PI, true);
    // and also varies based on the particle's location
    const angle = xAngle * (this.center.x / width) + yAngle * (this.center.y / height);

    // each particle moves in a circle
    const myX = this.center.x + wave_intensity_x * cos(2 * PI * this.freq * t + angle);
    const myY = this.center.y + wave_intensity_y * sin(2 * PI * this.freq * t + angle);
    //const myY = this.position.y
    
    return createVector(myX, myY);
}

Particle.prototype.set_effect = function(pdist) {
    if (pdist < effect_dist) {
        const norm_pdist = pdist / effect_max_size;
        this.freq = 10 * (pow(norm_pdist, 2)) + 0.5;
    } else {
        this.freq = this.init_freq;
    }
}

Particle.prototype.set_color = function(pdist) {
    if (pdist < stroke_size && painting) {
        this.markColor = this.color = color(random(250), random(250), random(250));
        this.marked = true;
        this.fade_timer = 0;
    } else if (this.marked) {
        this.color = lerpColor(this.markColor, base_color, this.fade_timer / stroke_dur);
        this.fade_timer += 1;
        if (this.fade_timer > stroke_dur) {
            this.color = base_color;
            this.fade_timer = 0;
            this.marked = false;
        }
    }
}
