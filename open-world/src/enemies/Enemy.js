import * as THREE from 'three';
import { applyShadows } from '../core/shadows.js';

const TAU = Math.PI * 2;
const TURN_SPEED = 2.8;
const CHASE_SPEED_MULTIPLIER = 1.35;
const DEBUG_SEGMENTS = 64;
const LEVEL_COLORS = [
  0x74c69d, 0x40916c, 0xe9c46a, 0xf4a261,
  0xd62828, 0x7b2cbf, 0x4361ee, 0x240046,
];
const BODY_GEOMETRY = new THREE.IcosahedronGeometry(1, 1);
const EYE_GEOMETRY = new THREE.SphereGeometry(1, 8, 6);
const LEG_GEOMETRY = new THREE.CylinderGeometry(0.07, 0.1, 0.85, 5);
const SPIKE_GEOMETRY = new THREE.ConeGeometry(0.18, 0.7, 5);
const HORN_GEOMETRY = new THREE.ConeGeometry(0.14, 0.85, 6);
const BROW_GEOMETRY = new THREE.BoxGeometry(0.3, 0.07, 0.08);
const BODY_MATERIALS = LEVEL_COLORS.map((color, i) => new THREE.MeshLambertMaterial({
  color,
  emissive: color,
  emissiveIntensity: Math.max(0, i - 2) * 0.035,
  flatShading: true,
}));
const SEGMENT_MATERIALS = LEVEL_COLORS.map((color) => new THREE.MeshLambertMaterial({
  color: new THREE.Color(color).multiplyScalar(0.72),
  flatShading: true,
}));
const EYE_MATERIALS = LEVEL_COLORS.map((_, i) => new THREE.MeshLambertMaterial({
  color: i < 2 ? 0x231f20 : 0xffb703,
  emissive: i < 2 ? 0x000000 : 0xff5d00,
  emissiveIntensity: i * 0.12,
}));
const LABEL_MATERIALS = LEVEL_COLORS.map((color, i) => makeLabelMaterial(i + 1, color));
const DARK_MATERIAL = new THREE.MeshLambertMaterial({ color: 0x2b2130, flatShading: true });
const SPIKE_MATERIAL = new THREE.MeshLambertMaterial({ color: 0x3d2b3a, flatShading: true });

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
    this.model = new THREE.Group();
    this.group.add(this.model);
    this.position = this.group.position;
    this.heading = rng() * TAU;
    this.targetHeading = this.heading;
    this.turnTimer = 1 + rng() * 3;
    this.walkSpeed = config.enemyWalkSpeed * (0.85 + rng() * 0.3) / (1 + (level - 1) * 0.06);
    this.detectionRadius = config.enemyDetectionRadius + (level - 1) * 1.5;
    this.chasing = false;
    this.moveAmount = 1;
    this.targetMoveAmount = 1;
    this.time = rng() * TAU;
    this.legs = [];
    this.#build();
    this.model.scale.setScalar(0.65 + (level - 1) * 0.22);
    this.radius = 0.65 * this.model.scale.x;
    this.position.set(x, heightAt(x, z), z);
    this.model.rotation.y = this.heading;
    this.#buildLabel();
    this.#buildDebugRing(debugMode);
    applyShadows(this.group, { cast: true, receive: true });
  }

  setDebug(enabled) {
    this.debugRing.visible = enabled;
    if (enabled) this.#updateDebugRing();
  }

  dispose() {
    this.debugRing.geometry.dispose();
    this.debugRing.material.dispose();
  }

  update(dt, focusPos) {
    this.time += dt;
    this.turnTimer -= dt;
    const dx = focusPos.x - this.position.x;
    const dz = focusPos.z - this.position.z;
    const distance = Math.hypot(dx, dz);
    const chasing = distance <= this.detectionRadius;
    if (chasing !== this.chasing) {
      this.chasing = chasing;
      this.debugRing.material.color.set(chasing ? 0xff3b30 : 0x48cae4);
    }

    if (chasing) {
      if (distance > 0.001) this.targetHeading = Math.atan2(dx, dz);
      this.targetMoveAmount = distance > 0.8 + this.model.scale.x * 0.6 ? 1 : 0;
    } else if (this.turnTimer <= 0) {
      this.turnTimer = 1.8 + this.rng() * 3.2;
      this.targetHeading = this.heading + (this.rng() - 0.5) * Math.PI * 1.6;
      this.targetMoveAmount = this.rng() < 0.25 ? 0 : 0.65 + this.rng() * 0.5;
    }

    const difference = this.targetHeading - this.heading;
    const turn = Math.atan2(Math.sin(difference), Math.cos(difference));
    this.heading += turn * Math.min(1, TURN_SPEED * dt);
    this.moveAmount += (this.targetMoveAmount - this.moveAmount) * Math.min(1, dt * 4);
    const speed = this.walkSpeed * (chasing ? CHASE_SPEED_MULTIPLIER : 1);
    this.position.x += Math.sin(this.heading) * speed * this.moveAmount * dt;
    this.position.z += Math.cos(this.heading) * speed * this.moveAmount * dt;
    this.position.y = this.heightAt(this.position.x, this.position.z);
    this.model.position.y = Math.abs(Math.sin(this.time * 7)) * 0.04 * this.moveAmount;
    this.model.rotation.y = this.heading;

    for (const { mesh, phase } of this.legs) {
      mesh.rotation.x = Math.sin(this.time * 8 + phase) * 0.5 * this.moveAmount;
    }
    if (this.debugRing.visible) this.#updateDebugRing();
  }

  #build() {
    const bodyMat = BODY_MATERIALS[this.level - 1];
    const segmentMat = SEGMENT_MATERIALS[this.level - 1];
    const segmentCount = 3 + Math.floor((this.level - 1) / 2);
    for (let i = 0; i < segmentCount; i++) {
      const radius = 0.58 - i * 0.035;
      const segment = new THREE.Mesh(BODY_GEOMETRY, i % 2 === 0 ? bodyMat : segmentMat);
      segment.scale.set(radius * (1 + this.level * 0.025), radius * 0.72, radius);
      segment.position.set(0, 0.58, -i * 0.62);
      this.model.add(segment);
    }

    const head = new THREE.Mesh(BODY_GEOMETRY, bodyMat);
    head.scale.set(0.64 + this.level * 0.015, 0.56 + this.level * 0.01, 0.68);
    head.position.set(0, 0.68, 0.62);
    this.model.add(head);

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(EYE_GEOMETRY, EYE_MATERIALS[this.level - 1]);
      eye.scale.setScalar(0.095 + this.level * 0.005);
      eye.position.set(side * 0.23, 0.82, 1.23);
      this.model.add(eye);

      const brow = new THREE.Mesh(BROW_GEOMETRY, DARK_MATERIAL);
      brow.position.set(side * 0.23, 1.01, 1.25);
      brow.rotation.z = side * 0.28;
      this.model.add(brow);
    }

    const legPairs = 2 + Math.floor((this.level - 1) / 2);
    for (let pair = 0; pair < legPairs; pair++) {
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(LEG_GEOMETRY, DARK_MATERIAL);
        leg.position.set(side * 0.6, 0.25, 0.35 - pair * 0.75);
        leg.rotation.z = side * -0.95;
        this.model.add(leg);
        this.legs.push({ mesh: leg, phase: pair * Math.PI + (side > 0 ? Math.PI : 0) });
      }
    }

    for (let i = 0; i < this.level - 1; i++) {
      const row = Math.floor(i / segmentCount);
      const spike = new THREE.Mesh(SPIKE_GEOMETRY, SPIKE_MATERIAL);
      spike.position.set(row === 0 ? 0 : 0.22, 1.16 + row * 0.05, -(i % segmentCount) * 0.62);
      spike.scale.setScalar((0.75 + this.level * 0.07) * (1 - row * 0.15));
      this.model.add(spike);
    }

    if (this.level >= 3) {
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(HORN_GEOMETRY, SPIKE_MATERIAL);
        horn.position.set(side * 0.34, 1.16, 0.76);
        horn.rotation.set(0.65, 0, side * -0.35);
        horn.scale.setScalar(0.85 + (this.level - 3) * 0.18);
        this.model.add(horn);
      }
    }

    if (this.level >= 5) {
      const crownHorn = new THREE.Mesh(HORN_GEOMETRY, SPIKE_MATERIAL);
      crownHorn.position.set(0, 1.35, 0.42);
      crownHorn.rotation.x = 0.25;
      crownHorn.scale.setScalar(1 + (this.level - 5) * 0.3);
      this.model.add(crownHorn);
    }

    if (this.level >= 7) {
      for (const side of [-1, 1]) {
        const sideHorn = new THREE.Mesh(HORN_GEOMETRY, SPIKE_MATERIAL);
        sideHorn.position.set(side * 0.62, 0.85, 0.15);
        sideHorn.rotation.z = side * -1.25;
        sideHorn.scale.setScalar(1.1 + (this.level - 7) * 0.3);
        this.model.add(sideHorn);
      }
    }
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
