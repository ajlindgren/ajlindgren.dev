import { describe, it, expect } from 'vitest';
import {
  toBook,
  parseBooks,
  parseSomeday,
  displayConstraint,
  CONSTRAINT_FALLBACK
} from './books';

const book = (fm: string) => toBook('./books/01-book.md', `---\n${fm}\n---\nbody ignored\n`);

describe('toBook', () => {
  it('maps the four honest fields plus dates', () => {
    const b = book(
      [
        'title: "Ledger"',
        'what: "A double-entry accounting toy"',
        'constraint: "I never found a real user"',
        'taught: "Ledgers are social, not technical"',
        'started: "2019-03"',
        'abandoned: "2020-01"',
        'order: 2'
      ].join('\n')
    );
    expect(b).toMatchObject({
      title: 'Ledger',
      what: 'A double-entry accounting toy',
      constraint: 'I never found a real user',
      taught: 'Ledgers are social, not technical',
      started: '2019-03',
      abandoned: '2020-01',
      order: 2
    });
  });

  it('derives a stable id from the filename', () => {
    expect(toBook('./books/03-thing.md', '---\ntitle: X\n---').id).toBe('03-thing');
  });

  it('degrades missing optional fields to empty strings', () => {
    const b = book('title: "Bare"\nconstraint: "c"\ntaught: "t"');
    expect(b.what).toBe('');
    expect(b.started).toBe('');
    expect(b.abandoned).toBe('');
  });

  it('treats an unset or non-numeric order as last', () => {
    expect(book('title: "A"').order).toBe(Number.POSITIVE_INFINITY);
    expect(book('title: "A"\norder: "soon"').order).toBe(Number.POSITIVE_INFINITY);
  });

  it('preserves a blank constraint rather than dropping the field', () => {
    expect(book('title: "A"\nconstraint: ""\ntaught: "t"').constraint).toBe('');
  });
});

describe('displayConstraint', () => {
  it('returns the constraint when present', () => {
    expect(displayConstraint('ran out of time')).toBe('ran out of time');
  });
  it('shows a visible fallback when blank', () => {
    expect(displayConstraint('')).toBe(CONSTRAINT_FALLBACK);
    expect(displayConstraint('   ')).toBe(CONSTRAINT_FALLBACK);
  });
});

describe('parseBooks', () => {
  it('sorts by order, then filename, and is content-driven', () => {
    const files = {
      './books/09-late.md': '---\ntitle: "Late"\norder: 3\n---',
      './books/01-early.md': '---\ntitle: "Early"\norder: 1\n---',
      './books/05-unset.md': '---\ntitle: "Unset"\n---',
      './books/02-also-unset.md': '---\ntitle: "AlsoUnset"\n---'
    };
    expect(parseBooks(files).map((b) => b.title)).toEqual(['Early', 'Late', 'AlsoUnset', 'Unset']);
  });

  it('yields an empty shelf for an empty folder', () => {
    expect(parseBooks({})).toEqual([]);
  });
});

describe('parseSomeday', () => {
  it('reads the drawer title and title/note cards from frontmatter', () => {
    const raw = [
      '---',
      'title: "Someday"',
      'cards:',
      '  - title: "A compiler"',
      '    note: "For a language I keep sketching"',
      '  - title: "A garden log"',
      '    note: "If I ever keep a garden"',
      '---'
    ].join('\n');
    const s = parseSomeday(raw);
    expect(s.title).toBe('Someday');
    expect(s.cards).toEqual([
      { title: 'A compiler', note: 'For a language I keep sketching' },
      { title: 'A garden log', note: 'If I ever keep a garden' }
    ]);
  });

  it('defaults the title and yields no cards when absent', () => {
    expect(parseSomeday('---\n---')).toEqual({ title: 'Someday', cards: [] });
  });
});
