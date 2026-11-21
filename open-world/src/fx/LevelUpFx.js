import * as THREE from 'three';

const RING_DURATION = 0.8;
const BEAM_DURATION = 0.9;
const TEXT_DURATION = 1.4;

function makeTextTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#3a2a00';
  ctx.strokeText('LEVEL UP!', 256, 64);
  ctx.fillStyle = '#ffd54a';
  ctx.fillText('LEVEL UP!', 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Goku-style golden burst around the character on level-up: expanding ring,
 *  rising energy beam, and floating "LEVEL UP!" text. */
export class LevelUpFx {
  constructor(scene) {
    this.scene = scene;
    this.active = [];
  }

  play(pos) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.6, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffd54a, transparent: true, opacity: 0.9, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    ring.geometry.rotateX(-Math.PI / 2);
    ring.position.copy(pos);
    ring.position.y += 0.1;

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.8, 7, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffe27a, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    beam.position.copy(pos);
    beam.position.y += 3.5;

    const text = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeTextTexture(), transparent: true, depthWrite: false, depthTest: false
    }));
    text.position.copy(pos);
    text.position.y += 2.4;
    text.scale.set(6, 1.5, 1);
    text.renderOrder = 5;

    this.scene.add(ring, beam, text);
    this.active.push(
      { mesh: ring, t: 0, duration: RING_DURATION, kind: 'ring' },
      { mesh: beam, t: 0, duration: BEAM_DURATION, kind: 'beam' },
      { mesh: text, t: 0, duration: TEXT_DURATION, kind: 'text' }
    );
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const fx = this.active[i];
      fx.t += dt;
      const k = Math.min(fx.t / fx.duration, 1);
      if (fx.kind === 'ring') {
        fx.mesh.scale.setScalar(1 + k * 9);
        fx.mesh.material.opacity = 0.9 * (1 - k);
      } else if (fx.kind === 'beam') {
        fx.mesh.scale.set(1 + k * 0.6, 1, 1 + k * 0.6);
        fx.mesh.material.opacity = 0.55 * (1 - k);
      } else {
        fx.mesh.position.y += dt * 1.1;
        fx.mesh.material.opacity = 1 - k * k;
      }
      if (k >= 1) {
        this.scene.remove(fx.mesh);
        fx.mesh.material.map?.dispose();
        fx.mesh.material.dispose();
        fx.mesh.geometry.dispose();
        this.active.splice(i, 1);
      }
    }
  }
}
