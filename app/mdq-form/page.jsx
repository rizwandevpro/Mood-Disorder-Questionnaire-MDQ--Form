"use client";

// ─────────────────────────────────────────────────────────────────────────────
// page.js  (app/mdq/page.js)
//
// Thin orchestrator — owns state, renders layout shell + sticky header.
// No form logic lives here. No canvas logic lives here.
//
// File structure:
//   page.js           ← you are here  (state + layout)
//   MDQForm.js        ← multi-step form UI
//   MDQImageMapper.js ← 1275×1650 canvas renderer + POS config
//   mdqSteps.js       ← pure data (steps, labels, constants)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { STEPS, TOTAL_STEPS } from "./mdqSteps";
import MDQForm        from "./MDQForm";
import MDQImageMapper from "./MDQImageMapper";

export default function MDQPage() {
  // ── Shared state ────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [submitted,   setSubmitted]   = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const handleChange = (key, value) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const handleNext = () => {
    if (currentStep === TOTAL_STEPS - 1) {
      setSubmitted(true);
      return;
    }
    setCurrentStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditStep = (stepIndex) => {
    setCurrentStep(stepIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Progress percentage for the top bar (0–100)
  const progressPct = Math.round((currentStep / (TOTAL_STEPS - 1)) * 100);
  const step        = STEPS[currentStep];

  return (
    <>
      {/* Google Fonts — loaded once at the page level */}
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">

        {/* ── Sticky top navigation bar ── */}
        <div className="bg-gradient-to-r from-blue-950 to-blue-800 px-4 py-4 sticky top-0 z-40 shadow-md">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">

            {/* Logo + name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
                <svg viewBox="0 0 36 36" width="22" height="22" fill="none">
                  <path d="M18 3C13 3 7 8 7 15c0 5 3 9 8 11v6h6v-6c5-2 8-6 8-11C29 8 23 3 18 3z" fill="#1d4ed8" />
                  <path d="M18 3C13 3 7 8 7 15c0 5 3 9 8 11" stroke="#93c5fd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <circle cx="18" cy="15" r="2.5" fill="#60a5fa" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-bold text-xs tracking-widest uppercase leading-none" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  Cambridge Psychiatry
                </p>
                <p className="text-blue-300 text-[9px] tracking-widest uppercase" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  Mood Disorder Questionnaire (MDQ)
                </p>
              </div>
              <p className="sm:hidden text-white font-bold text-xs tracking-widest uppercase" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                MDQ
              </p>
            </div>

            {/* Step counter */}
            <p
              className="text-blue-200 text-[10px] uppercase tracking-widest flex-shrink-0"
              style={{ fontFamily: "'Source Sans 3', sans-serif" }}
            >
              {submitted
                ? "Complete"
                : step.type === "review"
                ? "Final Review"
                : `Step ${currentStep + 1} of ${TOTAL_STEPS}`}
            </p>
          </div>

          {/* Progress bar — hidden after submit */}
          {!submitted && (
            <div className="max-w-2xl mx-auto mt-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-300 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {/* Step dots */}
              <div className="flex justify-between mt-2 px-0.5">
                {STEPS.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx < currentStep
                        ? "bg-emerald-400"
                        : idx === currentStep
                        ? "bg-white scale-125"
                        : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Page body ── */}
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* ── FORM — visible before submission ── */}
          {!submitted && (
            <>
              <MDQForm
                currentStep={currentStep}
                answers={answers}
                onChange={handleChange}
                onNext={handleNext}
                onBack={handleBack}
                onEditStep={handleEditStep}
              />

              {/* Disclaimer */}
              <p
                className="text-center text-xs text-slate-400 mt-6 leading-relaxed px-4"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
              >
                This questionnaire is not a substitute for a full medical evaluation.
                <br />
                <strong className="text-slate-500">
                  An accurate diagnosis can only be made by your doctor.
                </strong>
              </p>
            </>
          )}

          {/* ── RESULT — visible after submission ── */}
          {submitted && (
            <div>
              {/* Success banner */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl px-6 py-5 flex items-center gap-4 mb-6 shadow-lg shadow-emerald-100">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "'Lora', serif" }}>
                    Questionnaire Complete
                  </p>
                  <p className="text-emerald-100 text-sm" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                    Your answers have been mapped onto the form below at 1275 × 1650 px.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-emerald-100 hover:text-white border border-white/30 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                >
                  Start Over
                </button>
              </div>

              {/* Image mapper — receives answers, manages its own canvas */}
              <MDQImageMapper answers={answers} />
            </div>
          )}

        </div>
      </div>
    </>
  );
}