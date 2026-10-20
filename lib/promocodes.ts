import { useStore, patientPairingCode } from '../state/store';
import { trackEvent } from './analytics';

export interface PromoDefinition {
  code: string;
  /** null means lifetime access */
  durationDays: number | null;
  /** Fixed expiration date if set, otherwise durationDays from redemption */
  fixedExpiration?: string;
  description: string;
}

/**
 * Built-in promo codes for VIP testers, partners, therapists and campaigns.
 * Can be verified offline or extended with a backend check in the future.
 */
export const PROMO_CODES: PromoDefinition[] = [
  {
    code: 'SPEASOVIP',
    durationDays: null,
    description: 'Lifetime VIP access',
  },
  {
    code: 'BETA2026',
    durationDays: null,
    fixedExpiration: '2026-12-31T23:59:59.999Z',
    description: 'Full access for 2026 beta testers',
  },
  {
    code: 'LOGOPED',
    durationDays: 365,
    description: '1 year partner access for speech therapists',
  },
  {
    code: 'FREEMONTH',
    durationDays: 30,
    description: '1 month trial promotion',
  },
  {
    code: 'SPEASO30',
    durationDays: 30,
    description: '30 days campaign voucher',
  },
];

export interface RedeemResult {
  success: boolean;
  code?: string;
  expiresAt?: string | null;
  error?: 'invalid' | 'expired' | 'referral_already_used' | 'active_store_trial' | 'max_uses_reached' | 'already_redeemed';
}

/** Returns the user's personal shareable gift code (e.g. GIFT-SPE-8492). */
export function userReferralCode(installId: string): string {
  return `GIFT-${patientPairingCode(installId)}`;
}

export async function redeemPromoCode(input: string): Promise<RedeemResult> {
  const normalized = input.toUpperCase().trim();
  if (!normalized) return { success: false, error: 'invalid' };

  const { subscription, user, installId, setUser, unlockPromo } = useStore.getState();

  // Guard: if user currently has an active App Store trial, they shouldn't consume a gift code
  if (subscription.isPremium && subscription.isTrial) {
    return { success: false, error: 'active_store_trial' };
  }

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // 1. Online: Supabase Managed VIP Promo Codes with single-use quota enforcement
  if (url && key) {
    try {
      const res = await fetch(`${url}/rest/v1/rpc/redeem_vip_code`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_code: normalized, p_install_id: installId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          let expiresAt: string | null = null;
          if (typeof data.duration_days === 'number') {
            const d = new Date();
            d.setDate(d.getDate() + data.duration_days);
            expiresAt = d.toISOString();
          }
          unlockPromo(data.code || normalized, expiresAt);
          trackEvent('promo_code_redeem', { code: data.code || normalized, source: 'supabase_vip' });
          return { success: true, code: data.code || normalized, expiresAt };
        } else if (data && data.error && data.error !== 'invalid') {
          return { success: false, error: data.error };
        }
      }
    } catch {
      // Offline fallback: continue checking local codes
    }
  }

  // 2. Built-in promo codes (offline fallback)
  const match = PROMO_CODES.find((p) => p.code === normalized);
  if (match) {
    let expiresAt: string | null = null;
    if (match.fixedExpiration) {
      if (new Date(match.fixedExpiration).getTime() <= Date.now()) {
        return { success: false, error: 'expired' };
      }
      expiresAt = match.fixedExpiration;
    } else if (match.durationDays !== null) {
      const d = new Date();
      d.setDate(d.getDate() + match.durationDays);
      expiresAt = d.toISOString();
    }

    unlockPromo(match.code, expiresAt);
    trackEvent('promo_code_redeem', { code: match.code, referral: false });
    return { success: true, code: match.code, expiresAt };
  }

  // 3. Peer Referral Gift Codes (e.g. GIFT-SPE-8492)
  if (normalized.startsWith('GIFT-') && normalized.length >= 8) {
    const ownCode = userReferralCode(installId);
    if (normalized === ownCode) {
      return { success: false, error: 'invalid' };
    }
    // Anti-abuse: a user can only redeem a friend's referral gift once
    if (user.hasRedeemedReferral) {
      return { success: false, error: 'referral_already_used' };
    }
    const d = new Date();
    d.setDate(d.getDate() + 30); // 30 days free gift
    const expiresAt = d.toISOString();

    unlockPromo(normalized, expiresAt);
    setUser({ hasRedeemedReferral: true });
    trackEvent('promo_code_redeem', { code: normalized, referral: true });
    return { success: true, code: normalized, expiresAt };
  }

  return { success: false, error: 'invalid' };
}


