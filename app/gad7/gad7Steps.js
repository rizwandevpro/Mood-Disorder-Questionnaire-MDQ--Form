// ─────────────────────────────────────────────────────────────────────────────
// gad7Steps.js — GAD-7 Anxiety form step definitions
// ─────────────────────────────────────────────────────────────────────────────

export const OPTIONS = [
  { label: "Not at all",             score: 0 },
  { label: "Several days",           score: 1 },
  { label: "More than half the days",score: 2 },
  { label: "Nearly every day",       score: 3 },
];

export const QUESTIONS = [
  { key: "q1", text: "Feeling nervous, anxious, or on edge" },
  { key: "q2", text: "Not being able to stop or control worrying" },
  { key: "q3", text: "Worrying too much about different things" },
  { key: "q4", text: "Trouble relaxing" },
  { key: "q5", text: "Being so restless that it is hard to sit still" },
  { key: "q6", text: "Becoming easily annoyed or irritable" },
  { key: "q7", text: "Feeling afraid, as if something awful might happen" },
];

export const DIFFICULTY_OPTIONS = [
  "Not difficult at all",
  "Somewhat difficult",
  "Very difficult",
  "Extremely difficult",
];

// Steps: info → questions (one per step, auto-advance) → difficulty → thankyou
export const STEPS = [
  { type: "info" },
  ...QUESTIONS.map((q, i) => ({ type: "question", questionIndex: i, ...q })),
  { type: "difficulty" },
  { type: "thankyou" },
];

export const TOTAL_STEPS   = STEPS.length;
export const THANKYOU_STEP = STEPS.findIndex(s => s.type === "thankyou");
