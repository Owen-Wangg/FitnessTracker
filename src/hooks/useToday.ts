import { useEffect, useState } from 'react';
import { formatLocalDate } from '../utils/workoutMetrics';

// Wait a moment past midnight so the clock has definitely rolled over.
const PAST_MIDNIGHT_MS = 1000;

const msUntilMidnight = (now: Date): number =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

// Today's date as 'YYYY-MM-DD' in the user's time zone. Unlike reading the date once, this keeps
// "today" right when the app is left open overnight: it updates just after midnight, and again
// whenever the tab or phone comes back to the foreground (timers are paused while a device sleeps).
export const useToday = (): string => {
  const [today, setToday] = useState(() => formatLocalDate(new Date()));

  useEffect(() => {
    const refresh = () => setToday(formatLocalDate(new Date()));
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    let timer: ReturnType<typeof setTimeout>;
    const scheduleNextMidnight = () => {
      timer = setTimeout(() => {
        refresh();
        scheduleNextMidnight();
      }, msUntilMidnight(new Date()) + PAST_MIDNIGHT_MS);
    };
    scheduleNextMidnight();

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return today;
};
