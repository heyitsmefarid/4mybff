/* Small helpers shared across screens. */

/** Resolve a path from content.js (e.g. "media/photo.jpg") against the app base. */
export function assetUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  const base = import.meta.env.BASE_URL || '/';
  return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}

/** 214 -> "3:34" */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/* Deterministic PRNG so a given seed always draws the same sprite. */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Last entry of each row is the sprite's background. */
const SPRITE_PALETTES = {
  night: [
    ['#ff4d9d', '#ff9ecb', '#4deeea', '#1a0b2e'],
    ['#4deeea', '#a6fffd', '#ffd93d', '#12213d'],
    ['#ffd93d', '#ffe98a', '#ff4d9d', '#2a1250'],
    ['#5bff9b', '#b2ffd2', '#4deeea', '#0f2a1e'],
    ['#c084fc', '#e9d5ff', '#ff4d9d', '#1d0f38'],
  ],
  day: [
    ['#f27ab0', '#ffc7de', '#5cc9c6', '#fff4f9'],
    ['#5cc9c6', '#b6ecea', '#f0b429', '#f0fbfb'],
    ['#f0b429', '#ffe3a3', '#f27ab0', '#fffaef'],
    ['#5fd39b', '#c4f2da', '#5cc9c6', '#f1fcf6'],
    ['#a97ceb', '#ded0fb', '#f27ab0', '#f9f4ff'],
  ],
};

/**
 * Generates a mirrored 16x16 sprite as an SVG data URI — used as a stand-in
 * wherever a real photo has not been dropped in yet. The palette follows the
 * active theme so placeholders never fight the page they sit on.
 */
export function pixelArt(seed = 0, { size = 16, density = 0.52, theme = 'night' } = {}) {
  const rnd = mulberry32((seed + 1) * 2654435761);
  const sets = SPRITE_PALETTES[theme] || SPRITE_PALETTES.night;
  const pal = sets[Math.floor(rnd() * sets.length)];
  const half = Math.ceil(size / 2);
  const rects = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < half; x++) {
      if (rnd() > density) continue;
      const color = pal[Math.floor(rnd() * 3)];
      rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`);
      const mx = size - 1 - x;
      if (mx !== x) {
        rects.push(`<rect x="${mx}" y="${y}" width="1" height="1" fill="${color}"/>`);
      }
    }
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${size}" fill="${pal[3]}"/>` +
    rects.join('') +
    `</svg>`;

  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
