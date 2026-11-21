export class Collisions {
  constructor() {
    this.circles = [];
    this.occluders = [];
  }

  addCircle(x, z, radius, tag = null) {
    this.circles.push({ x, z, radius, tag });
  }

  addOccluder(x, z, radius, tag = null) {
    this.occluders.push({ x, z, radius, tag });
  }

  /** Drops every collider and occluder created for a terrain tile tag. */
  removeTagged(tag) {
    this.circles = this.circles.filter((c) => c.tag !== tag);
    this.occluders = this.occluders.filter((c) => c.tag !== tag);
  }

  hasLineOfSight(from, to) {
    const vx = to.x - from.x;
    const vz = to.z - from.z;
    const lengthSq = vx * vx + vz * vz;
    if (lengthSq === 0) return true;
    for (const c of this.occluders) {
      const t = Math.max(0, Math.min(1, ((c.x - from.x) * vx + (c.z - from.z) * vz) / lengthSq));
      const dx = from.x + vx * t - c.x;
      const dz = from.z + vz * t - c.z;
      if (dx * dx + dz * dz < c.radius * c.radius) return false;
    }
    return true;
  }

  /** Pushes pos (Vector3-like, y untouched) out of every circle it overlaps. */
  resolve(pos, moverRadius) {
    for (const c of this.circles) {
      const dx = pos.x - c.x;
      const dz = pos.z - c.z;
      const min = c.radius + moverRadius;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const push = (min - d) / d;
      pos.x += dx * push;
      pos.z += dz * push;
    }
  }
}
