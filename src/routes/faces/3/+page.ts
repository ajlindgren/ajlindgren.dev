import { parseFrontmatter } from '$lib/frontmatter';
import somedayRaw from './someday.md?raw';
import type { PageLoad } from './$types';

export type Book = {
  /** Stable id derived from the filename, used as a keyed-each key. */
  id: string;
  title: string;
  year: string;
  /** The constraint that actually stopped it — the page's dominant field. */
  constraint: string;
  lesson: string;
  /** Blank-line-separated paragraphs of the honest page. */
  paragraphs: string[];
};

export type Someday = {
  title: string;
  /** Read-only idea titles. No pull/borrow affordance is ever offered. */
  ideas: string[];
};

// Eagerly gather every book as a raw string at build time. An empty folder
// simply yields no books rather than an error.
const bookFiles = import.meta.glob('./books/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

function toBook(path: string, raw: string): Book {
  const { data, body } = parseFrontmatter(raw);
  const id = path.split('/').pop()?.replace(/\.md$/, '') ?? path;
  return {
    id,
    title: data.title ?? '',
    year: data.year ?? '',
    constraint: data.constraint ?? '',
    lesson: data.lesson ?? '',
    paragraphs: body ? body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : []
  };
}

function parseSomeday(raw: string): Someday {
  const { data, body } = parseFrontmatter(raw);
  const ideas = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return { title: data.title ?? 'Someday', ideas };
}

export const load: PageLoad = () => {
  const books = Object.entries(bookFiles)
    // Sort by filename so 01-…, 02-… render in authored order.
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, raw]) => toBook(path, raw));

  return {
    books,
    someday: parseSomeday(somedayRaw)
  };
};
