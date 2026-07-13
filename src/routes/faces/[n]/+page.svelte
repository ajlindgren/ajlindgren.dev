<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{data.entry.display_name} · ajlindgren.dev</title>
</svelte:head>

<article>
  <p class="numeral">{data.face_number}</p>
  <h1>{data.entry.display_name}</h1>
  <p class="description">{data.entry.description}</p>
  <p class="back"><a href="/">← return to the die</a></p>
</article>

<style>
  article {
    max-width: 42rem;
    margin: 0 auto;
    padding: 6rem 2rem;
    text-align: center;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow-y: auto;
  }
  .numeral {
    font-size: 8rem;
    line-height: 1;
    margin: 0 0 1rem;
    color: var(--accent);
    font-variant-numeric: oldstyle-nums;
  }
  h1 {
    font-size: 2rem;
    font-weight: normal;
    letter-spacing: 0.1em;
    margin: 0 0 2rem;
  }
  .description {
    font-size: 1.25rem;
    line-height: 1.6;
    color: #d8ceb8;
    margin: 0 0 3rem;
  }
  .back {
    font-size: 0.9rem;
    letter-spacing: 0.05em;
  }
</style>
