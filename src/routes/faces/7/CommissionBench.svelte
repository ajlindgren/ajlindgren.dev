<script lang="ts">
  // The commission bench: a visitor names a possible-future place and a target
  // date, and the attic drafts a chart for it using the same refinement math.
  // This is a progressive enhancement — the form is inert without JS, so a
  // <noscript> notice explains the degradation. Persistence to localStorage is
  // guarded in try/catch, so private-mode browsers simply keep commissions for
  // the session.
  import type { Commission } from './commissions';
  import { createCommission } from './commissions';

  let { onCommission }: { onCommission: (c: Commission) => void } = $props();

  let name = $state('');
  let target = $state('');
  let error = $state('');

  function submit(e: SubmitEvent) {
    e.preventDefault();
    const commission = createCommission(name, target, Date.now());
    if (!commission) {
      error = 'Please give the place a name and a valid future date.';
      return;
    }
    error = '';
    name = '';
    target = '';
    onCommission(commission);
  }
</script>

<section class="bench" aria-labelledby="bench-title">
  <h2 id="bench-title">The Commission Bench</h2>
  <p class="lead">
    Name a place that does not exist yet and the date you imagine it might. The
    attic will draft its chart — sparse at first, refining as its date nears.
  </p>

  <form onsubmit={submit} class="commission-form">
    <label>
      <span>Place name</span>
      <input
        type="text"
        bind:value={name}
        placeholder="e.g. The Sunken City"
        autocomplete="off"
      />
    </label>
    <label>
      <span>Target date</span>
      <input type="month" bind:value={target} />
    </label>
    <button type="submit">Commission a chart</button>
    {#if error}
      <p class="error" role="alert">{error}</p>
    {/if}
  </form>

  <noscript>
    <p class="notice">
      Commissioning a chart needs JavaScript. The seeded maps, their raised-line
      editions, and their orientation are all available above without it.
    </p>
  </noscript>
</section>

<style>
  .bench {
    margin: 3rem auto 0;
    max-width: 32rem;
    padding: 1.25rem 1.5rem 1.5rem;
    border: 1px solid #4a341a;
    border-radius: 4px;
    background: linear-gradient(180deg, #2e2011 0%, #201509 100%);
    text-align: center;
  }
  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.2rem;
    font-weight: normal;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--fg);
  }
  .lead {
    margin: 0 0 1.25rem;
    font-size: 0.88rem;
    color: #cdbfa4;
    line-height: 1.5;
  }
  .commission-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-align: left;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8rem;
    color: #b7a582;
  }
  input {
    padding: 0.5rem 0.6rem;
    border: 1px solid #4a341a;
    border-radius: 3px;
    background: #17100a;
    color: var(--fg);
    font: inherit;
  }
  input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  button {
    margin-top: 0.25rem;
    cursor: pointer;
    padding: 0.6rem 1rem;
    border: 1px solid var(--accent);
    border-radius: 3px;
    background: rgba(217, 161, 90, 0.12);
    color: var(--accent);
    font: inherit;
    letter-spacing: 0.05em;
  }
  button:hover,
  button:focus-visible {
    background: rgba(217, 161, 90, 0.22);
    outline: none;
  }
  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .error {
    margin: 0.25rem 0 0;
    font-size: 0.82rem;
    color: #e0a06a;
  }
  .notice {
    margin: 1rem 0 0;
    font-size: 0.82rem;
    color: #cdbfa4;
    font-style: italic;
  }
</style>
