/**
 * Single source of truth for exercises. Titles, subtitles and steps live in
 * i18n/strings.json under `exercises.<id>`, `exercises.<id>_sub` and
 * `exercises.steps.<id>`.
 */
export type ExerciseId = 'breathing' | 'reading' | 'softstart';

export interface Exercise {
  id: ExerciseId;
  emoji: string;
  /** Recommended duration — a guide, not a requirement. */
  minutes: number;
  level: 1 | 2 | 3;
}

export const EXERCISES: Exercise[] = [
  { id: 'breathing', emoji: '🫁', minutes: 8, level: 1 },
  { id: 'reading', emoji: '📖', minutes: 5, level: 2 },
  { id: 'softstart', emoji: '🎙️', minutes: 6, level: 2 },
];

export function getExercise(id: string | undefined): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
