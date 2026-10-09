import eas from '../eas.json';

describe('eas.json', () => {
  it('never unlocks beta access in production builds', () => {
    const env = (eas.build.production as { env?: Record<string, string> }).env ?? {};
    expect(env.EXPO_PUBLIC_BETA_ALL_ACCESS).toBeUndefined();
  });

  it('unlocks everything for closed-beta preview builds', () => {
    expect(eas.build.preview.env.EXPO_PUBLIC_BETA_ALL_ACCESS).toBe('1');
  });
});
