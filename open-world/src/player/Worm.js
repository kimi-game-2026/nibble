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
const XP_PER_LEVEL = 5;
const LEVEL_SCALE_STEP = 0.12;
const INVINCIBILITY_DURATION = 3;
const FLASH_RATE = 10;

export class Worm {
  constructor(heightAt, { walkSpeed, playerRadius, enemyMaxLevel }) {
    this.heightAt = heightAt;
    this.walkSpeed = walkSpeed;
    this.playerRadius = playerRadius;
    this.maxLevel = enemyMaxLevel;
    this.level = 1;
    this.experience = 0;
    this.growthScale = 1;
    this.invincibilityRemaining = 0;
    this.levelUpCb = null;
    this.levelDownCb = null;
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
      seg.userData.baseRadius = r;
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

  get radius() {
    return this.playerRadius * this.growthScale;
  }

  onLevelUp(cb) {
    this.levelUpCb = cb;
  }

  onLevelDown(cb) {
    this.levelDownCb = cb;
  }

  experienceForNextLevel() {
    return this.level * XP_PER_LEVEL;
  }

  addExperience(amount) {
    if (this.level >= this.maxLevel) return;
    this.experience += amount;
    let leveledUp = false;
    while (this.level < this.maxLevel && this.experience >= this.experienceForNextLevel()) {
      this.experience -= this.experienceForNextLevel();
      this.level++;
      leveledUp = true;
    }
    if (this.level >= this.maxLevel) this.experience = 0;
    if (leveledUp) {
      this.#applyLevel();
      this.levelUpCb?.(this.level);
    }
  }

  takeHit() {
    if (this.invincibilityRemaining > 0) return false;
    const previousLevel = this.level;
    this.level = Math.max(1, this.level - 1);
    this.experience = 0;
    this.invincibilityRemaining = INVINCIBILITY_DURATION;
    this.#applyLevel();
    if (this.level < previousLevel) this.levelDownCb?.(this.level);
    return true;
  }

  /** Swap the body stripe colors when the shared progression changes form. */
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
    this.invincibilityRemaining = Math.max(0, this.invincibilityRemaining - dt);
    this.position.y = this.heightAt(this.position.x, this.position.z);
    this.trail.unshift(this.position.clone());
    if (this.trail.length > TRAIL_LIMIT) this.trail.pop();
    this.#layout();
    this.group.visible = this.invincibilityRemaining <= 0
      || Math.floor(this.invincibilityRemaining * FLASH_RATE) % 2 === 0;
  }

  #applyLevel() {
    this.growthScale = 1 + (this.level - 1) * LEVEL_SCALE_STEP;
    for (const segment of this.segments) {
      const radius = segment.userData.baseRadius * this.growthScale;
      segment.scale.setScalar(radius);
      segment.userData.radius = radius;
    }
  }

  #layout() {
    const head = this.segments[0];
    head.position.copy(this.position);
    head.position.y += head.userData.radius * 0.85;
    head.rotation.y = this.heading;

    let dist = 0;
    let ti = 0;
    for (let i = 1; i < this.segments.length; i++) {
      const target = i * SEGMENT_SPACING * this.growthScale;
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
      const wiggle = Math.sin(this.time * WIGGLE_SPEED - i * 1.1) * 0.05 * this.growthScale * (i / this.segments.length);
      const px = -(b.z - a.z) / segLen;
      const pz = (b.x - a.x) / segLen;
      seg.position.x += px * wiggle;
      seg.position.z += pz * wiggle;

      seg.position.y = this.heightAt(seg.position.x, seg.position.z) + seg.userData.radius * 0.85;
    }
  }
}
