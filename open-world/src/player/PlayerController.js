import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class PlayerController {
  constructor(camera, domElement, heightAt, { walkSpeed, eyeHeight, mapSize }) {
    this.camera = camera;
    this.heightAt = heightAt;
    this.walkSpeed = walkSpeed;
    this.eyeHeight = eyeHeight;
    this.bound = mapSize / 2 - 3;
    this.controls = new PointerLockControls(camera, domElement);
    this.keys = {};
    this.fwd = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.move = new THREE.Vector3();
    addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }

  lock() {
    this.controls.lock();
  }

  onLock(cb) {
    this.controls.addEventListener('lock', cb);
  }

  onUnlock(cb) {
    this.controls.addEventListener('unlock', cb);
  }

  update(dt) {
    if (!this.controls.isLocked) return;
    const { camera, keys, fwd, right, move } = this;
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    right.crossVectors(fwd, camera.up);
    move.set(0, 0, 0);
    if (keys.KeyW) move.add(fwd);
    if (keys.KeyS) move.sub(fwd);
    if (keys.KeyD) move.add(right);
    if (keys.KeyA) move.sub(right);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(this.walkSpeed * dt);
      camera.position.add(move);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -this.bound, this.bound);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -this.bound, this.bound);
    }
    camera.position.y = this.heightAt(camera.position.x, camera.position.z) + this.eyeHeight;
  }
}
