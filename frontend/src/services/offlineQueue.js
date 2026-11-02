const DB_NAME = 'erp-pos-offline';
const STORE_NAME = 'sales';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('createdAt', 'createdAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueSale(payload) {
  const db = await openDb();
  const sale = {
    id: globalThis.crypto.randomUUID(),
    payload: { ...payload, idempotencyKey: payload.idempotencyKey || globalThis.crypto.randomUUID() },
    status: 'pending',
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  };
  await new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).add(sale);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
  db.close();
  return sale;
}

export async function migrateLegacySales() {
  const raw = localStorage.getItem('pendingSales');
  if (!raw) return;
  let legacy;
  try {
    legacy = JSON.parse(raw);
  } catch {
    localStorage.removeItem('pendingSales');
    return;
  }
  if (!Array.isArray(legacy)) return;
  for (const payload of legacy) await enqueueSale(payload);
  localStorage.removeItem('pendingSales');
}

export async function listPendingSales() {
  const db = await openDb();
  const result = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).index('status').getAll('pending');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function updateQueuedSale(sale, changes) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put({ ...sale, ...changes });
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
  db.close();
}

export async function removeQueuedSale(id) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
  db.close();
}
