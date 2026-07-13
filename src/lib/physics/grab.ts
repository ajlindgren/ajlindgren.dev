import * as THREE from 'three';

/**
 * Pointer-to-world helpers for the drag/flick interaction on the D12.
 *
 * The heavy state (Rapier body ref, dragging flag, velocity history) lives in
 * the D12 component because it's tightly coupled to Svelte reactivity. This
 * module holds the pure math so it can be unit-tested independently.
 */

export function screenToWorldOnPlane(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  plane: THREE.Plane,
  out: THREE.Vector3
): boolean {
  const rect = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  const ray = new THREE.Raycaster();
  ray.setFromCamera(ndc, camera);
  return ray.ray.intersectPlane(plane, out) !== null;
}

export type PointerSample = { t: number; x: number; y: number; z: number };

/**
 * Trim samples older than `windowMs`, then estimate linear velocity from the
 * first and last remaining samples. Returns a zero vector if fewer than two
 * samples remain.
 */
export function estimateFlickVelocity(
  history: PointerSample[],
  now: number,
  windowMs: number,
  out: THREE.Vector3
): THREE.Vector3 {
  while (history.length > 2 && now - history[0].t > windowMs) {
    history.shift();
  }
  if (history.length < 2) return out.set(0, 0, 0);
  const first = history[0];
  const last = history[history.length - 1];
  const dt = Math.max(0.001, (last.t - first.t) / 1000);
  return out.set((last.x - first.x) / dt, (last.y - first.y) / dt, (last.z - first.z) / dt);
}
