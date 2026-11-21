import * as THREE from 'three';

const SPEED = 40;
const RANGE = 45;
const HIT_RADIUS = 1.2;
const FLIGHT_HEIGHT = 0.9;
const LAUNCH_OFFSET = 1.2; // starts just ahead of the worm's head

/** One-shot durian spike: flies straight ahead, kills the first enemy it touches. */
export class DurianSpike {
  constructor(scene, enemies, heightAt) {
    this.enemies = enemies;
    this.heightAt = heightAt;
    this.mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 1.4, 6),
      new THREE.MeshLambertMaterial({ color: 0x9aa53f, flatShading: true })
    );
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.active = false;
    this.traveled = 0;
    this.dir = new THREE.Vector3();
  }

  fire(pos, heading) {
    if (this.active) return; // one in flight at a time
    this.dir.set(Math.sin(heading), 0, Math.cos(heading));
    this.mesh.position.set(pos.x + this.dir.x * LAUNCH_OFFSET, 0, pos.z + this.dir.z * LAUNCH_OFFSET);
    this.mesh.position.y = this.heightAt(this.mesh.position.x, this.mesh.position.z) + FLIGHT_HEIGHT;
    this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.dir);
    this.mesh.visible = true;
    this.active = true;
    this.traveled = 0;
  }

  update(dt) {
    if (!this.active) return;
    const step = SPEED * dt;
    this.mesh.position.addScaledVector(this.dir, step);
    this.mesh.position.y = this.heightAt(this.mesh.position.x, this.mesh.position.z) + FLIGHT_HEIGHT;
    this.mesh.rotateOnWorldAxis(this.dir, dt * 10); // spin like a thrown dart
    this.traveled += step;
    if (this.enemies.hitEnemy(this.mesh.position, HIT_RADIUS) || this.traveled >= RANGE) {
      this.active = false;
      this.mesh.visible = false;
    }
  }
}
