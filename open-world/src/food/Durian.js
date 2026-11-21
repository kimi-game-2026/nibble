import * as THREE from 'three';
import { SpecialFruit } from './SpecialFruit.js';

const SPIKE_COUNT = 16;

/** Special fruit that fires a spike projectile forward when eaten (see DurianSpike). */
export class Durian extends SpecialFruit {
  constructor(scene, heightAt) {
    super(scene, heightAt, 0xc9d675); // pale green marker beam
  }

  buildModel() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x9aa53f, flatShading: true, transparent: true });
    const spikeMat = new THREE.MeshLambertMaterial({ color: 0x6f7d2e, flatShading: true, transparent: true });

    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), bodyMat);
    body.scale.set(1, 1.15, 1);
    group.add(body);

    // husk spikes, evenly distributed over the surface (fibonacci sphere)
    const spikeGeo = new THREE.ConeGeometry(0.09, 0.32, 5);
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < SPIKE_COUNT; i++) {
      const y = 1 - (i + 0.5) * (2 / SPIKE_COUNT);
      const r = Math.sqrt(1 - y * y);
      const a = i * 2.39996; // golden angle
      const dir = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(dir.x * 0.5, dir.y * 0.575, dir.z * 0.5).addScaledVector(dir, 0.1);
      spike.quaternion.setFromUnitVectors(up, dir);
      group.add(spike);
    }
    return { group, blinkMats: [bodyMat, spikeMat] };
  }
}
