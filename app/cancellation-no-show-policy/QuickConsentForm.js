"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  STEPS,
  FORM_TITLE,
  EFFECTIVE_DATE,
  INTRO_PARAGRAPHS,
  SECTIONS,
  CLOSING_LINES,
} from "./quickConsentSteps";

const BRAND         = "#7d4f50";
const EXIT_DURATION = 220;

const QC_CSS = `
  @keyframes qcIn  { from{opacity:0;transform:translateX(60px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes qcInL { from{opacity:0;transform:translateX(-60px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes qcOut { from{opacity:1;transform:none} to{opacity:0;transform:translateX(-60px) scale(0.97)} }
  @keyframes qcOutR{ from{opacity:1;transform:none} to{opacity:0;transform:translateX(60px) scale(0.97)} }
  .qc-ef { animation: qcIn   0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .qc-eb { animation: qcInL  0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .qc-xf { animation: qcOut  0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
  .qc-xb { animation: qcOutR 0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }

  .qc-input { border:2px solid #e2e8f0; border-radius:10px; padding:12px 16px;
    font-size:16px; font-weight:500; color:#1e293b; background:#f8fafc;
    outline:none; font-family:"Source Sans 3",sans-serif; width:100%; box-sizing:border-box;
    text-transform:uppercase; }
  .qc-input:focus { border-color:#7d4f50; background:white; }
`;

if (typeof document !== "undefined" && !document.getElementById("qc-styles")) {
  const t = document.createElement("style");
  t.id = "qc-styles";
  t.textContent = QC_CSS;
  document.head.appendChild(t);
}

