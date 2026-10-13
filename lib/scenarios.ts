import { FREE_SCENARIOS_LIMIT, type CustomScenario } from '../state/store';

export const SCENARIO_PREFIX = 'scenario:';
/** Rough length of one run-through (prep + phrases + challenge). */
export const SCENARIO_MINUTES = 5;

export function scenarioActivityId(id: string) {
  return `${SCENARIO_PREFIX}${id}`;
}

function byAge(scenarios: CustomScenario[]) {
  return [...scenarios].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Free users can practise their oldest scenario(s) up to the free limit. */
export function isScenarioUnlocked(id: string, scenarios: CustomScenario[], isPremium: boolean) {
  if (isPremium) return true;
  return byAge(scenarios).slice(0, FREE_SCENARIOS_LIMIT).some((s) => s.id === id);
}

export function canCreateScenario(scenarios: CustomScenario[], isPremium: boolean) {
  return isPremium || scenarios.length < FREE_SCENARIOS_LIMIT;
}
