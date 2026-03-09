"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MDQForm.js
//
// Multi-step form UI with card transition animations.
//
// ANIMATION DESIGN:
//   Forward (next question): current card flies LEFT + fades out,
//                             new card enters from RIGHT + fades in
//   Backward (back button):  current card flies RIGHT + fades out,
//                             new card enters from LEFT + fades in
//
//   The animation is driven by CSS keyframes injected once via a <style> tag.
//   Each step change re-keys the animated wrapper so React remounts it,
//   which restarts the enter animation cleanly every time.
//   The exit animation runs on the outgoing card before it unmounts.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { STEPS } from "./mdqSteps";

// ═══════════════════════════════════════════════════════════════════════════════
// CSS KEYFRAMES — injected once into <head>, used by animation classes below
// ═══════════════════════════════════════════════════════════════════════════════
const ANIMATION_STYLES = `
  /* ── Enter from right (forward navigation) ── */
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(60px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0)    scale(1);    }
  }
  /* ── Enter from left (back navigation) ── */
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-60px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0)     scale(1);    }
  }
  /* ── Exit to left (forward navigation) ── */
  @keyframes slideOutLeft {
    from { opacity: 1; transform: translateX(0)    scale(1);    }
    to   { opacity: 0; transform: translateX(-60px) scale(0.97); }
  }
  /* ── Exit to right (back navigation) ── */
  @keyframes slideOutRight {
    from { opacity: 1; transform: translateX(0)   scale(1);    }
    to   { opacity: 0; transform: translateX(60px) scale(0.97); }
  }
  .card-enter-right {
    animation: slideInRight 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .card-enter-left {
    animation: slideInLeft 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .card-exit-left {
    animation: slideOutLeft 0.22s cubic-bezier(0.4, 0, 1, 1) forwards;
    pointer-events: none;
  }
  .card-exit-right {
    animation: slideOutRight 0.22s cubic-bezier(0.4, 0, 1, 1) forwards;
    pointer-events: none;
  }
`;

