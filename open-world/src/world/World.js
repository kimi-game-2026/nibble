import { Sky } from './Sky.js';
import { Terrain } from './Terrain.js';
import { Bushes } from './Bushes.js';
import { Trees } from './Trees.js';
import { Flowers } from './Flowers.js';
import { Clouds } from './Clouds.js';
import { TileField } from './TileField.js';
import { Collisions } from '../physics/Collisions.js';
import { Enemies } from '../enemies/Enemies.js';

const CLUSTER_FREQUENCY = 0.025; // low-frequency mask => groves, thickets, clearings

export class World {
  constructor(scene, noise, seed, config) {
    this.sky = new Sky(scene, config);
    this.terrain = new Terrain(noise, config);
    this.collisions = new Collisions();
    const densityAt = (x, z) => noise.fbm(x * CLUSTER_FREQUENCY, z * CLUSTER_FREQUENCY, { octaves: 3 });
    const painters = [new Bushes(config), new Trees(config), new Flowers(config)];
    this.tiles = new TileField(scene, this.terrain, painters, this.collisions, seed, densityAt);
    this.enemies = new Enemies(
      scene,
      (x, z) => this.heightAt(x, z),
      config,
      seed,
      (from, to) => this.hasLineOfSight(from, to)
    );
    this.clouds = new Clouds(config);
    scene.add(this.clouds.group);
  }

  heightAt(x, z) {
    return this.terrain.heightAt(x, z);
  }

  resolveCollisions(pos, radius) {
    this.collisions.resolve(pos, radius);
  }

  hasLineOfSight(from, to) {
    return this.collisions.hasLineOfSight(from, to);
  }

  update(dt, camPos, worm) {
    const focusPos = worm.position;
    this.tiles.update(focusPos);
    this.enemies.update(dt, worm);
    this.clouds.update(dt, focusPos);
    this.sky.update(camPos, focusPos, dt);
  }
}
