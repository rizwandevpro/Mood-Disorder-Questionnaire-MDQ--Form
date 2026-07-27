"use client";

import { useState } from "react";
import { TQ_QUESTIONS, tqMultiKey } from "./triageSteps";

const BRAND        = "#7d4f50";
const BRAND_LIGHT  = "rgba(125,79,80,0.07)";
const BRAND_SHADOW = "0 8px 24px rgba(125,79,80,0.18)";

// ── CSS (injected once) ──────────────────────────────────────────────────────
const TQ_CSS = `
  .tq-field-grid   { display:grid; gap:16px; grid-template-columns:repeat(2,1fr); }
  @media(max-width:640px) { .tq-field-grid { grid-template-columns:1fr; } }

  .tq-opt-grid     { display:grid; gap:10px; grid-template-columns:repeat(3,1fr); }
  @media(max-width:700px) { .tq-opt-grid { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:480px) { .tq-opt-grid { grid-template-columns:1fr; } }

  .tq-pill:hover   { border-color:#7d4f50 !important; }
`;

if (typeof document !== "undefined" && !document.getElementById("tq-styles")) {
  const t = document.createElement("style");
  t.id = "tq-styles";
  t.textContent = TQ_CSS;
  document.head.appendChild(t);
}

function inputStyle(err) {
  return {
    width: "100%", boxSizing: "border-box",
    border: `2px solid ${err ? "#dc2626" : "#e2e8f0"}`,
    borderRadius: "12px", padding: "12px 16px",
    fontSize: "14px", fontWeight: 500, color: "#1e293b",
    backgroundColor: "#f8fafc", outline: "none",
    fontFamily: "'Source Sans 3', sans-serif",
  };
}

function labelStyle(err) {
  return {
    display: "block", fontSize: "10px", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.1em",
    marginBottom: "6px", color: err ? "#dc2626" : "#94a3b8",
    fontFamily: "'Source Sans 3', sans-serif",
  };
}

// ── Checkbox / radio pill ────────────────────────────────────────────────────
function OptionPill({ label, checked, onToggle }) {
  return (
    <label className="tq-pill" style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "10px 14px", borderRadius: "12px",
      border: `2px solid ${checked ? BRAND : "#e2e8f0"}`,
      backgroundColor: checked ? BRAND_LIGHT : "white",
      cursor: "pointer", transition: "border-color 0.15s",
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      <span style={{
        width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
        border: `2px solid ${checked ? BRAND : "#cbd5e1"}`,
        backgroundColor: checked ? BRAND : "white",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {checked && (
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={onToggle} style={{ display: "none" }} />
      <span style={{ fontSize: "14px", color: "#1e293b", lineHeight: 1.3 }}>{label}</span>
    </label>
  );
}

// ── Patient Info Step (Name, Phone, Email, Date) ─────────────────────────────
export function TriagePatientInfoStep({ answers, onChange, onNext }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!answers.ptqName?.trim())  e.ptqName  = "Full name is required.";
    if (!answers.ptqPhone?.trim()) e.ptqPhone = "Phone number is required.";
    if (!answers.ptqEmail?.trim()) e.ptqEmail = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.ptqEmail.trim()))
                                    e.ptqEmail = "Please enter a valid email.";
    if (!answers.ptqDate)          e.ptqDate  = "Date is required.";
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext();
  };

  const field = (key, label, type, placeholder) => (
    <div>
      <label style={labelStyle(errors[key])}>
        {label}<span style={{ color: BRAND }}> *</span>
      </label>
      <input
        type={type}
        value={answers[key] || ""}
        placeholder={placeholder}
        onChange={e => { onChange(key, e.target.value); setErrors(prev => ({ ...prev, [key]: "" })); }}
        style={inputStyle(errors[key])}
      />
      {errors[key] && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontFamily: "'Source Sans 3', sans-serif" }}>{errors[key]}</p>}
    </div>
  );

  return (
    <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', serif", marginBottom: "8px" }}>
          Before We Begin
        </h2>
        <p style={{ fontSize: "14px", color: "#64748b", fontFamily: "'Source Sans 3', sans-serif", lineHeight: 1.6 }}>
          Please provide your contact information. Your completed form will be emailed to you and to our office.
        </p>
      </div>

      <div className="tq-field-grid" style={{ marginBottom: "8px" }}>
        {field("ptqName",  "Full Name",     "text",  "e.g. Jane Smith")}
        {field("ptqPhone", "Phone Number",  "tel",   "e.g. (555) 123-4567")}
        {field("ptqEmail", "Email Address", "email", "e.g. jane@example.com")}
        {field("ptqDate",  "Date",          "date",  "")}
      </div>

      <button
        onClick={handleNext}
        style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, border: "none", color: "white", backgroundColor: BRAND, cursor: "pointer", boxShadow: "0 4px 14px rgba(125,79,80,0.25)", fontFamily: "'Source Sans 3', sans-serif", marginTop: "24px" }}
      >
        Start Form →
      </button>
    </div>
  );
}

