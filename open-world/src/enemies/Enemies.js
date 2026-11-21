import * as THREE from 'three';
import { createRng } from '../math/rng.js';
import { Enemy } from './Enemy.js';

const RESPAWN_INTERVAL = 0.15;

export class Enemies {
  constructor(scene, heightAt, config, seed, canSee = () => true) {
    this.heightAt = heightAt;
    this.config = config;
    this.count = config.enemyCount;
    this.minSpawnRadius = config.enemyMinSpawnRadius;
    this.spawnRadius = config.enemySpawnRadius;
    this.despawnRadius = config.enemyDespawnRadius;
    this.maxLevel = config.enemyMaxLevel;
    this.debugMode = config.enemyDebugMode;
    this.canSee = canSee;
    this.rng = createRng(seed ^ 0x9e3779b9);
    this.enemies = [];
    this.group = new THREE.Group();
    this.spawnTimer = 0;
    scene.add(this.group);
    for (let i = 0; i < this.count; i++) this.#spawn({ x: 0, z: 0 });
  }

  toggleDebug() {
    this.debugMode = !this.debugMode;
    for (const enemy of this.enemies) enemy.setDebug(this.debugMode);
  }

  update(dt, worm) {
    const focusPos = worm.position;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, focusPos, this.canSee);
      const dx = enemy.position.x - focusPos.x;
      const dz = enemy.position.z - focusPos.z;
      const collisionRadius = enemy.radius + worm.radius;
      if (dx * dx + dz * dz <= collisionRadius * collisionRadius) {
        if (enemy.level <= worm.level) {
          this.group.remove(enemy.group);
          enemy.dispose();
          this.enemies.splice(i, 1);
          worm.addExperience(enemy.level);
          continue;
        }
        worm.takeHit();
      }
      if (enemy.position.distanceToSquared(focusPos) > this.despawnRadius * this.despawnRadius) {
        this.group.remove(enemy.group);
        enemy.dispose();
        this.enemies.splice(i, 1);
      }
    }

    this.spawnTimer -= dt;
    if (this.enemies.length < this.count && this.spawnTimer <= 0) {
      this.#spawn(focusPos);
      this.spawnTimer = RESPAWN_INTERVAL;
    }
  }

  #spawn(focusPos) {
    const angle = this.rng() * Math.PI * 2;
    const minSq = this.minSpawnRadius * this.minSpawnRadius;
    const maxSq = this.spawnRadius * this.spawnRadius;
    const distance = Math.sqrt(minSq + this.rng() * (maxSq - minSq));
    const x = focusPos.x + Math.sin(angle) * distance;
    const z = focusPos.z + Math.cos(angle) * distance;
    const level = Math.min(this.maxLevel, 1 + Math.floor(Math.pow(this.rng(), 1.8) * this.maxLevel));
    const rng = createRng((this.rng() * 0xffffffff) >>> 0);
    const enemy = new Enemy(level, x, z, this.heightAt, rng, this.config, this.debugMode);
    this.enemies.push(enemy);
    this.group.add(enemy.group);
  }
}
