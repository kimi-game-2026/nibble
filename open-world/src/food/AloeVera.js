import * as THREE from 'three';
import { SpecialFruit } from './SpecialFruit.js';

/** Special fruit that banks an R invincibility shield (see InvincibilitySkill). */
export class AloeVera extends SpecialFruit {
  constructor(scene, heightAt) {
    super(scene, heightAt, 0xa8e6a1); // fresh green marker beam
  }

  buildModel() {
    const group = new THREE.Group();
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x7fbf7f, flatShading: true, transparent: true });
    const leafGeo = new THREE.ConeGeometry(0.16, 0.9, 6);

    // rosette: outer ring leaning out, inner ring upright
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(a) * 0.22, 0.35, Math.sin(a) * 0.22);
      leaf.rotation.set(Math.sin(a) * 0.7, 0, Math.cos(a) * -0.7);
      group.add(leaf);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.scale.setScalar(0.8);
      leaf.position.set(Math.cos(a) * 0.08, 0.45, Math.sin(a) * 0.08);
      leaf.rotation.set(Math.sin(a) * 0.3, 0, Math.cos(a) * -0.3);
      group.add(leaf);
    }
    return { group, blinkMats: [leafMat] };
  }
}
