<script lang="ts">
  // Face 7 — The Cartographer's Attic. A room of self-refining charts of places
  // that do not exist yet. Each cabinet renders a seeded map whose detail is a
  // pure function of (seed, now, target); the commission bench lets a visitor
  // draft a chart of any possible-future place, persisted in localStorage.
  import { untrack } from 'svelte';
  import type { PageProps } from './$types';
  import type { Commission } from './commissions';
  import { parse, serialize, toChart } from './commissions';
  import MapCabinet from './MapCabinet.svelte';
  import CommissionBench from './CommissionBench.svelte';
  import DieCorner from '$lib/components/DieCorner.svelte';

  let { data }: PageProps = $props();

  const STORAGE_KEY = 'face7:commissions';

  // Live "now": SSR captures a stable `data.now` for a deterministic first
  // paint (no hydration mismatch); once mounted in the browser we refine
  // against the live clock and keep ticking so charts develop over time.
  // Deliberate one-time read of the SSR-captured `now` to seed mutable state;
  // the live clock takes over in the $effect below.
  let now = $state(untrack(() => data.now));
  let commissions = $state<Commission[]>([]);

  $effect(() => {
    // Browser-only. Load persisted commissions and start the live clock.
    now = Date.now();
    commissions = readStore();
    const id = setInterval(() => {
      now = Date.now();
    }, 30_000);
    return () => clearInterval(id);
  });

  function readStore(): Commission[] {
    try {
      return parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return []; // private mode / storage disabled — degrade to ephemeral
    }
  }

  function writeStore(list: Commission[]) {
    try {
      localStorage.setItem(STORAGE_KEY, serialize(list));
    } catch {
      // Ignore: commissions simply stay in-memory for the session.
    }
  }

  function addCommission(c: Commission) {
    commissions = [...commissions, c];
    writeStore(commissions);
  }

  function forget(id: string) {
    commissions = commissions.filter((c) => c.id !== id);
    writeStore(commissions);
  }

  function onKeydown(e: KeyboardEvent) {
    // Escape collapses any open raised-line drawer, matching the room's
    // keyboard model.
    if (e.key === 'Escape') {
      document
        .querySelectorAll<HTMLDetailsElement>('details[open]')
        .forEach((d) => (d.open = false));
    }
  }
</script>

<svelte:head>
  <title>The Cartographer's Attic · ajlindgren.dev</title>
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<main class="attic">
  <header class="room-header">
    <h1>The Cartographer's Attic</h1>
    <p class="subtitle">
      Hand-drawn charts of territories that do not exist yet. Each one grows more
      detailed as its imagined date approaches — refined, never invented, from a
      single seed.
    </p>
  </header>

  <section class="gallery" aria-label="Charts of not-yet-existent places">
    {#each data.charts as chart (chart.id)}
      <MapCabinet {chart} {now} />
    {/each}
  </section>

  {#if commissions.length > 0}
    <section class="gallery commissioned" aria-label="Commissioned charts">
      {#each commissions as c (c.id)}
        <div class="commissioned-item">
          <MapCabinet chart={toChart(c)} {now} />
          <button class="forget" onclick={() => forget(c.id)}>
            Forget this commission
          </button>
        </div>
      {/each}
    </section>
  {/if}

  <CommissionBench onCommission={addCommission} />
</main>

<DieCorner label="roll onward" />

<style>
  .attic {
    position: relative;
    min-height: 100vh;
    max-width: 62rem;
    margin: 0 auto;
    padding: 4rem 1.5rem 8rem;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(217, 161, 90, 0.1) 0%, transparent 55%),
      radial-gradient(ellipse at center, #241708 0%, #0e0805 90%);
    overflow-x: hidden;
  }
  .room-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  .room-header h1 {
    font-size: clamp(1.6rem, 4vw, 2.4rem);
    font-weight: normal;
    letter-spacing: 0.08em;
    margin: 0 0 1rem;
    color: var(--fg);
  }
  .subtitle {
    max-width: 36rem;
    margin: 0 auto;
    color: #cdbfa4;
    line-height: 1.6;
  }
  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
    gap: 1.5rem;
  }
  .commissioned {
    margin-top: 1.5rem;
  }
  .commissioned-item {
    display: flex;
    flex-direction: column;
  }
  .forget {
    align-self: flex-end;
    margin-top: 0.5rem;
    cursor: pointer;
    padding: 0.3rem 0.6rem;
    border: 1px solid #4a341a;
    border-radius: 3px;
    background: transparent;
    color: #b7a582;
    font: inherit;
    font-size: 0.78rem;
  }
  .forget:hover,
  .forget:focus-visible {
    color: var(--accent);
    border-color: var(--accent);
    outline: none;
  }
  .forget:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
