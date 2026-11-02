import { useEffect, useState } from 'react';
import { getApiTarget } from '../services/connection';
import { getNodeStatus } from '../services/connection';

export function useNodeStatus() {
  const [state, setState] = useState({ status: null, error: null, loading: true });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const status = await getNodeStatus();
        if (active) setState({ status, error: null, loading: false });
      } catch {
        if (active) setState({ status: null, error: 'unavailable', loading: false });
      }
    };
    load();
    const interval = window.setInterval(load, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return { ...state, target: getApiTarget() };
}
