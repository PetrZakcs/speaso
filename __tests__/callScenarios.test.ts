import { CALL_SCENARIOS, getCallScenario, formatTurnResponse } from '../content/callScenarios';

describe('callScenarios', () => {
  it('has valid scenarios with turns in both cs and en', () => {
    expect(CALL_SCENARIOS.length).toBeGreaterThanOrEqual(3);
    for (const scenario of CALL_SCENARIOS) {
      expect(scenario.id).toBeTruthy();
      expect(scenario.callerName.cs).toBeTruthy();
      expect(scenario.callerName.en).toBeTruthy();
      expect(scenario.turns.length).toBeGreaterThanOrEqual(2);

      for (const turn of scenario.turns) {
        expect(turn.callerPrompt.cs).toBeTruthy();
        expect(turn.callerPrompt.en).toBeTruthy();
        expect(turn.suggestedResponse.cs).toBeTruthy();
        expect(turn.suggestedResponse.en).toBeTruthy();
        expect(turn.clinicalTip.cs).toBeTruthy();
        expect(turn.clinicalTip.en).toBeTruthy();
        expect(turn.prepSeconds).toBeGreaterThan(0);
      }
    }
  });

  it('retrieves scenario by id', () => {
    const doctor = getCallScenario('doctor');
    expect(doctor).toBeDefined();
    expect(doctor?.callerName.cs).toContain('Dvořáková');

    const missing = getCallScenario('unknown');
    expect(missing).toBeUndefined();
  });

  it('formats turn response with user name correctly', () => {
    const template = 'Moje jméno je {name}';
    expect(formatTurnResponse(template, 'Honza', 'cs')).toBe('Moje jméno je Honza');
    expect(formatTurnResponse(template, '', 'cs')).toBe('Moje jméno je Petr');
    expect(formatTurnResponse(template, undefined, 'en')).toBe('Moje jméno je Alex');
  });
});
