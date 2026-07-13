import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { estimateFlickVelocity, type PointerSample } from './grab';

describe('estimateFlickVelocity', () => {
  const out = new THREE.Vector3();

  it('returns zero when there are fewer than two samples', () => {
    expect(estimateFlickVelocity([], 0, 100, out).length()).toBe(0);
    estimateFlickVelocity([{ t: 0, x: 1, y: 2, z: 3 }], 0, 100, out);
    expect(out.length()).toBe(0);
  });

  it('computes velocity as displacement over elapsed seconds', () => {
    const history: PointerSample[] = [
      { t: 0, x: 0, y: 0, z: 0 },
      { t: 100, x: 1, y: 0, z: -2 }
    ];
    // 0.1s elapsed → 1 unit in x is 10 u/s, -2 in z is -20 u/s.
    estimateFlickVelocity(history, 100, 200, out);
    expect(out.x).toBeCloseTo(10, 5);
    expect(out.z).toBeCloseTo(-20, 5);
  });

  it('drops samples older than the window before estimating', () => {
    const history: PointerSample[] = [
      { t: 0, x: 0, y: 0, z: 0 }, // stale, should be trimmed
      { t: 900, x: 5, y: 0, z: 0 },
      { t: 1000, x: 6, y: 0, z: 0 }
    ];
    estimateFlickVelocity(history, 1000, 100, out);
    // Only the last two remain: 1 unit over 0.1s = 10 u/s.
    expect(out.x).toBeCloseTo(10, 5);
    expect(history).toHaveLength(2);
  });
});
