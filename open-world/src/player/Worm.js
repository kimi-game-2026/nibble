import * as THREE from 'three';
import { applyShadows } from '../core/shadows.js';

const SEGMENT_COUNT = 8;
const SEGMENT_SPACING = 0.42;
const HEAD_RADIUS = 0.38;
const TAPER = 0.45;        // how much the tail shrinks
const TURN_SPEED = 10;     // heading lerp rate
const WIGGLE_SPEED = 9;
const TRAIL_LIMIT = 256;
const TRAIL_MIN = SEGMENT_COUNT * 4;

export class Worm {
  constructor(heightAt, { walkSpeed }) {
    this.heightAt = heightAt;
    this.walkSpeed = walkSpeed;
    this.heading = 0;
    this.time = 0;
    this.position = new THREE.Vector3(); // head, ground level
    this.trail = [];
    this.group = new THREE.Group();
    this.segments = [];

    const geo = new THREE.SphereGeometry(1, 16, 12);
    this.matA = new THREE.MeshLambertMaterial({ color: 0xe5989b });
    this.matB = new THREE.MeshLambertMaterial({ color: 0xd97f86 });
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const r = HEAD_RADIUS * (1 - (i / SEGMENT_COUNT) * TAPER);
      const seg = new THREE.Mesh(geo, i % 2 === 0 ? this.matA : this.matB);
      seg.scale.setScalar(r);
      seg.userData.radius = r;
      this.segments.push(seg);
      this.group.add(seg);
    }

    const eyeGeo = new THREE.SphereGeometry(1, 8, 8);
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x26221f });
    const head = this.segments[0];
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.scale.setScalar(0.09 / HEAD_RADIUS);
      eye.position.set(side * 0.15 / HEAD_RADIUS, 0.14 / HEAD_RADIUS, 0.82);
      head.add(eye);
    }

    applyShadows(this.group, { cast: true, receive: true });
  }

  /** Swap the body stripe colors (placeholder character change on level-up). */
  setColors(a, b) {
    this.matA.color.set(a);
    this.matB.color.set(b);
  }

  setPosition(x, z) {
    this.position.set(x, this.heightAt(x, z), z);
    this.trail.length = 0;
    for (let i = 0; i < TRAIL_MIN; i++) this.trail.push(this.position.clone());
    this.#layout();
  }

  /** Steer toward (dirX, dirZ) and advance; turning is smoothed so the worm curves. */
  move(dirX, dirZ, dt) {
    const target = Math.atan2(dirX, dirZ);
    let diff = target - this.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.heading += diff * Math.min(1, TURN_SPEED * dt);
    this.position.x += Math.sin(this.heading) * this.walkSpeed * dt;
    this.position.z += Math.cos(this.heading) * this.walkSpeed * dt;
  }

  update(dt) {
    this.time += dt;
    this.position.y = this.heightAt(this.position.x, this.position.z);
    this.trail.unshift(this.position.clone());
    if (this.trail.length > TRAIL_LIMIT) this.trail.pop();
    this.#layout();
  }

  #layout() {
    const head = this.segments[0];
    head.position.copy(this.position);
    head.position.y += head.userData.radius * 0.85;
    head.rotation.y = this.heading;

    let dist = 0;
    let ti = 0;
    for (let i = 1; i < this.segments.length; i++) {
      const target = i * SEGMENT_SPACING;
      while (ti < this.trail.length - 2) {
        const a = this.trail[ti], b = this.trail[ti + 1];
        if (dist + a.distanceTo(b) >= target) break;
        dist += a.distanceTo(b);
        ti++;
      }
      const a = this.trail[ti], b = this.trail[ti + 1] ?? a;
      const segLen = a.distanceTo(b) || 1;
      const t = THREE.MathUtils.clamp((target - dist) / segLen, 0, 1);
      const seg = this.segments[i];
      seg.position.lerpVectors(a, b, t);

      // slither: lateral wiggle, stronger toward the tail
      const wiggle = Math.sin(this.time * WIGGLE_SPEED - i * 1.1) * 0.05 * (i / this.segments.length);
      const px = -(b.z - a.z) / segLen;
      const pz = (b.x - a.x) / segLen;
      seg.position.x += px * wiggle;
      seg.position.z += pz * wiggle;

      seg.position.y = this.heightAt(seg.position.x, seg.position.z) + seg.userData.radius * 0.85;
    }
  }
}
