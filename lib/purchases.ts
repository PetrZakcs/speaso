import { Linking, Platform } from 'react-native';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import { useStore } from '../state/store';
import { BETA_ALL_ACCESS } from './beta';
import { cancelTrialReminder, scheduleTrialReminder } from './reminders';

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const ENTITLEMENT_ID = 'premium';

// RevenueCat Test Store key — only ever used in development builds.
const DEV_TEST_KEY = 'test_IKPSNPtpWUCoqYmZmKYHGlOKMjy';

function apiKey(): string | undefined {
  const key = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  });
  return key || (__DEV__ ? DEV_TEST_KEY : undefined);
}

type RCModule = typeof import('react-native-purchases').default;
let RC: RCModule | null = null;
let configured = false;

function getRC(): RCModule | null {
  if (!RC) {
    try {
      RC = require('react-native-purchases').default;
    } catch {
      console.warn('[RC] react-native-purchases is not available in this runtime.');
    }
  }
  return RC;
}

function requireRC(): RCModule {
  const Purchases = getRC();
  if (!Purchases || !configured) throw new Error('PURCHASES_UNAVAILABLE');
  return Purchases;
}

/** Mirrors the entitlement into the store — preserving active promos if Store has no entitlement. */
function applyCustomerInfo(info: CustomerInfo) {
  const ent = info.entitlements.active[ENTITLEMENT_ID];
  const current = useStore.getState().subscription;

  if (ent) {
    const isTrial = ent.periodType === 'TRIAL';
    const expiresAt = ent.expirationDate ?? null;
    useStore.getState().setSubscription({
      isPremium: true,
      isTrial,
      expiresAt,
      promoCode: null,
    });
    const task = isTrial && expiresAt
      ? scheduleTrialReminder(expiresAt, useStore.getState().language)
      : cancelTrialReminder();
    task.catch((e) => console.warn('[RC] trial reminder failed:', e));
  } else {
    // If no store subscription is active, preserve any active unexpired promo code
    const isPromoActive =
      !!current.promoCode &&
      (!current.expiresAt || new Date(current.expiresAt).getTime() > Date.now());

    if (isPromoActive) {
      useStore.getState().setSubscription({
        isPremium: true,
        isTrial: false,
        expiresAt: current.expiresAt,
        promoCode: current.promoCode,
      });
    } else {
      useStore.getState().setSubscription({
        isPremium: false,
        isTrial: false,
        expiresAt: null,
        promoCode: null,
      });
    }
    cancelTrialReminder().catch(() => {});
  }
}

/** Configures RevenueCat and keeps the store in sync with the entitlement. */
export function initPurchases() {
  if (configured) return;
  if (BETA_ALL_ACCESS) {
    // Closed beta: everything unlocked, no store involved.
    useStore.getState().setSubscription({ isPremium: true, isTrial: false, expiresAt: null });
    return;
  }
  const Purchases = getRC();
  const key = apiKey();
  if (!Purchases || !key) {
    console.warn('[RC] Purchases disabled: missing native module or API key.');
    return;
  }
  try {
    Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: key });
    configured = true;
    Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
    // Offline: keep the cached entitlement until RevenueCat answers.
    Purchases.getCustomerInfo().then(applyCustomerInfo).catch(() => { });
  } catch (e) {
    console.warn('[RC] configure failed:', e);
  }
}

export function purchasesAvailable() {
  return configured;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await requireRC().getOfferings();
  return offerings.current;
}

/**
 * Product ids whose free trial / intro offer the user can still get.
 * iOS asks StoreKit; on Android Google only returns offers the user is
 * eligible for, so the presence of `introPrice` is enough.
 */
export async function getTrialEligibility(packages: PurchasesPackage[]): Promise<Set<string>> {
  const withIntro = packages.filter((p) => p.product.introPrice);
  if (Platform.OS !== 'ios') return new Set(withIntro.map((p) => p.product.identifier));
  const Purchases = requireRC();
  const result = await Purchases.checkTrialOrIntroductoryPriceEligibility(
    withIntro.map((p) => p.product.identifier),
  );
  return new Set(
    Object.entries(result)
      .filter(([, e]) => e.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE)
      .map(([id]) => id),
  );
}

export type PurchaseOutcome = 'success' | 'cancelled' | 'pending';

export async function purchase(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  const Purchases = requireRC();
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyCustomerInfo(customerInfo);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] ? 'success' : 'pending';
  } catch (e: any) {
    if (e?.userCancelled || e?.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return 'cancelled';
    }
    throw e;
  }
}

/** Returns true when an active Premium entitlement was restored. */
export async function restorePurchases(): Promise<boolean> {
  const info = await requireRC().restorePurchases();
  applyCustomerInfo(info);
  return !!info.entitlements.active[ENTITLEMENT_ID];
}

const STORE_SUBSCRIPTIONS_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  default: 'https://play.google.com/store/account/subscriptions',
});

export async function manageSubscription() {
  try {
    await requireRC().showManageSubscriptions();
  } catch {
    await Linking.openURL(STORE_SUBSCRIPTIONS_URL);
  }
}

/**
 * Presents Apple's native Offer Code redemption sheet on iOS.
 */
export async function presentCodeRedemptionSheet() {
  if (Platform.OS === 'ios') {
    try {
      const Purchases = requireRC();
      if (typeof (Purchases as any).presentCodeRedemptionSheet === 'function') {
        await (Purchases as any).presentCodeRedemptionSheet();
      }
    } catch (e) {
      console.warn('[RC] presentCodeRedemptionSheet failed:', e);
    }
  }
}
