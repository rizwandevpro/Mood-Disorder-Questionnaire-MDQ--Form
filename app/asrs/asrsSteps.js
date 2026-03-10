// ─────────────────────────────────────────────────────────────────────────────
// asrsSteps.js — Adult ADHD Self-Report Scale v1.1 (ASRS) step definitions
//
// Scoring: each option is 0 or 1, varying per question (read from the form).
// scores array = [Never, Rarely, Sometimes, Often, Very Often]
// ─────────────────────────────────────────────────────────────────────────────

export const OPTION_LABELS = ["Never", "Rarely", "Sometimes", "Often", "Very Often"];

// Part A = Q1–Q6, Part B = Q7–Q18
// scores: [Never, Rarely, Sometimes, Often, Very Often]
export const QUESTIONS = [
  { key:"q1",  part:"A", scores:[0,0,1,1,1], text:"How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?" },
  { key:"q2",  part:"A", scores:[0,0,1,1,1], text:"How often do you have difficulty getting things in order when you have to do a task that requires organisation?" },
  { key:"q3",  part:"A", scores:[0,0,1,1,1], text:"How often do you have problems remembering appointments or obligations?" },
  { key:"q4",  part:"A", scores:[0,0,0,1,1], text:"When you have a task that requires a lot of thought, how often do you avoid or delay getting started?" },
  { key:"q5",  part:"A", scores:[0,0,0,1,1], text:"How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?" },
  { key:"q6",  part:"A", scores:[0,0,0,1,1], text:"How often do you feel overly active and compelled to do things, like you were driven by a motor?" },
  { key:"q7",  part:"B", scores:[0,0,0,1,1], text:"How often do you make careless mistakes when you have to work on a boring or difficult project?" },
  { key:"q8",  part:"B", scores:[0,0,0,1,1], text:"How often do you have difficulty keeping your attention when you are doing boring or repetitive work?" },
  { key:"q9",  part:"B", scores:[0,0,1,1,1], text:"How often do you have difficulty concentrating on what people say to you, even when they are speaking to you directly?" },
  { key:"q10", part:"B", scores:[0,0,0,1,1], text:"How often do you misplace or have difficulty finding things at home or at work?" },
  { key:"q11", part:"B", scores:[0,0,0,1,1], text:"How often are you distracted by activity or noise around you?" },
  { key:"q12", part:"B", scores:[0,0,1,1,1], text:"How often do you leave your seat in meetings or other situations in which you are expected to remain seated?" },
  { key:"q13", part:"B", scores:[0,0,0,1,1], text:"How often do you feel restless or fidgety?" },
  { key:"q14", part:"B", scores:[0,0,0,1,1], text:"How often do you have difficulty unwinding and relaxing when you have time to yourself?" },
  { key:"q15", part:"B", scores:[0,0,0,1,1], text:"How often do you find yourself talking too much when you are in social situations?" },
  { key:"q16", part:"B", scores:[0,0,1,1,1], text:"When you're in a conversation, how often do you find yourself finishing the sentences of the people you are talking to, before they can finish them themselves?" },
  { key:"q17", part:"B", scores:[0,0,0,1,1], text:"How often do you have difficulty waiting your turn in situations when turn taking is required?" },
  { key:"q18", part:"B", scores:[0,0,1,1,1], text:"How often do you interrupt others when they are busy?" },
];

// Steps: info → Q1–Q18 (one per step, auto-advance) → thankyou
export const STEPS = [
  { type: "info" },
  ...QUESTIONS.map((q, i) => ({ type: "question", questionIndex: i, ...q })),
  { type: "thankyou" },
];

export const TOTAL_STEPS   = STEPS.length;
export const THANKYOU_STEP = STEPS.findIndex(s => s.type === "thankyou");