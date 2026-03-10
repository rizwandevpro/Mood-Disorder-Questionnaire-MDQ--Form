// hipaaSteps.js — HIPAA Compliance Patient Consent Form

export const STEPS = [
  { type: "consent" },   // show full text + YES/NO questions
  { type: "signature" }, // print name + signature + date
  { type: "thankyou" },
];

export const TOTAL_STEPS   = STEPS.length;
export const THANKYOU_STEP = STEPS.findIndex(s => s.type === "thankyou");

export const YES_NO_QUESTIONS = [
  { key: "q1", text: "May we phone, email, or send a text to you to confirm appointments?" },
  { key: "q2", text: "May we leave a message on your answering machine at home or on your cell phone?" },
  { key: "q3", text: "May we discuss your medical condition with any member of your family?" },
];
