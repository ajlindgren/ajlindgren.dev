import { parseCharts } from './charts';
import type { PageLoad } from './$types';

// Re-exported so components can `import type { Chart } from './+page'`.
export type { Chart, Feature, MapKind } from './charts';

// Eagerly gather every seeded map as a raw string at build time. Adding or
// removing a `.md` under maps/ changes the attic with zero code edits.
const mapFiles = import.meta.glob('./maps/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

export const load: PageLoad = () => ({
  charts: parseCharts(mapFiles),
  // The moment the page was rendered. SSR captures one stable `now` so the
  // first paint is deterministic (no hydration mismatch); a browser-only
  // $effect then refines against the live clock post-mount.
  now: Date.now()
});
