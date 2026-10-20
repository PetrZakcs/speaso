import { CUSTOM_MASCOT_SOURCE } from '../components/companion/companionAsset';

describe('companionAsset', () => {
  it('exports CUSTOM_MASCOT_SOURCE default slot as null until user supplies asset', () => {
    // Verified slot ready for user's character asset (e.g. require('../../assets/mascot.png'))
    expect(CUSTOM_MASCOT_SOURCE).toBeNull();
  });
});
