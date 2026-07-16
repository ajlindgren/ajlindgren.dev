import { describe, it, expect } from 'vitest';
import {
  seedFromString,
  mulberry32,
  proximity,
  detailLevel,
  featureCount,
  deriveFeatures,
  buildRaisedLine,
  gridRef,
  toChart,
  parseCharts,
  MAX_DETAIL,
  MAX_FEATURES
} from './charts';

describe('seedFromString', () => {
  it('is deterministic for the same input', () => {
    expect(seedFromString('Verdant Bay')).toBe(seedFromString('Verdant Bay'));
  });

  it('matches committed vectors (cross-engine integer math)', () => {
    expect(seedFromString('Verdant Bay')).toBe(4210856507);
    expect(seedFromString('')).toBe(2166136261);
  });

  it('distinguishes different strings', () => {
    expect(seedFromString('Verdant Bay')).not.toBe(seedFromString('Verdant Bays'));
  });

  it('always returns an unsigned 32-bit integer', () => {
    for (const s of ['a', 'The Sunken City', 'x'.repeat(200)]) {
      const v = seedFromString(s);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe('mulberry32', () => {
  it('reproduces a committed sequence for a fixed seed', () => {
    const rng = mulberry32(12345);
    const seq = [rng(), rng(), rng(), rng(), rng()];
    expect(seq[0]).toBeCloseTo(0.9797282677609473, 12);
    expect(seq[1]).toBeCloseTo(0.3067522644996643, 12);
    expect(seq[2]).toBeCloseTo(0.484205421525985, 12);
    expect(seq[3]).toBeCloseTo(0.817934412509203, 12);
    expect(seq[4]).toBeCloseTo(0.5094283693470061, 12);
  });

  it('yields identical streams from two instances of the same seed', () => {
    const a = mulberry32(99);
    const b = mulberry32(99);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it('stays within [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('proximity', () => {
  it('clamps to 0 at or before the survey start', () => {
    expect(proximity(0, 100, 200)).toBe(0);
    expect(proximity(100, 100, 200)).toBe(0);
  });

  it('clamps to 1 at or after the target', () => {
    expect(proximity(200, 100, 200)).toBe(1);
    expect(proximity(999, 100, 200)).toBe(1);
  });

  it('interpolates linearly in between', () => {
    expect(proximity(150, 100, 200)).toBeCloseTo(0.5, 12);
    expect(proximity(125, 100, 200)).toBeCloseTo(0.25, 12);
  });

  it('collapses a degenerate or inverted window to a step at the target', () => {
    expect(proximity(50, 100, 100)).toBe(0);
    expect(proximity(100, 100, 100)).toBe(1);
    expect(proximity(150, 200, 100)).toBe(1);
  });
});

describe('detailLevel', () => {
  it('is 0 at the start and MAX_DETAIL at the end', () => {
    expect(detailLevel(0)).toBe(0);
    expect(detailLevel(1)).toBe(MAX_DETAIL);
  });

  it('never decreases as proximity grows', () => {
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const lvl = detailLevel(i / 100);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });

  it('stays within bounds for out-of-range input', () => {
    expect(detailLevel(-5)).toBe(0);
    expect(detailLevel(5)).toBe(MAX_DETAIL);
  });
});

describe('deriveFeatures', () => {
  it('is fully deterministic for identical inputs', () => {
    expect(deriveFeatures(4210856507, 3, 'coastline')).toEqual(
      deriveFeatures(4210856507, 3, 'coastline')
    );
  });

  it('grows monotonically — each tier is a prefix of the next', () => {
    let prevLen = -1;
    for (let level = 0; level <= MAX_DETAIL; level++) {
      const lower = deriveFeatures(555, level, 'city');
      const higher = deriveFeatures(555, Math.min(MAX_DETAIL, level + 1), 'city');
      // Length never shrinks…
      expect(lower.length).toBeGreaterThanOrEqual(prevLen);
      prevLen = lower.length;
      // …and the coarser set is exactly the prefix of the finer one.
      expect(higher.slice(0, lower.length)).toEqual(lower);
    }
  });

  it('caps features at MAX_FEATURES and matches featureCount', () => {
    expect(deriveFeatures(1, MAX_DETAIL).length).toBe(MAX_FEATURES);
    for (let level = 0; level <= MAX_DETAIL; level++) {
      expect(deriveFeatures(1, level).length).toBe(featureCount(level));
    }
  });

  it('keeps every position within the unit square', () => {
    for (const f of deriveFeatures(4210856507, MAX_DETAIL, 'civilisation')) {
      expect(f.x).toBeGreaterThanOrEqual(0);
      expect(f.x).toBeLessThan(1);
      expect(f.y).toBeGreaterThanOrEqual(0);
      expect(f.y).toBeLessThan(1);
    }
  });
});

describe('buildRaisedLine (a11y information-equivalence)', () => {
  it('names every visual feature — the raised-line edition ⊇ the visual map', () => {
    const features = deriveFeatures(4210856507, MAX_DETAIL, 'coastline');
    const text = buildRaisedLine(features).join('\n');
    for (const f of features) {
      expect(text).toContain(f.name);
      expect(text).toContain(f.kind);
      expect(text).toContain(gridRef(f.x, f.y));
    }
  });

  it('emits exactly one line per feature', () => {
    const features = deriveFeatures(1, 2);
    expect(buildRaisedLine(features)).toHaveLength(features.length);
  });
});

describe('toChart / parseCharts', () => {
  const md = (fm: string) => `---\n${fm}\n---\nbody ignored`;

  it('parses frontmatter into a typed chart', () => {
    const c = toChart(
      './maps/01-bay.md',
      md(
        [
          'title: "Verdant Bay"',
          'place: "A coastline that is not yet drawn"',
          'seed: 4210856507',
          'from: "2020-01"',
          'target: "2030-01"',
          'kind: coastline'
        ].join('\n')
      )
    );
    expect(c.id).toBe('01-bay');
    expect(c.title).toBe('Verdant Bay');
    expect(c.seed).toBe(4210856507);
    expect(c.from).toBe(Date.parse('2020-01'));
    expect(c.target).toBe(Date.parse('2030-01'));
    expect(c.kind).toBe('coastline');
  });

  it('derives a seed from a non-numeric seed string', () => {
    const c = toChart('./maps/x.md', md('seed: "Verdant Bay"'));
    expect(c.seed).toBe(seedFromString('Verdant Bay'));
  });

  it('falls back to coastline for an unknown kind', () => {
    expect(toChart('./maps/x.md', md('kind: dreamscape')).kind).toBe('coastline');
  });

  it('orders charts by filename and is content-driven', () => {
    const files = {
      './maps/03-c.md': md('title: "C"'),
      './maps/01-a.md': md('title: "A"'),
      './maps/02-b.md': md('title: "B"')
    };
    expect(parseCharts(files).map((c) => c.title)).toEqual(['A', 'B', 'C']);
    expect(parseCharts({})).toEqual([]);
  });
});
