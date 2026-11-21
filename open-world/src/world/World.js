import { Sky } from './Sky.js';
import { Terrain } from './Terrain.js';
import { Bushes } from './Bushes.js';
import { Clouds } from './Clouds.js';

export class World {
  constructor(scene, noise, config) {
    this.sky = new Sky(scene, config);
    this.terrain = new Terrain(noise, config);
    this.bushes = new Bushes((x, z) => this.terrain.heightAt(x, z), config);
    this.clouds = new Clouds(config);
    scene.add(this.terrain.mesh, this.bushes.mesh, this.clouds.group);
  }

  heightAt(x, z) {
    return this.terrain.heightAt(x, z);
  }

  update(dt) {
    this.clouds.update(dt);
  }
}
