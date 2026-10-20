jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'cs' }] }));
jest.mock('../lib/recordings', () => ({ deleteRecordingFile: () => {} }));

import { redeemPromoCode, PROMO_CODES, userReferralCode } from '../lib/promocodes';
import { useStore } from '../state/store';

describe('promo codes', () => {
  beforeEach(() => {
    useStore.getState().setSubscription({ isPremium: false, isTrial: false, expiresAt: null, promoCode: null });
  });

  it('rejects invalid or empty codes', async () => {
    expect((await redeemPromoCode('')).success).toBe(false);
    expect((await redeemPromoCode('NOT_A_REAL_CODE')).success).toBe(false);
    expect(useStore.getState().subscription.isPremium).toBe(false);
  });

  it('redeems SPEASOVIP as lifetime premium', async () => {
    const res = await redeemPromoCode('speasovip');
    expect(res.success).toBe(true);
    expect(res.code).toBe('SPEASOVIP');
    expect(res.expiresAt).toBeNull();
    const sub = useStore.getState().subscription;
    expect(sub.isPremium).toBe(true);
    expect(sub.promoCode).toBe('SPEASOVIP');
    expect(sub.expiresAt).toBeNull();
  });

  it('redeems FREEMONTH with 30-day expiration', async () => {
    const res = await redeemPromoCode('freemonth');
    expect(res.success).toBe(true);
    expect(res.code).toBe('FREEMONTH');
    expect(res.expiresAt).toBeTruthy();
    const sub = useStore.getState().subscription;
    expect(sub.isPremium).toBe(true);
    expect(sub.promoCode).toBe('FREEMONTH');
  });

  it('handles peer referral gift codes', async () => {
    const { installId } = useStore.getState();
    const ownCode = userReferralCode(installId);
    expect(ownCode).toMatch(/^GIFT-SPE-/);

    // Reject own code
    expect((await redeemPromoCode(ownCode)).success).toBe(false);

    // Accept friend's referral code
    const friendCode = 'GIFT-SPE-9999';
    const res = await redeemPromoCode(friendCode);
    expect(res.success).toBe(true);
    expect(res.code).toBe(friendCode);
    expect(res.expiresAt).toBeTruthy();
    expect(useStore.getState().subscription.isPremium).toBe(true);
    expect(useStore.getState().user.hasRedeemedReferral).toBe(true);

    // Guard: Prevent second referral redemption (anti-looping)
    const secondFriendCode = 'GIFT-SPE-1111';
    const secondRes = await redeemPromoCode(secondFriendCode);
    expect(secondRes.success).toBe(false);
    expect(secondRes.error).toBe('referral_already_used');
  });

  it('rejects promo redemption when active on store trial', async () => {
    useStore.getState().setSubscription({
      isPremium: true,
      isTrial: true,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      promoCode: null,
    });

    const res = await redeemPromoCode('FREEMONTH');
    expect(res.success).toBe(false);
    expect(res.error).toBe('active_store_trial');
  });

  describe('Supabase Managed VIP codes', () => {
    const originalFetch = global.fetch;
    const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    beforeAll(() => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';
    });

    afterAll(() => {
      global.fetch = originalFetch;
      process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });

    it('redeems managed VIP code with 1-year duration', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          code: 'VIP-LOGOPED-NOVAK',
          duration_days: 365,
          description: '1 year for partner therapist',
        }),
      } as any);

      const res = await redeemPromoCode('VIP-LOGOPED-NOVAK');
      expect(res.success).toBe(true);
      expect(res.code).toBe('VIP-LOGOPED-NOVAK');
      expect(res.expiresAt).toBeTruthy();
      expect(useStore.getState().subscription.isPremium).toBe(true);
      expect(useStore.getState().subscription.promoCode).toBe('VIP-LOGOPED-NOVAK');
    });

    it('enforces single-use quota (max_uses_reached)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'max_uses_reached',
        }),
      } as any);

      const res = await redeemPromoCode('LEAKED-VIP-CODE');
      expect(res.success).toBe(false);
      expect(res.error).toBe('max_uses_reached');
    });

    it('handles already_redeemed error on same device', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'already_redeemed',
        }),
      } as any);

      const res = await redeemPromoCode('VIP-CODE-ONCE');
      expect(res.success).toBe(false);
      expect(res.error).toBe('already_redeemed');
    });
  });
});
