/** Onboarding goal — personalises the plan reveal and the offer headline. */
export const GOALS = ['calm', 'confidence', 'situations', 'accept'] as const;
export type Goal = (typeof GOALS)[number];

export function asGoal(value: string | null | undefined): Goal | null {
  return GOALS.includes(value as Goal) ? (value as Goal) : null;
}
