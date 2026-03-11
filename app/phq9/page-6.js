"use client";

import { useState } from "react";
import { STEPS, TOTAL_STEPS, THANKYOU_STEP, QUESTIONS, OPTIONS } from "./phq9Steps";
import PHQ9Form        from "./PHQ9Form";
import PHQ9ImageMapper from "./PHQ9ImageMapper";
import Image from "next/image";

function scoreLabel(score) {
  if (score <= 4)  return { label: "Minimal Depression",           color: "#16a34a" };
  if (score <= 9)  return { label: "Mild Depression",              color: "#ca8a04" };
  if (score <= 14) return { label: "Moderate Depression",          color: "#ea580c" };
  if (score <= 19) return { label: "Moderately Severe Depression", color: "#dc2626" };
  return                  { label: "Severe Depression",            color: "#991b1b" };
}

export default function PHQ9Page() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [downloadFn,  setDownloadFn]  = useState(null);

  const onThankYou = currentStep === THANKYOU_STEP;

  const handleChange = (key, value) =>
    setAnswers(prev => ({ ...prev, [key]: value }));

  const handleNext = () => {
    const next = currentStep + 1;
    if (next >= TOTAL_STEPS) return;
    setCurrentStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setDownloadFn(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Progress: step 0 = info, steps 1–9 = questions, step 10 = difficulty, step 11 = thankyou
  const progressSteps   = THANKYOU_STEP - 1; // 10 (9 questions + difficulty)
  const progressCurrent = Math.max(0, Math.min(currentStep - 1, progressSteps));
  const progressPct     = onThankYou ? 100 : Math.round((progressCurrent / progressSteps) * 100);

  const totalScore = QUESTIONS.reduce((sum, q) => {
    const opt = OPTIONS.find(o => o.label === answers[q.key]);
    return sum + (opt ? opt.score : 0);
  }, 0);
  const { label: sevLabel, color: sevColor } = scoreLabel(totalScore);

  const stepLabel = () => {
    if (onThankYou)      return "Complete";
    if (currentStep === 0) return "PHQ-9";
    if (currentStep === THANKYOU_STEP - 1) return "Question 10";
    return `Q${currentStep} of 9`;
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0fdf4 0%,#ffffff 50%,#fefce8 100%)" }}>

        {/* ── Sticky header ── */}
        <div style={{ backgroundColor: "#7d4f50", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
          <div style={{ maxWidth: "620px", margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "44px", height: "44px", backgroundColor: "white", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", flexShrink: 0 }}>
                <Image src="/logo2.png" alt="Logo" width={80} height={40} style={{ objectFit: "contain" }} />
              </div>
              <div>
                <p style={{ color: "white", fontWeight: 700, fontSize: "14px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif", margin: 0, lineHeight: 1.2 }}>Cambridge Psychiatry</p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif", margin: 0 }}>Patient Health Questionnaire (PHQ-9)</p>
              </div>
            </div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Source Sans 3', sans-serif", flexShrink: 0 }}>
              {stepLabel()}
            </p>
          </div>
          {!onThankYou && currentStep > 0 && (
            <div style={{ maxWidth: "620px", margin: "0 auto", padding: "0 16px 10px" }}>
              <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(to right,#86efac,#fde68a)", borderRadius: "999px", transition: "width 0.5s ease-out" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ maxWidth: "620px", margin: "0 auto", padding: "32px 16px" }}>

          {!onThankYou && (
            <>
              <PHQ9Form
                currentStep={currentStep}
                answers={answers}
                onChange={handleChange}
                onNext={handleNext}
                onBack={handleBack}
              />
              <p style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", marginTop: "20px", lineHeight: 1.6, fontFamily: "'Source Sans 3', sans-serif", padding: "0 16px" }}>
                This questionnaire is not a substitute for clinical evaluation.<br />
                <strong style={{ color: "#64748b" }}>Please discuss results with your healthcare provider.</strong>
              </p>
            </>
          )}

          {/* ── Thank You ── */}
          {onThankYou && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 16px" }}>

              {/* Score circle */}
              <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: `${sevColor}15`, border: `4px solid ${sevColor}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: `0 8px 28px ${sevColor}25` }}>
                <span style={{ fontSize: "42px", fontWeight: 800, color: sevColor, fontFamily: "'Lora', serif", lineHeight: 1 }}>{totalScore}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: sevColor, fontFamily: "'Source Sans 3', sans-serif" }}>/ 27</span>
              </div>

              <span style={{ display: "inline-block", padding: "6px 20px", borderRadius: "20px", fontSize: "14px", fontWeight: 700, backgroundColor: `${sevColor}15`, color: sevColor, border: `2px solid ${sevColor}30`, marginBottom: "16px", fontFamily: "'Source Sans 3', sans-serif" }}>
                {sevLabel}
              </span>

              <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a", marginBottom: "8px", fontFamily: "'Lora', serif" }}>Assessment Complete</h1>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, maxWidth: "380px", marginBottom: "28px", fontFamily: "'Source Sans 3', sans-serif" }}>
                Your completed PHQ-9 form is ready to download. Please share it with your clinician at your appointment.
              </p>

              {/* Severity guide */}
              <div style={{ width: "100%", maxWidth: "400px", backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: "28px", textAlign: "left" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "12px", fontFamily: "'Source Sans 3', sans-serif" }}>Severity Guide</p>
                {[
                  { range: "1–4",   label: "Minimal",           color: "#16a34a" },
                  { range: "5–9",   label: "Mild",              color: "#ca8a04" },
                  { range: "10–14", label: "Moderate",          color: "#ea580c" },
                  { range: "15–19", label: "Moderately Severe", color: "#dc2626" },
                  { range: "20–27", label: "Severe",            color: "#991b1b" },
                ].map(row => (
                  <div key={row.range} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: row.color, width: "44px", fontFamily: "'Lora', serif" }}>{row.range}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: row.color === sevColor ? row.color : "#64748b", fontFamily: "'Source Sans 3', sans-serif", flex: 1 }}>{row.label}</span>
                    {row.color === sevColor && (
                      <span style={{ fontSize: "10px", fontWeight: 700, backgroundColor: `${row.color}15`, color: row.color, padding: "2px 8px", borderRadius: "10px", fontFamily: "'Source Sans 3', sans-serif" }}>Your score</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px" }}>
                {downloadFn ? (
                  <button onClick={downloadFn}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, border: "none", color: "white", backgroundColor: "#7d4f50", cursor: "pointer", boxShadow: "0 4px 14px rgba(125,79,80,0.35)", fontFamily: "'Source Sans 3', sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#6a4142"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#7d4f50"}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download PDF Report
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.8)", backgroundColor: "#7d4f50", opacity: 0.6, fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "phq9Spin 0.8s linear infinite" }} />
                    Preparing PDF…
                  </div>
                )}
                <button onClick={handleReset}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, border: "2px solid #e2e8f0", color: "#475569", backgroundColor: "white", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}>
                  Start New Assessment
                </button>
              </div>

              {/* Silent PDF builder */}
              <div aria-hidden="true" style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "1px", height: "1px", overflow: "hidden", pointerEvents: "none" }}>
                <PHQ9ImageMapper answers={answers} silentMode onPdfReady={fn => setDownloadFn(() => fn)} />
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes phq9Spin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}
