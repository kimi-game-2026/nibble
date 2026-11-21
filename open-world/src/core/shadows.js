/**
 * Shadow policy for a prefab. Sets cast/receive flags on every mesh in the
 * prefab's subtree, so shadow behavior is declared once per prefab instead of
 * scattered across per-mesh lines — and applies automatically to any meshes
 * the prefab contains, now or after future edits.
 */
export function applyShadows(root, { cast = true, receive = false } = {}) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = cast;
    obj.receiveShadow = receive;
  });
}
