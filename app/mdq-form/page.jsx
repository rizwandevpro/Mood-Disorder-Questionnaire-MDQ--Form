"use client";

// ─────────────────────────────────────────────────────────────────────────────
// page.js  (app/mdq/page.js)
//
// Orchestrator — owns state, sticky header, progress bar.
// When user reaches the thank you step:
//   • MDQImageMapper is rendered invisibly (off-screen) to build the PDF
//   • PDF is emailed silently — nothing shown to the user except Thank You
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { STEPS, TOTAL_STEPS, THANKYOU_STEP } from "./mdqSteps";
import MDQForm        from "./MDQForm";
import MDQImageMapper from "./MDQImageMapper";

export default function MDQPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers,     setAnswers]     = useState({});

  const onThankYou = currentStep === THANKYOU_STEP;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const handleChange = (key, value) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const handleNext = () => {
    const next = currentStep + 1;
    if (next >= TOTAL_STEPS) return;
    setCurrentStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const step        = STEPS[currentStep];
  // Progress excludes the thank you step from the bar (bar fills at 100% on last question)
  const progressPct = Math.round((Math.min(currentStep, THANKYOU_STEP - 1) / (THANKYOU_STEP - 1)) * 100);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">

        {/* ── Sticky top bar ── */}
        <div className="bg-gradient-to-r from-blue-950 to-blue-800 px-4 py-4 sticky top-0 z-40 shadow-md">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
                <svg viewBox="0 0 36 36" width="22" height="22" fill="none">
                  <path d="M18 3C13 3 7 8 7 15c0 5 3 9 8 11v6h6v-6c5-2 8-6 8-11C29 8 23 3 18 3z" fill="#1d4ed8" />
                  <path d="M18 3C13 3 7 8 7 15c0 5 3 9 8 11" stroke="#93c5fd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <circle cx="18" cy="15" r="2.5" fill="#60a5fa" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-bold text-2xl tracking-widest uppercase leading-none" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  Cambridge Psychiatry
                </p>
                <p className="text-blue-300 text-[16px] tracking-widest uppercase" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  Mood Disorder Questionnaire (MDQ)
                </p>
              </div>
              <p className="sm:hidden text-white font-bold text-xs tracking-widest uppercase" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>MDQ</p>
            </div>

            <p className="text-blue-200 text-[10px] uppercase tracking-widest flex-shrink-0" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
              {onThankYou ? "Complete" : `Step ${currentStep + 1} of ${THANKYOU_STEP}`}
            </p>
          </div>

          {/* Progress bar — hidden on thank you */}
          {!onThankYou && (
            <div className="max-w-2xl mx-auto mt-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-300 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Page body ── */}
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* ── FORM steps (all except thank you) ── */}
          {!onThankYou && (
            <>
              <MDQForm
                currentStep={currentStep}
                answers={answers}
                onChange={handleChange}
                onNext={handleNext}
                onBack={handleBack}
              />
              <p
                className="text-center text-xs text-slate-400 mt-6 leading-relaxed px-4"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
              >
                This questionnaire is not a substitute for a full medical evaluation.
                <br />
                <strong className="text-slate-500">An accurate diagnosis can only be made by your doctor.</strong>
              </p>
            </>
          )}

          {/* ── THANK YOU screen ── */}
          {onThankYou && (
            <div className="flex flex-col items-center text-center py-12 px-4">

              {/* Check icon */}
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-lg shadow-emerald-100">
                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1
                className="text-3xl font-bold text-slate-900 mb-3"
                style={{ fontFamily: "'Lora', serif" }}
              >
                Thank You!
              </h1>

              <p
                className="text-slate-500 text-base leading-relaxed max-w-sm mb-2"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
              >
                Your questionnaire has been submitted successfully.
              </p>

              <p
                className="text-slate-500 text-base leading-relaxed max-w-sm mb-8"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
              >
                Your report has been sent to{" "}
                <span className="font-semibold text-slate-700">{answers.email || "your provided email"}</span>.
              </p>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm transition-all"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
              >
                Start New Assessment
              </button>

              {/*
                ── Silent PDF generator ────────────────────────────────────────
                Rendered off-screen (invisible, zero size, no pointer events).
                MDQImageMapper builds the canvas, generates the PDF, and emails
                it automatically via /api/send-email.
                The user never sees this — they only see the Thank You message.
              */}
              <div
                aria-hidden="true"
                style={{
                  position:      "fixed",
                  top:           "-9999px",
                  left:          "-9999px",
                  width:         "1px",
                  height:        "1px",
                  overflow:      "hidden",
                  pointerEvents: "none",
                }}
              >
                <MDQImageMapper answers={answers} silentMode />
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}