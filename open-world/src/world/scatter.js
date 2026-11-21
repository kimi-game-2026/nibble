/**
 * Rejection-samples a scatter position inside a rect { minX, minZ, size } whose
 * clump density meets `threshold`, keeping `clearRadius` around the origin
 * (spawn) empty. Returns null if no spot qualifies after maxTries, so clusters
 * naturally vary in density. Uses the caller's rng for deterministic tiles.
 */
export function pickScatterSpot(rng, densityAt, area, { threshold = 0, clearRadius = 0, maxTries = 8 } = {}) {
  for (let t = 0; t < maxTries; t++) {
    const x = area.minX + rng() * area.size;
    const z = area.minZ + rng() * area.size;
    if (clearRadius > 0 && Math.hypot(x, z) < clearRadius) continue;
    if (densityAt(x, z) >= threshold) return { x, z };
  }
  return null;
}
