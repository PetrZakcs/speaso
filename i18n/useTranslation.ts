import { useCallback, useReducer, useEffect } from 'react';
import { getLang, subscribe, t as translate, setLang, type SupportedLang } from './index';

export function useTranslation() {
  const [, rerender] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const unsub = subscribe(rerender);
    return () => { unsub(); };
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => translate(key, vars),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getLang()],
  );

  const i18n = {
    language: getLang(),
    changeLanguage: (lang: SupportedLang) => setLang(lang),
  };

  return { t, i18n };
}
