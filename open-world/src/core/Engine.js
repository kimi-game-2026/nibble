import * as THREE from 'three';

export class Engine {
  constructor(camera) {
    this.camera = camera;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);
    addEventListener('resize', () => this.#resize());
  }

  start(update) {
    this.renderer.setAnimationLoop(() => {
      const dt = Math.min(this.clock.getDelta(), 0.05);
      update(dt);
      this.renderer.render(this.scene, this.camera);
    });
  }

  #resize() {
    this.camera.setAspect(innerWidth / innerHeight);
    this.renderer.setSize(innerWidth, innerHeight);
  }
}
