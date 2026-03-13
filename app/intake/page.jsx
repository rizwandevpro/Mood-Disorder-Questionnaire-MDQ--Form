"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/intake/page.js
//
// New Patient Intake Form — orchestrator page.
// Place at: app/intake/page.js  (route: /intake)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Image from "next/image";
import { INTAKE_STEPS, INTAKE_TOTAL_STEPS, INTAKE_THANKYOU_STEP } from "./intakeSteps";
import IntakeForm        from "./IntakeForm";
import IntakeImageMapper from "./IntakeImageMapper";

export default function IntakePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [downloadFn,  setDownloadFn]  = useState(null);

  const onThankYou = currentStep === INTAKE_THANKYOU_STEP;

  const handleChange = (key, value) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const handleNext = () => {
    const next = currentStep + 1;
    if (next >= INTAKE_TOTAL_STEPS) return;
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
    setDownloadFn(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Progress bar — excludes thank you step
  const progressPct = Math.round(
    (Math.min(currentStep, INTAKE_THANKYOU_STEP - 1) / (INTAKE_THANKYOU_STEP - 1)) * 100
  );

  // Step label for header
  const stepLabels = ["Personal", "Location", "Contact", "Demographics", "Emergency", "Insurance", "Signature"];
  const stepLabel  = onThankYou ? "Complete" : stepLabels[currentStep] || "";

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">

        {/* ── Sticky header ── */}
        <div className="bg-[#7d4f50] px-4 py-4 sticky top-0 z-40 shadow-md">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg border border-white/20 flex items-center justify-center p-1">
                <Image src="/logo2.png" alt="Cambridge Psychiatry Logo" width={100} height={50} />
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-bold text-2xl tracking-widest uppercase leading-none"
                  style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  Cambridge Psychiatry
                </p>
                <p className="text-white/80 text-[16px] tracking-widest uppercase"
                  style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  New Patient Intake Form
                </p>
              </div>
              <p className="sm:hidden text-white font-bold text-xs tracking-widest uppercase"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Intake
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-[14px] uppercase tracking-widest"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                {onThankYou ? "Complete" : `Step ${currentStep + 1} of ${INTAKE_THANKYOU_STEP}`}
              </p>
              {!onThankYou && (
                <p className="text-white/60 text-[11px] uppercase tracking-widest"
                  style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  {stepLabel}
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {!onThankYou && (
            <div className="max-w-2xl mx-auto mt-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-300 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {/* Step dots */}
              <div className="flex justify-between mt-2 px-0.5">
                {stepLabels.map((label, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < currentStep ? "bg-emerald-400" :
                      i === currentStep ? "bg-white scale-125" :
                      "bg-white/20"
                    }`} />
                    <span className="hidden sm:block text-[9px] uppercase tracking-wider"
                      style={{ color: i <= currentStep ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
                               fontFamily: "'Source Sans 3', sans-serif" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Form steps */}
          {!onThankYou && (
            <>
              <IntakeForm
                currentStep={currentStep}
                answers={answers}
                onChange={handleChange}
                onNext={handleNext}
                onBack={handleBack}
              />
              <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed px-4"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Your information is kept confidential and used only for medical purposes.
                <br />
                <strong className="text-slate-500">Fields marked with * are required.</strong>
              </p>
            </>
          )}

          {/* Thank You */}
          {onThankYou && (
            <div className="flex flex-col items-center text-center py-12 px-4">

              <div className="w-20 h-20 rounded-full bg-[#7d4f50] flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-3"
                style={{ fontFamily: "'Lora', serif" }}>
                Form Submitted!
              </h1>

              <p className="text-slate-500 text-base leading-relaxed max-w-sm mb-2"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Thank you, <strong className="text-slate-700">{answers.firstName} {answers.lastName}</strong>.
              </p>

              <p className="text-slate-500 text-base leading-relaxed max-w-sm mb-8"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Your intake form has been submitted successfully.
              </p>
              <p className="text-slate-500 text-base leading-relaxed max-w-sm mb-8"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Can't find this email? Please check your spam or junk folder.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">

                {/* Download */}
                {downloadFn ? (
                  <button onClick={downloadFn}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
                    style={{ backgroundColor: "#7d4f50", boxShadow: "0 4px 14px rgba(125,79,80,0.35)",
                             fontFamily: "'Source Sans 3', sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#6a4142"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#7d4f50"}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white/80"
                    style={{ backgroundColor: "#7d4f50", opacity: 0.6, fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Preparing PDF…
                  </div>
                )}

                <button onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm transition-all"
                  style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  Start New Form
                </button>
              </div>

              <p className="text-xs text-slate-400" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Download your filled form as a PDF for your records.
              </p>

              {/* Silent PDF builder */}
              <div aria-hidden="true" style={{
                position: "fixed", top: "-9999px", left: "-9999px",
                width: "1px", height: "1px", overflow: "hidden", pointerEvents: "none",
              }}>
                <IntakeImageMapper
                  answers={answers}
                  silentMode
                  onPdfReady={(fn) => setDownloadFn(() => fn)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}