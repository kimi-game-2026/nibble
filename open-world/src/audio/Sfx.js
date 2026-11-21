// Synthesized sound effects — no audio asset files needed.

export const noteFreq = (m) => 440 * 2 ** ((m - 69) / 12);

let noiseBuf = null;

function getNoiseBuffer(ctx) {
  if (noiseBuf) return noiseBuf;
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/** Looped grass-rustle noise; call set(true/false) as the worm starts/stops moving. */
export function createRolling(ctx, destination) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  src.loop = true;

  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 650;
  band.Q.value = 0.7;

  // Slow wobble on the filter cutoff => uneven rustle instead of static hiss
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 6;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain).connect(band.frequency);

  const gain = ctx.createGain();
  gain.gain.value = 0;

  src.connect(band).connect(gain).connect(destination);
  src.start();
  lfo.start();

  let on = false;
  return {
    set(active) {
      if (active === on) return;
      on = active;
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setTargetAtTime(active ? 0.14 : 0, t, active ? 0.08 : 0.15);
    },
  };
}

/** Quick two-bite "nom" when an essence dot is eaten. */
export function chomp(ctx, destination) {
  const t0 = ctx.currentTime;
  bite(t0, 1);
  bite(t0 + 0.09, 0.6);

  function bite(t, vol) {
    // Mouth click: noise burst through a fast lowpass sweep
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2500, t);
    lp.frequency.exponentialRampToValueAtTime(300, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    src.connect(lp).connect(g).connect(destination);
    src.start(t);
    src.stop(t + 0.1);

    // Body of the bite: quick sine pitch drop
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.1);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.25 * vol, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(og).connect(destination);
    osc.start(t);
    osc.stop(t + 0.11);
  }
}

/** Cartoonish falling "aargh" when the worm takes a hit, with an impact thud. */
export function hurt(ctx, destination) {
  const t0 = ctx.currentTime;
  const dur = 0.45;

  // Voice: falling sawtooth with fast vibrato => vocal wobble
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(520, t0);
  osc.frequency.exponentialRampToValueAtTime(150, t0 + dur);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 28;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 40;
  lfo.connect(lfoGain).connect(osc.frequency);

  // Formant sweep makes it read as "aaah" instead of a siren
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.6;
  bp.frequency.setValueAtTime(1100, t0);
  bp.frequency.exponentialRampToValueAtTime(500, t0 + dur);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.03);
  g.gain.setValueAtTime(0.5, t0 + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

  osc.connect(bp).connect(g).connect(destination);
  osc.start(t0);
  lfo.start(t0);
  osc.stop(t0 + dur + 0.05);
  lfo.stop(t0 + dur + 0.05);

  // Impact thud underneath
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(900, t0);
  lp.frequency.exponentialRampToValueAtTime(120, t0 + 0.15);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.35, t0);
  ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
  src.connect(lp).connect(ng).connect(destination);
  src.start(t0);
  src.stop(t0 + 0.2);
}

/** Playful slide-whistle "whee!" when the worm eats an enemy. */
export function whee(ctx, destination) {
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  // Rise, tiny dip, bigger rise => giddy slide-whistle contour
  osc.frequency.setValueAtTime(500, t0);
  osc.frequency.exponentialRampToValueAtTime(950, t0 + 0.12);
  osc.frequency.exponentialRampToValueAtTime(800, t0 + 0.2);
  osc.frequency.exponentialRampToValueAtTime(1500, t0 + 0.34);

  // Light vibrato so it feels alive, not robotic
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 14;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 25;
  lfo.connect(lfoGain).connect(osc.frequency);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.28, t0 + 0.03);
  g.gain.setValueAtTime(0.28, t0 + 0.26);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
  osc.connect(g).connect(destination);
  osc.start(t0);
  lfo.start(t0);
  osc.stop(t0 + 0.42);
  lfo.stop(t0 + 0.42);
}

/** Leafy double-swish when the worm slips into a bush for cover. */
export function bushRustle(ctx, destination) {
  const t0 = ctx.currentTime;
  swish(t0, 0.28, 1);        // pushing through the leaves
  swish(t0 + 0.14, 0.34, 0.6); // settling into cover

  function swish(t, dur, vol) {
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    // Sweep up then back down => a "shhk" instead of flat hiss
    bp.frequency.setValueAtTime(1400, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.5);
    bp.frequency.exponentialRampToValueAtTime(900, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35 * vol, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp).connect(g).connect(destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }
}

/** Bright rising fanfare with a whoosh and a final sparkle. */
export function levelUp(ctx, destination) {
  const t0 = ctx.currentTime + 0.02;
  const notes = [72, 76, 79, 84, 88, 91]; // C5 E5 G5 C6 E6 G6
  notes.forEach((m, i) => {
    const t = t0 + i * 0.07;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = noteFreq(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g).connect(destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });

  // Whoosh sweeping up underneath
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 2;
  bp.frequency.setValueAtTime(400, t0);
  bp.frequency.exponentialRampToValueAtTime(4000, t0 + 0.5);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
  src.connect(bp).connect(g).connect(destination);
  src.start(t0);
  src.stop(t0 + 0.6);

  // Sparkle cluster landing on the last note
  const tEnd = t0 + notes.length * 0.07;
  for (const m of [96, 100, 103]) {
    const osc = ctx.createOscillator();
    osc.frequency.value = noteFreq(m);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, tEnd);
    sg.gain.exponentialRampToValueAtTime(0.08, tEnd + 0.02);
    sg.gain.exponentialRampToValueAtTime(0.001, tEnd + 0.5);
    osc.connect(sg).connect(destination);
    osc.start(tEnd);
    osc.stop(tEnd + 0.55);
  }
}
