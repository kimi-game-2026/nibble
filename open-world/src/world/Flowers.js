import * as THREE from 'three';
import { pickScatterSpot } from './scatter.js';
import { paintPiece } from './paint.js';

const STEM_HEIGHT = 0.5;
const PETALS_PER_FLOWER = 6;
const PETAL_RING_RADIUS = 0.13;
const COLLIDER_RADIUS = 0.25;
const STEM_GEO = new THREE.CylinderGeometry(0.025, 0.035, STEM_HEIGHT, 5);
const CENTER_GEO = new THREE.IcosahedronGeometry(0.09, 1);
const PETAL_GEO = new THREE.SphereGeometry(1, 6, 4);
const CENTER_COLOR = new THREE.Color(0xffd54a);
const STEM_COLOR = new THREE.Color(0x3f7a34);
const DENSITY_THRESHOLD = 0.1; // flowers grow in meadow patches

export class Flowers {
  constructor({ flowersPerTile }) {
    this.perTile = flowersPerTile;
  }

  paint(ctx) {
    const { rng, densityAt, heightAt, addCollider, pieces } = ctx;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const euler = new THREE.Euler();
    const col = new THREE.Color();
    for (let i = 0; i < this.perTile; i++) {
      const spot = pickScatterSpot(rng, densityAt, ctx, { threshold: DENSITY_THRESHOLD, clearRadius: 3 });
      if (!spot) continue;
      const fy = heightAt(spot.x, spot.z);
      const sc = 0.7 + rng() * 0.6;
      const baseRot = rng() * Math.PI;
      const headY = fy + (STEM_HEIGHT + 0.05) * sc - 0.05;

      p.set(spot.x, fy + (STEM_HEIGHT / 2) * sc - 0.05, spot.z);
      q.setFromEuler(euler.set(0, baseRot, 0));
      s.set(sc, sc, sc);
      m4.compose(p, q, s);
      paintPiece(pieces, STEM_GEO, m4, STEM_COLOR);

      p.set(spot.x, headY, spot.z);
      m4.compose(p, q, s);
      paintPiece(pieces, CENTER_GEO, m4, CENTER_COLOR);

      col.setHSL(rng(), 0.65 + rng() * 0.2, 0.6 + rng() * 0.15);
      for (let k = 0; k < PETALS_PER_FLOWER; k++) {
        const ang = baseRot + (k / PETALS_PER_FLOWER) * Math.PI * 2;
        p.set(
          spot.x + Math.sin(ang) * PETAL_RING_RADIUS * sc,
          headY - 0.02 * sc,
          spot.z + Math.cos(ang) * PETAL_RING_RADIUS * sc
        );
        q.setFromEuler(euler.set(0, ang, 0));
        s.set(0.075 * sc, 0.03 * sc, 0.14 * sc);
        m4.compose(p, q, s);
        paintPiece(pieces, PETAL_GEO, m4, col);
      }

      addCollider(spot.x, spot.z, COLLIDER_RADIUS * sc);
    }
  }
}
