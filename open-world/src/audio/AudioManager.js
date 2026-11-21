import { Bgm } from './Bgm.js';
import { createRolling, chomp, levelUp, hurt, bushRustle, whee } from './Sfx.js';

/**
 * Owns the AudioContext and every game sound. Browsers block audio before a
 * user gesture, so the context (and the BGM) only starts on first input.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bgm = null;
    this.rolling = null;
    const unlock = () => this.#unlock();
    addEventListener('pointerdown', unlock, { once: true });
    addEventListener('keydown', unlock, { once: true });
  }

  #unlock() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.bgm = new Bgm(this.ctx, this.master);
    this.bgm.start();
    this.rolling = createRolling(this.ctx, this.master);
  }

  /** Grass-rustle loop; cheap to call every frame, only acts on change. */
  setRolling(active) {
    this.rolling?.set(active);
  }

  chomp() {
    if (this.ctx) chomp(this.ctx, this.master);
  }

  levelUp() {
    if (this.ctx) levelUp(this.ctx, this.master);
  }

  hurt() {
    if (this.ctx) hurt(this.ctx, this.master);
  }

  /** Leafy rustle for entering bush cover. Mechanics live elsewhere — call this when the worm hides. */
  bushRustle() {
    if (this.ctx) bushRustle(this.ctx, this.master);
  }

  whee() {
    if (this.ctx) whee(this.ctx, this.master);
  }
}
