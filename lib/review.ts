import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent } from './analytics';

const REVIEW_STORAGE_KEY = 'speaso_last_review_prompt';
const REVIEW_COOLDOWN_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

export type ReviewTrigger = 'streak_3' | 'streak_7' | 'streak_14' | 'great_rating';

/**
 * Gently prompts the user for an App Store / Google Play review
 * at moments of high delight (hitting a streak or rating a session 5/5).
 * Enforces a 60-day cooldown and respects native StoreKit availability.
 */
export async function maybeRequestReview(trigger: ReviewTrigger): Promise<boolean> {
  try {
    const isAvailable = await StoreReview.isAvailableAsync().catch(() => false);
    if (!isAvailable) return false;

    const lastPromptStr = await AsyncStorage.getItem(REVIEW_STORAGE_KEY).catch(() => null);
    if (lastPromptStr) {
      const lastPromptTime = parseInt(lastPromptStr, 10);
      if (!isNaN(lastPromptTime) && Date.now() - lastPromptTime < REVIEW_COOLDOWN_MS) {
        return false;
      }
    }

    // Record timestamp and request review
    await AsyncStorage.setItem(REVIEW_STORAGE_KEY, Date.now().toString()).catch(() => {});
    trackEvent('store_review_prompted', { trigger });

    // Slight delay so the user first sees their completion/celebration screen
    setTimeout(() => {
      StoreReview.requestReview().catch(() => {});
    }, 1000);

    return true;
  } catch (e) {
    console.warn('[review] requestReview failed:', e);
    return false;
  }
}