// ── Step 1: Policy text + Email ──────────────────────────────────────────────
function StepConsent({ answers, onChange, onNext }) {
  const emailValid  = /\S+@\S+\.\S+/.test(answers.email || "");
  const allAnswered = emailValid;

  return (
    <div style={{ backgroundColor: "white", borderRadius: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ backgroundColor: BRAND, padding: "24px 28px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "white", margin: 0, fontFamily: "'Lora', Georgia, serif" }}>
          {FORM_TITLE}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", margin: "4px 0 0", fontFamily: "'Source Sans 3', sans-serif" }}>
          {EFFECTIVE_DATE}
        </p>
      </div>

      {/* Policy text */}
      <div style={{ padding: "24px 28px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ fontSize: "15px", color: "#374151", lineHeight: 1.75, fontFamily: "'Source Sans 3', sans-serif" }}>
          {INTRO_PARAGRAPHS.map((p, i) => (
            <p key={i} style={{ marginTop: i === 0 ? 0 : undefined }}>{p}</p>
          ))}

          {SECTIONS.map((section, si) => (
            <div key={si} style={{ marginTop: "20px" }}>
              <p style={{ fontWeight: 700, color: "#1e293b", fontSize: "16px", marginBottom: "8px" }}>
                {section.heading}
              </p>
              <ul style={{ paddingLeft: "22px", margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {section.items.map((item, ii) => (
                  <li key={ii} style={{ lineHeight: 1.6 }}>
                    {item.bold && <strong style={{ color: "#1e293b" }}>{item.bold} </strong>}
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div style={{ marginTop: "24px" }}>
            {CLOSING_LINES.map((line, i) => (
              <p key={i} style={{ margin: "4px 0" }}>{line}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Email field */}
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "8px", fontFamily: "'Source Sans 3', sans-serif" }}>
          Email Address <span style={{ color: BRAND }}>*</span>
        </label>
        <input type="email" className="qc-input" style={{ textTransform: "none" }}
          value={answers.email || ""}
          onChange={e => onChange("email", e.target.value)}
          placeholder="name@example.com" />
        <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px", fontFamily: "'Source Sans 3', sans-serif" }}>
          We'll email a copy of your signed form to this address.
        </p>
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 28px", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onNext} disabled={!allAnswered}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 32px", borderRadius: "12px",
            fontSize: "16px", fontWeight: 700, border: "none", color: "white", cursor: allAnswered ? "pointer" : "not-allowed",
            fontFamily: "'Source Sans 3', sans-serif",
            backgroundColor: allAnswered ? BRAND : "#cbd5e1",
            boxShadow: allAnswered ? "0 4px 16px rgba(125,79,80,0.35)" : "none" }}>
          Continue
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Patient Initials + Date ──────────────────────────────────────────
function StepSignature({ answers, onChange, onNext, onBack }) {
  const canProceed = (answers.patientInitials || "").trim().length > 0 && !!answers.consentDate;

  return (
    <div style={{ backgroundColor: "white", borderRadius: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9", overflow: "hidden" }}>

      <div style={{ backgroundColor: BRAND, padding: "20px 28px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "white", margin: 0, fontFamily: "'Lora', Georgia, serif" }}>
          Acknowledge & Complete
        </h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: "4px 0 0", fontFamily: "'Source Sans 3', sans-serif" }}>
          Please initial and add today's date.
        </p>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Patient Initials */}
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "8px", fontFamily: "'Source Sans 3', sans-serif" }}>
            Patient Initials <span style={{ color: BRAND }}>*</span>
          </label>
          <input type="text" className="qc-input" style={{ maxWidth: "160px" }}
            maxLength={6}
            value={answers.patientInitials || ""}
            onChange={e => onChange("patientInitials", e.target.value.toUpperCase())}
            placeholder="e.g. JD" />
        </div>

        {/* Date */}
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "8px", fontFamily: "'Source Sans 3', sans-serif" }}>
            Date <span style={{ color: BRAND }}>*</span>
          </label>
          <input type="date" className="qc-input" style={{ maxWidth: "240px", textTransform: "none" }}
            value={answers.consentDate || ""}
            onChange={e => onChange("consentDate", e.target.value)} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 28px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9" }}>
        <button type="button" onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 20px", borderRadius: "12px",
            fontSize: "15px", fontWeight: 600, border: "2px solid #e2e8f0", color: "#475569",
            backgroundColor: "white", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f1f5f9"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <button type="button" onClick={onNext} disabled={!canProceed}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "13px 28px", borderRadius: "12px",
            fontSize: "16px", fontWeight: 700, border: "none", color: "white", cursor: canProceed ? "pointer" : "not-allowed",
            fontFamily: "'Source Sans 3', sans-serif",
            backgroundColor: canProceed ? BRAND : "#cbd5e1",
            boxShadow: canProceed ? "0 4px 16px rgba(125,79,80,0.35)" : "none" }}>
          Submit
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </button>
      </div>
    </div>
  );
}

// ── Animated wrapper ──────────────────────────────────────────────────────────
function AnimatedCard({ direction, children }) {
  const [phase, setPhase] = useState("enter");
  const cls = direction === "back" ? "qc-eb" : "qc-ef";
  return (
    <div className={phase === "enter" ? cls : ""} onAnimationEnd={() => setPhase("idle")} style={{ willChange: "transform,opacity" }}>
      {children}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function QuickConsentForm({ currentStep, answers, onChange, onNext, onBack }) {
  const [displayStep, setDisplayStep] = useState(currentStep);
  const [direction,   setDirection]   = useState("forward");
  const [isExiting,   setIsExiting]   = useState(false);
  const pendingStep = useRef(null);

  const animateTo = useCallback((target, dir) => {
    if (isExiting) return;
    setDirection(dir); setIsExiting(true); pendingStep.current = target;
  }, [isExiting]);

  useEffect(() => {
    if (!isExiting) return;
    const t = setTimeout(() => { setDisplayStep(pendingStep.current); setIsExiting(false); }, EXIT_DURATION);
    return () => clearTimeout(t);
  }, [isExiting]);

  useEffect(() => {
    if (!isExiting && currentStep !== displayStep)
      animateTo(currentStep, currentStep > displayStep ? "forward" : "back");
  }, [currentStep]);

  const handleNext = useCallback(() => {
    animateTo(currentStep + 1, "forward");
    setTimeout(() => onNext(), EXIT_DURATION);
  }, [animateTo, onNext, currentStep]);

  const handleBack = useCallback(() => {
    animateTo(currentStep - 1, "back");
    setTimeout(() => onBack(), EXIT_DURATION);
  }, [animateTo, onBack, currentStep]);

  const exitClass = direction === "back" ? "qc-xb" : "qc-xf";
  const step = STEPS[displayStep] || STEPS[currentStep];

  const renderStep = () => {
    switch (step?.type) {
      case "consent":   return <StepConsent   answers={answers} onChange={onChange} onNext={handleNext} />;
      case "signature": return <StepSignature answers={answers} onChange={onChange} onNext={handleNext} onBack={handleBack} />;
      default:          return null;
    }
  };

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "400px" }}>
      {isExiting && (
        <div className={exitClass} style={{ position: "absolute", inset: 0, willChange: "transform,opacity" }}>
          {renderStep()}
        </div>
      )}
      {!isExiting && (
        <AnimatedCard key={displayStep} direction={direction}>
          {renderStep()}
        </AnimatedCard>
      )}
    </div>
  );
}
