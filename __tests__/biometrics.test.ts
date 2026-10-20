import { checkBiometricsAvailability, authenticateWithBiometrics } from '../lib/biometrics';
import * as LocalAuthentication from 'expo-local-authentication';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

describe('biometrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detects Face ID when facial recognition hardware is enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);

    const result = await checkBiometricsAvailability();
    expect(result.available).toBe(true);
    expect(result.biometryType).toBe('FACE_ID');
  });

  it('detects Touch ID when fingerprint hardware is enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);

    const result = await checkBiometricsAvailability();
    expect(result.available).toBe(true);
    expect(result.biometryType).toBe('TOUCH_ID');
  });

  it('returns unavailable when device has no biometrics enrolled', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([]);

    const result = await checkBiometricsAvailability();
    expect(result.available).toBe(false);
    expect(result.biometryType).toBe('NONE');
  });

  it('authenticates successfully via authenticateAsync', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

    const ok = await authenticateWithBiometrics('Test Prompt');
    expect(ok).toBe(true);
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ promptMessage: 'Test Prompt' }),
    );
  });

  it('returns false if authentication is cancelled or failed', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: false, error: 'user_cancel' });

    const ok = await authenticateWithBiometrics();
    expect(ok).toBe(false);
  });

  it('returns true automatically in simulator/non-enrolled environment so user is never trapped', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([]);

    const ok = await authenticateWithBiometrics();
    expect(ok).toBe(true);
  });
});
