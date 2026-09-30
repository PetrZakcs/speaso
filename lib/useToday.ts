import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { toDateKey, type DateKey } from './dates';

/** Today's DateKey, refreshed whenever the app comes back to the foreground. */
export function useToday(): DateKey {
  const [today, setToday] = useState(toDateKey);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(toDateKey());
    });
    return () => sub.remove();
  }, []);
  return today;
}
