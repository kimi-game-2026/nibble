import * as THREE from 'three';
import { CreatureModel } from '../creatures/CreatureModel.js';

const TURN_SPEED = 10;
const XP_PER_LEVEL = 5;
const INVINCIBILITY_DURATION = 3;
const FLASH_RATE = 10;

export class Worm {
  constructor(heightAt, { walkSpeed, enemyMaxLevel }) {
    this.heightAt = heightAt;
    this.walkSpeed = walkSpeed;
    this.maxLevel = enemyMaxLevel;
    this.level = 1;
    this.experience = 0;
    this.invincibilityRemaining = 0;
    this.levelUpCb = null;
    this.levelDownCb = null;
    this.heading = 0;
    this.time = 0;
    this.moving = false;
    this.group = new THREE.Group();
    this.position = this.group.position;
    this.creature = null;
    this.#applyLevel();
  }

  get radius() {
    return this.creature.radius;
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

  setPosition(x, z) {
    this.position.set(x, this.heightAt(x, z), z);
  }

  /** Steer toward (dirX, dirZ) and advance; turning is smoothed so the worm curves. */
  move(dirX, dirZ, dt) {
    this.moving = true;
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
    this.creature.animate(this.time, this.moving ? 1 : 0);
    this.creature.group.rotation.y = this.heading;
    this.moving = false;
    this.group.visible = this.invincibilityRemaining <= 0
      || Math.floor(this.invincibilityRemaining * FLASH_RATE) % 2 === 0;
  }

  #applyLevel() {
    if (this.creature) this.group.remove(this.creature.group);
    this.creature = new CreatureModel(this.level);
    this.creature.group.rotation.y = this.heading;
    this.group.add(this.creature.group);
  }
}
