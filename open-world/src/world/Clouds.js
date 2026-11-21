import * as THREE from 'three';

const MIN_ALTITUDE = 45;
const ALTITUDE_RANGE = 30;
const WRAP_MARGIN = 60;

export class Clouds {
  constructor({ cloudCount, mapSize }) {
    this.mapSize = mapSize;
    this.clouds = [];
    this.group = new THREE.Group();
    const puffGeo = new THREE.IcosahedronGeometry(1, 1);
    const mat = new THREE.MeshLambertMaterial({
      color: 0xffffff, emissive: 0x9aa7b5, flatShading: true,
      transparent: true, opacity: 0.9
    });
    for (let i = 0; i < cloudCount; i++) this.#addCloud(puffGeo, mat);
  }

  #addCloud(puffGeo, mat) {
    const cloud = new THREE.Group();
    const puffs = 3 + ((Math.random() * 4) | 0);
    for (let j = 0; j < puffs; j++) {
      const puff = new THREE.Mesh(puffGeo, mat);
      puff.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 6);
      puff.scale.set(3 + Math.random() * 4, 1.6 + Math.random() * 1.4, 2.4 + Math.random() * 2.5);
      puff.rotation.y = Math.random() * Math.PI;
      cloud.add(puff);
    }
    cloud.position.set(
      (Math.random() - 0.5) * this.mapSize,
      MIN_ALTITUDE + Math.random() * ALTITUDE_RANGE,
      (Math.random() - 0.5) * this.mapSize
    );
    cloud.userData.speed = 1.5 + Math.random() * 2.5;
    this.clouds.push(cloud);
    this.group.add(cloud);
  }

  update(dt) {
    const limit = this.mapSize / 2 + WRAP_MARGIN;
    for (const cloud of this.clouds) {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > limit) cloud.position.x = -limit;
    }
  }
}
