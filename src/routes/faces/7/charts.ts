import { parseFrontmatter } from '../../../lib/frontmatter';

/**
 * Face 7 content + refinement engine — pure, dependency-free, unit-testable.
 *
 * The attic's premise: a chart of a place that does not exist yet grows more
 * detailed the closer "now" creeps to the place's target date. Refinement is a
 * *pure function of `(seed, now, target)`* — there is no hidden randomness, so
 * identical inputs always yield identical maps. The visual SVG and the
 * non-visual "raised-line edition" both render from the SAME `deriveFeatures()`
 * output, so their information content is equivalent by construction (and the
 * tests enforce it).
 */

/** The three kinds of not-yet-existent place a chart can depict. */
export type MapKind = 'coastline' | 'city' | 'civilisation';

const MAP_KINDS: readonly MapKind[] = ['coastline', 'city', 'civilisation'];

export function isMapKind(value: string): value is MapKind {
  return (MAP_KINDS as readonly string[]).includes(value);
}

/** A single mapped feature. Positions are in a unit square [0,1]×[0,1]. */
export type Feature = {
  /** Stable within a chart — used as a keyed-each key. */
  id: string;
  /** The feature's proper name (e.g. "Verdant Bay"). */
  name: string;
  /** What kind of thing it is (e.g. "bay", "tower"). */
  kind: string;
  /** Horizontal position, 0 (west) → 1 (east). */
  x: number;
  /** Vertical position, 0 (north) → 1 (south). */
  y: number;
  /** The detail tier at which this feature first emerges. */
  emergesAt: number;
};

/** A seeded chart definition, parsed from a `maps/*.md` file. */
export type Chart = {
  /** Stable id derived from the filename. */
  id: string;
  /** The chart's display title. */
  title: string;
  /** The name of the not-yet-existent place. */
  place: string;
  /** Integer seed driving the deterministic feature derivation. */
  seed: number;
  /** Epoch ms the survey began (proximity lower bound). */
  from: number;
  /** Epoch ms the place is projected to exist (proximity upper bound). */
  target: number;
  /** Which vocabulary/geometry pool the features are drawn from. */
  kind: MapKind;
};

/** The coarsest→finest detail tiers a chart can reach. */
export const MAX_DETAIL = 5;
/** Features present at the coarsest tier (0). */
const MIN_FEATURES = 3;
/** New features unlocked per detail tier. */
const PER_LEVEL = 2;
/** Hard cap on features drawn, so a fully-refined SVG stays cheap. */
export const MAX_FEATURES = MIN_FEATURES + PER_LEVEL * MAX_DETAIL;

/**
 * A tiny, integer-only hash from string → uint32. Deterministic across engines
 * (no floats), so a place name always yields the same seed. FNV-1a style.
 */
export function seedFromString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // 32-bit FNV prime multiply, kept in uint32 via Math.imul.
    h = Math.imul(h, 0x01000193);
  }
  // Force to an unsigned 32-bit integer.
  return h >>> 0;
}

/**
 * `mulberry32` — a compact, fast, well-distributed 32-bit PRNG. Integer math
 * only until the final normalisation, so its sequence is identical on every JS
 * engine. Returns a function yielding floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * How near `now` is to a place's existence, on [0, 1].
 * 0 at (or before) the survey start, 1 at (or after) the target. A degenerate
 * or inverted window collapses to a step function at the target.
 */
export function proximity(now: number, from: number, target: number): number {
  if (!(target > from)) {
    return now >= target ? 1 : 0;
  }
  const r = (now - from) / (target - from);
  if (r <= 0) return 0;
  if (r >= 1) return 1;
  return r;
}

/**
 * Map a proximity ratio to a discrete detail tier 0..MAX_DETAIL. Monotonic
 * non-decreasing in `r`, so a chart never loses detail as time passes.
 */
export function detailLevel(r: number): number {
  const clamped = r <= 0 ? 0 : r >= 1 ? 1 : r;
  return Math.min(MAX_DETAIL, Math.floor(clamped * MAX_DETAIL));
}

/** Feature count revealed at a given tier, capped for performance. */
export function featureCount(level: number): number {
  const lvl = Math.max(0, Math.min(MAX_DETAIL, level));
  return Math.min(MAX_FEATURES, MIN_FEATURES + PER_LEVEL * lvl);
}

// Per-kind pools. Feature *types* differ by geography; the descriptive word
// pools are shared so names read consistently across kinds.
const KIND_TYPES: Record<MapKind, readonly string[]> = {
  coastline: ['bay', 'cape', 'inlet', 'shoal', 'isle', 'strait', 'reef', 'sound'],
  city: ['plaza', 'quarter', 'tower', 'bridge', 'market', 'gate', 'terrace', 'canal'],
  civilisation: ['settlement', 'road', 'temple', 'field', 'mine', 'border', 'well', 'grove']
};

