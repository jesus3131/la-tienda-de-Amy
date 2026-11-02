const LOCAL_API_STORAGE_KEY = 'localApiUrl';
const TARGET_STORAGE_KEY = 'apiTarget';

function normalizeApiUrl(value) {
  return value?.trim().replace(/\/+$/, '') || '';
}

export function getCentralApiUrl() {
  return normalizeApiUrl(import.meta.env.VITE_API_URL);
}

export function getLocalApiUrl() {
  return normalizeApiUrl(localStorage.getItem(LOCAL_API_STORAGE_KEY) || import.meta.env.VITE_LOCAL_API_URL);
}

export function getApiTarget() {
  if (import.meta.env.PROD && localStorage.getItem(TARGET_STORAGE_KEY) === 'local' && import.meta.env.VITE_ALLOW_LOCAL_TARGET !== 'true') {
    return 'central';
  }
  return localStorage.getItem(TARGET_STORAGE_KEY) === 'local' ? 'local' : 'central';
}

export function setApiTarget(target) {
  if (target !== 'local' && target !== 'central') throw new Error('Invalid API target');
  if (import.meta.env.PROD && target === 'local' && import.meta.env.VITE_ALLOW_LOCAL_TARGET !== 'true') {
    throw new Error('Local API target is disabled in production');
  }
  localStorage.setItem(TARGET_STORAGE_KEY, target);
}

export function getSelectedApiUrl() {
  const target = getApiTarget();
  const url = target === 'local' ? getLocalApiUrl() : getCentralApiUrl();
  if (!url && target === 'local') throw new Error('Local API URL is not configured');
  return url;
}

export async function probeLocalApi(timeoutMs = 1500) {
  const localUrl = getLocalApiUrl();
  if (!localUrl) return false;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${localUrl}/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function getNodeStatus(timeoutMs = 2000) {
  const apiUrl = getSelectedApiUrl();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${apiUrl}/sync/status`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Node status unavailable');
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}
