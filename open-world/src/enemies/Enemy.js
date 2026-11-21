import * as THREE from 'three';
import { CreatureModel, LEVEL_COLORS } from '../creatures/CreatureModel.js';

const TAU = Math.PI * 2;
const TURN_SPEED = 2.8;
const CHASE_SPEED_MULTIPLIER = 1.35;
const FLEE_SPEED_MULTIPLIER = 1.2;
const LEVEL_SPEED_STEP = 0.25;
const DEBUG_SEGMENTS = 64;
const LABEL_MATERIALS = LEVEL_COLORS.map((color, i) => makeLabelMaterial(i + 1, color));

function makeLabelMaterial(level, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(17, 24, 39, 0.88)';
  ctx.fillRect(3, 3, 250, 74);
  ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 68);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`LEVEL ${level}`, 128, 42);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
}

export class Enemy {
  constructor(level, x, z, heightAt, rng, config, debugMode) {
    this.level = level;
    this.heightAt = heightAt;
    this.rng = rng;
    this.group = new THREE.Group();
    this.creature = new CreatureModel(level);
    this.model = this.creature.group;
    this.group.add(this.model);
    this.position = this.group.position;
    this.heading = rng() * TAU;
    this.targetHeading = this.heading;
    this.turnTimer = 1 + rng() * 3;
    this.walkSpeed = config.enemyWalkSpeed * (1 + (level - 1) * LEVEL_SPEED_STEP);
    this.detectionRadius = config.enemyDetectionRadius + (level - 1) * 1.5;
    this.chasing = false;
    this.fleeing = false;
    this.hitLatched = false; // true while overlapping the player — blocks repeat hits until separation
    this.moveAmount = 1;
    this.targetMoveAmount = 1;
    this.time = rng() * TAU;
    this.radius = this.creature.radius;
    this.position.set(x, heightAt(x, z), z);
    this.model.rotation.y = this.heading;
    this.#buildLabel();
    this.#buildDebugRing(debugMode);
  }

  setDebug(enabled) {
    this.debugRing.visible = enabled;
    if (enabled) this.#updateDebugRing();
  }

  dispose() {
    this.debugRing.geometry.dispose();
    this.debugRing.material.dispose();
  }

  refreshPosition() {
    this.position.y = this.heightAt(this.position.x, this.position.z);
    if (this.debugRing.visible) this.#updateDebugRing();
  }

  update(dt, focusPos, canSee = () => true, playerLevel = 1) {
    this.time += dt;
    this.turnTimer -= dt;
    const dx = focusPos.x - this.position.x;
    const dz = focusPos.z - this.position.z;
    const distance = Math.hypot(dx, dz);
    const wasAlert = this.chasing || this.fleeing;
    const detected = distance <= this.detectionRadius && canSee(this.position, focusPos);
    const fleeing = detected && this.level <= playerLevel;
    const chasing = detected && !fleeing;
    if (chasing !== this.chasing || fleeing !== this.fleeing) {
      this.chasing = chasing;
      this.fleeing = fleeing;
      this.debugRing.material.color.set(chasing ? 0xff3b30 : fleeing ? 0xffb703 : 0x48cae4);
    }

    if (fleeing) {
      if (distance > 0.001) this.targetHeading = Math.atan2(-dx, -dz);
      this.targetMoveAmount = 1;
    } else if (chasing) {
      if (distance > 0.001) this.targetHeading = Math.atan2(dx, dz);
      this.targetMoveAmount = distance > 0.8 + this.model.scale.x * 0.6 ? 1 : 0;
    } else {
      if (wasAlert) this.turnTimer = 0;
      if (this.turnTimer <= 0) {
        this.turnTimer = 1.8 + this.rng() * 3.2;
        this.targetHeading = this.heading + (this.rng() - 0.5) * Math.PI * 1.6;
        this.targetMoveAmount = this.rng() < 0.25 ? 0 : 1;
      }
    }

    const difference = this.targetHeading - this.heading;
    const turn = Math.atan2(Math.sin(difference), Math.cos(difference));
    this.heading += turn * Math.min(1, TURN_SPEED * dt);
    this.moveAmount += (this.targetMoveAmount - this.moveAmount) * Math.min(1, dt * 4);
    const speedMultiplier = chasing ? CHASE_SPEED_MULTIPLIER : fleeing ? FLEE_SPEED_MULTIPLIER : 1;
    const speed = this.walkSpeed * speedMultiplier;
    this.position.x += Math.sin(this.heading) * speed * this.moveAmount * dt;
    this.position.z += Math.cos(this.heading) * speed * this.moveAmount * dt;
    this.position.y = this.heightAt(this.position.x, this.position.z);
    this.creature.animate(this.time, this.moveAmount);
    this.model.rotation.y = this.heading;
    if (this.debugRing.visible) this.#updateDebugRing();
  }

  #buildLabel() {
    const label = new THREE.Sprite(LABEL_MATERIALS[this.level - 1]);
    label.center.set(0, 1);
    label.scale.set(2.4, 0.75, 1);
    label.position.set(-0.9, 1.6 + this.model.scale.y * 1.3, 0);
    this.group.add(label);
  }

  #buildDebugRing(debugMode) {
    const geometry = new THREE.BufferGeometry();
    const positions = new THREE.BufferAttribute(new Float32Array(DEBUG_SEGMENTS * 3), 3);
    positions.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', positions);
    const material = new THREE.LineBasicMaterial({
      color: 0x48cae4,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.debugRing = new THREE.LineLoop(geometry, material);
    this.debugRing.frustumCulled = false;
    this.debugRing.visible = debugMode;
    this.group.add(this.debugRing);
    this.#updateDebugRing();
  }

  #updateDebugRing() {
    const positions = this.debugRing.geometry.attributes.position;
    for (let i = 0; i < DEBUG_SEGMENTS; i++) {
      const angle = (i / DEBUG_SEGMENTS) * TAU;
      const x = Math.sin(angle) * this.detectionRadius;
      const z = Math.cos(angle) * this.detectionRadius;
      const y = this.heightAt(this.position.x + x, this.position.z + z) - this.position.y + 0.08;
      positions.setXYZ(i, x, y, z);
    }
    positions.needsUpdate = true;
  }
}
