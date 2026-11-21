import * as THREE from 'three';

export class Camera extends THREE.PerspectiveCamera {
  constructor({ fov }) {
    super(fov, innerWidth / innerHeight, 0.1, 1200); // far must cover the 800u sky dome
  }

  setAspect(aspect) {
    this.aspect = aspect;
    this.updateProjectionMatrix();
  }
}
