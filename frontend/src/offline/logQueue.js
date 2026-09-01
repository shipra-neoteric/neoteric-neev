// SPEC.md §6: "Log submissions write to IndexedDB first, then sync. Show a clear
// queued state — never a spinner that fails silently." Idempotency is already handled
// server-side (POST /api/logs upserts on trainee+day), so a retry here is always safe.

const DB_NAME = 'neev-offline';
const STORE = 'log-queue';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'dayId' }); // one queued entry per day — a resubmit just replaces it
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueLog(dayId, bodyJson) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ dayId, bodyJson, queuedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedLogs() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedLog(dayId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(dayId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Call after regaining connectivity (or on load) to flush anything queued while
// offline. Silently skips entries that fail again — they stay queued for next time.
export async function syncQueuedLogs(postLog) {
  const queued = await getQueuedLogs();
  for (const entry of queued) {
    try {
      await postLog(entry.dayId, entry.bodyJson);
      await removeQueuedLog(entry.dayId);
    } catch {
      // still offline or the request failed — leave it queued, try again next time
    }
  }
}
