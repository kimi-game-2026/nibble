import * as THREE from 'three';

const PATCH_OFFSET = 100;
const PATCH_FREQUENCY = 0.08;
const OCTAVES = 4;

export class Terrain {
  constructor(noise, { segments, heightScale, terrainFrequency, mapSize }) {
    this.noise = noise;
    this.heightScale = heightScale;
    this.frequency = terrainFrequency;
    this.mesh = this.#build(mapSize, segments);
  }

  heightAt(x, z) {
    return this.noise.fbm(x * this.frequency, z * this.frequency, { octaves: OCTAVES })
      * (this.heightScale / 2);
  }

  #build(size, segments) {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const col = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = this.heightAt(x, z);
      pos.setY(i, y);
      const patch = this.noise.noise(
        x * PATCH_FREQUENCY + PATCH_OFFSET,
        z * PATCH_FREQUENCY + PATCH_OFFSET
      ) * 0.5 + 0.5;
      const t = THREE.MathUtils.clamp(y / this.heightScale + 0.5, 0, 1);
      col.setHSL(0.29 - 0.04 * patch, 0.5 + 0.15 * patch, 0.3 + 0.1 * patch + 0.06 * t);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  }
}