// ── Single question block ────────────────────────────────────────────────────
// noTitle: true when the title/subtitle is already rendered by the parent step header.
function QuestionBlock({ question, answers, onChange, noTitle = false }) {
  const isOtherChecked = question.type === "single"
    ? answers[question.key] === "Other"
    : !!answers[tqMultiKey(question.id, question.otherOptionLabel || "Other")];

  return (
    <div style={{ marginBottom: noTitle ? 0 : "32px" }}>
      {!noTitle && (
        <>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: question.subtitle ? "2px" : "12px", fontFamily: "'Lora', serif" }}>
            {question.title}
          </p>
          {question.subtitle && (
            <p style={{ fontSize: "12px", fontStyle: "italic", color: "#94a3b8", marginBottom: "12px", fontFamily: "'Source Sans 3', sans-serif" }}>
              {question.subtitle}
            </p>
          )}
        </>
      )}

      <div className="tq-opt-grid">
        {question.options.map(opt => {
          if (question.type === "single") {
            const checked = answers[question.key] === opt;
            return (
              <OptionPill key={opt} label={opt} checked={checked}
                onToggle={() => onChange(question.key, checked ? "" : opt)} />
            );
          }
          const key = tqMultiKey(question.id, opt);
          const checked = !!answers[key];
          return (
            <OptionPill key={opt} label={opt} checked={checked}
              onToggle={() => onChange(key, !checked)} />
          );
        })}
      </div>

      {question.hasOther && isOtherChecked && (
        <div style={{ marginTop: "10px" }}>
          <input
            type="text"
            value={answers[question.otherKey] || ""}
            onChange={e => onChange(question.otherKey, e.target.value)}
            placeholder="Please specify…"
            style={inputStyle(false)}
          />
        </div>
      )}
    </div>
  );
}

// ── Single Question Step (one question per step) ─────────────────────────────
// questionIndex: 0-based index into TQ_QUESTIONS. isLast: shows "Submit" instead of "Next".
export function TriageQuestionStep({ questionIndex, answers, onChange, onBack, onNext, isLast }) {
  const [error, setError] = useState("");
  const question = TQ_QUESTIONS[questionIndex];

  const validate = () => {
    if (question.type === "single") {
      if (!answers[question.key]) return "Please select an option to continue.";
    } else {
      const anyChecked = question.options.some(opt => answers[tqMultiKey(question.id, opt)]);
      if (!anyChecked) return "Please select at least one option to continue.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    onNext();
  };

  return (
    <div style={{ backgroundColor: "white", borderRadius: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #f1f5f9" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "'Source Sans 3', sans-serif" }}>
          Question {questionIndex + 1} of {TQ_QUESTIONS.length}
        </p>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', Georgia, serif", lineHeight: 1.35 }}>
          {question.title}
        </h2>
        {question.subtitle && (
          <p style={{ fontSize: "13px", fontStyle: "italic", color: "#94a3b8", marginTop: "6px", fontFamily: "'Source Sans 3', sans-serif" }}>
            {question.subtitle}
          </p>
        )}
      </div>

      <div style={{ padding: "28px 32px" }}>
        <QuestionBlock question={question} answers={answers} onChange={onChange} noTitle />
        {error && <p style={{ fontSize: "13px", color: "#dc2626", fontFamily: "'Source Sans 3', sans-serif", marginTop: "4px" }}>⚠ {error}</p>}
      </div>

      <div style={{ padding: "20px 32px", backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <button type="button" onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, border: "2px solid #e2e8f0", color: "#475569", backgroundColor: "white", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <button type="button" onClick={handleNext}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 28px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, border: "none", color: "white", backgroundColor: BRAND, cursor: "pointer", boxShadow: BRAND_SHADOW, fontFamily: "'Source Sans 3', sans-serif" }}>
          {isLast ? "Submit" : "Next"}
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}
