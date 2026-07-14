import { parseBooks, parseSomeday } from './books';
import somedayRaw from './someday.md?raw';
import type { PageLoad } from './$types';

// Re-exported so the component can `import type { Book } from './+page'`.
export type { Book, Someday, SomedayCard } from './books';

// Eagerly gather every book as a raw string at build time. An empty folder
// simply yields no books rather than an error — adding or removing a `.md`
// changes the room with zero code edits.
const bookFiles = import.meta.glob('./books/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

export const load: PageLoad = () => ({
  books: parseBooks(bookFiles),
  someday: parseSomeday(somedayRaw)
});
