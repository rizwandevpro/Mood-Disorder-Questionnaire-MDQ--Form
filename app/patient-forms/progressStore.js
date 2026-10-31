// ─────────────────────────────────────────────────────────────────────────────
// app/patient-forms/progressStore.js — save progress on THIS device for 48 h
//
// Stores answers (incl. ID/insurance photos and signatures) in IndexedDB, not
// localStorage: the photos alone are ~1 MB and localStorage is capped at ~5 MB
// (less on some iPhones) and is synchronous.
//
// What is saved:  info, per-form answers, steps, current stage, completed forms
// What is NOT:    generated PDFs — they are rebuilt from the answers on resume,
//                 so a next-day resume needs no saved PDF and can't hit a
//                 stale-PDF error.
//
// Privacy: this is health information on the patient's own device. It is
// deleted (1) as soon as the forms are sent, (2) on "Start over" / "Start
// fresh", (3) automatically after 48 hours.
// ─────────────────────────────────────────────────────────────────────────────

const DB_NAME   = "cambridge-patient-forms";
const STORE     = "progress";
const KEY       = "current";
const VERSION   = 1;              // bump if the saved shape changes incompatibly
export const MAX_AGE_MS = 48 * 60 * 60 * 1000;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t   = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(req?.result); };
    t.onerror    = () => { db.close(); reject(t.error); };
    t.onabort    = () => { db.close(); reject(t.error); };
  });
}

export async function saveProgress(state) {
  try {
    await tx("readwrite", (s) => s.put({ ...state, v: VERSION, savedAt: Date.now() }, KEY));
    return true;
  } catch (e) {
    console.warn("[progress] save failed:", e?.message);  // private mode / quota — not fatal
    return false;
  }
}

// Returns the saved state, or null if none / expired / incompatible.
export async function loadProgress() {
  try {
    const saved = await tx("readonly", (s) => s.get(KEY));
    if (!saved) return null;
    if (saved.v !== VERSION || !saved.savedAt || Date.now() - saved.savedAt > MAX_AGE_MS) {
      await clearProgress();
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

export async function clearProgress() {
  try { await tx("readwrite", (s) => s.delete(KEY)); } catch { /* nothing saved */ }
}
