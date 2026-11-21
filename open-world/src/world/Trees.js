import * as THREE from 'three';
import { pickScatterSpot } from './scatter.js';
import { paintPiece } from './paint.js';

const TRUNK_HEIGHT = 3.2;
const TRUNK_GEO = new THREE.CylinderGeometry(0.35, 0.6, TRUNK_HEIGHT, 7);
const FOLIAGE_GEO = new THREE.IcosahedronGeometry(1, 1);
const SAKURA_RATIO = 0.35;
const DENSITY_THRESHOLD = -0.05; // groves with clearings between them

export class Trees {
  constructor({ treesPerTile }) {
    this.perTile = treesPerTile;
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
      const spot = pickScatterSpot(rng, densityAt, ctx, { threshold: DENSITY_THRESHOLD, clearRadius: 5 });
      if (!spot) continue;
      const ty = heightAt(spot.x, spot.z);
      const sc = 1.4 + rng() * 1.0;
      const sakura = rng() < SAKURA_RATIO;

      p.set(spot.x, ty + (TRUNK_HEIGHT / 2) * sc - 0.1, spot.z);
      q.setFromEuler(euler.set(0, rng() * Math.PI, 0));
      s.set(sc, sc, sc);
      m4.compose(p, q, s);
      col.setHSL(0.07, 0.4, sakura ? 0.15 + rng() * 0.04 : 0.22 + rng() * 0.08);
      paintPiece(pieces, TRUNK_GEO, m4, col);

      const blobs = 2 + ((rng() * 2) | 0); // 2-3
      for (let j = 0; j < blobs; j++) {
        const fs = (1.5 + rng() * 1.1) * sc;
        p.set(
          spot.x + (rng() - 0.5) * 1.2 * sc,
          ty + (2.9 + j * 0.9 + rng() * 0.3) * sc,
          spot.z + (rng() - 0.5) * 1.2 * sc
        );
        q.setFromEuler(euler.set(0, rng() * Math.PI, 0));
        s.set(fs, fs * 0.85, fs);
        m4.compose(p, q, s);
        if (sakura) {
          col.setHSL(0.93 + rng() * 0.04, 0.55 + rng() * 0.15, 0.68 + rng() * 0.08);
        } else {
          col.setHSL(0.33 + rng() * 0.04, 0.45 + rng() * 0.15, 0.2 + rng() * 0.1);
        }
        paintPiece(pieces, FOLIAGE_GEO, m4, col);
      }

      addCollider(spot.x, spot.z, 0.7 * sc);
    }
  }
}
