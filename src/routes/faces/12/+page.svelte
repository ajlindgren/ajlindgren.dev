<script lang="ts">
  // The Hall of Twelve Doors — Face 12. A flat, keyboard-navigable hall of
  // twelve door cards (one per face), each a real anchor to /faces/N so it is
  // Tab/Enter operable and screen-reader-legible out of the box. The operable
  // die is embedded in a corner via the existing Scene component (roll onward),
  // reusing DieCorner with no duplication. MVP: no swarm data, no snapshot,
  // no audio, no live previews.
  import { FACES, FACE_NUMBERS, ROMAN } from '$lib/faces';
  import DieCorner from '$lib/components/DieCorner.svelte';

  // A deterministic placeholder gradient per door, derived from its number so
  // each door reads as a distinct threshold until real previews land.
  const hue = (n: number) => n * 30;
</script>

<svelte:head>
  <title>The Hall of Twelve Doors · ajlindgren.dev</title>
</svelte:head>

<main class="hall">
  <header class="hall-header">
    <p class="numeral">{ROMAN[12]}</p>
    <h1>{FACES[12].title}</h1>
    <p class="subtitle">{FACES[12].tagline}</p>
  </header>

  <nav class="doors" aria-label="The Twelve Doors">
    {#each FACE_NUMBERS as n (n)}
      <a
        class="door"
        href={FACES[n].route}
        aria-label={`Door ${ROMAN[n]} — ${FACES[n].title}`}
        aria-current={n === 12 ? 'page' : undefined}
      >
        <span
          class="thumb"
          aria-hidden="true"
          style={`background:
            radial-gradient(circle at 30% 25%, hsl(${hue(n)} 55% 42%) 0%, transparent 60%),
            linear-gradient(150deg, hsl(${hue(n)} 45% 22%) 0%, hsl(${hue(n) + 24} 40% 12%) 100%);`}
        >
          <span class="thumb-numeral">{ROMAN[n]}</span>
        </span>
        <span class="door-body">
          <span class="door-title">{FACES[n].title}</span>
          <span class="door-tagline">{FACES[n].tagline}</span>
        </span>
      </a>
    {/each}
  </nav>
</main>

<DieCorner label="roll onward" />

<style>
  .hall {
    /* The Hall owns its own scroll: global `overflow: hidden` on html/body
       would otherwise clip the grid on small viewports. */
    height: 100vh;
    overflow-y: auto;
    padding: 4rem 1.5rem 9rem;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(217, 161, 90, 0.12) 0%, transparent 55%),
      radial-gradient(ellipse at center, #241708 0%, #0e0805 90%);
  }

  .hall-header {
    text-align: center;
    max-width: 42rem;
    margin: 0 auto 3rem;
  }
  .numeral {
    font-size: 4.5rem;
    line-height: 1;
    margin: 0 0 0.5rem;
    color: var(--accent);
    font-variant-numeric: oldstyle-nums;
  }
  .hall-header h1 {
    font-size: clamp(1.7rem, 4vw, 2.6rem);
    font-weight: normal;
    letter-spacing: 0.09em;
    margin: 0 0 0.75rem;
    color: var(--fg);
  }
  .subtitle {
    margin: 0;
    color: #cdbfa4;
    font-style: italic;
    line-height: 1.6;
  }

  .doors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 1.25rem;
    max-width: 68rem;
    margin: 0 auto;
  }

  .door {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: var(--fg);
    text-decoration: none;
    background: linear-gradient(180deg, #2a1c0e 0%, #1a1108 100%);
    border: 1px solid #4a341a;
    border-radius: 0.6rem;
    box-shadow: 0 12px 22px -18px rgba(0, 0, 0, 0.9);
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }
  .door:hover,
  .door:focus-visible {
    transform: translateY(-4px);
    border-color: var(--accent);
    box-shadow: 0 18px 30px -18px rgba(0, 0, 0, 0.95);
    text-decoration: none;
  }
  .door:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
  .door[aria-current='page'] {
    border-color: var(--accent);
  }

  .thumb {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 8rem;
  }
  .thumb-numeral {
    font-size: 2.4rem;
    letter-spacing: 0.08em;
    color: rgba(244, 234, 216, 0.85);
    font-variant-numeric: oldstyle-nums;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  }

  .door-body {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 1rem 1.15rem 1.25rem;
  }
  .door-title {
    font-size: 1.1rem;
    letter-spacing: 0.03em;
    color: var(--fg);
  }
  .door-tagline {
    font-size: 0.88rem;
    line-height: 1.5;
    color: #b7a582;
  }

  @media (prefers-reduced-motion: reduce) {
    .door {
      transition: none;
    }
    .door:hover,
    .door:focus-visible {
      transform: none;
    }
  }
</style>
