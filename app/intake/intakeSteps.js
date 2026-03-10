// ─────────────────────────────────────────────────────────────────────────────
// intakeSteps.js — pure data for New Patient Intake Form
//
// STEP STRUCTURE (8 steps total):
//   Step 0  — personal     (Last Name, First Name, M.I., DOB, Gender, Address, Apt#)
//   Step 1  — location     (City, State, Zip, Marital Status)
//   Step 2  — contact      (Cell Phone, Home Phone, Email)
//   Step 3  — demographics (Pharmacy, Race, Ethnicity, Primary Language)
//   Step 4  — emergency    (Full Name, Telephone, Relation)
//   Step 5  — insurance    (Primary + Secondary Insurance)
//   Step 6  — signature    (Signature pad + Date)
//   Step 7  — thankyou
// ─────────────────────────────────────────────────────────────────────────────

export const INTAKE_STEPS = [
  // ── Step 0: Personal Info ─────────────────────────────────────────────────
  {
    id: "personal",
    type: "fields",
    title: "Personal Information",
    subtitle: "Enter your basic personal details.",
    fields: [
      { key: "lastName",  label: "Last Name",    type: "text", placeholder: "Last name",      required: true,  span: "half" },
      { key: "firstName", label: "First Name",   type: "text", placeholder: "First name",     required: true,  span: "half" },
      { key: "mi",        label: "M.I.",          type: "text", placeholder: "M.I.",           required: false, span: "quarter" },
      { key: "dob",       label: "Date of Birth", type: "date", placeholder: "",               required: true,  span: "threequarter" },
      { key: "gender",    label: "Gender",        type: "select",
        options: ["Male", "Female", "Non-binary", "Prefer not to say"],
        required: true, span: "half" },
      { key: "address",   label: "Address",       type: "text", placeholder: "Street address", required: true,  span: "half" },
      { key: "apt",       label: "Apt #",         type: "text", placeholder: "Apt #",          required: false, span: "quarter" },
    ],
  },

  // ── Step 1: Location & Status ─────────────────────────────────────────────
  {
    id: "location",
    type: "fields",
    title: "Location & Status",
    subtitle: "Where do you live?",
    fields: [
      { key: "city",          label: "City",           type: "text",   placeholder: "City",         required: true,  span: "half" },
      { key: "state",         label: "State",          type: "text",   placeholder: "State",        required: true,  span: "quarter" },
      { key: "zip",           label: "Zip",            type: "text",   placeholder: "Zip code",     required: true,  span: "quarter" },
      { key: "maritalStatus", label: "Marital Status", type: "select",
        options: ["Single", "Married", "Divorced", "Widowed", "Separated"],
        required: true, span: "half" },
    ],
  },

  // ── Step 2: Contact ───────────────────────────────────────────────────────
  {
    id: "contact",
    type: "fields",
    title: "Contact Details",
    subtitle: "How can we reach you?",
    fields: [
      { key: "cellPhone", label: "Cell Phone",  type: "tel",   placeholder: "Cell phone number",    required: true,  span: "half" },
      { key: "homePhone", label: "Home Phone",  type: "tel",   placeholder: "Home phone number",    required: false, span: "half" },
      { key: "email",     label: "E-mail",      type: "email", placeholder: "e.g. name@example.com", required: false, span: "full" },
    ],
  },

  // ── Step 3: Demographics ──────────────────────────────────────────────────
  {
    id: "demographics",
    type: "fields",
    title: "Demographics",
    subtitle: "A few more details for our records.",
    fields: [
      { key: "pharmacy",        label: "Pharmacy Name / Location", type: "text", placeholder: "Pharmacy name and location", required: true, span: "full" },
      { key: "race",            label: "Race",                     type: "text", placeholder: "Race",                      required: true, span: "third" },
      { key: "ethnicity",       label: "Ethnicity",                type: "text", placeholder: "Ethnicity",                 required: true, span: "third" },
      { key: "primaryLanguage", label: "Primary Language",         type: "text", placeholder: "Primary language",          required: true, span: "third" },
    ],
  },

  // ── Step 4: Emergency Contact ─────────────────────────────────────────────
  {
    id: "emergency",
    type: "fields",
    title: "Emergency Contact",
    subtitle: "Who should we contact in an emergency?",
    fields: [
      { key: "ecFullName",  label: "Full Name",  type: "text", placeholder: "Emergency contact full name", required: true, span: "half" },
      { key: "ecTelephone", label: "Telephone",  type: "tel",  placeholder: "Phone number",                required: true, span: "quarter" },
      { key: "ecRelation",  label: "Relation",   type: "text", placeholder: "e.g. Spouse, Parent",         required: true, span: "quarter" },
    ],
  },

  // ── Step 5: Insurance ─────────────────────────────────────────────────────
  {
    id: "insurance",
    type: "insurance",
    title: "Insurance Information",
    subtitle: "Enter your primary and secondary insurance details.",
    primaryFields: [
      { key: "priProvider",    label: "Insurance Provider", type: "text", placeholder: "Provider name", required: true },
      { key: "priMemberId",    label: "Member ID",          type: "text", placeholder: "Member ID",     required: true },
      { key: "priPolicyOwner", label: "Policy Owner Name",  type: "text", placeholder: "Owner name",    required: true },
      { key: "priPolicyDob",   label: "Policy Owner DOB",   type: "date", placeholder: "",              required: true },
      { key: "priRelationship",label: "Relationship",       type: "text", placeholder: "e.g. Self, Spouse", required: true },
    ],
    secondaryFields: [
      { key: "secProvider",    label: "Insurance Provider", type: "text", placeholder: "Provider name", required: false },
      { key: "secMemberId",    label: "Member ID",          type: "text", placeholder: "Member ID",     required: false },
      { key: "secPolicyOwner", label: "Policy Owner Name",  type: "text", placeholder: "Owner name",    required: false },
      { key: "secPolicyDob",   label: "Policy Owner DOB",   type: "date", placeholder: "",              required: false },
      { key: "secRelationship",label: "Relationship",       type: "text", placeholder: "e.g. Self, Spouse", required: false },
    ],
  },

  // ── Step 6: Signature ─────────────────────────────────────────────────────
  {
    id: "signature",
    type: "signature",
    title: "Authorization & Signature",
    subtitle: "Please read and sign the authorization below.",
    text: "I hereby authorize Livewell Medical Clinic to treat the patient named above. I authorize the release of medical information necessary to insurance claims concerning my illness and treatment. Photocopies are valid as original. I authorize payment of medical benefits to be directly to Livewell Medical Clinic. I understand that I am financially responsible for any amounts not covered by my health insurance.",
  },

  // ── Step 7: Thank You ─────────────────────────────────────────────────────
  {
    id: "thankyou",
    type: "thankyou",
  },
];

export const INTAKE_TOTAL_STEPS  = INTAKE_STEPS.length;                                    // 8
export const INTAKE_THANKYOU_STEP = INTAKE_STEPS.findIndex((s) => s.type === "thankyou");  // 7
