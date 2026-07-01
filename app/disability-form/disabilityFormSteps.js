// ─────────────────────────────────────────────────────────────────────────────
// quickConsentSteps.js — data for the Cancellation & No-Show Policy form
//
// STEP STRUCTURE (3 steps):
//   Step 0 — consent    (title + policy text + email field)
//   Step 1 — signature  (patient initials + date)
//   Step 2 — thankyou
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TITLE     = "Cancellation & No-Show Policy";
export const EFFECTIVE_DATE = "(Effective July 1st, 2026)";

export const INTRO_PARAGRAPHS = [
  "At Cambridge Psychiatry and Behavioral Institute, our goal is to provide quality care to all our patients in a timely manner. No-shows and late cancellations inconvenience those patients who need access to medical care.",
  "We understand that circumstances arise that may prevent you from keeping your appointment; however, we kindly ask for your cooperation with our policy.",
];

export const SECTIONS = [
  {
    heading: "Policy Guidelines",
    items: [
      {
        bold: "24-Hour Notice Required:",
        text: "If you need to cancel or reschedule your appointment, please notify us at least 24 hours in advance.",
      },
      {
        bold: "Late Cancellations & No-Shows:",
        text: "If you cancel your appointment with less than 24 hours' notice, or if you miss your scheduled appointment entirely (No-Show), a $50.00 fee will be charged to your account.",
      },
      {
        bold: "How to Cancel:",
        text: "You can cancel or reschedule your appointment by calling our office or through our patient portal. If you reach our voicemail, please leave a detailed message.",
      },
    ],
  },
  {
    heading: "Important Notes",
    items: [
      { text: "Cancellation fees are not covered by insurance providers and will be the sole responsibility of the patient." },
      { text: "This fee must be paid prior to scheduling or attending your next appointment." },
      { text: "We understand that true emergencies happen. A one-time waiver may be considered at the discretion of management for extraordinary circumstances." },
    ],
  },
];

export const CLOSING_LINES = [
  "Sincerely,",
  "Cambridge Psychiatry and Behavioral Institute",
];

export const STEPS = [
  { type: "consent" },   // policy text + email field
  { type: "signature" }, // patient initials + date
  { type: "thankyou" },
];

export const TOTAL_STEPS   = STEPS.length;
export const THANKYOU_STEP = STEPS.findIndex((s) => s.type === "thankyou");
