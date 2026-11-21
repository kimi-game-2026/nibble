export class Collisions {
  constructor() {
    this.circles = [];
  }

  addCircle(x, z, radius, tag = null) {
    this.circles.push({ x, z, radius, tag });
  }

  /** Drops every collider created for a tag (e.g. an unloaded terrain tile). */
  removeTagged(tag) {
    this.circles = this.circles.filter((c) => c.tag !== tag);
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
