import { useMemo } from 'react';
import { useStore } from '../state/store';
import { translate, translateList, translatePlural } from './index';

type Vars = Record<string, string | number>;

export function useTranslation() {
  const lang = useStore((s) => s.language);
  return useMemo(
    () => ({
      lang,
      t: (key: string, vars?: Vars) => translate(lang, key, vars),
      tList: (key: string) => translateList(lang, key),
      tn: (key: string, n: number, vars?: Vars) => translatePlural(lang, key, n, vars),
      /** Wraps text in the quotation marks of the current language. */
      q: (text: string) => (lang === 'cs' ? `„${text}“` : `“${text}”`),
    }),
    [lang],
  );
}
