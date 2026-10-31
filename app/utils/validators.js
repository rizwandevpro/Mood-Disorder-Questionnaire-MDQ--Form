// ─────────────────────────────────────────────────────────────────────────────
// app/utils/validators.js — one phone / zip rule for every form
//
// PHONE (US): 10 digits, area code starting 2–9. A leading "1" / "+1"
// country code is accepted and dropped. Displayed as (555) 123-4567.
// ZIP (US):   5 digits, or ZIP+4 as 12345-6789.
//
// The *Input functions run on every keystroke: letters can't be typed at all.
// The isValid* functions run on Next/Submit: incomplete numbers are rejected.
// ─────────────────────────────────────────────────────────────────────────────

export const PHONE_ERROR = "Enter a valid 10-digit phone number, e.g. (555) 123-4567.";
export const ZIP_ERROR   = "Enter a valid 5-digit zip code (or ZIP+4, e.g. 48185-1234).";

function phoneDigits(v) {
  let d = String(v || "").replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("1")) d = d.slice(1); // drop +1 country code
  if (d.length <= 10 && d.startsWith("1")) d = d.slice(1); // US area codes never start with 1
  return d.slice(0, 10);
}

export function formatPhone(v) {
  const d = phoneDigits(v);
  if (!d) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// prev = the field's current value. When the user is deleting, keep their
// raw text (minus letters) so backspace never gets "stuck" on ( ) or -.
export function formatPhoneInput(next, prev = "") {
  const clean = String(next || "").replace(/[^\d()\-\s.+]/g, "");
  if (clean.length < String(prev || "").length) return clean;
  return formatPhone(clean);
}

export function isValidPhone(v) {
  return /^[2-9]\d{9}$/.test(phoneDigits(v)) &&
         String(v || "").replace(/[\d()\-\s.+]/g, "") === "";
}

export function formatZipInput(next) {
  const d = String(next || "").replace(/\D/g, "").slice(0, 9);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function isValidZip(v) {
  return /^\d{5}(-\d{4})?$/.test(String(v || "").trim());
}

// ── Number-only inputs ──────────────────────────────────────────────────────
// Used on every keystroke: letters/symbols can't be typed at all.
export function digitsOnly(v, maxLen = 10) {
  return String(v ?? "").replace(/\D/g, "").slice(0, maxLen);
}

// Checked on Next/Submit. Returns an error string or null. Empty = OK
// (required-ness is checked separately).
export function rangeError(v, min, max, label = "value") {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (!/^\d+$/.test(s)) return `Enter numbers only.`;
  const n = Number(s);
  if (n < min || n > max) return `Please enter a valid ${label} (${min}–${max}).`;
  return null;
}

export const CURRENT_YEAR = new Date().getFullYear();
export function yearError(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (!/^\d{4}$/.test(s)) return "Enter a 4-digit year, e.g. 2015.";
  return rangeError(s, 1900, CURRENT_YEAR, "year");
}

// M/F style single-letter fields
export function oneOfLetters(v, allowed = "MF") {
  const c = String(v ?? "").toUpperCase().replace(new RegExp(`[^${allowed}]`, "g"), "");
  return c.slice(-1);
}

// ── Date of birth ───────────────────────────────────────────────────────────
// Minimum patient age (clinic decision: 17+). Change here only — used by the
// intro screen, the Intake DOB, and the date-picker limit.
export const MIN_PATIENT_AGE = 17;
export const MAX_PATIENT_AGE = 120;

function localISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function ageOn(dobISO, todayISO) {
  const [by, bm, bd] = dobISO.split("-").map(Number);
  const [ty, tm, td] = todayISO.split("-").map(Number);
  let a = ty - by;
  if (tm < bm || (tm === bm && td < bd)) a -= 1;
  return a;
}
// Latest allowed birth date (today minus MIN_PATIENT_AGE years) — for <input max=…>
export function maxDobISO(today = localISO()) {
  const [y, m, d] = today.split("-");
  return `${Number(y) - MIN_PATIENT_AGE}-${m}-${d}`;
}
// Returns an error string or null. "YYYY-MM-DD" input (from <input type="date">).
export function dobError(dobISO, today = localISO()) {
  const v = String(dobISO || "").trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "Please enter a valid date of birth.";
  if (v > today) return "Date of birth can't be in the future.";
  const a = ageOn(v, today);
  if (a < MIN_PATIENT_AGE) return `Our clinic sees patients ${MIN_PATIENT_AGE} and older. Please check the date of birth, or call our office.`;
  if (a > MAX_PATIENT_AGE) return "Please check the year of birth.";
  return null;
}
