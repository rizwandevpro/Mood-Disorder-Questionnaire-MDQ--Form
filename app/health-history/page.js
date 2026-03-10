"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/health-history/page.js  →  route: /health-history
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Image from "next/image";
import { HH_STEPS, HH_TOTAL_STEPS, HH_THANKYOU_STEP } from "./healthHistorySteps";
import HealthHistoryForm        from "./HealthHistoryForm";
import HealthHistoryImageMapper from "./HealthHistoryImageMapper";

const STEP_LABELS = ["Personal","Health Maint.","Conditions","Allergies","Habits","Surgical","Pregnancy","Family","Signature"];

export default function HealthHistoryPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [downloadFn,  setDownloadFn]  = useState(null);

  const onThankYou = currentStep === HH_THANKYOU_STEP;

  const handleChange = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));
  const handleNext   = () => { setCurrentStep(s => Math.min(s + 1, HH_TOTAL_STEPS - 1)); window.scrollTo({ top:0, behavior:"smooth" }); };
  const handleBack   = () => { setCurrentStep(s => Math.max(s - 1, 0)); window.scrollTo({ top:0, behavior:"smooth" }); };
  const handleReset  = () => { setAnswers({}); setCurrentStep(0); setDownloadFn(null); window.scrollTo({ top:0, behavior:"smooth" }); };

  const progressPct = Math.round((Math.min(currentStep, HH_THANKYOU_STEP - 1) / (HH_THANKYOU_STEP - 1)) * 100);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">

        {/* ── Header ── */}
        <div className="bg-[#7d4f50] px-4 py-4 sticky top-0 z-40 shadow-md">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg border border-white/20 flex items-center justify-center p-1">
                <Image src="/logo2.png" alt="Logo" width={100} height={50} />
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-bold text-xl tracking-widest uppercase" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>Cambridge Psychiatry</p>
                <p className="text-white/80 text-xs tracking-widest uppercase" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>Patient Health History (Confidential)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm uppercase tracking-widest" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
                {onThankYou ? "Complete" : `Step ${currentStep + 1} of ${HH_THANKYOU_STEP}`}
              </p>
              {!onThankYou && (
                <p className="text-white/60 text-xs uppercase tracking-widest" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
                  {STEP_LABELS[currentStep] || ""}
                </p>
              )}
            </div>
          </div>

          {!onThankYou && (
            <div className="max-w-3xl mx-auto mt-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-300 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width:`${progressPct}%` }} />
              </div>
              <div className="flex justify-between mt-2 px-0.5">
                {STEP_LABELS.map((label, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < currentStep ? "bg-emerald-400" : i === currentStep ? "bg-white scale-125" : "bg-white/20"
                    }`} />
                    <span className="hidden lg:block text-[8px] uppercase tracking-wider"
                      style={{ color: i <= currentStep ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", fontFamily:"'Source Sans 3', sans-serif" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="max-w-3xl mx-auto px-4 py-8">

          {!onThankYou && (
            <>
              <HealthHistoryForm
                currentStep={currentStep}
                answers={answers}
                onChange={handleChange}
                onNext={handleNext}
                onBack={handleBack}
              />
              <p className="text-center text-xs text-slate-400 mt-6" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
                This form is confidential. Fields marked <span style={{ color:"#7d4f50" }}>*</span> are required.
              </p>
            </>
          )}

          {onThankYou && (
            <div className="flex flex-col items-center text-center py-12 px-4">
              <div className="w-20 h-20 rounded-full bg-[#7d4f50] flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily:"'Lora', serif" }}>Form Submitted!</h1>
              <p className="text-slate-500 text-base max-w-sm mb-8" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
                Thank you, <strong className="text-slate-700">{answers.hhName}</strong>. Your health history has been submitted.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                {downloadFn ? (
                  <button onClick={downloadFn}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white"
                    style={{ backgroundColor:"#7d4f50", boxShadow:"0 4px 14px rgba(125,79,80,0.35)", fontFamily:"'Source Sans 3', sans-serif" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF (2 pages)
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white/80"
                    style={{ backgroundColor:"#7d4f50", opacity:0.6, fontFamily:"'Source Sans 3', sans-serif" }}>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Preparing PDF…
                  </div>
                )}

                <button onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm"
                  style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
                  Start New Form
                </button>
              </div>

              {/* Silent PDF builder — hidden off-screen */}
              <div aria-hidden="true" style={{ position:"fixed", top:"-9999px", left:"-9999px", width:"1px", height:"1px", overflow:"hidden", pointerEvents:"none" }}>
                <HealthHistoryImageMapper
                  answers={answers}
                  silentMode
                  onPdfReady={fn => setDownloadFn(() => fn)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
