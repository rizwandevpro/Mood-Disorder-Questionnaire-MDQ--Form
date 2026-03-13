"use client";

import { useState } from "react";
import { STEPS, TOTAL_STEPS, THANKYOU_STEP } from "./mdqSteps";
import MDQForm        from "./MDQForm";
import MDQImageMapper from "./MDQImageMapper";
import Image from "next/image";

export default function MDQPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers,     setAnswers]     = useState({});
  // Holds the download function provided by MDQImageMapper once PDF is built
  const [downloadFn,  setDownloadFn]  = useState(null);

  const onThankYou = currentStep === THANKYOU_STEP;

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
    setDownloadFn(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const progressPct = Math.round(
    (Math.min(currentStep, THANKYOU_STEP - 1) / (THANKYOU_STEP - 1)) * 100
  );

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">

        {/* ── Sticky top bar ── */}
        <div className="bg-[#7d4f50] px-4 py-4 sticky top-0 z-40 shadow-md">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg border border-white/20 flex items-center justify-center p-1">
                <Image src="/logo2.png" alt="Cambridge Psychiatry Logo" width={100} height={50} />
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-bold text-2xl tracking-widest uppercase leading-none" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  Cambridge Psychiatry
                </p>
                <p className="text-white/80 text-[16px] tracking-widest uppercase" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  Mood Disorder Questionnaire (MDQ)
                </p>
              </div>
              <p className="sm:hidden text-white font-bold text-xs tracking-widest uppercase" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>MDQ</p>
            </div>
            <p className="text-white/80 text-[14px] uppercase tracking-widest flex-shrink-0" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
              {onThankYou ? "Complete" : `Step ${currentStep + 1} of ${THANKYOU_STEP}`}
            </p>
          </div>

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

          {/* ── FORM ── */}
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

          {/* ── THANK YOU ── */}
          {onThankYou && (
            <div className="flex flex-col items-center text-center py-12 px-4">

              <div className="w-20 h-20 rounded-full bg-[#7d4f50] flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: "'Lora', serif" }}>
                Thank You!
              </h1>

              <p className="text-slate-500 text-base leading-relaxed max-w-sm mb-2" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Your questionnaire has been submitted successfully.
              </p>

              <p className="text-slate-500 text-base leading-relaxed max-w-sm mb-8" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Your report has been sent to{" "}
                <span className="font-semibold text-slate-700">{answers.email || "your provided email"}</span>.
              </p>

              <p className="text-slate-500 text-base leading-relaxed max-w-sm mb-2" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Can't find this email? Please check your spam or junk folder.
              </p>

              {/* ── Buttons ── */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">

                {/* Download button — shown once PDF is ready, spinner while building */}
                {downloadFn ? (
                  <button
                    onClick={downloadFn}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
                    style={{ backgroundColor: "#7d4f50", boxShadow: "0 4px 14px rgba(125,79,80,0.35)", fontFamily: "'Source Sans 3', sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#6a4142"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#7d4f50"}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF Report
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white/80"
                    style={{ backgroundColor: "#7d4f50", opacity: 0.6, fontFamily: "'Source Sans 3', sans-serif" }}
                  >
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Preparing PDF…
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm transition-all"
                  style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                >
                  Start New Assessment
                </button>
              </div>

              <p className="text-xs text-slate-400" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Same PDF that was emailed to you.
              </p>

              {/* ── Silent PDF builder ── */}
              <div
                aria-hidden="true"
                style={{
                  position: "fixed", top: "-9999px", left: "-9999px",
                  width: "1px", height: "1px", overflow: "hidden", pointerEvents: "none",
                }}
              >
                <MDQImageMapper
                  answers={answers}
                  silentMode
                  onPdfReady={(fn) => {
                    setDownloadFn(() => fn);
                    fn(); // auto-download
                  }}
                />
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}