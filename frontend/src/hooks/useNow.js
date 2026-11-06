import { useEffect, useState } from 'react';

/** Heure courante, rafraîchie régulièrement : les comptes à rebours changent sans recharger la page. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
