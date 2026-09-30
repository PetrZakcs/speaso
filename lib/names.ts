import type { SupportedLang } from './locale';
import { toVocative } from './vocative';

/** How to address the user in a greeting — Czech uses the vocative case. */
export function addressName(name: string, lang: SupportedLang): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return lang === 'cs' ? toVocative(trimmed) : trimmed;
}

export function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'S';
}
