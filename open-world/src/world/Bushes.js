import * as THREE from 'three';
import { pickScatterSpot } from './scatter.js';
import { paintPiece } from './paint.js';

const BUSH_GEO = new THREE.IcosahedronGeometry(1, 1);
const MAX_BLOBS_PER_BUSH = 4;
const DENSITY_THRESHOLD = -0.12; // loose thickets with gaps between them

export class Bushes {
  constructor({ bushesPerTile }) {
    this.perTile = bushesPerTile;
  }

  paint(ctx) {
    const { rng, densityAt, heightAt, addOccluder, pieces } = ctx;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const euler = new THREE.Euler();
    const col = new THREE.Color();
    for (let i = 0; i < this.perTile; i++) {
      const spot = pickScatterSpot(rng, densityAt, ctx, { threshold: DENSITY_THRESHOLD, clearRadius: 4 });
      if (!spot) continue;
      const by = heightAt(spot.x, spot.z);
      const blobs = 2 + ((rng() * (MAX_BLOBS_PER_BUSH - 1)) | 0); // 2-4
      let occluderRadius = 0;
      for (let j = 0; j < blobs; j++) {
        const sc = 1.2 + rng() * 1.3;
        const offsetX = (rng() - 0.5) * 2.2;
        const offsetZ = (rng() - 0.5) * 2.2;
        p.set(spot.x + offsetX, by + sc * 0.5, spot.z + offsetZ);
        q.setFromEuler(euler.set(0, rng() * Math.PI, 0));
        s.set(sc * (0.9 + rng() * 0.4), sc * (0.9 + rng() * 0.35), sc * (0.9 + rng() * 0.4));
        occluderRadius = Math.max(occluderRadius, Math.hypot(offsetX, offsetZ) + Math.max(s.x, s.z));
        m4.compose(p, q, s);
        col.setHSL(0.3 + rng() * 0.06, 0.5 + rng() * 0.2, 0.22 + rng() * 0.12);
        paintPiece(pieces, BUSH_GEO, m4, col);
      }
      addOccluder(spot.x, spot.z, occluderRadius);
    }
  }
}
