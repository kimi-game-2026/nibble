import * as THREE from 'three';

/**
 * Clones a base geometry into world position with a flat-baked color and
 * appends it to `pieces` for merging. Color is a THREE.Color, baked now.
 */
export function paintPiece(pieces, baseGeo, matrix, color) {
  // mergeGeometries requires all pieces to be non-indexed; icosahedra already
  // are, cylinders/spheres are not
  const g = baseGeo.index ? baseGeo.toNonIndexed() : baseGeo.clone();
  g.deleteAttribute('uv');
  g.applyMatrix4(matrix);
  const n = g.attributes.position.count;
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  pieces.push(g);
}
