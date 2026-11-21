import { noteFreq } from './Sfx.js';

const BPM = 72;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

// I - vi - IV - V, one chord per bar (midi note numbers)
const CHORDS = [
  [60, 64, 67, 71], // Cmaj7
  [57, 60, 64, 67], // Am7
  [53, 57, 60, 64], // Fmaj7
  [55, 59, 62, 64], // G6
];
const BASS_ROOTS = [36, 33, 29, 31];
const PENTATONIC = [72, 74, 76, 79, 81, 84]; // C D E G A C

/** Calm procedural background music: soft pads, sub bass, sparse pentatonic plucks. */
export class Bgm {
  constructor(ctx, destination) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0.22;
    this.out.connect(destination);

    // Spacey echo for the melody plucks
    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = BEAT * 0.75;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    this.delay.connect(feedback).connect(this.delay);
    this.delay.connect(this.out);

    this.bar = 0;
    this.nextBarTime = 0;
    this.timer = null;
  }

  start() {
    if (this.timer) return;
    this.nextBarTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.#schedule(), 200);
    this.#schedule();
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  // Lookahead scheduler: always stay a bar ahead so timing never stutters
  #schedule() {
    while (this.nextBarTime < this.ctx.currentTime + BAR * 1.5) {
      this.#playBar(this.bar, this.nextBarTime);
      this.bar++;
      this.nextBarTime += BAR;
    }
  }

  #playBar(bar, t) {
    const i = bar % CHORDS.length;
    this.#pad(CHORDS[i], t);
    this.#bass(BASS_ROOTS[i], t);
    // Sparse melody: up to one pluck per beat, often resting
    for (let beat = 0; beat < 4; beat++) {
      if (Math.random() < 0.45) continue;
      const note = PENTATONIC[(Math.random() * PENTATONIC.length) | 0];
      this.#pluck(note, t + beat * BEAT + (Math.random() < 0.3 ? BEAT / 2 : 0));
    }
  }

  #pad(chord, t) {
    for (const m of chord) {
      for (const detune of [-4, 4]) {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = noteFreq(m);
        osc.detune.value = detune;
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + BAR * 0.3);
        g.gain.setValueAtTime(0.05, t + BAR * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, t + BAR);
        osc.connect(lp).connect(g).connect(this.out);
        osc.start(t);
        osc.stop(t + BAR + 0.05);
      }
    }
  }

  #bass(m, t) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = noteFreq(m);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + BAR);
    osc.connect(g).connect(this.out);
    osc.start(t);
    osc.stop(t + BAR + 0.05);
  }

  #pluck(m, t) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = noteFreq(m);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    osc.connect(g);
    g.connect(this.out);
    g.connect(this.delay);
    osc.start(t);
    osc.stop(t + 0.65);
  }
}
