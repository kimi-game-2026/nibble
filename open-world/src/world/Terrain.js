import * as THREE from 'three';

const PATCH_OFFSET = 100;
const PATCH_FREQUENCY = 0.08;
const OCTAVES = 4;
const NORMAL_EPS = 0.6;

export class Terrain {
  constructor(noise, { heightScale, terrainFrequency }) {
    this.noise = noise;
    this.heightScale = heightScale;
    this.frequency = terrainFrequency;
  }

  heightAt(x, z) {
    return this.noise.fbm(x * this.frequency, z * this.frequency, { octaves: OCTAVES })
      * (this.heightScale / 2);
  }

  /** World-space tile geometry for tile (cx, cz); normals are analytic so tiles join seamlessly. */
  buildTile(cx, cz, size, segments) {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    geo.deleteAttribute('uv');
    geo.translate(cx * size + size / 2, 0, cz * size + size / 2);

    const pos = geo.attributes.position;
    const normals = geo.attributes.normal;
    const colors = new Float32Array(pos.count * 3);
    const col = new THREE.Color();
    const n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = this.heightAt(x, z);
      pos.setY(i, y);
      n.set(
        this.heightAt(x - NORMAL_EPS, z) - this.heightAt(x + NORMAL_EPS, z),
        2 * NORMAL_EPS,
        this.heightAt(x, z - NORMAL_EPS) - this.heightAt(x, z + NORMAL_EPS)
      ).normalize();
      normals.setXYZ(i, n.x, n.y, n.z);
      const patch = this.noise.noise(
        x * PATCH_FREQUENCY + PATCH_OFFSET,
        z * PATCH_FREQUENCY + PATCH_OFFSET
      ) * 0.5 + 0.5;
      const t = THREE.MathUtils.clamp(y / this.heightScale + 0.5, 0, 1);
      col.setHSL(0.28 - 0.03 * patch, 0.55 + 0.15 * patch, 0.4 + 0.12 * patch + 0.05 * t);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }
}
