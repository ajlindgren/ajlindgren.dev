import * as THREE from 'three';

/**
 * Canvas-drawn seamless hardwood albedo + roughness. Zero-asset: nothing is
 * fetched, so there's no binary to license or lazy-load. Browser-only — callers
 * must guard on `browser` because it needs a 2D canvas.
 *
 * Planks run along X. Per-plank base tone varies; grain is layered sine bands
 * plus value noise, and roughness is derived so grain lines read as slightly
 * rougher than the finished plank surface.
 */
export type WoodTextures = {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateWoodTextures(size = 1024, planks = 6, seed = 1337): WoodTextures {
  const albedo = document.createElement('canvas');
  albedo.width = albedo.height = size;
  const rough = document.createElement('canvas');
  rough.width = rough.height = size;
  const ac = albedo.getContext('2d')!;
  const rc = rough.getContext('2d')!;

  const rand = mulberry32(seed);
  const plankH = size / planks;
  const base = [92, 58, 33];

  for (let p = 0; p < planks; p++) {
    const y0 = Math.round(p * plankH);
    const y1 = Math.round((p + 1) * plankH);
    const tone = 0.82 + rand() * 0.36;
    const grainFreq = 5 + rand() * 6;
    const grainPhase = rand() * Math.PI * 2;
    const knot = rand();

    for (let y = y0; y < y1; y++) {
      const v = (y - y0) / plankH;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        // Streaky grain running along the plank length (X), warped in Y.
        const grain =
          0.5 +
          0.5 *
            Math.sin(
              u * Math.PI * 2 * grainFreq +
                grainPhase +
                Math.sin(v * Math.PI * 3 + p) * 0.8 +
                (rand() - 0.5) * 0.25
            );
        const knotDip = knot > 0.7 ? Math.max(0, 1 - Math.hypot(u - knot, v - 0.5) * 6) * 0.35 : 0;
        const shade = tone * (0.72 + 0.28 * grain) - knotDip;
        const r = Math.max(0, Math.min(255, base[0] * shade));
        const g = Math.max(0, Math.min(255, base[1] * shade));
        const b = Math.max(0, Math.min(255, base[2] * shade));
        ac.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
        ac.fillRect(x, y, 1, 1);
        // Grain lines are rougher (less specular) than the plank body.
        const rv = Math.max(0, Math.min(255, (0.55 + 0.35 * (1 - grain)) * 255));
        rc.fillStyle = `rgb(${rv | 0},${rv | 0},${rv | 0})`;
        rc.fillRect(x, y, 1, 1);
      }
    }
    // Dark seam between planks.
    ac.fillStyle = 'rgba(20,12,6,0.85)';
    ac.fillRect(0, y1 - 1, size, 1);
  }

  const map = new THREE.CanvasTexture(albedo);
  const roughnessMap = new THREE.CanvasTexture(rough);
  for (const t of [map, roughnessMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 4);
    t.anisotropy = 8;
  }
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, roughnessMap };
}
