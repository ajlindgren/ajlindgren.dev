<script lang="ts">
  import type { PageProps } from './$types';
  import type { Book } from './+page';
  import { displayConstraint } from './books';
  import DieCorner from '$lib/components/DieCorner.svelte';

  let { data }: PageProps = $props();

  // The book currently pulled from the shelf, or null when the shelf is at rest.
  let activeBook = $state<Book | null>(null);
  let drawerOpen = $state(false);

  function openBook(book: Book) {
    activeBook = book;
  }
  function closeBook() {
    activeBook = null;
  }
  function toggleDrawer() {
    drawerOpen = !drawerOpen;
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (activeBook) closeBook();
      else if (drawerOpen) drawerOpen = false;
    }
  }
</script>

<svelte:head>
  <title>The Library of Unfinished Books · ajlindgren.dev</title>
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<main class="library">
  <header class="room-header">
    <h1>The Library of Unfinished Books</h1>
    <p class="subtitle">
      A candle-lit room of projects that were never finished — and were never
      failures. Pull a book to read the one constraint that actually stopped it.
    </p>
  </header>

  <section class="shelf" aria-label="Shelf of unfinished books">
    {#each data.books as book, i (book.id)}
      <button
        class="spine"
        style="--i: {i}"
        onclick={() => openBook(book)}
        aria-haspopup="dialog"
      >
        <span class="spine-title">{book.title}</span>
      </button>
    {/each}
  </section>

  <section class="catalog" aria-label="Card catalog of ideas not yet begun">
    <button
      class="drawer-face"
      onclick={toggleDrawer}
      aria-expanded={drawerOpen}
      aria-controls="someday-drawer"
    >
      <span class="drawer-pull" aria-hidden="true"></span>
      <span class="drawer-label">{data.someday.title}</span>
      <span class="drawer-hint">a drawer of things not yet begun</span>
    </button>

    {#if drawerOpen}
      <div id="someday-drawer" class="drawer-open">
        <ul class="ideas">
          {#each data.someday.cards as card, i (i)}
            <li>
              <span class="idea-title">{card.title}</span>
              {#if card.note}
                <span class="idea-note">{card.note}</span>
              {/if}
            </li>
          {/each}
        </ul>
        <p class="readonly-note">
          Read only. Nothing in this drawer can be pulled or borrowed — only
          remembered.
        </p>
      </div>
    {/if}
  </section>
</main>

{#if activeBook}
  <div class="modal" role="dialog" aria-modal="true" aria-label="An unfinished book">
    <!-- A real button as the scrim keeps click-outside-to-close accessible. -->
    <button class="scrim" aria-label="Close book" onclick={closeBook}></button>

    <article class="pulled-page">
      <button class="close" aria-label="Close book" onclick={closeBook}>×</button>

      <!-- Contract: the constraint is the dominant element of the page. It is
           the largest text, above the fold, never hover-only or buried. A blank
           constraint shows an explicit fallback rather than hiding the field. -->
      <p class="constraint-label">The constraint that actually stopped it</p>
      <p class="constraint" class:unrecorded={!activeBook.constraint.trim()}>
        {displayConstraint(activeBook.constraint)}
      </p>

      <div class="page-meta">
        <h2 class="what-label">What it was</h2>
        <p class="what">{activeBook.what}</p>
        {#if activeBook.started || activeBook.abandoned}
          <p class="year">
            {#if activeBook.started && activeBook.abandoned}
              {activeBook.started} – {activeBook.abandoned}
            {:else if activeBook.started}
              started {activeBook.started}
            {:else}
              abandoned {activeBook.abandoned}
            {/if}
          </p>
        {/if}

        <h2 class="lesson-label">The one thing building it taught</h2>
        <p class="lesson">{activeBook.taught}</p>
      </div>
    </article>
  </div>
{/if}

<DieCorner />

<style>
  .library {
    position: relative;
    min-height: 100vh;
    max-width: 60rem;
    margin: 0 auto;
    padding: 4rem 1.5rem 8rem;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(217, 161, 90, 0.12) 0%, transparent 55%),
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
    max-width: 34rem;
    margin: 0 auto;
    color: #cdbfa4;
    line-height: 1.6;
  }

  /* ── Shelf of spines ─────────────────────────────────────────────── */
  .shelf {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-end;
    gap: 0.5rem;
    padding: 1.5rem 1rem 0.75rem;
    border-bottom: 6px solid #3a2713;
    box-shadow: 0 14px 24px -18px rgba(0, 0, 0, 0.9);
    perspective: 1200px;
  }
  .spine {
    --hue: calc(24deg + var(--i) * 9deg);
    appearance: none;
    cursor: pointer;
    width: clamp(2.4rem, 6vw, 3rem);
    height: clamp(11rem, 26vh, 15rem);
    margin: 0;
    padding: 0.75rem 0.25rem;
    border: 1px solid rgba(0, 0, 0, 0.4);
    border-radius: 2px 2px 0 0;
    background: linear-gradient(
      90deg,
      hsl(var(--hue) 35% 16%) 0%,
      hsl(var(--hue) 40% 26%) 50%,
      hsl(var(--hue) 30% 14%) 100%
    );
    color: #f0e4cd;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    transition:
      transform 0.35s ease,
      box-shadow 0.35s ease;
    transform-origin: bottom center;
  }
  .spine-title {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 100%;
  }
  .spine:hover,
  .spine:focus-visible {
    transform: translateY(-0.75rem) rotateX(6deg);
    box-shadow: 0 12px 20px -10px rgba(0, 0, 0, 0.8);
    outline: none;
  }
  .spine:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }

  /* ── Card-catalog drawer ─────────────────────────────────────────── */
  .catalog {
    margin: 4rem auto 0;
    max-width: 26rem;
    text-align: center;
  }
  .drawer-face {
    position: relative;
    width: 100%;
    cursor: pointer;
    padding: 1.4rem 1rem 1.6rem;
    border: 1px solid #4a341a;
    border-radius: 4px;
    background: linear-gradient(180deg, #2e2011 0%, #201509 100%);
    color: #e7d9bd;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    transition: transform 0.25s ease;
  }
  .drawer-face:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
  .drawer-pull {
    width: 1.6rem;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: var(--accent);
    opacity: 0.8;
  }
  .drawer-label {
    font-size: 1.3rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .drawer-hint {
    font-size: 0.8rem;
    color: #b7a582;
    font-style: italic;
  }
  .drawer-open {
    margin-top: -2px;
    border: 1px solid #4a341a;
    border-top: none;
    border-radius: 0 0 4px 4px;
    background: #17100a;
    padding: 1.25rem 1.5rem;
    animation: drawer-slide 0.3s ease;
  }
  .ideas {
    list-style: none;
    margin: 0;
    padding: 0;
    text-align: left;
  }
  .ideas li {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.6rem 0;
    border-bottom: 1px dotted #3a2b18;
    color: #d8ceb8;
  }
  .ideas li:last-child {
    border-bottom: none;
  }
  .idea-title {
    color: #d8ceb8;
  }
  .idea-note {
    font-size: 0.82rem;
    color: #9c8c6d;
  }
  .readonly-note {
    margin: 1rem 0 0;
    font-size: 0.78rem;
    color: #9c8c6d;
    font-style: italic;
  }

  /* ── The pulled book: a single page ──────────────────────────────── */
  .modal {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  .scrim {
    position: fixed;
    inset: 0;
    border: none;
    cursor: pointer;
    background: rgba(6, 4, 2, 0.72);
    backdrop-filter: blur(2px);
  }
  .pulled-page {
    position: relative;
    z-index: 1;
    width: min(38rem, 100%);
    max-height: 86vh;
    overflow-y: auto;
    padding: 3rem 2.5rem 2.5rem;
    background: linear-gradient(180deg, #f6ecd6 0%, #efe2c6 100%);
    color: #2a2013;
    border-radius: 3px;
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.15),
      0 30px 60px -20px rgba(0, 0, 0, 0.85);
    /* The 3D "book-pull": the page swings open from its spine. */
    transform-origin: left center;
    animation: book-pull 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .close {
    position: absolute;
    top: 0.6rem;
    right: 0.9rem;
    cursor: pointer;
    border: none;
    background: none;
    font-size: 1.6rem;
    line-height: 1;
    color: #7a6a4d;
  }
  .close:focus-visible {
    outline: 2px solid #a9752c;
    outline-offset: 2px;
  }

  .constraint-label {
    margin: 0 0 0.5rem;
    font-size: 0.8rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #9c6b23;
  }
  /* Contract-critical: the constraint is the largest, most prominent text. */
  .constraint {
    margin: 0 0 2rem;
    font-size: clamp(1.7rem, 4.5vw, 2.4rem);
    line-height: 1.25;
    font-weight: 600;
    color: #1c1409;
  }
  /* An unrecorded constraint stays visible but reads as an admission, not a
     styled title — the room refuses to hide the omission. */
  .constraint.unrecorded {
    font-style: italic;
    font-weight: 500;
    color: #6b5836;
  }

  .page-meta {
    border-top: 1px solid #d8c39a;
    padding-top: 1.5rem;
  }
  .what-label,
  .lesson-label {
    margin: 1.25rem 0 0.35rem;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #8a744d;
    font-weight: normal;
  }
  .what-label {
    margin-top: 0;
  }
  .what {
    margin: 0;
    font-size: 1.1rem;
    color: #332716;
  }
  .year {
    margin: 0.15rem 0 0;
    font-size: 0.85rem;
    color: #8a744d;
  }
  .lesson {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.5;
    color: #332716;
  }

  @keyframes book-pull {
    from {
      opacity: 0;
      transform: rotateY(-78deg) translateX(-1.5rem);
    }
    to {
      opacity: 1;
      transform: rotateY(0) translateX(0);
    }
  }
  @keyframes drawer-slide {
    from {
      opacity: 0;
      transform: translateY(-0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* The constraint must be reachable without motion. Reduced-motion users get
     the page revealed instantly, no transform, and no spine tilt. */
  @media (prefers-reduced-motion: reduce) {
    .pulled-page,
    .drawer-open {
      animation: none;
    }
    .spine {
      transition: none;
    }
    .spine:hover,
    .spine:focus-visible {
      transform: none;
    }
  }
</style>
