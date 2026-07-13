import * as THREE from 'three';

/**
 * A dodecahedron has 12 pentagonal faces. `THREE.DodecahedronGeometry` emits
 * triangulated geometry (36 tris = 3 tris/face × 12 faces). We group triangles
 * by shared face-normal, then assign a stable face-number 1..12 by centroid sort.
 */

export type FaceMapping = {
  /** unit-length outward normal for each face 1..12, in geometry local space */
  normals: THREE.Vector3[];
  /** centroid of each face in geometry local space (for debugging / labels) */
  centroids: THREE.Vector3[];
};

/**
 * Build the face → normal mapping once from a dodecahedron geometry.
 * Face numbers 1..12 correspond to array indices 0..11.
 * Ordering: sort by centroid — Y descending (top-first), then X, then Z.
 * This gives a deterministic, reproducible labeling.
 */
export function buildFaceMapping(radius = 0.5): FaceMapping {
  const geom = new THREE.DodecahedronGeometry(radius, 0);
  const pos = geom.getAttribute('position');
  const idx = geom.getIndex();

  const groups: { normal: THREE.Vector3; centroid: THREE.Vector3; count: number }[] = [];

  // Two triangles belong to the same pentagon iff their normals are (near-)
  // parallel. Adjacent dodecahedron faces differ by ~63.4° (dot ≈ 0.447), so
  // any threshold near 1 is unambiguous. String-quantizing components
  // (toFixed) is NOT a safe bucket key: face normals have exact-zero
  // components, and cross-product noise lands on either side of 0, splitting
  // one face into "0.000" and "-0.000" buckets (12 faces became 17 in the
  // first Pages deploy).
  const SAME_FACE_DOT = 0.99;

  const triCount = idx ? idx.count / 3 : pos.count / 3;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let t = 0; t < triCount; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3;
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    n.crossVectors(ab, ac).normalize();

    const centroidTri = new THREE.Vector3().addVectors(a, b).add(c).divideScalar(3);
    const existing = groups.find((g) => g.normal.dot(n) > SAME_FACE_DOT);
    if (existing) {
      existing.centroid.add(centroidTri);
      existing.count++;
    } else {
      groups.push({
        normal: n.clone(),
        centroid: centroidTri.clone(),
        count: 1
      });
    }
  }

  const faces = groups.map((g) => ({
    normal: g.normal,
    centroid: g.centroid.divideScalar(g.count)
  }));

  if (faces.length !== 12) {
    throw new Error(`expected 12 dodecahedron faces, got ${faces.length}`);
  }

  faces.sort((f1, f2) => {
    if (Math.abs(f1.centroid.y - f2.centroid.y) > 1e-4) return f2.centroid.y - f1.centroid.y;
    if (Math.abs(f1.centroid.x - f2.centroid.x) > 1e-4) return f1.centroid.x - f2.centroid.x;
    return f1.centroid.z - f2.centroid.z;
  });

  return {
    normals: faces.map((f) => f.normal),
    centroids: faces.map((f) => f.centroid)
  };
}

const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * Given a rigid body's world quaternion and the precomputed face normals,
 * return the face number (1..12) whose transformed normal points closest to
 * world-up, plus the alignment score (dot product, in [-1, 1]).
 */
export function detectUpFace(
  mapping: FaceMapping,
  quaternion: THREE.Quaternion
): { face: number; alignment: number } {
  let best = -Infinity;
  let bestIndex = 0;
  const worldNormal = new THREE.Vector3();
  for (let i = 0; i < 12; i++) {
    worldNormal.copy(mapping.normals[i]).applyQuaternion(quaternion);
    const dot = worldNormal.dot(WORLD_UP);
    if (dot > best) {
      best = dot;
      bestIndex = i;
    }
  }
  return { face: bestIndex + 1, alignment: best };
}
