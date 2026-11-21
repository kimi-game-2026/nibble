import * as THREE from 'three';

const MAX_BLOBS_PER_BUSH = 3;

export class Bushes {
  constructor(heightAt, { bushCount, mapSize }) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshLambertMaterial({ flatShading: true }),
      bushCount * MAX_BLOBS_PER_BUSH
    );
    this.#scatter(heightAt, bushCount, mapSize);
  }

  #scatter(heightAt, count, mapSize) {
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const p = new THREE.Vector3();
    const euler = new THREE.Euler();
    const col = new THREE.Color();
    let bi = 0;
    for (let i = 0; i < count; i++) {
      const bx = (Math.random() - 0.5) * (mapSize - 10);
      const bz = (Math.random() - 0.5) * (mapSize - 10);
      if (Math.hypot(bx, bz) < 4) continue; // keep spawn area clear
      const by = heightAt(bx, bz);
      const blobs = 1 + ((Math.random() * MAX_BLOBS_PER_BUSH) | 0);
      for (let j = 0; j < blobs && bi < this.mesh.instanceMatrix.count; j++) {
        const sc = 0.6 + Math.random() * 1.1;
        p.set(bx + (Math.random() - 0.5) * 1.6, by + sc * 0.55, bz + (Math.random() - 0.5) * 1.6);
        q.setFromEuler(euler.set(0, Math.random() * Math.PI, 0));
        scale.set(
          sc * (0.9 + Math.random() * 0.4),
          sc * (0.75 + Math.random() * 0.3),
          sc * (0.9 + Math.random() * 0.4)
        );
        m4.compose(p, q, scale);
        this.mesh.setMatrixAt(bi, m4);
        col.setHSL(0.3 + Math.random() * 0.06, 0.5 + Math.random() * 0.2, 0.22 + Math.random() * 0.12);
        this.mesh.setColorAt(bi, col);
        bi++;
      }
    }
    this.mesh.count = bi;
  }
}
