// ─────────────────────────────────────────────────────────────────────────────
// disabilityFormSteps.js — data for the Documentation and Form Completion Fees form
//
// STEP STRUCTURE (3 steps):
//   Step 0 — consent    (title + policy text + email field)
//   Step 1 — signature  (patient initials + date)
//   Step 2 — thankyou
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TITLE     = "Documentation and Form Completion Fees";
export const EFFECTIVE_DATE = "";

export const INTRO_PARAGRAPHS = [
  "At Cambridge Psychiatry and Behavioral Institute, our primary focus is providing you with the highest quality of clinical care. Due to the significant time, administrative resources, and detailed medical review required to accurately complete legal and insurance documentation, we are implementing a standard processing fee for all specialized paperwork.",
  "A fee of $50 will be charged for the preparation, completion, and submission of the following forms:",
];

export const SECTIONS = [
  {
    heading: "Covered Forms",
    items: [
      { text: "Family and Medical Leave Act (FMLA) paperwork" },
      { text: "Short-Term Disability (STD) forms" },
      { text: "Long-Term Disability (LTD) forms" },
      { text: "Any other specialized employer or insurance disability documentation" },
    ],
  },
  {
    heading: "Policy Details",
    items: [
      {
        bold: "Payment Due:",
        text: "The $50 fee is per documentation, updates, or recertifications are required to maintain your claim. This fee must be paid prior to the completion and release of the paperwork to you, your employer, or your insurance carrier.",
      },
      {
        bold: "Turnaround Time:",
        text: "Please allow up to 7  business days from the date of payment for our office to complete and submit the forms.",
      },
    ],
  },
  {
    heading: "Additional Information",
    items: [
      { text: "We appreciate your understanding and cooperation as we implement this policy to ensure our administrative team can continue to support your healthcare needs efficiently." },
      { text: "If you have any questions regarding this policy, please do not hesitate to speak with our front desk or billing coordinator." },
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
