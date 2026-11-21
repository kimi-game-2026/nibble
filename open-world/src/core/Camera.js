import * as THREE from 'three';

export class Camera extends THREE.PerspectiveCamera {
  constructor({ fov, mapSize }) {
    super(fov, innerWidth / innerHeight, 0.1, mapSize * 2.5);
  }

  setAspect(aspect) {
    this.aspect = aspect;
    this.updateProjectionMatrix();
  }
}
