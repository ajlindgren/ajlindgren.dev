import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildFaceMapping, detectUpFace } from './faceDetection';

const RADIUS = 0.5;
const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * These tests are the correctness gate for the "which face is up" logic. The
 * mapping built by `buildFaceMapping` is the single source of truth: the same
 * `normal → face-number` table is what any printed numeral must be placed
 * against. If a face-up orientation resolves to the wrong number here, the die
 * would report a face the player doesn't see.
 */
describe('buildFaceMapping', () => {
  const mapping = buildFaceMapping(RADIUS);

  it('produces exactly 12 unit-length face normals', () => {
    expect(mapping.normals).toHaveLength(12);
    for (const n of mapping.normals) {
      expect(n.length()).toBeCloseTo(1, 6);
    }
  });

  it('produces 12 distinct face normals (no duplicate/split faces)', () => {
    for (let i = 0; i < 12; i++) {
      for (let j = i + 1; j < 12; j++) {
        // Any two distinct dodecahedron faces differ by >= ~63.4deg (dot <= ~0.45).
        expect(mapping.normals[i].dot(mapping.normals[j])).toBeLessThan(0.9);
      }
    }
  });
});

describe('detectUpFace', () => {
  const mapping = buildFaceMapping(RADIUS);

  it('reports the correct number for each of the 12 faces pointing up', () => {
    const reported = new Set<number>();
    for (let i = 0; i < 12; i++) {
      // Rotate face i's local normal onto world-up; the detector must name it.
      const q = new THREE.Quaternion().setFromUnitVectors(mapping.normals[i], WORLD_UP);
      const { face, alignment } = detectUpFace(mapping, q);
      expect(face, `face index ${i} pointed up`).toBe(i + 1);
      expect(alignment).toBeCloseTo(1, 5);
      reported.add(face);
    }
    // The map is a bijection: all of 1..12, each exactly once.
    expect([...reported].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('returns a slightly-perturbed orientation to the same face (robust to jitter)', () => {
    for (let i = 0; i < 12; i++) {
      const q = new THREE.Quaternion().setFromUnitVectors(mapping.normals[i], WORLD_UP);
      // ~8deg wobble about a horizontal axis: still unambiguously face i up.
      const wobble = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        (8 * Math.PI) / 180
      );
      q.premultiply(wobble);
      expect(detectUpFace(mapping, q).face).toBe(i + 1);
    }
  });

  /**
   * Regression anchor. The die at its identity (un-rotated) rest pose resolves
   * to a fixed number. This documents the deterministic outcome that produced
   * the original "always the same face" behavior: with zero imparted spin the
   * simulation is deterministic, so identity == that face. Landing variety must
   * come from user-imparted velocity, NOT from changing this mapping. If a
   * refactor silently changes this number, that is a real behavior change.
   */
  it('resolves the identity rest pose to a stable, documented face', () => {
    const a = detectUpFace(mapping, new THREE.Quaternion());
    const b = detectUpFace(mapping, new THREE.Quaternion());
    expect(a.face).toBe(b.face);
    expect(a.face).toBe(1);
  });
});
