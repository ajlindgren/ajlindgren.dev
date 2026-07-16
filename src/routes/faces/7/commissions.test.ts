import { describe, it, expect } from 'vitest';
import { createCommission, toChart, serialize, parse } from './commissions';
import { seedFromString } from './charts';

describe('createCommission', () => {
  it('derives the seed deterministically from the (trimmed) name', () => {
    const a = createCommission('Verdant Bay', '2030-01', 1000);
    const b = createCommission('  Verdant Bay  ', '2030-01', 1000);
    expect(a?.seed).toBe(seedFromString('Verdant Bay'));
    expect(b?.seed).toBe(seedFromString('Verdant Bay'));
    expect(a?.seed).toBe(b?.seed);
  });

  it('captures now as the survey start and parses the target date', () => {
    const c = createCommission('The Sunken City', '2040-06-01', 12345, 'city');
    expect(c).not.toBeNull();
    expect(c?.from).toBe(12345);
    expect(c?.target).toBe(Date.parse('2040-06-01'));
    expect(c?.kind).toBe('city');
    expect(c?.name).toBe('The Sunken City');
  });

  it('accepts a numeric epoch target directly', () => {
    const c = createCommission('X', 999999, 0);
    expect(c?.target).toBe(999999);
  });

  it('rejects an empty name or an unparseable target', () => {
    expect(createCommission('   ', '2030-01', 0)).toBeNull();
    expect(createCommission('Somewhere', 'not-a-date', 0)).toBeNull();
  });
});

describe('toChart', () => {
  it('maps a commission onto the shared Chart shape', () => {
    const c = createCommission('Amber Reach', '2035-01', 500, 'civilisation');
    const chart = toChart(c!);
    expect(chart).toMatchObject({
      id: c!.id,
      title: 'Amber Reach',
      place: 'Amber Reach',
      seed: c!.seed,
      from: 500,
      target: c!.target,
      kind: 'civilisation'
    });
  });
});

describe('serialize / parse round-trip', () => {
  it('preserves a list of commissions', () => {
    const list = [
      createCommission('Verdant Bay', '2030-01', 1000)!,
      createCommission('Iron Ford', '2031-01', 2000, 'city')!
    ];
    expect(parse(serialize(list))).toEqual(list);
  });

  it('tolerates missing, empty, and malformed input', () => {
    expect(parse(null)).toEqual([]);
    expect(parse(undefined)).toEqual([]);
    expect(parse('')).toEqual([]);
    expect(parse('{ not json')).toEqual([]);
    expect(parse('{"not":"an array"}')).toEqual([]);
  });

  it('drops individual invalid entries but keeps valid ones', () => {
    const good = createCommission('Good Place', '2030-01', 1000)!;
    const raw = JSON.stringify([good, { name: 'no seed' }, 42, null]);
    expect(parse(raw)).toEqual([good]);
  });
});
