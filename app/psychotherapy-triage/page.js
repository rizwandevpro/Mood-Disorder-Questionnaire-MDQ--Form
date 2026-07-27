"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/psychotherapy-triage/page.js  →  route: /psychotherapy-triage
//
// Step 0     → Patient info (Name, Phone, Email, Date — all required)
// Step 1..5  → One TriageQuestionStep per question (Q1..Q5)
// Step 6     → Thank you screen with auto-download + auto-email (patient + clinic)
//
// Background image required at: /public/psychotherapy-triage-questions.jpg
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { TQ_QUESTIONS, TQ_INFO_STEP, TQ_QUESTIONS_START, TQ_THANKYOU_STEP } from "./triageSteps";
import { TriagePatientInfoStep, TriageQuestionStep } from "./TriageForm";
import TriageImageMapper from "./TriageImageMapper";

const DONE_STEP = TQ_THANKYOU_STEP;
const BRAND = "#7d4f50";

export default function PsychotherapyTriagePage() {
  const [currentStep, setCurrentStep] = useState(TQ_INFO_STEP);
  const [answers,     setAnswers]     = useState({});
  const [downloadFn,  setDownloadFn]  = useState(null);
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | sent | error
  const emailSentRef = useRef(false);

  const onInfoStep    = currentStep === TQ_INFO_STEP;
  const onThankYou    = currentStep === DONE_STEP;
  const onQuestionStep = !onInfoStep && !onThankYou;
  const questionIndex  = currentStep - TQ_QUESTIONS_START; // 0-based index into TQ_QUESTIONS

  const handleChange = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));

  const goNext = () => { setCurrentStep(s => Math.min(s + 1, DONE_STEP)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const goBack = () => { setCurrentStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(TQ_INFO_STEP);
    setDownloadFn(null);
    setEmailStatus("idle");
    emailSentRef.current = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const stepLabel = onThankYou ? "Complete" : onInfoStep ? "Patient Info" : `Question ${questionIndex + 1} of ${TQ_QUESTIONS.length}`;
  // Progress across: info step + each question step (thank-you excluded)
  const progressSteps = 1 + TQ_QUESTIONS.length; // info + 5 questions
  const progressPct   = Math.round((Math.min(currentStep, progressSteps) / progressSteps) * 100);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
        {/* ── Header ── */}
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e2e8f0" }}>
          <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', serif" }}>
                Psychotherapy Triage Questions
              </h1>
              <p style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "'Source Sans 3', sans-serif" }}>
                Cambridge Psychiatry and Behavioral Institute
              </p>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: BRAND, fontFamily: "'Source Sans 3', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {stepLabel}
            </span>
          </div>
          {/* Progress bar: info step + 5 question steps before thank-you */}
          {!onThankYou && (
            <div style={{ height: "3px", backgroundColor: "#f1f5f9" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, backgroundColor: BRAND, transition: "width 0.3s" }} />
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="max-w-3xl mx-auto px-4 py-8">

          {onInfoStep && (
            <TriagePatientInfoStep answers={answers} onChange={handleChange} onNext={goNext} />
          )}

          {onQuestionStep && (
            <>
              <TriageQuestionStep
                questionIndex={questionIndex}
                answers={answers}
                onChange={handleChange}
                onBack={goBack}
                onNext={goNext}
                isLast={questionIndex === TQ_QUESTIONS.length - 1}
              />
              <p className="text-center text-xs text-slate-400 mt-6" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                This form is confidential. All questions are required.
              </p>
            </>
          )}

          {onThankYou && (
            <div className="flex flex-col items-center text-center py-12 px-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg" style={{ backgroundColor: BRAND }}>
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: "'Lora', serif" }}>Form Submitted!</h1>
              <p className="text-slate-500 text-base max-w-sm mb-8" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Thank you, <strong className="text-slate-700">{answers.ptqName}</strong>. Your triage questions have been submitted.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                {downloadFn ? (
                  <button onClick={downloadFn}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white"
                    style={{ backgroundColor: BRAND, boxShadow: "0 4px 14px rgba(125,79,80,0.35)", fontFamily: "'Source Sans 3', sans-serif" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF Report
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white/80"
                    style={{ backgroundColor: BRAND, opacity: 0.6, fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Preparing PDF…
                  </div>
                )}

                <button onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm"
                  style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  Start New Form
                </button>
              </div>

              {/* Email status */}
              {emailStatus === "sending" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", fontFamily: "'Source Sans 3', sans-serif", marginBottom: "8px" }}>
                  <div style={{ width: "12px", height: "12px", border: "2px solid #cbd5e1", borderTopColor: BRAND, borderRadius: "50%", animation: "tqSpin 0.8s linear infinite", flexShrink: 0 }} />
                  {answers.ptqEmail ? `Sending to ${answers.ptqEmail}…` : "Sending to our office…"}
                </div>
              )}
              {emailStatus === "sent" && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#16a34a", fontFamily: "'Source Sans 3', sans-serif", marginBottom: "8px" }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {answers.ptqEmail ? `Emailed to ${answers.ptqEmail} and our office` : "Emailed to our office"}
                </div>
              )}
              {emailStatus === "error" && (
                <div style={{ fontSize: "13px", color: "#dc2626", textAlign: "center", fontFamily: "'Source Sans 3', sans-serif", marginBottom: "8px" }}>
                  Email delivery failed — please download the PDF above.
                </div>
              )}

              {/* Silent PDF builder */}
              <div aria-hidden="true" style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "1px", height: "1px", overflow: "hidden", pointerEvents: "none" }}>
                <TriageImageMapper
                  answers={answers}
                  silentMode
                  onPdfReady={(fn, blob) => {
                    setDownloadFn(() => fn);

                    // Guard against double-fire
                    if (emailSentRef.current) return;
                    emailSentRef.current = true;

                    // Auto-download
                    fn();

                    // Auto-email
                    setEmailStatus("sending");
                    const patientName = answers.ptqName || "Patient";
                    const fileName    = `${patientName.replace(/\s+/g, "_")}_Triage_Questions.pdf`;

                    new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result.split(",")[1]);
                      reader.readAsDataURL(blob);
                    })
                      .then(base64 => fetch("/api/send-forms", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          pdfBase64:      base64,
                          patientEmail:   answers.ptqEmail?.trim() || "",
                          patientName,
                          patientPhone:   answers.ptqPhone || "",
                          patientDate:    answers.ptqDate  || "",
                          fileName,
                          formName:       "Psychotherapy Triage Questions",
                        }),
                      }))
                      .then(r => r.json())
                      .then(data => {
                        if (data.success) setEmailStatus("sent");
                        else { console.error("Email error:", data.error); setEmailStatus("error"); }
                      })
                      .catch(err => { console.error("Email failed:", err); setEmailStatus("error"); });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes tqSpin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}
