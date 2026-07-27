// ─────────────────────────────────────────────────────────────────────────────
// triageSteps.js — Psychotherapy Triage Questions
//
// STEPS (one question per step):
//   0 — info   (Name, Phone, Email, Date — collected before the questions)
//   1 — Q1
//   2 — Q2
//   3 — Q3
//   4 — Q4
//   5 — Q5
//   6 — thankyou
//
// The source form is a single page — all 5 answers still render onto one
// page image / one-page PDF at the end. Splitting into steps only affects
// the wizard UI, not the final PDF layout.
//
// Q1, Q2, Q4, Q5 are SINGLE-select ("check the option that best applies").
// Q3 is MULTI-select (explicitly "Choose all that apply" on the form).
// Any question with hasOther:true shows a text input when "Other" is checked.
// ─────────────────────────────────────────────────────────────────────────────

export const TQ_QUESTIONS = [
  {
    id: "q1",
    key: "ptqQ1",              // single-select answer key
    type: "single",
    title: "1. Since your last visit, what has been your biggest challenge?",
    options: [
      "Anxiety or excessive worry",
      "Relationship or family problems",
      "Anger or irritability",
      "Depression or low mood",
      "Grief or loss",
      "ADHD/executive functioning",
      "Stress from work or school",
      "Trauma or PTSD symptoms",
      "Other",
    ],
    hasOther: true,
    otherKey: "ptqQ1Other",
  },
  {
    id: "q2",
    key: "ptqQ2",
    type: "single",
    title: "2. How much has this affected your daily life?",
    options: ["Not at all", "A little", "Moderately", "Severely"],
  },
  {
    id: "q3",
    type: "multi",              // multi-select — uses per-option boolean keys (ptqQ3_<Option>)
    title: "3. How have you been coping?",
    subtitle: "Choose all that apply",
    options: [
      "Healthy coping (exercise, prayer, meditation, hobbies)",
      "Talking with family or friends",
      "Counseling or therapy skills",
      "Avoiding situations",
      "Alcohol or drug use",
      "No coping strategies",
      "Other",
    ],
    hasOther: true,
    otherKey: "ptqQ3Other",
    otherOptionLabel: "Other",
  },
  {
    id: "q4",
    key: "ptqQ4",
    type: "single",
    title: "4. What would you most like to improve today?",
    options: [
      "Reduce anxiety",
      "Improve mood",
      "Improve focus/concentration",
      "Better sleep",
      "Improve relationships",
      "Manage stress",
      "Better emotional control",
      "Increase motivation",
      "Other",
    ],
    hasOther: true,
    otherKey: "ptqQ4Other",
  },
  {
    id: "q5",
    key: "ptqQ5",
    type: "single",
    title: "5. Which thoughts have been bothering you the most?",
    options: [
      "Excessive worrying",
      "Negative thoughts about myself",
      "Feeling hopeless",
      "Racing thoughts",
      "Intrusive or unwanted thoughts",
      "Anger or resentment",
      "None of the above",
      "Other",
    ],
    hasOther: true,
    otherKey: "ptqQ5Other",
  },
];

// Helper: sanitize an option label into a safe object key fragment,
// mirroring the cond_<Name> convention used in the Health History form.
export function tqSanitize(label) {
  return label.replace(/[^a-zA-Z0-9]/g, "_");
}

// Multi-select boolean key for a given question + option (Q3 only, currently).
export function tqMultiKey(questionId, option) {
  return `ptq_${questionId}_${tqSanitize(option)}`;
}

export const TQ_INFO_STEP        = 0;
export const TQ_QUESTIONS_START  = 1;                                   // step index of Q1
export const TQ_THANKYOU_STEP    = TQ_QUESTIONS_START + TQ_QUESTIONS.length; // = 6
export const TQ_TOTAL_STEPS      = TQ_THANKYOU_STEP + 1;                // = 7 (info + 5 Qs + thankyou)
