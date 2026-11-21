import { CONFIG } from './src/config.js';
import { Engine } from './src/core/Engine.js';
import { Camera } from './src/core/Camera.js';
import { PerlinNoise } from './src/math/PerlinNoise.js';
import { World } from './src/world/World.js';
import { PlayerController } from './src/player/PlayerController.js';

// New seed each load => new map
const noise = new PerlinNoise((Math.random() * 1e9) | 0);

const camera = new Camera(CONFIG);
const engine = new Engine(camera);
const world = new World(engine.scene, noise, CONFIG);

camera.position.set(0, world.heightAt(0, 0) + CONFIG.eyeHeight, 0);

const player = new PlayerController(
  camera,
  engine.renderer.domElement,
  (x, z) => world.heightAt(x, z),
  CONFIG
);

const overlay = document.getElementById('overlay');
overlay.addEventListener('click', () => player.lock());
player.onLock(() => overlay.classList.add('hidden'));
player.onUnlock(() => overlay.classList.remove('hidden'));

engine.start((dt) => {
  player.update(dt);
  world.update(dt);
});
