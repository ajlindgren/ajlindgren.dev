import { parseFrontmatter } from '../../../lib/frontmatter';

/**
 * Face 3 content loader — pure, dependency-free, unit-testable.
 *
 * The room's honesty is load-bearing: every book exposes exactly four fields —
 * what it was, the constraint that actually stopped it, the one thing it
 * taught, and (optionally) the dates it lived between. The Patron fills these
 * in markdown frontmatter; this module turns raw markdown into typed data.
 */

export type Book = {
  /** Stable id derived from the filename — used as a keyed-each key. */
  id: string;
  /** The project's name (the spine label). */
  title: string;
  /** One line — what it was. */
  what: string;
  /** The constraint that ACTUALLY stopped it. Required; '' triggers the UI fallback. */
  constraint: string;
  /** The one thing building it taught. Required. */
  taught: string;
  /** Optional YYYY-MM it was started. '' when unrecorded. */
  started: string;
  /** Optional YYYY-MM it was abandoned. '' when unrecorded. */
  abandoned: string;
  /** Optional shelf position; unset books sort after ordered ones, then by filename. */
  order: number;
};

export type SomedayCard = {
  title: string;
  /** One line — read, never borrowed. */
  note: string;
};

export type Someday = {
  title: string;
  cards: SomedayCard[];
};

/**
 * A book with a blank constraint violates the room's premise. Rather than hide
 * the field, the page shows this so the omission is visible and honest.
 */
export const CONSTRAINT_FALLBACK = '(constraint not recorded)';

export function displayConstraint(constraint: string): string {
  return constraint.trim() ? constraint : CONSTRAINT_FALLBACK;
}

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

export function toBook(path: string, raw: string): Book {
  const { data } = parseFrontmatter(raw);
  const id = path.split('/').pop()?.replace(/\.md$/, '') ?? path;
  const rawOrder = (data.order ?? '').trim();
  const parsedOrder = Number(rawOrder);
  return {
    id,
    title: data.title ?? '',
    what: data.what ?? '',
    constraint: data.constraint ?? '',
    taught: data.taught ?? '',
    started: data.started ?? '',
    abandoned: data.abandoned ?? '',
    order: rawOrder !== '' && Number.isFinite(parsedOrder) ? parsedOrder : Number.POSITIVE_INFINITY
  };
}

/**
 * Build the shelf from a map of `path -> raw markdown`. Adding or removing a
 * `.md` file changes the room with zero code edits. Ordered books come first
 * (by `order`), with filename as the stable tiebreak.
 */
export function parseBooks(files: Record<string, string>): Book[] {
  return Object.entries(files)
    .map(([path, raw]) => [path, toBook(path, raw)] as const)
    .sort((a, b) => (a[1].order !== b[1].order ? a[1].order - b[1].order : a[0].localeCompare(b[0])))
    .map(([, book]) => book);
}

/**
 * Parse the `someday` drawer. The cards live in a small YAML list under
 * `cards:` in frontmatter; the shared flat frontmatter reader can't express a
 * list-of-objects, so this walks the fenced block directly (still zero-dep).
 */
export function parseSomeday(raw: string): Someday {
  const { data } = parseFrontmatter(raw);
  return {
    title: data.title ?? 'Someday',
    cards: parseCards(raw)
  };
}

function parseCards(raw: string): SomedayCard[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const cards: SomedayCard[] = [];
  let inFence = false;
  let inCards = false;
  let current: SomedayCard | null = null;

  for (const line of lines) {
    if (/^---\s*$/.test(line)) {
      if (!inFence) {
        inFence = true;
        continue;
      }
      break; // closing fence — done with frontmatter
    }
    if (!inFence) continue;

    if (/^cards:\s*$/.test(line)) {
      inCards = true;
      continue;
    }
    // A new top-level key ends the cards block.
    if (inCards && /^\S/.test(line) && !/^-/.test(line)) {
      inCards = false;
    }
    if (!inCards) continue;

    const dash = line.match(/^\s*-\s*(.*)$/);
    if (dash) {
      if (current) cards.push(current);
      current = { title: '', note: '' };
      applyField(current, dash[1]);
      continue;
    }
    if (current && /^\s+\S/.test(line)) {
      applyField(current, line.trim());
    }
  }
  if (current) cards.push(current);
  return cards.filter((c) => c.title || c.note);
}

function applyField(card: SomedayCard, text: string): void {
  const sep = text.indexOf(':');
  if (sep === -1) return;
  const key = text.slice(0, sep).trim();
  const value = unquote(text.slice(sep + 1).trim());
  if (key === 'title') card.title = value;
  else if (key === 'note') card.note = value;
}
