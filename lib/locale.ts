import * as Localization from 'expo-localization';

export type SupportedLang = 'cs' | 'en';

/** Czech for Czech and Slovak devices, English for everyone else. */
export function detectDeviceLanguage(): SupportedLang {
  const code = Localization.getLocales()[0]?.languageCode;
  return code === 'cs' || code === 'sk' ? 'cs' : 'en';
}
