// ─────────────────────────────────────────────────────────────────────────────
// mdqSteps.js — pure data, no UI
//
// STEP STRUCTURE (19 steps total):
//   Step 0        — info        (patient details, has Next button)
//   Steps 1–13    — q1_item     (one Q1 sub-question per step, auto-advance)
//   Step 14       — q2          (yes/no, auto-advance)
//   Step 15       — q3          (choice4, auto-advance)
//   Step 16       — q4          (yes/no, auto-advance)
//   Step 17       — q5          (yes/no, auto-advance)
//   Step 18       — thankyou    (final screen, no input)
// ─────────────────────────────────────────────────────────────────────────────

// ── Q1 sub-items — used both in step definitions and in MDQImageMapper ────────
export const Q1_ITEMS = [
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
];

export const STEPS = [
  // ── Step 0: Patient Info ─────────────────────────────────────────────────
  {
    id: "info",
    type: "info",
    autoAdvance: false,
    title: "Patient Information",
    subtitle: "Enter your details before we begin.",
    fields: [
      { key: "name",            label: "Full Name",       type: "text",   placeholder: "Enter your full name" },
      { key: "date",            label: "Date",            type: "date",   placeholder: "" },
      { key: "email",           label: "Email Address",   type: "email",  placeholder: "e.g. name@example.com" },
      { key: "phone",           label: "Phone Number",    type: "tel",    placeholder: "e.g. 03001234567" },
      { key: "clinicLocation",  label: "Clinic Location", type: "select", placeholder: "", required: true,
        options: ["Westland", "Hamtramck", "Roseville"] },
    ],
  },

  // ── Steps 1–13: Q1 sub-questions (one per step) ───────────────────────────
  ...Q1_ITEMS.map((item, i) => ({
    id:          `q1_${i + 1}`,
    type:        "q1_item",
    autoAdvance: true,
    key:         item.key,
    itemIndex:   i,
    itemNumber:  i + 1,
    label:       item.label,
    q1Header: {
      title:    "Question 1",
      subtitle: "Has there ever been a period of time when you were NOT your usual self and…",
    },
  })),

  // ── Step 14: Q2 ───────────────────────────────────────────────────────────
  {
    id:          "q2",
    type:        "yesno",
    autoAdvance: true,
    key:         "q2",
    title:       "Question 2",
    subtitle:    "If you checked YES to more than one of the above, have several of these ever happened during the same period of time?",
  },

  // ── Step 15: Q3 ───────────────────────────────────────────────────────────
  {
    id:          "q3",
    type:        "choice4",
    autoAdvance: true,
    key:         "q3",
    title:       "Question 3",
    subtitle:    "How much of a problem did any of these cause you — like being able to work; having family, money, or legal troubles; getting into arguments or fights?",
    options: [
      { value: "no_problem",       label: "No Problem",       icon: "😌", desc: "Little to no impact on daily life" },
      { value: "minor_problem",    label: "Minor Problem",    icon: "😕", desc: "Slight disruption occasionally" },
      { value: "moderate_problem", label: "Moderate Problem", icon: "😟", desc: "Noticeable impact on daily life" },
      { value: "serious_problem",  label: "Serious Problem",  icon: "😰", desc: "Significant disruption to daily life" },
    ],
  },

  // ── Step 16: Q4 ───────────────────────────────────────────────────────────
  {
    id:          "q4",
    type:        "yesno",
    autoAdvance: true,
    key:         "q4",
    title:       "Question 4",
    subtitle:    "Have any of your blood relatives (ie, children, siblings, parents, grandparents, aunts, uncles) had manic-depressive illness or bipolar disorder?",
  },

  // ── Step 17: Q5 ───────────────────────────────────────────────────────────
  {
    id:          "q5",
    type:        "yesno",
    autoAdvance: true,
    key:         "q5",
    title:       "Question 5",
    subtitle:    "Has a health professional ever told you that you have manic-depressive illness or bipolar disorder?",
  },

  // ── Step 18: Thank You ────────────────────────────────────────────────────
  {
    id:          "thankyou",
    type:        "thankyou",
    autoAdvance: false,
  },
];

export const TOTAL_STEPS = STEPS.length; // 19

// Index of the thank you step — used by page.js to trigger PDF generation
export const THANKYOU_STEP = STEPS.findIndex((s) => s.type === "thankyou");

// Human-readable labels for Q3
export const Q3_LABELS = {
  no_problem:       "No Problem",
  minor_problem:    "Minor Problem",
  moderate_problem: "Moderate Problem",
  serious_problem:  "Serious Problem",
};

// Maps Q3 answer → POS.Q3 array index in MDQImageMapper
export const Q3_OPTION_INDEX = {
  no_problem:       0,
  minor_problem:    1,
  moderate_problem: 2,
  serious_problem:  3,
};