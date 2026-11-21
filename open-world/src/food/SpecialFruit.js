import * as THREE from 'three';
import { applyShadows } from '../core/shadows.js';

const EAT_RADIUS = 2.0;      // generous on purpose — the fruit is time-limited
const HOVER = 1.0;
const BOB_HEIGHT = 0.25;
const BOB_SPEED = 2.0;
const SPIN_SPEED = 1.5;
const BEAM_HEIGHT = 5;
const FIRST_SPAWN_DELAY = 4; // let the player meet one early
const RESPAWN_MIN = 6;       // seconds after the previous fruit is gone
const RESPAWN_VARIANCE = 4;
const LIFE_MIN = 3;          // uneaten fruit vanishes after 3-5s
const LIFE_VARIANCE = 2;
const BLINK_TIME = 1;        // final seconds spent blinking before vanishing
const SPAWN_MIN_DIST = 8;
const SPAWN_MAX_DIST = 20;

/**
 * Shared lifecycle of a time-limited special fruit: every few seconds one spawns
 * near the worm, bobs and spins under a marker beam, blinks before vanishing,
 * and fires onEat when touched. Subclasses provide buildModel() and a beam color.
 */
export class SpecialFruit {
  constructor(scene, heightAt, beamColor) {
    this.scene = scene;
    this.heightAt = heightAt;
    this.eatenCb = null;
    this.time = 0;
    this.fruit = null;
    this.blinkMats = [];
    this.life = 0;
    this.nextSpawnIn = FIRST_SPAWN_DELAY;
    this.beamMat = new THREE.MeshBasicMaterial({
      color: beamColor, transparent: true, opacity: 0.25, toneMapped: false,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
  }

  onEat(cb) {
    this.eatenCb = cb;
  }

  /** Returns { group, blinkMats } — model centered at origin + materials that blink before vanishing. */
  buildModel() {
    throw new Error('SpecialFruit subclasses must implement buildModel()');
  }

  #spawn(wormPos) {
    const { group, blinkMats } = this.buildModel();
    applyShadows(group, { cast: true });
    // Marker beam, like the essence orbs (added after shadows: it must not cast)
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.5, BEAM_HEIGHT, 8, 1, true),
      this.beamMat
    );
    beam.position.y = -HOVER + BEAM_HEIGHT / 2;
    group.add(beam);

    const angle = Math.random() * Math.PI * 2;
    const dist = SPAWN_MIN_DIST + Math.random() * (SPAWN_MAX_DIST - SPAWN_MIN_DIST);
    const x = wormPos.x + Math.sin(angle) * dist;
    const z = wormPos.z + Math.cos(angle) * dist;
    group.position.set(x, this.heightAt(x, z) + HOVER, z);
    this.scene.add(group);
    this.fruit = group;
    this.blinkMats = blinkMats;
    this.life = LIFE_MIN + Math.random() * LIFE_VARIANCE;
  }

  #despawn() {
    this.scene.remove(this.fruit);
    this.fruit = null;
    this.blinkMats = [];
    this.nextSpawnIn = RESPAWN_MIN + Math.random() * RESPAWN_VARIANCE;
  }

  update(dt, wormPos) {
    this.time += dt;
    if (!this.fruit) {
      this.nextSpawnIn -= dt;
      if (this.nextSpawnIn <= 0) this.#spawn(wormPos);
      return;
    }

    this.fruit.rotation.y += dt * SPIN_SPEED;
    this.fruit.position.y = this.heightAt(this.fruit.position.x, this.fruit.position.z)
      + HOVER + Math.sin(this.time * BOB_SPEED) * BOB_HEIGHT;

    const dx = wormPos.x - this.fruit.position.x;
    const dz = wormPos.z - this.fruit.position.z;
    if (dx * dx + dz * dz < EAT_RADIUS * EAT_RADIUS) {
      this.eatenCb?.();
      this.#despawn();
      return;
    }

    this.life -= dt;
    const blink = this.life < BLINK_TIME ? (Math.sin(this.time * 14) > 0 ? 1 : 0.25) : 1;
    for (const mat of this.blinkMats) mat.opacity = blink;
    if (this.life <= 0) this.#despawn();
  }
}
