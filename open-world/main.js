import { CONFIG } from './src/config.js';
import { Engine } from './src/core/Engine.js';
import { Camera } from './src/core/Camera.js';
import { PerlinNoise } from './src/math/PerlinNoise.js';
import { World } from './src/world/World.js';
import { Worm } from './src/player/Worm.js';
import { PlayerController } from './src/player/PlayerController.js';
import { Hud } from './src/ui/Hud.js';
import { GameMenu } from './src/ui/GameMenu.js';
import { Food } from './src/food/Food.js';
import { Experience } from './src/food/Experience.js';
import { LevelUpFx } from './src/fx/LevelUpFx.js';
import { AudioManager } from './src/audio/AudioManager.js';
import { Pineapple } from './src/food/Pineapple.js';
import { Durian } from './src/food/Durian.js';
import { SpeedBoost } from './src/player/SpeedBoost.js';
import { DurianSpike } from './src/fx/DurianSpike.js';
import { SmokeTrail } from './src/fx/SmokeTrail.js';
import { SpikeShot } from './src/player/SpikeShot.js';
import { AloeVera } from './src/food/AloeVera.js';
import { InvincibilitySkill } from './src/player/InvincibilitySkill.js';

// New seed each load => new map
const seed = (Math.random() * 1e9) | 0;
const noise = new PerlinNoise(seed);

const camera = new Camera(CONFIG);
const engine = new Engine(camera);
const world = new World(engine.scene, noise, seed, CONFIG);

const worm = new Worm((x, z) => world.heightAt(x, z), CONFIG);
worm.setPosition(0, 0);
engine.scene.add(worm.group);

camera.position.set(0, world.heightAt(0, 0) + 3, 7);

const player = new PlayerController(
  camera,
  engine.renderer.domElement,
  worm,
  (x, z) => world.heightAt(x, z),
  (pos, r) => world.resolveCollisions(pos, r)
);

const hud = new Hud();
const food = new Food(engine.scene, (x, z) => world.heightAt(x, z), CONFIG);
const experience = new Experience(hud, worm);
const levelUpFx = new LevelUpFx(engine.scene);
const audio = new AudioManager();
const menu = new GameMenu();
let phase = 'ready';
const pineapple = new Pineapple(engine.scene, (x, z) => world.heightAt(x, z));
const durian = new Durian(engine.scene, (x, z) => world.heightAt(x, z));
const speedBoost = new SpeedBoost(worm, hud);
const durianSpike = new DurianSpike(engine.scene, world.enemies, (x, z) => world.heightAt(x, z));
const spikeShot = new SpikeShot(worm, hud, durianSpike);
const aloeVera = new AloeVera(engine.scene, (x, z) => world.heightAt(x, z));
const invincibilitySkill = new InvincibilitySkill(worm, hud);
const smoke = new SmokeTrail(engine.scene);

food.onEat(() => { experience.gain(1); audio.chomp(); });
pineapple.onEat(() => { speedBoost.grant(); audio.chomp(); });
durian.onEat(() => { spikeShot.grant(); audio.chomp(); });
aloeVera.onEat(() => { invincibilitySkill.grant(); audio.chomp(); });
experience.onLevelUp(() => { levelUpFx.play(worm.position); audio.levelUp(); });
world.enemies.onPlayerHit(() => audio.hurt());
world.enemies.onEnemyEaten(() => audio.whee());

menu.onPrimary(() => player.lock());
menu.onRestart(() => location.reload());
player.onLock(() => {
  phase = 'running';
  menu.hide();
});
player.onUnlock(() => {
  if (phase !== 'running') return;
  phase = 'paused';
  audio.setRolling(false);
  menu.showPause(worm.level, worm.experience);
});
menu.showStart();
player.update(0);

addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'F3') {
    e.preventDefault();
    world.enemies.toggleDebug();
  }
  if (e.code === 'KeyQ' && player.controls.isLocked) speedBoost.tryActivate();
  if (e.code === 'KeyE' && player.controls.isLocked && spikeShot.tryActivate()) audio.quip();
  if (e.code === 'KeyR' && player.controls.isLocked) invincibilitySkill.tryActivate();
});

engine.start((dt) => {
  if (phase !== 'running') {
    audio.setRolling(false);
    if (phase === 'ready') world.tiles.update(worm.position);
    return;
  }
  player.update(dt);
  world.update(dt, camera.position, worm);
  food.update(dt, worm.position);
  pineapple.update(dt, worm.position);
  durian.update(dt, worm.position);
  durianSpike.update(dt);
  speedBoost.update(dt);
  invincibilitySkill.update(dt);
  aloeVera.update(dt, worm.position);
  smoke.update(dt, worm.position, worm.heading, speedBoost.active && player.moving);
  levelUpFx.update(dt);
  experience.update();
  audio.setRolling(player.moving);
});
