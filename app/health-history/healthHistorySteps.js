// ─────────────────────────────────────────────────────────────────────────────
// healthHistorySteps.js — Patient Health History (Confidential)
//
// STEPS:
//   0  — personal        (Name, Date, Age, Birthdate, Marital, Gender, Occupation, Visit reason)
//   1  — healthMaint     (Health maintenance dates — Women Only, Both, Men Only)
//   2  — conditions      (Condition checkboxes + Cancer type + Other)
//   3  — allergies       (Allergy checkboxes + text + Medications textarea)
//   4  — healthHabits    (Caffeine, Tobacco, Alcohol, Drugs, Diet, Exercise, Seatbelts)
//   5  — surgicalHistory (Up to 8 rows: Year, Hospital, Surgery type)
//   6  — pregnancyOther  (Pregnancy stats + up to 6 child rows + Other hospitalizations)
//   7  — familyHistory   (Father, Mother, Brothers x4, Sisters x4 + disease checkboxes)
//   8  — additional      (Additional info textarea + Patient signature + Date)
//   9  — thankyou
// ─────────────────────────────────────────────────────────────────────────────

export const CONDITIONS = [
  // col 1
  "AIDS","Alcoholism","Anemia","Anorexia","Anxiety","Arthritis","Asthma","Bleeding Disorder","Breast Lump",
  // col 2
  "Bronchitis","Bulimia","CAD / heart disease","Cancer","Chemical Dependency","Depression","Diabetes","Emphysema / COPD","Epilepsy",
  // col 3
  "GERD (reflux)","Glaucoma","Goiter","Gout","Headaches","Heart attack","Hepatitis","Herpes","High blood pressure",
  // col 4
  "HIV positive","Kidney disease","Liver disease","Multiple sclerosis","Pacemaker","Pneumonia","Prostate problem","Psychiatric care","Rheumatic fever",
  // col 5
  "Rhinitis","Sexually Transmitted","Infection","Stroke","Suicide attempt","Thyroid problem","Tuberculosis","Ulcer(s)","Vaginal infections",
];

export const FAMILY_DISEASES = [
  "Arthritis","Asthma","Cancer","Diabetes","Gout",
  "Heart Disease","High blood pressure","Kidney Disease","Stroke","Other",
];

export const HH_STEPS = [
  // ── Step 0: Personal ──────────────────────────────────────────────────────
  {
    id: "personal", type: "fields",
    title: "Patient Health History",
    subtitle: "Basic personal information — all fields marked * are required.",
    fields: [
      { key: "hhName",       label: "Full Name",                    type: "text",  placeholder: "Full name",          required: true,  span: "half" },
      { key: "hhTodayDate",  label: "Today's Date",                 type: "date",  placeholder: "",                   required: true,  span: "quarter" },
      { key: "hhLastExam",   label: "Date of Last Physical Exam",   type: "date",  placeholder: "",                   required: false, span: "quarter" },
      { key: "hhAge",        label: "Age",                          type: "text",  placeholder: "Age",                required: true,  span: "quarter" },
      { key: "hhBirthdateM", label: "Birthdate — Month",            type: "text",  placeholder: "MM",                 required: true,  span: "quarter" },
      { key: "hhBirthdateD", label: "Day",                          type: "text",  placeholder: "DD",                 required: true,  span: "quarter" },
      { key: "hhBirthdateY", label: "Year",                         type: "text",  placeholder: "YY",                 required: true,  span: "quarter" },
      { key: "hhMarital",    label: "Marital Status",               type: "select",
        options: ["Single","Married","Divorced","Widowed","Separated"],            required: true,  span: "half" },
      { key: "hhGender",     label: "Gender",                       type: "select",
        options: ["Male","Female"],                                                required: true,  span: "half" },
      { key: "hhOccupation", label: "Occupation",                   type: "text",  placeholder: "Occupation",         required: false, span: "half" },
      { key: "hhVisitReason",label: "Reason for Visit Today",       type: "text",  placeholder: "Reason for visit",   required: true,  span: "half" },
    ],
  },

  // ── Step 1: Health Maintenance ────────────────────────────────────────────
  {
    id: "healthMaint", type: "healthMaint",
    title: "Health Maintenance",
    subtitle: "Enter the most recent date for each applicable screening.",
  },

  // ── Step 2: Conditions ────────────────────────────────────────────────────
  {
    id: "conditions", type: "conditions",
    title: "Medical Conditions",
    subtitle: "Check all conditions you currently have or have had in the past.",
  },

  // ── Step 3: Allergies & Medications ──────────────────────────────────────
  {
    id: "allergies", type: "allergies",
    title: "Allergies & Medications",
    subtitle: "List known allergies and all current medications.",
  },

  // ── Step 4: Health Habits ─────────────────────────────────────────────────
  {
    id: "healthHabits", type: "healthHabits",
    title: "Health Habits",
    subtitle: "Check appropriate boxes and describe your habits.",
  },

  // ── Step 5: Surgical History ──────────────────────────────────────────────
  {
    id: "surgicalHistory", type: "surgicalHistory",
    title: "Surgical History",
    subtitle: "List any surgeries you have had (up to 8). Click + Add to add more rows.",
  },

  // ── Step 6: Pregnancy & Other Hospitalizations ───────────────────────────
  {
    id: "pregnancyOther", type: "pregnancyOther",
    title: "Pregnancy & Other Hospitalizations",
    subtitle: "Complete pregnancy history and any other hospitalizations or serious illnesses.",
  },

  // ── Step 7: Family History ────────────────────────────────────────────────
  {
    id: "familyHistory", type: "familyHistory",
    title: "Family History",
    subtitle: "Fill in information about your family's health history.",
  },

  // ── Step 8: Additional Info & Signature ──────────────────────────────────
  {
    id: "additional", type: "additional",
    title: "Additional Information & Signature",
    subtitle: "Share anything else your doctor should know, then sign.",
  },

  // ── Step 9: Thank You ─────────────────────────────────────────────────────
  { id: "thankyou", type: "thankyou" },
];

export const HH_TOTAL_STEPS   = HH_STEPS.length;
export const HH_THANKYOU_STEP = HH_STEPS.findIndex((s) => s.type === "thankyou");
