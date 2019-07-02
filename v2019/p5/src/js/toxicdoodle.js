/*
 * Copyright (c) 2009 Karsten Schmidt
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * http://creativecommons.org/licenses/LGPL/2.1/
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

 
let TriangleMesh = toxi.geom.mesh.TriangleMesh,
    Face = toxi.geom.mesh.Face,
    Vec3D = toxi.geom.Vec3D,
    Vec2D = toxi.geom.Vec2D;

// import toxi.geom.*;
// import toxi.geom.mesh.*;

let mesh = new TriangleMesh("doodle");
let prev = new toxi.geom.Vec3D();
let p = new toxi.geom.Vec3D();
let q = new Vec3D();

let rotation = new Vec2D();
let weight = 0;

function setup() {
  // toxi.size(940, 600, toxi.OPENGL);
  createCanvas(window.innerWidth, window.innerHeight);
  fill(255,255,255);
  stroke(255,0,0);
}

function draw() {
  background(0);
  TriangleMesh.lights();
  translate(width/2,height/2,0);
  rotateX(rotation.x);
  rotateY(rotation.y);
  noStroke();
  beginShape(TRIANGLES);
  // iterate over all faces/triangles of the mesh
  let faces = mesh.getFaces();
  let numFaces = faces.length;
  for (var i = 0; i < numFaces; i++) {
    let f = faces[i];
    // create vertices for each corner point
    _vertex(f.a);
    _vertex(f.b);
    _vertex(f.c);
  }
  endShape();
  // udpate rotation
  rotation.addSelf(0.014,0.0237);
}

function _vertex(v) {
  console.log(v.toString());
  vertex(v.x,v.y,v.z);
}

function mouseMoved() {
  // get 3D rotated mouse position
  let pos = new Vec3D(mouseX-width/2,mouseY-height/2,0);
  pos.rotateX(rotation.x);
  pos.rotateY(rotation.y);
  // use distance to previous point as target stroke weight
  weight += (sqrt(pos.distanceTo(prev))*2-weight)*0.1;
  // define offset points for the triangle strip
  let a=pos.add(0,0,weight);
  let b=pos.add(0,0,-weight);
  // add 2 faces to the mesh
  mesh.addFace(p,b,q);
  mesh.addFace(p,a,b);
  // store current points for next iteration
  prev=pos;
  p=a;
  q=b;
}

function keyPressed() {
  mesh.clear();
}
