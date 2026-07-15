import { describe, it, expect } from 'vitest';
import { FACES, FACE_NUMBERS, ROMAN, isFaceNumber } from './faces';

describe('faces data model', () => {
  it('has an entry for every face number', () => {
    for (const n of FACE_NUMBERS) {
      expect(FACES[n]).toBeDefined();
    }
  });

  it('gives every face a non-empty canonical title and tagline', () => {
    for (const n of FACE_NUMBERS) {
      expect(FACES[n].title.trim().length).toBeGreaterThan(0);
      expect(FACES[n].tagline.trim().length).toBeGreaterThan(0);
    }
  });

  it('carries the canonical twelve titles from the seed doc', () => {
    expect(FACES[1].title).toBe('The Orrery of Working Parts');
    expect(FACES[6].title).toBe('The Vault of Sound Money');
    expect(FACES[11].title).toBe('The Lighthouse at the Edge of the Map');
    expect(FACES[12].title).toBe('The Hall of Twelve Doors');
  });

  it('keeps route pointing at the matching face page', () => {
    for (const n of FACE_NUMBERS) {
      expect(FACES[n].route).toBe(`/faces/${n}`);
    }
  });

  it('exposes a Roman numeral for each face', () => {
    expect(ROMAN[1]).toBe('I');
    expect(ROMAN[4]).toBe('IV');
    expect(ROMAN[9]).toBe('IX');
    expect(ROMAN[12]).toBe('XII');
    for (const n of FACE_NUMBERS) {
      expect(ROMAN[n].trim().length).toBeGreaterThan(0);
    }
  });

  it('still validates face numbers', () => {
    expect(isFaceNumber(1)).toBe(true);
    expect(isFaceNumber(12)).toBe(true);
    expect(isFaceNumber(0)).toBe(false);
    expect(isFaceNumber(13)).toBe(false);
    expect(isFaceNumber(3.5)).toBe(false);
  });
});
