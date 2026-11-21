import * as THREE from 'three';

const EAT_RADIUS = 1.6;    // worm-head touch distance
const HOVER = 1.5;         // rest height above the ground
const BOB_HEIGHT = 0.3;
const BOB_SPEED = 2.2;
const BEAM_HEIGHT = 5;     // light shaft marking each orb
const SPAWN_RANGE = 80;    // orbs live within ±SPAWN_RANGE of the worm

/** Floating essence dots with light beams: bob up and down, eaten on touch, respawn ahead. */
export class Food {
  constructor(scene, heightAt, { foodCount }) {
    this.heightAt = heightAt;
    this.eatenCb = null;
    this.time = 0;

    this.mesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.2, 1),
      new THREE.MeshLambertMaterial({ color: 0xffd966, emissive: 0x9a7418, flatShading: true }),
      foodCount
    );
    this.beams = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.12, 0.4, BEAM_HEIGHT, 8, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffe89a, transparent: true, opacity: 0.22, toneMapped: false,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      }),
      foodCount
    );
    // Instances constantly respawn around the moving worm, so no fixed bounding
    // sphere stays valid — without this the whole layer vanishes when the sphere
    // computed at spawn (near the origin) leaves the camera frustum.
    this.mesh.frustumCulled = false;
    this.beams.frustumCulled = false;
    scene.add(this.mesh, this.beams);

    this.orbs = [];
    for (let i = 0; i < foodCount; i++) this.orbs.push(this.#spawn(0, 0));

    this.m4 = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.s = new THREE.Vector3(1, 1, 1);
    this.p = new THREE.Vector3();
    this.euler = new THREE.Euler();
    this.identity = new THREE.Quaternion();
  }

  onEat(cb) {
    this.eatenCb = cb;
  }

  #spawn(cx, cz) {
    const x = cx + (Math.random() - 0.5) * SPAWN_RANGE * 2;
    const z = cz + (Math.random() - 0.5) * SPAWN_RANGE * 2;
    return {
      x, z,
      baseY: this.heightAt(x, z) + HOVER,
      phase: Math.random() * Math.PI * 2,
      spin: Math.random() * Math.PI * 2,
    };
  }

  update(dt, wormPos) {
    this.time += dt;
    for (let i = 0; i < this.orbs.length; i++) {
      let orb = this.orbs[i];
      const dx = wormPos.x - orb.x;
      const dz = wormPos.z - orb.z;
      if (dx * dx + dz * dz < EAT_RADIUS * EAT_RADIUS) {
        orb = this.orbs[i] = this.#spawn(wormPos.x, wormPos.z);
        this.eatenCb?.();
      }
      const y = orb.baseY + Math.sin(this.time * BOB_SPEED + orb.phase) * BOB_HEIGHT;
      this.p.set(orb.x, y, orb.z);
      this.q.setFromEuler(this.euler.set(0, this.time + orb.spin, 0));
      this.m4.compose(this.p, this.q, this.s);
      this.mesh.setMatrixAt(i, this.m4);

      this.p.set(orb.x, orb.baseY - HOVER + BEAM_HEIGHT / 2, orb.z);
      this.m4.compose(this.p, this.identity, this.s);
      this.beams.setMatrixAt(i, this.m4);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.beams.instanceMatrix.needsUpdate = true;
  }
}
