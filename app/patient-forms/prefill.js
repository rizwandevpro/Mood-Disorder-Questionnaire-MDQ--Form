// ─────────────────────────────────────────────────────────────────────────────
// app/patient-forms/prefill.js
//
// Maps the global "Before We Begin" info onto each form's OWN answer keys.
// Nothing here touches ImageMappers or coordinates — it only supplies values
// in the exact format each form's inputs already produce:
//   - dates      → "YYYY-MM-DD" (what <input type="date"> produces)
//   - signature  → PNG data URL from a 560×120 canvas (same as Intake/HH pads)
//   - selects    → only values that exist in that form's option list
//
// Precedence: anything the patient typed inside a form wins. A key the patient
// explicitly cleared (""/null) stays cleared — the global value is only used
// while the form's own key is still `undefined`.
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_INFO = {
  firstName: "", middleName: "", lastName: "", fullName: "",
  phone: "", email: "", location: "",
  dob: "", gender: "", maritalStatus: "", occupation: "", school: "", grade: "",
  address: "", apt: "", city: "", state: "", zip: "",
  signature: null,
  signatureMode: "draw", // "draw" | "upload" — mirrors the forms' own pads
  todayDate: "",
};

export const GENDER_OPTIONS  = ["Male", "Female", "Non-binary", "Prefer not to say"]; // = Intake options
export const MARITAL_OPTIONS = ["Single", "Married", "Divorced", "Widowed", "Separated"]; // = Intake + HH options

// Local calendar date (NOT toISOString — that is UTC and flips to "tomorrow"
// in the evening for US time zones).
export function todayISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function calcAge(dobISO, todayStr) {
  if (!dobISO || !todayStr) return "";
  const [by, bm, bd] = dobISO.split("-").map(Number);
  const [ty, tm, td] = todayStr.split("-").map(Number);
  if (!by || !ty) return "";
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age >= 0 ? String(age) : "";
}

export function buildFullName(i) {
  return [i.firstName, i.middleName, i.lastName].map(s => (s || "").trim()).filter(Boolean).join(" ");
}

function initials(i) {
  return [i.firstName, i.middleName, i.lastName]
    .map(s => (s || "").trim()[0] || "")
    .join("")
    .toUpperCase();
}

// Per-form mapping: global info → that form's keys
const MAP = {
  "hipaa-intake": (i, today, age, sig) => ({
    // Intake page 1
    firstName:      i.firstName,
    lastName:       i.lastName,
    mi:             (i.middleName || "").trim()[0]?.toUpperCase() || "",
    dob:            i.dob,
    gender:         i.gender,
    address:        i.address,
    apt:            i.apt,
    city:           i.city,
    state:          i.state,
    zip:            i.zip,
    maritalStatus:  i.maritalStatus,
    cellPhone:      i.phone,
    email:          i.email,
    clinicLocation: i.location,
    // HIPAA consent signature block
    printName:      i.fullName,
    signatureData:  sig,
    sigMode:        sig ? (i.signatureMode === "upload" ? "upload" : "draw") : undefined,
    consentDate:    today,
    // Intake signature block
    signature:      sig,
    sigDate:        today,
  }),

  "health-history": (i, today, age, sig) => {
    const [y, m, d] = (i.dob || "").split("-");
    return {
      hhName:       i.fullName,
      hhTodayDate:  today,
      hhAge:        age,
      hhBirthdateM: m || "",
      hhBirthdateD: d || "",
      hhBirthdateY: y ? y.slice(-2) : "", // form field + PDF slot are "YY"
      hhMarital:    i.maritalStatus,
      // HH only offers Male/Female — leave blank otherwise so patient chooses
      hhGender:     ["Male", "Female"].includes(i.gender) ? i.gender : "",
      hhOccupation: i.occupation,
      hhSignature:  sig,
      hhSigDate:    today,
    };
  },

  "phq9": (i, today) => ({
    patientName: i.fullName,
    patientDate: today,
  }),

  "brown-scales": (i, today, age) => ({
    patientFirst:  i.firstName,
    patientMiddle: i.middleName,
    patientLast:   i.lastName,
    patientDate:   today,
    patientBirth:  i.dob,
    patientAge:    age,
    patientSchool: i.school,
    patientGrade:  i.grade,
    // Brown PDF only has M / F boxes
    patientSex:    i.gender === "Male" ? "M" : i.gender === "Female" ? "F" : "",
  }),

  "cancellation": (i, today) => ({
    email:           i.email,
    patientInitials: initials(i),
    consentDate:     today,
  }),

  // gad7 / asrs: their PDFs have no personal-info fields
};

export function withPrefill(formId, own = {}, info) {
  const build = MAP[formId];
  if (!build) return own;

  const today = info.todayDate || todayISO();
  const age   = calcAge(info.dob, today);
  const sig   = info.signature || null;

  const out = { ...own };
  for (const [key, val] of Object.entries(build(info, today, age, sig))) {
    if (val === undefined || val === null || val === "") continue; // nothing to prefill
    if (own[key] === undefined) out[key] = val;                     // patient hasn't touched it
  }
  return out;
}
