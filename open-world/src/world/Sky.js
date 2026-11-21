import * as THREE from 'three';

const SUN_DIR = new THREE.Vector3(0.6, 0.45, -0.4).normalize();
const SUN_DISTANCE = 700;
const DOME_RADIUS = 800;
const FOG_NEAR = 80;
const FOG_FAR = 260;
const SHADOW_AREA = 45;      // shadow camera covers ±45 units around the focus
const LIGHT_DISTANCE = 180;
const MOUNTAIN_RADIUS = 620;
const MOUNTAIN_PEAKS = 48;

export class Sky {
  constructor(scene, { skyColor }) {
    const base = new THREE.Color(skyColor);
    this.zenith = base.clone().offsetHSL(0.02, 0.08, -0.12);
    this.horizon = base.clone().offsetHSL(-0.01, -0.08, 0.18);

    scene.fog = new THREE.Fog(this.horizon, FOG_NEAR, FOG_FAR);
    this.dome = this.#buildDome();
    this.mountains = this.#buildMountains();
    scene.add(this.dome, this.mountains);

    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x6f9a5e, 1.1));
    this.sunLight = new THREE.DirectionalLight(0xfff3e0, 2.0);
    this.sunLight.castShadow = true;
    const shadow = this.sunLight.shadow;
    shadow.mapSize.set(2048, 2048);
    shadow.camera.left = shadow.camera.bottom = -SHADOW_AREA;
    shadow.camera.right = shadow.camera.top = SHADOW_AREA;
    shadow.camera.near = 10;
    shadow.camera.far = 500;
    shadow.bias = -0.0015;
    shadow.normalBias = 0.5;
    shadow.camera.updateProjectionMatrix();
    scene.add(this.sunLight, this.sunLight.target);

    this.glow = new THREE.Mesh(
      new THREE.CircleGeometry(52, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.25, fog: false })
    );
    this.disc = new THREE.Mesh(
      new THREE.CircleGeometry(26, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff7cc, transparent: true, opacity: 0.9, fog: false })
    );
    scene.add(this.glow, this.disc);
  }

  /**
   * camPos: sky dome, mountains + sun disc track the camera (visual infinity).
   * focusPos: the shadow-casting light tracks the character, so shadow
   * direction stays fixed while the camera orbits.
   */
  update(camPos, focusPos = camPos) {
    this.dome.position.copy(camPos);
    this.mountains.position.set(camPos.x, 0, camPos.z);
    this.glow.position.copy(camPos).addScaledVector(SUN_DIR, SUN_DISTANCE);
    this.glow.lookAt(camPos);
    this.disc.position.copy(camPos).addScaledVector(SUN_DIR, SUN_DISTANCE - 1);
    this.disc.lookAt(camPos);
    this.sunLight.position.copy(focusPos).addScaledVector(SUN_DIR, LIGHT_DISTANCE);
    this.sunLight.target.position.copy(focusPos);
  }

  #buildDome() {
    const geo = new THREE.SphereGeometry(DOME_RADIUS, 32, 16);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / DOME_RADIUS;
      if (y >= 0) {
        c.copy(this.horizon).lerp(this.zenith, Math.pow(y, 0.55));
      } else {
        c.copy(this.horizon).multiplyScalar(0.95);
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false
    }));
    mesh.renderOrder = -1;
    return mesh;
  }

  /** A ring of jagged peak silhouettes in the reference's blue-violet palette. */
  #buildMountains() {
    const positions = [];
    const colors = [];
    const baseCol = new THREE.Color(0xb8bee8);   // light lavender slopes
    const topCol = new THREE.Color(0x7f86c2);    // mid slate-blue peaks
    const creaseCol = new THREE.Color(0x5f66a3); // darkest creases
    for (let i = 0; i < MOUNTAIN_PEAKS; i++) {
      const ang = (i / MOUNTAIN_PEAKS) * Math.PI * 2 + (Math.random() - 0.5) * 0.06;
      const r = MOUNTAIN_RADIUS + (Math.random() - 0.5) * 80;
      const halfW = 60 + Math.random() * 80;
      const h = 60 + Math.random() * 90;
      const cx = Math.cos(ang) * r, cz = Math.sin(ang) * r;
      const px = -Math.sin(ang), pz = Math.cos(ang);
      const jitterX = (Math.random() - 0.5) * 24, jitterZ = (Math.random() - 0.5) * 24;
      positions.push(
        cx - px * halfW, -6, cz - pz * halfW,
        cx + px * halfW, -6, cz + pz * halfW,
        cx + jitterX, -6 + h, cz + jitterZ
      );
      const shade = Math.random() * 0.35; // per-peak variation toward the crease tone
      const b = baseCol.clone().lerp(creaseCol, shade);
      const t = topCol.clone().lerp(creaseCol, shade);
      colors.push(
        b.r, b.g, b.b,
        b.r, b.g, b.b,
        t.r, t.g, t.b
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      vertexColors: true, fog: false, side: THREE.DoubleSide, toneMapped: false
    }));
  }
}
