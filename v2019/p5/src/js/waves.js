let t = 0; // time variable
let grid;
let max_dist;
let base_color;

let effect_speed_out = 1;
let effect_speed_in = 10;
let effect_max_size;
let wave_intensity_x = 10;
let wave_intensity_y = 10;
let point_size = 5;
let spacing = 10;
let stroke_size = 15;
let stroke_dur = 30000;

function setup() {
  createCanvas(600, 600);
  noStroke();
  base_color = color(255, 255, 255);
  fill(base_color);
  
  max_dist = dist(0, 0, width, height);
  effect_max_size = 200;
  grid = new Grid(spacing);
}

function draw() {
  background(10, 10); // translucent background (creates trails)
  grid.run();
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
  this.particles.forEach(function(p) {
    p.run();
  });
  t += 0.01;
}

function Particle(x, y, init_freq) {
  this.center = createVector(x, y);
  this.init_freq = init_freq; // save a reference;
  this.freq = init_freq;
  
  this.effect_dist = 1;
  this.increasing = true;
  
  this.color = base_color;
  this.fade_timer = 0;
  this.marked = false;
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
  if (pdist < this.effect_dist) {
    const norm_pdist = pdist / max_dist;
    this.freq = 4 * (1 - norm_pdist) + 1;
  } else {
    this.freq = this.init_freq;
  }
  
  if (this.increasing) {
    this.effect_dist += effect_speed_out;
    if (this.effect_dist > effect_max_size) {
      this.increasing = false;
    }
  } else {
    this.effect_dist -= effect_speed_in;
    if (this.effect_dist < 2) {
      this.increasing = true;
    }
  }
}

Particle.prototype.set_color = function(pdist) {
  if (pdist < stroke_size) {
    this.color = color(random(250), random(250), random(250));
    this.marked = true;
    this.fade_timer = 0;
  } else if (this.marked) {
    //this.color = color(random(250), random(250), random(250));
    this.color = lerpColor(this.color, base_color, this.fade_timer / stroke_dur);
    this.fade_timer += 1;
    if (this.fade_timer > stroke_dur) {
      this.color = base_color;
      this.marked = false;
    }
  }
}
