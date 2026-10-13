/** Days of practice after which the brand wave is fully calm. */
export const CALM_AFTER_DAYS = 14;

/**
 * How calm the home wave is (0–1). It reflects consistency — the streak and
 * today's plan — never a measurement of the user's speech.
 */
export function waveCalm(streakDays: number, todayDone: number) {
  const streak = Math.min(streakDays, CALM_AFTER_DAYS) / CALM_AFTER_DAYS;
  const today = Math.max(0, Math.min(1, todayDone));
  return Math.min(1, 0.1 + streak * 0.72 + today * 0.18);
}

export function waveCaptionKey(calm: number) {
  if (calm < 0.35) return 'home.wave_start';
  if (calm < 0.75) return 'home.wave_mid';
  return 'home.wave_calm';
}

const POINTS = 56;

/** Deterministic pseudo-random in [-1, 1] — the same wave on every render. */
function noise(i: number, seed: number) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
 * A voice-like waveform. `calm` 0 = tense, jagged speech; 1 = smooth, even
 * flow. The edges taper to silence like a recorded phrase.
 */
export function wavePath(width: number, height: number, calm: number, seed = 1) {
  const mid = height / 2;
  const c = Math.max(0, Math.min(1, calm));
  const pts: { x: number; y: number }[] = [];
  let prev = 0;
  for (let i = 0; i <= POINTS; i++) {
    const t = i / POINTS;
    // Envelope: silent at both ends like a recorded phrase.
    const env = Math.pow(Math.sin(Math.PI * t), 1.3);
    const smooth = Math.sin(t * Math.PI * 7 + seed) * 0.7 + Math.sin(t * Math.PI * 3.1 + seed * 2) * 0.3;
    // Tension: irregular bumps that fade as calm grows.
    prev = prev * 0.3 + noise(i, seed) * 0.7;
    const tense = prev * (1 - c) * 0.85;
    const amp = smooth * (0.4 + 0.6 * c) + tense;
    pts.push({ x: t * width, y: mid - amp * env * mid * 0.9 });
  }
  // Catmull-Rom → cubic Béziers: organic, never a zig-zag.
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}
