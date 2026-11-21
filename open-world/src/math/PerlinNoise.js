const GRADIENTS = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (t, a, b) => a + t * (b - a);

export class PerlinNoise {
  constructor(seed = 1337) {
    const rand = mulberry32(seed);
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = (rand() * (i + 1)) | 0;
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  /** Classic 2D Perlin gradient noise, returns ~[-1, 1]. */
  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const { perm } = this;
    const gaa = GRADIENTS[perm[perm[X] + Y] & 7];
    const gab = GRADIENTS[perm[perm[X] + Y + 1] & 7];
    const gba = GRADIENTS[perm[perm[X + 1] + Y] & 7];
    const gbb = GRADIENTS[perm[perm[X + 1] + Y + 1] & 7];
    const aa = gaa[0] * x + gaa[1] * y;
    const ba = gba[0] * (x - 1) + gba[1] * y;
    const ab = gab[0] * x + gab[1] * (y - 1);
    const bb = gbb[0] * (x - 1) + gbb[1] * (y - 1);
    return lerp(v, lerp(u, aa, ba), lerp(u, ab, bb));
  }

  /** Fractal Brownian motion: stacked octaves normalized to ~[-1, 1]. */
  fbm(x, y, { octaves = 4, lacunarity = 2.15, gain = 0.5 } = {}) {
    let sum = 0, amp = 1, norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += this.noise(x, y) * amp;
      norm += amp;
      amp *= gain;
      x *= lacunarity;
      y *= lacunarity;
    }
    return sum / norm;
  }
}
