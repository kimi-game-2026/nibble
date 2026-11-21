import * as THREE from 'three';
import { applyShadows } from '../core/shadows.js';

export const LEVEL_COLORS = [
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
const DARK_MATERIAL = new THREE.MeshLambertMaterial({ color: 0x2b2130, flatShading: true });
const SPIKE_MATERIAL = new THREE.MeshLambertMaterial({ color: 0x3d2b3a, flatShading: true });

export class CreatureModel {
  constructor(level) {
    this.level = level;
    this.group = new THREE.Group();
    this.legs = [];
    this.#build();
    this.scale = 0.65 + (level - 1) * 0.22;
    this.group.scale.setScalar(this.scale);
    this.radius = 0.65 * this.scale;
    applyShadows(this.group, { cast: true, receive: true });
  }

  animate(time, moveAmount) {
    this.group.position.y = Math.abs(Math.sin(time * 7)) * 0.04 * moveAmount;
    for (const { mesh, phase } of this.legs) {
      mesh.rotation.x = Math.sin(time * 8 + phase) * 0.5 * moveAmount;
    }
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
      this.group.add(segment);
    }

    const head = new THREE.Mesh(BODY_GEOMETRY, bodyMat);
    head.scale.set(0.64 + this.level * 0.015, 0.56 + this.level * 0.01, 0.68);
    head.position.set(0, 0.68, 0.62);
    this.group.add(head);

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(EYE_GEOMETRY, EYE_MATERIALS[this.level - 1]);
      eye.scale.setScalar(0.095 + this.level * 0.005);
      eye.position.set(side * 0.23, 0.82, 1.23);
      this.group.add(eye);

      const brow = new THREE.Mesh(BROW_GEOMETRY, DARK_MATERIAL);
      brow.position.set(side * 0.23, 1.01, 1.25);
      brow.rotation.z = side * 0.28;
      this.group.add(brow);
    }

    const legPairs = 2 + Math.floor((this.level - 1) / 2);
    for (let pair = 0; pair < legPairs; pair++) {
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(LEG_GEOMETRY, DARK_MATERIAL);
        leg.position.set(side * 0.6, 0.25, 0.35 - pair * 0.75);
        leg.rotation.z = side * -0.95;
        this.group.add(leg);
        this.legs.push({ mesh: leg, phase: pair * Math.PI + (side > 0 ? Math.PI : 0) });
      }
    }

    for (let i = 0; i < this.level - 1; i++) {
      const row = Math.floor(i / segmentCount);
      const spike = new THREE.Mesh(SPIKE_GEOMETRY, SPIKE_MATERIAL);
      spike.position.set(row === 0 ? 0 : 0.22, 1.16 + row * 0.05, -(i % segmentCount) * 0.62);
      spike.scale.setScalar((0.75 + this.level * 0.07) * (1 - row * 0.15));
      this.group.add(spike);
    }

    if (this.level >= 3) {
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(HORN_GEOMETRY, SPIKE_MATERIAL);
        horn.position.set(side * 0.34, 1.16, 0.76);
        horn.rotation.set(0.65, 0, side * -0.35);
        horn.scale.setScalar(0.85 + (this.level - 3) * 0.18);
        this.group.add(horn);
      }
    }

    if (this.level >= 5) {
      const crownHorn = new THREE.Mesh(HORN_GEOMETRY, SPIKE_MATERIAL);
      crownHorn.position.set(0, 1.35, 0.42);
      crownHorn.rotation.x = 0.25;
      crownHorn.scale.setScalar(1 + (this.level - 5) * 0.3);
      this.group.add(crownHorn);
    }

    if (this.level >= 7) {
      for (const side of [-1, 1]) {
        const sideHorn = new THREE.Mesh(HORN_GEOMETRY, SPIKE_MATERIAL);
        sideHorn.position.set(side * 0.62, 0.85, 0.15);
        sideHorn.rotation.z = side * -1.25;
        sideHorn.scale.setScalar(1.1 + (this.level - 7) * 0.3);
        this.group.add(sideHorn);
      }
    }
  }
}
