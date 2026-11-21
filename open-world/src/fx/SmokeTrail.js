import * as THREE from 'three';

const MAX_PUFFS = 36;
const LIFETIME = 0.7;
const SPAWN_INTERVAL = 0.035;
const START_SCALE = 0.3;
const END_SCALE = 1.1;
const START_OPACITY = 0.55;
const RISE_SPEED = 1.4;

/** Dust puffs trailing the worm while the speed boost is running. Pooled, zero per-frame allocation. */
export class SmokeTrail {
  constructor(scene) {
    this.scene = scene;
    this.spawnTimer = 0;
    this.puffs = [];
    this.dead = [];
    this.geo = new THREE.IcosahedronGeometry(1, 0);
    this.baseMat = new THREE.MeshBasicMaterial({ color: 0xd8dde0, transparent: true, depthWrite: false });
  }

  /** Pass emitting = boost active && worm moving; puffs spawn at the tail. */
  update(dt, wormPos, heading, emitting) {
    if (emitting) {
      this.spawnTimer -= dt;
      while (this.spawnTimer <= 0) {
        this.spawnTimer += SPAWN_INTERVAL;
        this.#emit(wormPos, heading);
      }
    } else {
      this.spawnTimer = 0;
    }

    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.age += dt;
      const t = p.age / LIFETIME;
      if (t >= 1) {
        p.mesh.visible = false;
        this.puffs.splice(i, 1);
        this.dead.push(p);
        continue;
      }
      p.mesh.scale.setScalar(START_SCALE + (END_SCALE - START_SCALE) * t);
      p.mesh.material.opacity = START_OPACITY * (1 - t);
      p.mesh.position.y += RISE_SPEED * dt;
    }
  }

  #emit(wormPos, heading) {
    let p = this.dead.pop();
    if (!p) {
      if (this.puffs.length >= MAX_PUFFS) return;
      p = { mesh: new THREE.Mesh(this.geo, this.baseMat.clone()), age: 0 };
      this.scene.add(p.mesh);
    }
    p.age = 0;
    p.mesh.position.set(
      wormPos.x - Math.sin(heading) * 0.6 + (Math.random() - 0.5) * 0.4,
      wormPos.y + 0.25,
      wormPos.z - Math.cos(heading) * 0.6 + (Math.random() - 0.5) * 0.4
    );
    p.mesh.scale.setScalar(START_SCALE);
    p.mesh.material.opacity = START_OPACITY;
    p.mesh.visible = true;
    this.puffs.push(p);
  }
}
