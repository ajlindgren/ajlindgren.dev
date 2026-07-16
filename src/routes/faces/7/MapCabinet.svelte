<script lang="ts">
  // One roll cabinet: a single chart of a not-yet-existent place. It computes
  // its own refinement from `(seed, now, target)` — proximity → detail tier →
  // features — and renders the visual map, its orientation region, and the
  // information-equivalent raised-line drawer from the SAME feature set.
  import type { Chart } from './+page';
  import { proximity, detailLevel, deriveFeatures, MAX_DETAIL } from './charts';
  import MapChart from './MapChart.svelte';
  import CompassRose from './CompassRose.svelte';
  import RaisedLineEdition from './RaisedLineEdition.svelte';

  let { chart, now }: { chart: Chart; now: number } = $props();

  let r = $derived(proximity(now, chart.from, chart.target));
  let level = $derived(detailLevel(r));
  let features = $derived(deriveFeatures(chart.seed, level, chart.kind));

  const fmtDate = (ms: number) =>
    Number.isFinite(ms) && ms > 0
      ? new Date(ms).toISOString().slice(0, 7)
      : 'unknown';
  let pct = $derived(Math.round(r * 100));
</script>

<article class="cabinet">
  <header class="cabinet-head">
    <h2>{chart.title || chart.place || chart.id}</h2>
    {#if chart.place}
      <p class="place">{chart.place}</p>
    {/if}
    <p class="survey" aria-label={`Survey ${pct} percent complete, detail tier ${level} of ${MAX_DETAIL}`}>
      Projected to exist by <strong>{fmtDate(chart.target)}</strong> ·
      survey {pct}% · detail {level}/{MAX_DETAIL}
    </p>
  </header>

  <div class="sheet-wrap" style={`--refine: ${r}`}>
    <MapChart {features} kind={chart.kind} />
  </div>

  <CompassRose label={`Orientation for ${chart.title || chart.place || chart.id}`} />
  <RaisedLineEdition {features} place={chart.title || chart.place || chart.id} />
</article>

<style>
  .cabinet {
    display: flex;
    flex-direction: column;
    padding: 1rem 1.1rem 1.2rem;
    border: 1px solid #3a2713;
    border-radius: 4px;
    background: linear-gradient(180deg, #2a1c0d 0%, #1a1108 100%);
    box-shadow: 0 14px 24px -18px rgba(0, 0, 0, 0.9);
  }
  .cabinet-head h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: normal;
    letter-spacing: 0.06em;
    color: var(--fg);
  }
  .place {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    color: #cdbfa4;
    font-style: italic;
  }
  .survey {
    margin: 0.4rem 0 0.75rem;
    font-size: 0.8rem;
    color: #b7a582;
  }
  .survey strong {
    color: var(--accent);
    font-weight: 600;
  }
  .sheet-wrap {
    /* More refined charts render at fuller opacity — a gentle "developing"
       effect. Opacity floors at 0.55 so a sparse map is never invisible. */
    opacity: calc(0.55 + 0.45 * var(--refine));
    transition: opacity 0.6s ease;
  }
  @media (prefers-reduced-motion: reduce) {
    .sheet-wrap {
      transition: none;
      /* No motion-based reveal: reduced-motion users always see the map fully. */
      opacity: 1;
    }
  }
</style>
