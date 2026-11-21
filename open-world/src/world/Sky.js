import * as THREE from 'three';

export class Sky {
  constructor(scene, { skyColor, fogNear, mapSize }) {
    const color = new THREE.Color(skyColor);
    scene.background = color;
    scene.fog = new THREE.Fog(color, fogNear, mapSize * 0.75);

    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x6f9a5e, 1.1));
    const sun = new THREE.DirectionalLight(0xfff3e0, 2.0);
    sun.position.set(80, 120, 40);
    scene.add(sun);
  }
}
