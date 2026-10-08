/**
 * Single source of truth for exercises. Titles, subtitles and steps live in
 * i18n/strings.json under `exercises.<id>`, `exercises.<id>_sub` and
 * `exercises.steps.<id>`.
 *
 * `kind` decides what follows the instruction steps:
 * - steps: nothing, the steps are the exercise
 * - reading: a text from the library + recorder
 * - metronome: a metronome + a short text to read along
 */
import type { TintName } from '../theme/tokens';

export type ExerciseId = 'breathing' | 'reading' | 'softstart' | 'metronome';
export type ExerciseKind = 'steps' | 'reading' | 'metronome';

export interface Exercise {
  id: ExerciseId;
  /** Ionicons name. */
  icon: string;
  tint: TintName;
  kind: ExerciseKind;
  /** Recommended duration — a guide, not a requirement. */
  minutes: number;
  level: 1 | 2 | 3;
}

export const EXERCISES: Exercise[] = [
  { id: 'breathing', icon: 'leaf-outline', tint: 'sage', kind: 'steps', minutes: 8, level: 1 },
  { id: 'reading', icon: 'book-outline', tint: 'sky', kind: 'reading', minutes: 5, level: 2 },
  { id: 'softstart', icon: 'mic-outline', tint: 'lavender', kind: 'steps', minutes: 6, level: 2 },
  { id: 'metronome', icon: 'musical-notes-outline', tint: 'butter', kind: 'metronome', minutes: 5, level: 2 },
];

export function getExercise(id: string | undefined): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
