import { useEffect, useState } from 'react';

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const interval = window.setInterval(sync, 1000);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); window.clearInterval(interval); };
  }, []);
  return online;
}
