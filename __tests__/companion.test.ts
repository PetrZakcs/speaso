import { CUSTOM_MASCOT_SOURCE } from '../components/companion/companionAsset';

describe('companionAsset', () => {
  it('exports CUSTOM_MASCOT_SOURCE with the active companion character asset', () => {
    expect(CUSTOM_MASCOT_SOURCE).not.toBeNull();
  });
});
