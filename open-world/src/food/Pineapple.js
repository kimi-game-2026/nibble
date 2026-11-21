import * as THREE from 'three';
import { SpecialFruit } from './SpecialFruit.js';

/** Special fruit that banks a Q speed boost (see SpeedBoost). */
export class Pineapple extends SpecialFruit {
  constructor(scene, heightAt) {
    super(scene, heightAt, 0xffc86e); // warm orange marker beam
  }

  buildModel() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf2b63d, flatShading: true, transparent: true });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x4e9b47, flatShading: true, transparent: true });

    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), bodyMat);
    body.scale.set(1, 1.25, 1);
    group.add(body);
    const leafGeo = new THREE.ConeGeometry(0.12, 0.5, 5);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const a = (i / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.12, 0.68, Math.sin(a) * 0.12);
      leaf.rotation.set(Math.sin(a) * 0.5, 0, Math.cos(a) * -0.5);
      group.add(leaf);
    }
    return { group, blinkMats: [bodyMat, leafMat] };
  }
}
