// phq9Steps.js — Patient Health Questionnaire (PHQ-9)

export const OPTIONS = [
  { label: "Not at all",          score: 0 },
  { label: "Several days",        score: 1 },
  { label: "More than half the days", score: 2 },
  { label: "Nearly every day",    score: 3 },
];

export const QUESTIONS = [
  { key: "q1", text: "Little interest or pleasure in doing things" },
  { key: "q2", text: "Feeling down, depressed, or hopeless" },
  { key: "q3", text: "Trouble falling or staying asleep, or sleeping too much" },
  { key: "q4", text: "Feeling tired or having little energy" },
  { key: "q5", text: "Poor appetite or overeating" },
  { key: "q6", text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down" },
  { key: "q7", text: "Trouble concentrating on things, such as reading the newspaper or watching television" },
  { key: "q8", text: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual" },
  { key: "q9", text: "Thoughts that you would be better off dead or of hurting yourself in some way" },
];

export const DIFFICULTY_OPTIONS = [
  "Not difficult at all",
  "Somewhat difficult",
  "Very difficult",
  "Extremely difficult",
];

export const STEPS = [
  { type: "info" },
  ...QUESTIONS.map((q, i) => ({ type: "question", questionIndex: i, ...q })),
  { type: "difficulty" },
  { type: "thankyou" },
];

export const TOTAL_STEPS   = STEPS.length;
export const THANKYOU_STEP = STEPS.findIndex(s => s.type === "thankyou");
