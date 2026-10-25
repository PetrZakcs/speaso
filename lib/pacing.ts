export type PaceZone = 'slow' | 'calm' | 'elevated' | 'fast';

/**
 * Classifies speech cadence (WPM) according to clinical stuttering (balbuties) standards:
 * - Slow (<100 WPM): relaxed speech, prolonged syllables
 * - Calm (100–135 WPM): optimal target fluency zone
 * - Elevated (136–155 WPM): hurried pace, increasing tension
 * - Fast (>155 WPM): rapid cluttering, articulatory pressure
 */
export function classifyWpm(wpm: number): PaceZone {
  if (wpm < 100) return 'slow';
  if (wpm <= 135) return 'calm';
  if (wpm <= 155) return 'elevated';
  return 'fast';
}

/**
 * Calculates words/beats per minute from an array of tap timestamps.
 */
export function calculateWpm(tapTimestamps: number[]): number {
  if (tapTimestamps.length < 2) return 0;
  // Keep last up to 7 taps (6 intervals) for a responsive, smoothed moving average
  const recent = tapTimestamps.slice(-7);
  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    // Ignore gaps longer than 2.5 seconds (speech pauses)
    if (diff > 0 && diff < 2500) {
      intervals.push(diff);
    }
  }
  if (intervals.length === 0) return 0;
  const avgMs = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  return Math.round(60000 / avgMs);
}