// Inject styles once on module load (safe for SSR — only runs in browser)
if (typeof document !== "undefined") {
  const existing = document.getElementById("mdq-anim-styles");
  if (!existing) {
    const tag = document.createElement("style");
    tag.id = "mdq-anim-styles";
    tag.textContent = ANIMATION_STYLES;
    document.head.appendChild(tag);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED CARD WRAPPER
//
// Props:
//   stepKey    {string|number}  unique key per step — change triggers remount
//   direction  "forward"|"back" controls which enter animation plays
//   children   card content
// ═══════════════════════════════════════════════════════════════════════════════
function AnimatedCard({ stepKey, direction, children }) {
  const [phase, setPhase]     = useState("enter");  // "enter" | "idle" | "exit"
  const [exiting, setExiting] = useState(false);
  const enterClass = direction === "back" ? "card-enter-left" : "card-enter-right";

  // After enter animation completes, move to idle (no class = no animation)
  const handleAnimEnd = () => {
    if (phase === "enter") setPhase("idle");
  };

  return (
    <div
      className={phase === "enter" ? enterClass : ""}
      onAnimationEnd={handleAnimEnd}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMALL UI ATOMS
// ═══════════════════════════════════════════════════════════════════════════════

function YesNoBtn({ value, selected, onClick }) {
  const isYes  = value === "yes";
  const active = selected === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 flex items-center justify-center gap-3 py-5 px-6 rounded-xl border-2 font-semibold text-base transition-all duration-200 focus:outline-none cursor-pointer
        ${active
          ? isYes
            ? "bg-[#7d4f50] text-white"
            : "bg-[#7d4f50] text-white"
          : "border-slate-300 bg-white text-slate-600 hover:bg-blue-50"
        }`}
      style={{ fontFamily: "'Source Sans 3', sans-serif" }}
    >
      <span className="text-2xl">{isYes ? "✓" : "✕"}</span>
      <span className="text-lg">{isYes ? "Yes" : "No"}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

// Validation rules — required fields + per-field validators
const FIELD_RULES = {
  name:  { required: true,  validator: (v) => v.trim().length < 2 ? "Please enter your full name" : null },
  date:  { required: true,  validator: (v) => !v ? "Please select a date" : null },
  email: { required: false, validator: (v) => {
    if (!v || !v.trim()) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : "Please enter a valid email address";
  }},
  phone: { required: true,  validator: (v) => {
    const digits = v.replace(/[\s\-().+]/g, "");
    if (!digits) return "Please enter your phone number";
    if (!/^\d+$/.test(digits)) return "Phone number must contain only digits";
    if (digits.length < 7 || digits.length > 15) return "Please enter a valid phone number (7–15 digits)";
    return null;
  }},
};

function StepInfo({ step, answers, onChange, errors }) {
  const fields = step.fields;
  const pairs  = [[fields[0], fields[1]], [fields[2], fields[3]]];
  return (
    <div className="space-y-5">
      {pairs.map((pair, pi) => (
        <div key={pi} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pair.map((f) => {
            const err      = errors?.[f.key];
            const required = FIELD_RULES[f.key]?.required;
            return (
              <div key={f.key}>
                <label
                  className="block text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: err ? "#dc2626" : "#94a3b8", fontFamily: "'Source Sans 3', sans-serif" }}
                >
                  {f.label}
                  {required && <span style={{ color: "#7d4f50" }}> *</span>}
                  {!required && <span className="normal-case tracking-normal font-normal text-slate-400"> (optional)</span>}
                </label>
                <input
                  type={f.type}
                  inputMode={f.type === "tel" ? "numeric" : undefined}
                  value={answers[f.key] || ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full border-2 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 text-base transition placeholder-slate-300"
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    borderColor: err ? "#dc2626" : "#e2e8f0",
                  }}
                  onFocus={e => e.target.style.borderColor = err ? "#dc2626" : "#3b82f6"}
                  onBlur={e  => e.target.style.borderColor = err ? "#dc2626" : "#e2e8f0"}
                />
                {err && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {err}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function StepQ1Item({ step, answers, onAnswer }) {
  const current = answers[step.key] || null;
  return (
    <div className="space-y-6">
      <span
        className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold"
        style={{ fontFamily: "'Source Sans 3', sans-serif" }}
      >
        Item {step.itemNumber} of 13
      </span>
      <p
        className="text-lg text-slate-800 leading-relaxed font-medium"
        style={{ fontFamily: "'Lora', serif" }}
      >
        {step.label}
      </p>
      <div className="flex gap-4">
        <YesNoBtn value="yes" selected={current} onClick={onAnswer} />
        <YesNoBtn value="no"  selected={current} onClick={onAnswer} />
      </div>
    </div>
  );
}

function StepYesNo({ step, answers, onAnswer }) {
  const current = answers[step.key] || null;
  return (
    <div className="flex gap-4">
      <YesNoBtn value="yes" selected={current} onClick={onAnswer} />
      <YesNoBtn value="no"  selected={current} onClick={onAnswer} />
    </div>
  );
}

function StepChoice4({ step, answers, onAnswer }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {step.options.map((opt) => {
        const active = answers[step.key] === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onAnswer(opt.value)}
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

// ═══════════════════════════════════════════════════════════════════════════════
// CARD CONTENT — renders the right step screen inside the white card
// ═══════════════════════════════════════════════════════════════════════════════
function CardContent({ step, answers, onChange, onAnswer, onNext, onBack, isFirst }) {
  const [errors, setErrors] = useState({});

  const validateInfo = () => {
    const newErrors = {};
    step.fields?.forEach((f) => {
      const rule = FIELD_RULES[f.key];
      if (!rule) return;
      const err = rule.validator(answers[f.key] || "");
      if (err) newErrors[f.key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step.type === "info" && !validateInfo()) return;
    onNext();
  };

  // Clear individual field error as user types
  const handleChange = (key, value) => {
    onChange(key, value);
    if (errors[key]) {
      const err = FIELD_RULES[key]?.validator(value) || null;
      setErrors((prev) => ({ ...prev, [key]: err }));
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">

      {/* Header — not shown for q1_item (has its own layout inside content) */}
      {step.type !== "q1_item" && (
        <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100">
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
        </div>
      )}

      {/* Content */}
      <div className="px-6 sm:px-8 py-7">
        {step.type === "info"    && <StepInfo    step={step} answers={answers} onChange={handleChange} errors={errors} />}
        {step.type === "q1_item" && <StepQ1Item  step={step} answers={answers} onAnswer={onAnswer} />}
        {step.type === "yesno"   && <StepYesNo   step={step} answers={answers} onAnswer={onAnswer} />}
        {step.type === "choice4" && <StepChoice4 step={step} answers={answers} onAnswer={onAnswer} />}
      </div>

      {/* Footer */}
      <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border-2 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300
            ${isFirst ? "opacity-0 pointer-events-none" : ""}`}
          style={{ fontFamily: "'Source Sans 3', sans-serif" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {step.type === "info" && (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-7 py-3 rounded-sm font-semibold text-sm bg-[#7d4f50] text-white shadow-md shadow-blue-200 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ fontFamily: "'Source Sans 3', sans-serif" }}
          >
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {step.type !== "info" && (
          <p
            className="text-xs text-slate-400 italic"
            style={{ fontFamily: "'Source Sans 3', sans-serif" }}
          >
            Select an answer to continue
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MDQForm — main export
//
// Animation flow:
//   1. User selects answer / clicks Next / clicks Back
//   2. `direction` state is set to "forward" or "back"
//   3. `displayStep` keeps showing the OLD card with an EXIT animation class
//   4. After EXIT_DURATION ms, `displayStep` is updated to the new step,
//      which remounts AnimatedCard (new `key`) and plays the ENTER animation
// ═══════════════════════════════════════════════════════════════════════════════

const EXIT_DURATION  = 220; // ms — must match slideOutLeft/Right duration above
const ANSWER_DELAY   = 280; // ms — brief pause after selection so highlight is visible

export default function MDQForm({ currentStep, answers, onChange, onNext, onBack }) {
  const [displayStep, setDisplayStep]   = useState(currentStep);
  const [direction,   setDirection]     = useState("forward");
  const [isExiting,   setIsExiting]     = useState(false);
  const pendingStep                     = useRef(null);

  // ── Animate to a new step ────────────────────────────────────────────────────
  const animateTo = useCallback((targetStep, dir) => {
    if (isExiting) return; // block double-triggers during animation
    setDirection(dir);
    setIsExiting(true);
    pendingStep.current = targetStep;
  }, [isExiting]);

  // Once exit animation duration elapses, swap in the new step
  useEffect(() => {
    if (!isExiting) return;
    const t = setTimeout(() => {
      setDisplayStep(pendingStep.current);
      setIsExiting(false);
    }, EXIT_DURATION);
    return () => clearTimeout(t);
  }, [isExiting]);

  // Sync when parent currentStep changes (e.g. browser back or external reset)
  useEffect(() => {
    if (!isExiting && currentStep !== displayStep) {
      const dir = currentStep > displayStep ? "forward" : "back";
      animateTo(currentStep, dir);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAnswer = useCallback((key, value) => {
    onChange(key, value);
    setTimeout(() => {
      animateTo(currentStep + 1, "forward");
      setTimeout(() => onNext(), EXIT_DURATION);
    }, ANSWER_DELAY);
  }, [onChange, animateTo, onNext, currentStep]);

  const handleNext = useCallback(() => {
    animateTo(currentStep + 1, "forward");
    setTimeout(() => onNext(), EXIT_DURATION);
  }, [animateTo, onNext, currentStep]);

  const handleBack = useCallback(() => {
    animateTo(currentStep - 1, "back");
    setTimeout(() => onBack(), EXIT_DURATION);
  }, [animateTo, onBack, currentStep]);

  // ── Derive classes ────────────────────────────────────────────────────────────
  const exitClass  = direction === "back" ? "card-exit-right" : "card-exit-left";
  const step       = STEPS[displayStep] || STEPS[currentStep];
  const isFirst    = displayStep === 0;

  return (
    <div>
      {/* ── Q1 section header — animates with the card ── */}
      {step.type === "q1_item" && (
        <div className="mb-4 px-1">
          <div className="bg-[#7d4f50] rounded-xl px-5 py-8 shadow-md">
            <p
              className="text-white font-bold text-xl leading-tight"
              style={{ fontFamily: "'Lora', serif" }}
            >
              {step.q1Header.title}
            </p>
            <p
              className="text-white text-sm mt-1 leading-snug text-xl"
              style={{ fontFamily: "'Source Sans 3', sans-serif" }}
            >
              {step.q1Header.subtitle}
            </p>
          </div>
        </div>
      )}

      {/*
        ── Animation container ──
        overflow-hidden clips the card as it slides in/out.
        relative + fixed height prevents layout jump during transition.
      */}
      <div className="relative overflow-hidden" style={{ minHeight: "320px" }}>

        {/* Exiting card — plays exit animation, then is replaced */}
        {isExiting && (
          <div
            className={`${exitClass} absolute inset-0`}
            style={{ willChange: "transform, opacity" }}
          >
            <CardContent
              step={step}
              answers={answers}
              onChange={onChange}
              onAnswer={() => {}}   // blocked during exit
              onNext={() => {}}
              onBack={() => {}}
              isFirst={isFirst}
            />
          </div>
        )}

        {/* Entering card — keyed by displayStep so it remounts on each change */}
        {!isExiting && (
          <AnimatedCard key={displayStep} direction={direction}>
            <CardContent
              step={step}
              answers={answers}
              onChange={onChange}
              onAnswer={(val) => handleAnswer(step.key, val)}
              onNext={handleNext}
              onBack={handleBack}
              isFirst={isFirst}
            />
          </AnimatedCard>
        )}
      </div>
    </div>
  );
}