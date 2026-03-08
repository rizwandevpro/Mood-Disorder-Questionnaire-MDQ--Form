"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MDQForm.js
//
// The multi-step form UI.
// Receives:
//   currentStep  {number}    — which step is active (controlled by page.js)
//   answers      {object}    — current answer state (controlled by page.js)
//   onChange     {function}  — (key, value) => void
//   onNext       {function}  — advance to next step
//   onBack       {function}  — go back one step
//   onEditStep   {function}  — (stepIndex) => void — jump to a specific step from review
// ─────────────────────────────────────────────────────────────────────────────

import { STEPS, TOTAL_STEPS, Q3_LABELS } from "./mdqSteps";

// ═══════════════════════════════════════════════════════════════════════════════
// SMALL SHARED UI ATOMS
// ═══════════════════════════════════════════════════════════════════════════════

function YesNoBtn({ value, selected, onClick }) {
  const isYes  = value === "yes";
  const active = selected === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border-2 font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400
        ${active
          ? isYes
            ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-[1.02]"
            : "border-rose-400 bg-rose-400 text-white shadow-lg shadow-rose-200 scale-[1.02]"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:scale-[1.01]"
        }`}
      style={{ fontFamily: "'Source Sans 3', sans-serif" }}
    >
      <span className="text-xl">{isYes ? "✓" : "✕"}</span>
      <span>{isYes ? "Yes" : "No"}</span>
    </button>
  );
}

function Badge({ value }) {
  if (value === "yes")
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">✓ Yes</span>;
  if (value === "no")
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-xs font-bold">✕ No</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-400 text-xs font-medium">— Skipped</span>;
}

function ReviewCard({ title, children, onEdit }) {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <span
          className="text-xs font-bold text-slate-600 uppercase tracking-wider"
          style={{ fontFamily: "'Source Sans 3', sans-serif" }}
        >
          {title}
        </span>
        <button
          onClick={onEdit}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          style={{ fontFamily: "'Source Sans 3', sans-serif" }}
        >
          Edit
        </button>
      </div>
      <div className="px-4 py-3 bg-white">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP SCREEN COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Step 0 — Patient name + date
function StepInfo({ answers, onChange }) {
  // Render fields in pairs: [name, date] on one row, [email, phone] on next
  const fields = STEPS[0].fields;
  const pairs  = [[fields[0], fields[1]], [fields[2], fields[3]]];

  return (
    <div className="space-y-5">
      {pairs.map((pair, pi) => (
        <div key={pi} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pair.map((f) => (
            <div key={f.key}>
              <label
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
              >
                {f.label}
              </label>
              <input
                type={f.type}
                inputMode={f.type === "tel" ? "tel" : undefined}
                value={answers[f.key] || ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-base transition placeholder-slate-300"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Steps 2, 4, 5 — Single Yes/No question
function StepYesNo({ step, answers, onChange }) {
  return (
    <div className="flex gap-4">
      <YesNoBtn value="yes" selected={answers[step.key] || null} onClick={(v) => onChange(step.key, v)} />
      <YesNoBtn value="no"  selected={answers[step.key] || null} onClick={(v) => onChange(step.key, v)} />
    </div>
  );
}

// Step 1 — Q1: 13 yes/no symptom items
function StepMultiYesNo({ step, answers, onChange }) {
  return (
    <div className="space-y-3">
      {step.items.map((item, idx) => {
        const val = answers[item.key] || null;
        return (
          <div
            key={item.key}
            className={`rounded-xl border-2 px-4 py-3 transition-all duration-150 ${
              val ? "border-blue-200 bg-blue-50/60" : "border-slate-100 bg-white hover:border-slate-200"
            }`}
          >
            <p
              className="text-sm text-slate-700 leading-relaxed mb-3"
              style={{ fontFamily: "'Source Sans 3', sans-serif" }}
            >
              <span className="font-bold text-blue-700 mr-1">{idx + 1}.</span>
              {item.label}
            </p>
            <div className="flex gap-3">
              {["yes", "no"].map((v) => {
                const isYes  = v === "yes";
                const active = val === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onChange(item.key, v)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all duration-150 focus:outline-none
                      ${active
                        ? isYes
                          ? "border-emerald-400 bg-emerald-500 text-white"
                          : "border-rose-400 bg-rose-400 text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:border-blue-300"
                      }`}
                    style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                  >
                    <span>{isYes ? "✓" : "✕"}</span>
                    <span>{isYes ? "Yes" : "No"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Step 3 — Q3: 4-option severity card grid
function StepChoice4({ step, answers, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {step.options.map((opt) => {
        const active = answers[step.key] === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(step.key, opt.value)}
            className={`flex flex-col items-start gap-2 p-5 rounded-2xl border-2 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
              ${active
                ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-100 scale-[1.02]"
                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 hover:scale-[1.01]"
              }`}
          >
            <span className="text-3xl">{opt.icon}</span>
            <span
              className={`font-bold text-base ${active ? "text-blue-800" : "text-slate-700"}`}
              style={{ fontFamily: "'Lora', serif" }}
            >
              {opt.label}
            </span>
            <span
              className={`text-xs leading-snug ${active ? "text-blue-600" : "text-slate-400"}`}
              style={{ fontFamily: "'Source Sans 3', sans-serif" }}
            >
              {opt.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Step 6 — Review all answers before submitting
function StepReview({ answers, onEditStep }) {
  const q1Items = STEPS[1].items;
  return (
    <div className="space-y-4">
      <ReviewCard title="Patient Information" onEdit={() => onEditStep(0)}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Name</p>
            <p className="text-sm font-semibold text-slate-800">{answers.name || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
            <p className="text-sm font-semibold text-slate-800">{answers.date || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
            <p className="text-sm font-semibold text-slate-800">{answers.email || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Phone</p>
            <p className="text-sm font-semibold text-slate-800">{answers.phone || "—"}</p>
          </div>
        </div>
      </ReviewCard>

      <ReviewCard title="Q1 — Symptom History" onEdit={() => onEditStep(1)}>
        <div className="space-y-2">
          {q1Items.map((item, idx) => (
            <div key={item.key} className="flex items-start justify-between gap-3">
              <p className="text-xs text-slate-600 flex-1 leading-snug">
                <span className="font-bold text-slate-400 mr-1">{idx + 1}.</span>
                {item.label.slice(1, 58)}…
              </p>
              <Badge value={answers[item.key]} />
            </div>
          ))}
        </div>
      </ReviewCard>

      <ReviewCard title="Q2 — Same Time Period" onEdit={() => onEditStep(2)}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Did several happen simultaneously?</p>
          <Badge value={answers.q2} />
        </div>
      </ReviewCard>

      <ReviewCard title="Q3 — Level of Problem" onEdit={() => onEditStep(3)}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">How much of a problem?</p>
          {answers.q3
            ? <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{Q3_LABELS[answers.q3]}</span>
            : <Badge value={null} />
          }
        </div>
      </ReviewCard>

      <ReviewCard title="Q4 — Family History" onEdit={() => onEditStep(4)}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Blood relatives with bipolar?</p>
          <Badge value={answers.q4} />
        </div>
      </ReviewCard>

      <ReviewCard title="Q5 — Professional Diagnosis" onEdit={() => onEditStep(5)}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Ever diagnosed by health professional?</p>
          <Badge value={answers.q5} />
        </div>
      </ReviewCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MDQForm — main export
// ═══════════════════════════════════════════════════════════════════════════════
export default function MDQForm({
  currentStep,
  answers,
  onChange,
  onNext,
  onBack,
  onEditStep,
}) {
  const step    = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast  = currentStep === TOTAL_STEPS - 1;

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">

      {/* ── Card header ── */}
      <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-3">
          {/* Step number badge */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${
              step.type === "review"
                ? "bg-violet-100 text-violet-700"
                : "bg-blue-100 text-blue-700"
            }`}
            style={{ fontFamily: "'Lora', serif" }}
          >
            {step.type === "review" ? "✓" : currentStep + 1}
          </div>
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-1"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
            >
              {step.title}
            </h2>
            <p
              className="text-sm text-slate-500 leading-relaxed"
              style={{ fontFamily: "'Source Sans 3', sans-serif" }}
            >
              {step.subtitle}
            </p>
            {step.hint && (
              <p
                className="text-xs text-blue-500 font-semibold mt-1.5 flex items-center gap-1"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {step.hint}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Step content — rendered based on step.type ── */}
      <div className="px-6 sm:px-8 py-6">
        {step.type === "info"        && <StepInfo        answers={answers} onChange={onChange} />}
        {step.type === "yesno"       && <StepYesNo       step={step} answers={answers} onChange={onChange} />}
        {step.type === "multi_yesno" && <StepMultiYesNo  step={step} answers={answers} onChange={onChange} />}
        {step.type === "choice4"     && <StepChoice4     step={step} answers={answers} onChange={onChange} />}
        {step.type === "review"      && <StepReview      answers={answers} onEditStep={onEditStep} />}
      </div>

      {/* ── Navigation footer ── */}
      <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300
            ${isFirst
              ? "opacity-0 pointer-events-none"
              : "border-2 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
            }`}
          style={{ fontFamily: "'Source Sans 3', sans-serif" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Next / Generate button */}
        <button
          type="button"
          onClick={onNext}
          className={`flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${isLast
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-200"
              : "bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700 text-white shadow-blue-200"
            }`}
          style={{ fontFamily: "'Source Sans 3', sans-serif" }}
        >
          {isLast ? "Generate Result" : "Next"}
          {!isLast && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {isLast && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}