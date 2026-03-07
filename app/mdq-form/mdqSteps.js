// ─────────────────────────────────────────────────────────────────────────────
// mdqSteps.js
//
// Pure data — no UI, no imports.
// All step definitions, question items, and label maps live here.
// Import this wherever you need question data.
// ─────────────────────────────────────────────────────────────────────────────

export const STEPS = [
  // ── Step 0: Patient Info ─────────────────────────────────────────────────
  {
    id: "info",
    type: "info",
    title: "Patient Information",
    subtitle: "Enter your details before we begin.",
    fields: [
      { key: "name", label: "Full Name", type: "text", placeholder: "Enter your full name" },
      { key: "date", label: "Date",      type: "date", placeholder: "" },
    ],
  },

  // ── Step 1: Q1 — 13 symptom sub-items ────────────────────────────────────
  {
    id: "q1",
    type: "multi_yesno",
    title: "Question 1",
    subtitle: "Has there ever been a period of time when you were NOT your usual self and…",
    hint: "Answer Yes or No for each item.",
    items: [
      { key: "q1_1",  label: "…you felt so good or so hyper that other people thought you were not your normal self, or you were so hyper that you got into trouble?" },
      { key: "q1_2",  label: "…you were so irritable that you shouted at people or started fights or arguments?" },
      { key: "q1_3",  label: "…you felt much more self-confident than usual?" },
      { key: "q1_4",  label: "…you got much less sleep than usual and found you didn't really miss it?" },
      { key: "q1_5",  label: "…you were much more talkative or spoke faster than usual?" },
      { key: "q1_6",  label: "…thoughts raced through your head or you couldn't slow your mind down?" },
      { key: "q1_7",  label: "…you were so easily distracted by things around you that you had trouble concentrating or staying on track?" },
      { key: "q1_8",  label: "…you had much more energy than usual?" },
      { key: "q1_9",  label: "…you were much more active or did many more things than usual?" },
      { key: "q1_10", label: "…you were much more social or outgoing than usual, for example, you telephoned friends in the middle of the night?" },
      { key: "q1_11", label: "…you were much more interested in sex than usual?" },
      { key: "q1_12", label: "…you did things that were unusual for you or that other people might have thought were excessive, foolish, or risky?" },
      { key: "q1_13", label: "…spending money got you or your family in trouble?" },
    ],
  },

  // ── Step 2: Q2 ────────────────────────────────────────────────────────────
  {
    id: "q2",
    type: "yesno",
    title: "Question 2",
    subtitle: "If you checked YES to more than one of the above, have several of these ever happened during the same period of time?",
    hint: "Please select one response only.",
    key: "q2",
  },

  // ── Step 3: Q3 ────────────────────────────────────────────────────────────
  {
    id: "q3",
    type: "choice4",
    title: "Question 3",
    subtitle: "How much of a problem did any of these cause you — like being able to work; having family, money, or legal troubles; getting into arguments or fights?",
    hint: "Please select one response only.",
    key: "q3",
    options: [
      { value: "no_problem",       label: "No Problem",       icon: "😌", desc: "Little to no impact on daily life" },
      { value: "minor_problem",    label: "Minor Problem",    icon: "😕", desc: "Slight disruption occasionally" },
      { value: "moderate_problem", label: "Moderate Problem", icon: "😟", desc: "Noticeable impact on daily life" },
      { value: "serious_problem",  label: "Serious Problem",  icon: "😰", desc: "Significant disruption to daily life" },
    ],
  },

  // ── Step 4: Q4 ────────────────────────────────────────────────────────────
  {
    id: "q4",
    type: "yesno",
    title: "Question 4",
    subtitle: "Have any of your blood relatives (ie, children, siblings, parents, grandparents, aunts, uncles) had manic-depressive illness or bipolar disorder?",
    hint: "Please select one response only.",
    key: "q4",
  },

  // ── Step 5: Q5 ────────────────────────────────────────────────────────────
  {
    id: "q5",
    type: "yesno",
    title: "Question 5",
    subtitle: "Has a health professional ever told you that you have manic-depressive illness or bipolar disorder?",
    hint: "Please select one response only.",
    key: "q5",
  },

  // ── Step 6: Review ────────────────────────────────────────────────────────
  {
    id: "review",
    type: "review",
    title: "Review Your Answers",
    subtitle: "Confirm everything looks correct before generating your result.",
  },
];

export const TOTAL_STEPS = STEPS.length;

// Human-readable labels for Q3 answer values
export const Q3_LABELS = {
  no_problem:       "No Problem",
  minor_problem:    "Minor Problem",
  moderate_problem: "Moderate Problem",
  serious_problem:  "Serious Problem",
};

// Maps Q3 answer value → index into POS.Q3_X array in MDQImageMapper
export const Q3_OPTION_INDEX = {
  no_problem:       0,
  minor_problem:    1,
  moderate_problem: 2,
  serious_problem:  3,
};