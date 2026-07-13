/**
 * Preloads a handful of dice-hit audio samples and exposes `playRandomHit`.
 * Autoplay-safe: the first pointer/keydown event unlocks playback. Until then,
 * calls are no-ops.
 */

import { browser } from '$app/environment';

const SAMPLE_URLS = [
  '/audio/clatter_01.mp3',
  '/audio/clatter_02.mp3',
  '/audio/clatter_03.mp3',
  '/audio/clatter_04.mp3',
  '/audio/clatter_05.mp3',
  '/audio/clatter_06.mp3'
];

const COOLDOWN_MS = 40;

let pool: HTMLAudioElement[] = [];
let unlocked = false;
let lastPlay = 0;
let initialized = false;

export function initClatter(): void {
  if (!browser || initialized) return;
  initialized = true;
  pool = SAMPLE_URLS.map((url) => {
    const a = new Audio(url);
    a.preload = 'auto';
    a.volume = 0;
    return a;
  });
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    for (const a of pool) {
      a.play()
        .then(() => {
          a.pause();
          a.currentTime = 0;
          a.volume = 1;
        })
        .catch(() => {
          /* file missing or blocked — silent no-op */
        });
    }
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });
}

export function playRandomHit(volume = 1): void {
  if (!browser || !unlocked || pool.length === 0) return;
  const now = performance.now();
  if (now - lastPlay < COOLDOWN_MS) return;
  lastPlay = now;
  const idle = pool.filter((a) => a.paused || a.ended);
  const source = idle.length > 0 ? idle[Math.floor(Math.random() * idle.length)] : pool[Math.floor(Math.random() * pool.length)];
  source.currentTime = 0;
  source.volume = Math.max(0, Math.min(1, volume));
  source.play().catch(() => {
    /* missing sample file — silent */
  });
}
