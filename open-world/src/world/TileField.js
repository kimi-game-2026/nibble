import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { applyShadows } from '../core/shadows.js';
import { createRng, hashCoords } from '../math/rng.js';

const TILE_SIZE = 128;
const TILE_SEGMENTS = 64;
const RADIUS = 2;            // tiles kept around the player => 5x5 = 640u span
const BUILDS_PER_FRAME = 2;  // spread generation cost over frames

/**
 * Endless terrain + vegetation, generated tile by tile around a moving focus.
 * Tiles are deterministic (seeded per coordinate) and disposed when left behind.
 */
export class TileField {
  constructor(scene, terrain, painters, collisions, seed, densityAt) {
    this.scene = scene;
    this.terrain = terrain;
    this.painters = painters;
    this.collisions = collisions;
    this.seed = seed;
    this.densityAt = densityAt;
    this.terrainMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.vegetationMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    this.tiles = new Map(); // key -> { terrainMesh, vegetationMesh }
    this.queue = [];
    this.centerKey = null;
  }

  update(focusPos) {
    const cx = Math.floor(focusPos.x / TILE_SIZE);
    const cz = Math.floor(focusPos.z / TILE_SIZE);
    const key = `${cx},${cz}`;
    if (key !== this.centerKey) {
      this.centerKey = key;
      this.#sync(cx, cz);
    }
    let budget = BUILDS_PER_FRAME;
    while (budget-- > 0 && this.queue.length > 0) {
      this.#build(...this.queue.shift());
    }
  }

  #sync(cx, cz) {
    const needed = new Set();
    for (let dx = -RADIUS; dx <= RADIUS; dx++) {
      for (let dz = -RADIUS; dz <= RADIUS; dz++) {
        const k = `${cx + dx},${cz + dz}`;
        needed.add(k);
        if (!this.tiles.has(k) && !this.queue.some((q) => q[2] === k)) {
          this.queue.push([cx + dx, cz + dz, k]);
        }
      }
    }
    this.queue = this.queue.filter((q) => needed.has(q[2])); // drop stale builds from the old area
    this.queue.sort((a, b) =>
      (Math.abs(a[0] - cx) + Math.abs(a[1] - cz)) - (Math.abs(b[0] - cx) + Math.abs(b[1] - cz))
    );
    for (const [k, tile] of this.tiles) {
      if (needed.has(k)) continue;
      this.scene.remove(tile.terrainMesh);
      tile.terrainMesh.geometry.dispose();
      if (tile.vegetationMesh) {
        this.scene.remove(tile.vegetationMesh);
        tile.vegetationMesh.geometry.dispose();
      }
      this.collisions.removeTagged(k);
      this.tiles.delete(k);
    }
  }

  #build(cx, cz, key) {
    if (this.tiles.has(key)) return;
    const rng = createRng(hashCoords(cx, cz, this.seed));

    const terrainMesh = new THREE.Mesh(
      this.terrain.buildTile(cx, cz, TILE_SIZE, TILE_SEGMENTS),
      this.terrainMat
    );
    applyShadows(terrainMesh, { cast: false, receive: true });
    this.scene.add(terrainMesh);

    const pieces = [];
    const ctx = {
      rng,
      minX: cx * TILE_SIZE,
      minZ: cz * TILE_SIZE,
      size: TILE_SIZE,
      heightAt: (x, z) => this.terrain.heightAt(x, z),
      densityAt: this.densityAt,
      addCollider: (x, z, r) => this.collisions.addCircle(x, z, r, key),
      pieces,
    };
    for (const painter of this.painters) painter.paint(ctx);

    let vegetationMesh = null;
    if (pieces.length > 0) {
      vegetationMesh = new THREE.Mesh(mergeGeometries(pieces, false), this.vegetationMat);
      applyShadows(vegetationMesh, { cast: true, receive: true });
      this.scene.add(vegetationMesh);
    }
    this.tiles.set(key, { terrainMesh, vegetationMesh });
  }
}
