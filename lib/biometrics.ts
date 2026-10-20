import * as LocalAuthentication from 'expo-local-authentication';

export type BiometryType = 'FACE_ID' | 'TOUCH_ID' | 'FINGERPRINT' | 'IRIS' | 'PIN' | 'NONE';

export interface BiometricsAvailability {
  available: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  biometryType: BiometryType;
}

/**
 * Checks if the device has biometric hardware and if the user has enrolled
 * credentials (Face ID, Touch ID, Fingerprint, Iris or passcode).
 */
export async function checkBiometricsAvailability(): Promise<BiometricsAvailability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometryType: BiometryType = 'NONE';
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometryType = 'FACE_ID';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometryType = 'TOUCH_ID';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometryType = 'IRIS';
    } else if (hasHardware && isEnrolled) {
      biometryType = 'PIN';
    }

    return {
      available: hasHardware && isEnrolled,
      hasHardware,
      isEnrolled,
      biometryType,
    };
  } catch {
    return {
      available: false,
      hasHardware: false,
      isEnrolled: false,
      biometryType: 'NONE',
    };
  }
}

/**
 * Authenticate the user using Face ID, Touch ID or device PIN passcode.
 */
export async function authenticateWithBiometrics(promptMessage = 'Odemknout Speaso'): Promise<boolean> {
  try {
    const { available } = await checkBiometricsAvailability();
    if (!available) {
      // In simulator or environments without enrolled biometrics, don't trap the user
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Zrušit',
      fallbackLabel: 'Použít kód',
      disableDeviceFallback: false,
    });

    return !!result.success;
  } catch {
    return false;
  }
}
