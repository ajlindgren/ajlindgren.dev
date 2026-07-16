<script lang="ts">
  // A persistent orientation region for a chart: a compass rose and a scale.
  // Every cue is available as text (the N/E/S/W labels and the scale ratio),
  // never colour- or position-only, so it is legible to a screen reader and
  // with CSS off. The embossed look is pure decoration layered over the text.
  let { scale = '1 : 100 000', label = 'Chart orientation' }: {
    scale?: string;
    label?: string;
  } = $props();
</script>

<figure class="compass" role="group" aria-label={label}>
  <div class="rose" aria-hidden="true">
    <span class="tick n">N</span>
    <span class="tick e">E</span>
    <span class="tick s">S</span>
    <span class="tick w">W</span>
    <span class="star"></span>
  </div>
  <figcaption>
    <span class="cardinals">North is up. East is right. South is down. West is left.</span>
    <span class="scale">Scale {scale}</span>
  </figcaption>
</figure>

<style>
  .compass {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0.75rem 0 0;
    padding: 0.4rem 0.6rem;
    border: 1px solid #4a341a;
    border-radius: 4px;
    /* Embossed texture — decorative only. */
    background:
      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.05), transparent 60%),
      #201509;
    color: #d8ceb8;
  }
  .rose {
    position: relative;
    flex: 0 0 auto;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    border: 1px solid #4a341a;
    background: radial-gradient(circle at center, #2e2011 0%, #17100a 100%);
  }
  .tick {
    position: absolute;
    font-size: 0.6rem;
    color: var(--accent);
    transform: translate(-50%, -50%);
  }
  .tick.n {
    left: 50%;
    top: 0.5rem;
  }
  .tick.s {
    left: 50%;
    top: calc(100% - 0.5rem);
  }
  .tick.e {
    left: calc(100% - 0.5rem);
    top: 50%;
  }
  .tick.w {
    left: 0.5rem;
    top: 50%;
  }
  .star {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 0.5rem;
    height: 1.6rem;
    transform: translate(-50%, -50%) rotate(45deg);
    background: linear-gradient(180deg, var(--accent), transparent);
    opacity: 0.7;
  }
  figcaption {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: 0.78rem;
  }
  .cardinals {
    color: #b7a582;
  }
  .scale {
    color: #9c8c6d;
    letter-spacing: 0.04em;
  }
</style>
