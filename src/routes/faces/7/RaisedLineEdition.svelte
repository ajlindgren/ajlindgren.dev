<script lang="ts">
  // The information-equivalent, non-visual "raised-line edition" of a chart.
  // Rendered with a native <details>/<summary> so it is SSR-present and works
  // with JavaScript and CSS switched off. It transcribes the exact same
  // Feature[] the SVG draws — one line per feature — so a screen-reader or a
  // no-CSS reader receives the complete map, not a summary.
  import type { Feature } from './+page';
  import { buildRaisedLine } from './charts';

  let { features, place }: { features: Feature[]; place: string } = $props();

  let lines = $derived(buildRaisedLine(features));
</script>

<details class="raised-line">
  <summary>Raised-line edition — read this chart as text</summary>
  <p class="intro">
    The tactile edition of {place}. Every feature on the visual chart is listed
    below with its kind and grid position.
  </p>
  <ol class="features">
    {#each features as f, i (f.id)}
      <li>{lines[i]}</li>
    {/each}
  </ol>
  {#if features.length === 0}
    <p class="empty">This survey is still blank — no features have emerged yet.</p>
  {/if}
</details>

<style>
  .raised-line {
    margin-top: 0.75rem;
    border: 1px solid #4a341a;
    border-radius: 4px;
    background: #17100a;
    padding: 0.4rem 0.75rem;
  }
  summary {
    cursor: pointer;
    color: var(--accent);
    font-size: 0.85rem;
    letter-spacing: 0.04em;
  }
  summary:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .intro {
    margin: 0.6rem 0 0.4rem;
    font-size: 0.82rem;
    color: #b7a582;
    font-style: italic;
  }
  .features {
    margin: 0;
    padding-left: 1.4rem;
    color: #d8ceb8;
    font-size: 0.85rem;
    line-height: 1.5;
  }
  .empty {
    margin: 0.4rem 0 0;
    font-size: 0.82rem;
    color: #9c8c6d;
  }
</style>