const ADJECTIVES: readonly string[] = [
  'Verdant',
  'Hollow',
  'Amber',
  'Quiet',
  'Distant',
  'Salt',
  'Iron',
  'Pale',
  'Wandering',
  'Sunken',
  'Bright',
  'Forgotten'
];

const NOUNS: readonly string[] = [
  'Harbour',
  'Ridge',
  'Meadow',
  'Hollow',
  'Reach',
  'Crossing',
  'Watch',
  'Hearth',
  'Anchor',
  'Vale',
  'Spire',
  'Ford'
];

function pick<T>(pool: readonly T[], rng: () => number): T {
  return pool[Math.floor(rng() * pool.length)];
}

/** The detail tier at which the feature at index `i` first appears. */
function emergesAtIndex(i: number): number {
  if (i < MIN_FEATURES) return 0;
  return Math.ceil((i - MIN_FEATURES + 1) / PER_LEVEL);
}

/**
 * Derive the ordered, deterministic feature set visible at a detail `level`.
 *
 * The full sequence up to MAX_FEATURES is generated from the seed in a fixed
 * order; the visible set is a prefix of that sequence. Because it is always a
 * prefix, features(level) ⊆ features(level+1) — detail only ever accretes, and
 * the same seed/level/kind always yields byte-identical output.
 */
export function deriveFeatures(seed: number, level: number, kind: MapKind = 'coastline'): Feature[] {
  const rng = mulberry32(seed);
  const types = KIND_TYPES[kind];
  const all: Feature[] = [];
  for (let i = 0; i < MAX_FEATURES; i++) {
    const type = pick(types, rng);
    const adj = pick(ADJECTIVES, rng);
    const noun = pick(NOUNS, rng);
    const x = rng();
    const y = rng();
    all.push({
      id: `f${i}`,
      name: `${adj} ${noun}`,
      kind: type,
      x,
      y,
      emergesAt: emergesAtIndex(i)
    });
  }
  return all.slice(0, featureCount(level));
}

/** Column letters A.. and rows 1.. for a human-readable grid reference. */
export function gridRef(x: number, y: number): string {
  const cols = 'ABCDEFGH';
  const col = cols[Math.min(cols.length - 1, Math.max(0, Math.floor(x * cols.length)))];
  const row = Math.min(8, Math.max(1, Math.floor(y * 8) + 1));
  return `${col}${row}`;
}

/**
 * Render the *information-equivalent* non-visual edition of a feature set:
 * one plain-text line per feature naming it, its kind, and its grid position.
 * Fed the exact same `Feature[]` the SVG draws, so it is a complete transcript
 * of the visual map — never a summary.
 */
export function buildRaisedLine(features: Feature[]): string[] {
  return features.map(
    (f) => `${f.name} — a ${f.kind} at grid ${gridRef(f.x, f.y)} (detail ${f.emergesAt})`
  );
}

function parseSeed(raw: string): number {
  const trimmed = raw.trim();
  const asNumber = Number(trimmed);
  if (trimmed !== '' && Number.isFinite(asNumber)) {
    return Math.abs(Math.trunc(asNumber)) >>> 0;
  }
  return seedFromString(trimmed);
}

/** Parse a `YYYY-MM` / `YYYY-MM-DD` date to epoch ms, or NaN. */
function parseDate(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === '') return Number.NaN;
  return Date.parse(trimmed);
}

export function toChart(path: string, raw: string): Chart {
  const { data } = parseFrontmatter(raw);
  const id = path.split('/').pop()?.replace(/\.md$/, '') ?? path;
  const kindRaw = (data.kind ?? '').trim();
  const from = parseDate(data.from ?? '');
  const target = parseDate(data.target ?? '');
  return {
    id,
    title: data.title ?? '',
    place: data.place ?? '',
    seed: parseSeed(data.seed ?? id),
    from: Number.isFinite(from) ? from : 0,
    target: Number.isFinite(target) ? target : 0,
    kind: isMapKind(kindRaw) ? kindRaw : 'coastline'
  };
}

/**
 * Build the attic's charts from a map of `path -> raw markdown`. Adding or
 * removing a `.md` file changes the room with zero code edits; charts are
 * ordered by filename for a stable gallery.
 */
export function parseCharts(files: Record<string, string>): Chart[] {
  return Object.entries(files)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([path, raw]) => toChart(path, raw));
}
