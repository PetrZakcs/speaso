jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(),
  requestReview: jest.fn(),
}));

import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { maybeRequestReview } from '../lib/review';

describe('In-App Store Review Engine', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    (StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (StoreReview.requestReview as jest.Mock).mockResolvedValue(undefined);
  });

  it('requests review when available and no recent prompt', async () => {
    const res = await maybeRequestReview('streak_3');
    expect(res).toBe(true);
    const stored = await AsyncStorage.getItem('speaso_last_review_prompt');
    expect(stored).toBeTruthy();
  });

  it('rejects review when StoreReview is not available', async () => {
    (StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    const res = await maybeRequestReview('great_rating');
    expect(res).toBe(false);
  });

  it('enforces 60-day cooldown between review prompts', async () => {
    // Set last prompt to 5 days ago
    const recent = Date.now() - 5 * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem('speaso_last_review_prompt', recent.toString());

    const res = await maybeRequestReview('streak_7');
    expect(res).toBe(false);
  });

  it('allows review after cooldown expires (e.g. 70 days)', async () => {
    // Set last prompt to 70 days ago
    const old = Date.now() - 70 * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem('speaso_last_review_prompt', old.toString());

    const res = await maybeRequestReview('streak_7');
    expect(res).toBe(true);
  });
});
