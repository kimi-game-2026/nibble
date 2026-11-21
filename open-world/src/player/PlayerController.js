import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const CAMERA_DISTANCE = 13;       // zoomed out for situational awareness
const CAMERA_ANCHOR_HEIGHT = 2.4; // lifts the view center above the worm, showing ground behind it
const CAMERA_MIN_CLEARANCE = 0.6;

export class PlayerController {
  constructor(camera, domElement, worm, heightAt, resolveCollision) {
    this.camera = camera;
    this.worm = worm;
    this.heightAt = heightAt;
    this.resolveCollision = resolveCollision;
    this.controls = new PointerLockControls(camera, domElement);
    this.keys = {};
    this.fwd = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.move = new THREE.Vector3();
    this.camDir = new THREE.Vector3();
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
    if (this.controls.isLocked) {
      const { camera, worm, keys, fwd, right, move } = this;
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
        move.normalize();
        worm.move(move.x, move.z, dt);
        this.resolveCollision(worm.position, worm.radius);
      }
    }
    this.worm.update(dt);
    this.#followCamera();
  }

  #followCamera() {
    this.camera.getWorldDirection(this.camDir);
    this.camera.position.copy(this.worm.position).addScaledVector(this.camDir, -CAMERA_DISTANCE);
    this.camera.position.y += CAMERA_ANCHOR_HEIGHT;
    const floor = this.heightAt(this.camera.position.x, this.camera.position.z) + CAMERA_MIN_CLEARANCE;
    if (this.camera.position.y < floor) this.camera.position.y = floor;
  }
}
