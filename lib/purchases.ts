import { Platform } from 'react-native';

const IOS_KEY = 'test_IKPSNPtpWUCoqYmZmKYHGlOKMjy';
const ANDROID_KEY = 'test_IKPSNPtpWUCoqYmZmKYHGlOKMjy';

// RevenueCat is a native module — not available in Expo Go.
// We lazy-import it so the app doesn't crash during UI testing.
let RC: typeof import('react-native-purchases').default | null = null;
let initialized = false;

function getRC() {
  if (!RC) {
    try {
      RC = require('react-native-purchases').default;
    } catch {
      console.warn('[RC] react-native-purchases not available (Expo Go). Purchases disabled.');
    }
  }
  return RC;
}

export function initPurchases() {
  if (initialized) return;
  const Purchases = getRC();
  if (!Purchases) return;
  try {
    const { LOG_LEVEL } = require('react-native-purchases');
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY });
    initialized = true;
  } catch (e) {
    console.warn('[RC] configure failed:', e);
  }
}

export async function getOfferings() {
  const Purchases = getRC();
  if (!Purchases) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.warn('[RC] getOfferings:', e);
    return null;
  }
}

export async function purchasePackage(pkg: any) {
  const Purchases = getRC();
  if (!Purchases) throw new Error('Purchases not available');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases() {
  const Purchases = getRC();
  if (!Purchases) return null;
  return Purchases.restorePurchases();
}

export async function isPremiumActive(): Promise<boolean> {
  const Purchases = getRC();
  if (!Purchases) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active['premium'] !== undefined;
  } catch {
    return false;
  }
}
