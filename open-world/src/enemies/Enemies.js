import * as THREE from 'three';
import { createRng } from '../math/rng.js';
import { Enemy } from './Enemy.js';

const RESPAWN_INTERVAL = 0.15;
const SEPARATION_ITERATIONS = 24;
const SEPARATION_PADDING = 1.05;

export class Enemies {
  constructor(scene, heightAt, config, seed, canSee = () => true) {
    this.heightAt = heightAt;
    this.config = config;
    this.count = config.enemyCount;
    this.minSpawnRadius = config.enemyMinSpawnRadius;
    this.spawnRadius = config.enemySpawnRadius;
    this.despawnRadius = config.enemyDespawnRadius;
    this.maxLevel = config.enemyMaxLevel;
    this.playerLevel = 1;
    this.debugMode = config.enemyDebugMode;
    this.canSee = canSee;
    this.rng = createRng(seed ^ 0x9e3779b9);
    this.enemies = [];
    this.group = new THREE.Group();
    this.spawnTimer = 0;
    this.playerHitCb = null;
    this.enemyEatenCb = null;
    scene.add(this.group);
    for (let i = 0; i < this.count; i++) this.#spawn({ x: 0, z: 0 });
  }

  toggleDebug() {
    this.debugMode = !this.debugMode;
    for (const enemy of this.enemies) enemy.setDebug(this.debugMode);
  }

  onPlayerHit(cb) {
    this.playerHitCb = cb;
  }

  onEnemyEaten(cb) {
    this.enemyEatenCb = cb;
  }

  update(dt, worm) {
    this.playerLevel = worm.level;
    const focusPos = worm.position;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, focusPos, this.canSee, worm.level);
      const dx = enemy.position.x - focusPos.x;
      const dz = enemy.position.z - focusPos.z;
      const collisionRadius = enemy.radius + worm.radius;
      if (dx * dx + dz * dz <= collisionRadius * collisionRadius) {
        if (enemy.level <= worm.level) {
          this.group.remove(enemy.group);
          enemy.dispose();
          this.enemies.splice(i, 1);
          worm.addExperience(enemy.level);
          this.enemyEatenCb?.(enemy.level);
          continue;
        }
        if (worm.takeHit()) this.playerHitCb?.();
      }
      if (enemy.position.distanceToSquared(focusPos) > this.despawnRadius * this.despawnRadius) {
        this.group.remove(enemy.group);
        enemy.dispose();
        this.enemies.splice(i, 1);
      }
    }

    this.#separate();
    this.spawnTimer -= dt;
    if (this.enemies.length < this.count && this.spawnTimer <= 0) {
      this.#spawn(focusPos);
      this.spawnTimer = RESPAWN_INTERVAL;
    }
  }

  #separate() {
    const moved = new Set();
    const coincident = new Map();
    for (const enemy of this.enemies) {
      const key = `${enemy.position.x},${enemy.position.z}`;
      if (!coincident.has(key)) coincident.set(key, []);
      coincident.get(key).push(enemy);
    }
    for (const group of coincident.values()) {
      if (group.length < 2) continue;
      const { x, z } = group[0].position;
      const spacing = Math.max(...group.map((enemy) => enemy.radius)) * 2 * SEPARATION_PADDING;
      for (const enemy of group) moved.add(enemy);
      let index = 1;
      let ring = 1;
      while (index < group.length) {
        const count = ring * 6;
        for (let slot = 0; slot < count && index < group.length; slot++) {
          const angle = (slot / count) * Math.PI * 2;
          group[index].position.x = x + Math.sin(angle) * spacing * ring;
          group[index].position.z = z + Math.cos(angle) * spacing * ring;
          index++;
        }
        ring++;
      }
    }

    for (let pass = 0; pass < SEPARATION_ITERATIONS; pass++) {
      for (let i = 0; i < this.enemies.length; i++) {
        const a = this.enemies[i];
        for (let j = i + 1; j < this.enemies.length; j++) {
          const b = this.enemies[j];
          const dx = b.position.x - a.position.x;
          const dz = b.position.z - a.position.z;
          const minimum = (a.radius + b.radius) * SEPARATION_PADDING;
          const distanceSq = dx * dx + dz * dz;
          if (distanceSq >= minimum * minimum) continue;

          let distance = Math.sqrt(distanceSq);
          let nx, nz;
          if (distance < 1e-8) {
            const angle = (i * 0.61803398875 + j * 0.41421356237) * Math.PI * 2;
            nx = Math.sin(angle);
            nz = Math.cos(angle);
            distance = 0;
          } else {
            nx = dx / distance;
            nz = dz / distance;
          }

          const correction = (minimum - distance) * 0.5;
          a.position.x -= nx * correction;
          a.position.z -= nz * correction;
          b.position.x += nx * correction;
          b.position.z += nz * correction;
          moved.add(a);
          moved.add(b);
        }
      }
    }
    for (const enemy of moved) enemy.refreshPosition();
  }

  #spawn(focusPos) {
    const angle = this.rng() * Math.PI * 2;
    const minSq = this.minSpawnRadius * this.minSpawnRadius;
    const maxSq = this.spawnRadius * this.spawnRadius;
    const distance = Math.sqrt(minSq + this.rng() * (maxSq - minSq));
    const x = focusPos.x + Math.sin(angle) * distance;
    const z = focusPos.z + Math.cos(angle) * distance;
    const levelCap = Math.min(this.maxLevel, this.playerLevel + 2);
    const level = 1 + Math.floor(Math.pow(this.rng(), 1.8) * levelCap);
    const rng = createRng((this.rng() * 0xffffffff) >>> 0);
    const enemy = new Enemy(level, x, z, this.heightAt, rng, this.config, this.debugMode);
    this.enemies.push(enemy);
    this.group.add(enemy.group);
  }
}
