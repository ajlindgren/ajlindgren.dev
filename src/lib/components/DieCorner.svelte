<script lang="ts">
  // A small, fixed-corner mount of the existing die composition. It reuses
  // Scene (Canvas → World → D12) verbatim — no duplication of the die logic —
  // so the corner die is press-and-drag operable exactly like the full-page one.
  // A discrete "back to the die" link returns to `/` for rolling onward.
  import Scene from './Scene.svelte';

  let { label = 'back to the die', corner = 'bottom-right' }: {
    label?: string;
    corner?: 'bottom-right' | 'bottom-left';
  } = $props();
</script>

<aside class="die-corner {corner}" aria-label="The die, in miniature">
  <div class="stage">
    <Scene />
  </div>
  <a class="return" href="/">↩ {label}</a>
</aside>

<style>
  .die-corner {
    position: fixed;
    z-index: 20;
    width: min(34vw, 200px);
    height: min(34vw, 200px);
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
  }
  .die-corner.bottom-right {
    right: 1.25rem;
    bottom: 1.25rem;
  }
  .die-corner.bottom-left {
    left: 1.25rem;
    bottom: 1.25rem;
  }
  /* The stage receives pointer events so the die can be grabbed and thrown;
     the wrapper itself stays transparent to clicks elsewhere. */
  .stage {
    position: relative;
    width: 100%;
    flex: 1;
    overflow: hidden;
    border-radius: 0.5rem;
    pointer-events: auto;
    -webkit-mask-image: radial-gradient(ellipse at center, #000 60%, transparent 100%);
    mask-image: radial-gradient(ellipse at center, #000 60%, transparent 100%);
  }
  .stage :global(canvas) {
    width: 100% !important;
    height: 100% !important;
  }
  .return {
    pointer-events: auto;
    margin-top: 0.35rem;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    color: var(--accent);
    background: rgba(14, 8, 5, 0.6);
    padding: 0.15rem 0.5rem;
    border-radius: 0.25rem;
  }
</style>
