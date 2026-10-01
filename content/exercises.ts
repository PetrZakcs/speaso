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
export type ExerciseId = 'breathing' | 'reading' | 'softstart' | 'metronome';
export type ExerciseKind = 'steps' | 'reading' | 'metronome';

export interface Exercise {
  id: ExerciseId;
  emoji: string;
  kind: ExerciseKind;
  /** Recommended duration — a guide, not a requirement. */
  minutes: number;
  level: 1 | 2 | 3;
}

export const EXERCISES: Exercise[] = [
  { id: 'breathing', emoji: '🫁', kind: 'steps', minutes: 8, level: 1 },
  { id: 'reading', emoji: '📖', kind: 'reading', minutes: 5, level: 2 },
  { id: 'softstart', emoji: '🎙️', kind: 'steps', minutes: 6, level: 2 },
  { id: 'metronome', emoji: '🥁', kind: 'metronome', minutes: 5, level: 2 },
];

export function getExercise(id: string | undefined): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
