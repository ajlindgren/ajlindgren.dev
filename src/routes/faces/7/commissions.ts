import { seedFromString, isMapKind, type Chart, type MapKind } from './charts';

/**
 * Commissions — a visitor asks the attic for a chart of any possible-future
 * place. A commission is pure data: a name, a target date, and the seed derived
 * from the name. It renders through the exact same refinement math as the
 * seeded maps, so a commissioned chart grows more detailed as `now → target`
 * just like the built-in ones. `localStorage` access lives in the component;
 * everything here is pure and testable.
 */
export type Commission = {
  /** Stable id (seed + target), unique enough for a keyed-each. */
  id: string;
  /** The place the visitor named. */
  name: string;
  /** Epoch ms the survey began (when it was commissioned). */
  from: number;
  /** Epoch ms the place is projected to exist. */
  target: number;
  /** Seed derived deterministically from the name. */
  seed: number;
  /** Which vocabulary/geometry pool to draw from. */
  kind: MapKind;
};

function toMillis(target: number | string): number {
  if (typeof target === 'number') return target;
  const parsed = Date.parse(target);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/**
 * Create a commission from a place name and target date. The seed is derived
 * purely from the (trimmed) name, so commissioning "Verdant Bay" always yields
 * the same chart. Returns null when the inputs are unusable (empty name or an
 * unparseable / non-future-window target).
 */
export function createCommission(
  name: string,
  target: number | string,
  now: number,
  kind: MapKind = 'coastline'
): Commission | null {
  const trimmed = name.trim();
  const targetMs = toMillis(target);
  if (trimmed === '' || !Number.isFinite(targetMs)) return null;
  const seed = seedFromString(trimmed);
  return {
    id: `c-${seed}-${targetMs}`,
    name: trimmed,
    from: now,
    target: targetMs,
    seed,
    kind
  };
}

/** A commission renders through the shared `Chart` shape. */
export function toChart(commission: Commission): Chart {
  return {
    id: commission.id,
    title: commission.name,
    place: commission.name,
    seed: commission.seed,
    from: commission.from,
    target: commission.target,
    kind: commission.kind
  };
}

/** Serialise a list of commissions for `localStorage`. */
export function serialize(commissions: Commission[]): string {
  return JSON.stringify(commissions);
}

function isValid(value: unknown): value is Commission {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.from === 'number' &&
    Number.isFinite(c.from) &&
    typeof c.target === 'number' &&
    Number.isFinite(c.target) &&
    typeof c.seed === 'number' &&
    Number.isFinite(c.seed) &&
    typeof c.kind === 'string' &&
    isMapKind(c.kind)
  );
}

/**
 * Parse a `localStorage` string back into commissions, tolerating any garbage:
 * malformed JSON or invalid entries yield an empty list rather than throwing,
 * so a corrupt store never breaks the room.
 */
export function parse(raw: string | null | undefined): Commission[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isValid);
}
