<script lang="ts">
  // A deterministic SVG rendering of a feature set. Every glyph is derived from
  // the SAME `Feature[]` the raised-line edition transcribes, so the two are
  // information-equivalent. The SVG itself is decorative (aria-hidden): all of
  // its content is available as text in the RaisedLineEdition drawer beside it.
  import type { Feature } from './+page';

  let { features, kind }: { features: Feature[]; kind: string } = $props();

  // Map the unit square onto a 200×140 viewBox with a small margin.
  const W = 200;
  const H = 140;
  const M = 12;
  const px = (x: number) => M + x * (W - 2 * M);
  const py = (y: number) => M + y * (H - 2 * M);

  // A stable glyph radius per feature kind keeps the map legible without colour.
  const radius = (k: string) => (k.length % 3) + 3;
</script>

<svg
  class="map"
  viewBox={`0 0 ${W} ${H}`}
  role="img"
  aria-hidden="true"
  preserveAspectRatio="xMidYMid meet"
>
  <rect class="sheet" x="0" y="0" width={W} height={H} rx="3" />
  <!-- faint survey grid -->
  {#each [0.25, 0.5, 0.75] as g (g)}
    <line class="grid" x1={px(g)} y1={M} x2={px(g)} y2={H - M} />
    <line class="grid" x1={M} y1={py(g)} x2={W - M} y2={py(g)} />
  {/each}
  {#each features as f (f.id)}
    <g class="feature">
      <circle cx={px(f.x)} cy={py(f.y)} r={radius(f.kind)} />
      <text class="pin" x={px(f.x) + radius(f.kind) + 2} y={py(f.y) + 3}>{f.kind}</text>
    </g>
  {/each}
  <title>{kind} chart with {features.length} surveyed features</title>
</svg>

<style>
  .map {
    display: block;
    width: 100%;
    height: auto;
    background: transparent;
  }
  .sheet {
    fill: #efe2c6;
    stroke: #b9a274;
    stroke-width: 1;
  }
  .grid {
    stroke: #cdb98c;
    stroke-width: 0.4;
    stroke-dasharray: 2 3;
  }
  .feature circle {
    fill: #3a2b14;
    stroke: #1c1409;
    stroke-width: 0.6;
  }
  .pin {
    font-size: 5px;
    fill: #4a3a1e;
    font-family: inherit;
  }
</style>
