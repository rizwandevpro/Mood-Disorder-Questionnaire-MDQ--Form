"use client";

// ─────────────────────────────────────────────────────────────────────────────
// IntakeForm.js — New Patient Intake Form UI
//
// Multi-step form with:
//   • Field validation (required fields, email, phone)
//   • Insurance section (primary + secondary side by side)
//   • Signature pad (draw) + upload fallback
//   • Card slide animations matching MDQ style
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { INTAKE_STEPS } from "./intakeSteps";

// ── Brand ─────────────────────────────────────────────────────────────────────
const BRAND       = "#7d4f50";
const BRAND_LIGHT = "rgba(125,79,80,0.08)";
const BRAND_SHADOW= "0 8px 24px rgba(125,79,80,0.18)";

// ── Animations ────────────────────────────────────────────────────────────────
const ANIM_CSS = `
  @keyframes intakeSlideInRight { from{opacity:0;transform:translateX(60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes intakeSlideInLeft  { from{opacity:0;transform:translateX(-60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes intakeSlideOutLeft { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(-60px) scale(0.97)} }
  @keyframes intakeSlideOutRight{ from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(60px) scale(0.97)} }
  .intake-enter-right { animation: intakeSlideInRight 0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .intake-enter-left  { animation: intakeSlideInLeft  0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .intake-exit-left   { animation: intakeSlideOutLeft  0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
  .intake-exit-right  { animation: intakeSlideOutRight 0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
`;
if (typeof document !== "undefined") {
  if (!document.getElementById("intake-anim-styles")) {
    const t = document.createElement("style");
    t.id = "intake-anim-styles";
    t.textContent = ANIM_CSS;
    document.head.appendChild(t);
  }
}

const EXIT_DURATION = 220;

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════
function validateField(key, value, required) {
  const v = (value || "").toString().trim();
  if (required && !v) return "This field is required";

  // email
  if (key === "email" && v) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address";
  }
  // phone fields
  if ((key === "cellPhone" || key === "homePhone" || key === "ecTelephone") && v) {
    const digits = v.replace(/[\s\-().+]/g, "");
    if (!/^\d+$/.test(digits)) return "Numbers only please";
    if (digits.length < 7 || digits.length > 15) return "Must be 7–15 digits";
  }
  // zip
  if (key === "zip" && v) {
    if (!/^\d{4,10}$/.test(v.replace(/\s/g, ""))) return "Please enter a valid zip code";
  }
  return null;
}

function validateStep(step, answers) {
  const errors = {};

  if (step.type === "fields") {
    step.fields.forEach((f) => {
      const err = validateField(f.key, answers[f.key], f.required);
      if (err) errors[f.key] = err;
    });
  }

  if (step.type === "insurance") {
    // Only primary insurance is required
    step.primaryFields.forEach((f) => {
      const err = validateField(f.key, answers[f.key], f.required);
      if (err) errors[f.key] = err;
    });
  }

  if (step.type === "signature") {
    if (!answers.signature) errors.signature = "Please provide your signature";
    if (!answers.sigDate)   errors.sigDate   = "Please enter the date";
  }

  return errors;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE INPUT
// ═══════════════════════════════════════════════════════════════════════════════
function Field({ f, answers, onChange, errors }) {
  const err = errors?.[f.key];
  const val = answers[f.key] || "";

  const baseClass = "w-full border-2 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm transition placeholder-slate-300";

  const borderStyle = { borderColor: err ? "#dc2626" : "#e2e8f0" };
  const onFocus = (e) => { e.target.style.borderColor = err ? "#dc2626" : "#3b82f6"; };
  const onBlur  = (e) => { e.target.style.borderColor = err ? "#dc2626" : "#e2e8f0"; };

  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
        style={{ color: err ? "#dc2626" : "#94a3b8", fontFamily: "'Source Sans 3', sans-serif" }}>
        {f.label}
        {f.required && <span style={{ color: BRAND }}> *</span>}
        {!f.required && <span className="normal-case tracking-normal font-normal text-slate-400"> (optional)</span>}
      </label>

      {f.type === "select" ? (
        <select
          value={val}
          onChange={(e) => onChange(f.key, e.target.value)}
          className={baseClass}
          style={{ ...borderStyle, fontFamily: "'Source Sans 3', sans-serif" }}
          onFocus={onFocus} onBlur={onBlur}
        >
          <option value="">Select…</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={f.type}
          inputMode={f.type === "tel" ? "numeric" : undefined}
          value={val}
          onChange={(e) => onChange(f.key, e.target.value)}
          placeholder={f.placeholder}
          className={baseClass}
          style={{ ...borderStyle, fontFamily: "'Source Sans 3', sans-serif" }}
          onFocus={onFocus} onBlur={onBlur}
        />
      )}

      {err && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1"
          style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {err}
        </p>
      )}
    </div>
  );
}

// span → Tailwind col-span class
function spanClass(span) {
  switch (span) {
    case "full":        return "col-span-4";
    case "threequarter":return "col-span-3";
    case "half":        return "col-span-2";
    case "third":       return "col-span-4 sm:col-span-1";  // 3 cols on sm
    case "quarter":     return "col-span-1";
    default:            return "col-span-2";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

function StepFields({ step, answers, onChange, errors }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {step.fields.map((f) => (
        <div key={f.key} className={spanClass(f.span)}>
          <Field f={f} answers={answers} onChange={onChange} errors={errors} />
        </div>
      ))}
    </div>
  );
}

function StepInsurance({ step, answers, onChange, errors }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Primary */}
      <div className="rounded-2xl border-2 border-slate-200 p-5">
        <p className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100"
          style={{ fontFamily: "'Lora', serif" }}>
          Primary Insurance <span style={{ color: BRAND }}>*</span>
        </p>
        <div className="space-y-3">
          {step.primaryFields.map((f) => (
            <Field key={f.key} f={f} answers={answers} onChange={onChange} errors={errors} />
          ))}
        </div>
      </div>
      {/* Secondary */}
      <div className="rounded-2xl border-2 border-slate-200 p-5">
        <p className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100"
          style={{ fontFamily: "'Lora', serif" }}>
          Secondary Insurance <span className="text-slate-400 font-normal text-xs">(optional)</span>
        </p>
        <div className="space-y-3">
          {step.secondaryFields.map((f) => (
            <Field key={f.key} f={f} answers={answers} onChange={onChange} errors={errors} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Signature Pad ─────────────────────────────────────────────────────────────
function SignaturePad({ value, onChange, error }) {
  const canvasRef  = useRef(null);
  const drawing    = useRef(false);
  const lastPos    = useRef(null);
  const fileRef    = useRef(null);
  const [mode, setMode]   = useState("draw"); // "draw" | "upload"
  const [isEmpty, setIsEmpty] = useState(!value);

  // On mount: if there's already a saved signature, paint it back
  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new window.Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      img.src = value;
    }
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
    lastPos.current = pos;
    setIsEmpty(false);
  };

  const endDraw = (e) => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL());
  };

  const clearSig = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange(null);
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx    = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Scale to fit
        const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (canvas.width  - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        setIsEmpty(false);
        onChange(canvas.toDataURL());
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex gap-2 mb-3">
        {["draw", "upload"].map((m) => (
          <button key={m} type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all`}
            style={{
              fontFamily: "'Source Sans 3', sans-serif",
              borderColor: mode === m ? BRAND : "#e2e8f0",
              backgroundColor: mode === m ? BRAND : "white",
              color: mode === m ? "white" : "#64748b",
            }}>
            {m === "draw" ? "✍️ Draw Signature" : "📁 Upload Signature"}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className={`relative rounded-xl border-2 overflow-hidden bg-white ${error ? "border-red-500" : "border-slate-200"}`}
        style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={560}
          height={140}
          className="w-full cursor-crosshair"
          style={{ display: mode === "draw" ? "block" : "none" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {mode === "upload" && (
          <div className="h-[140px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition"
            onClick={() => fileRef.current?.click()}>
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm text-slate-400" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
              Click to upload signature image
            </p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        )}

        {/* Watermark when empty + draw mode */}
        {isEmpty && mode === "draw" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-200 text-lg select-none" style={{ fontFamily: "'Lora', serif" }}>
              Sign here
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        {error ? (
          <p className="text-xs text-red-500 flex items-center gap-1" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </p>
        ) : (
          <p className="text-xs text-slate-400" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
            {mode === "draw" ? "Draw your signature above" : "Upload a clear image of your signature"}
          </p>
        )}
        {!isEmpty && (
          <button type="button" onClick={clearSig}
            className="text-xs text-red-400 hover:text-red-600 font-semibold transition"
            style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function StepSignature({ step, answers, onChange, errors }) {
  return (
    <div className="space-y-5">
      {/* Authorization text */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-sm text-slate-600 leading-relaxed" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
          {step.text}
        </p>
      </div>

      {/* Signature pad */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: errors?.signature ? "#dc2626" : "#94a3b8", fontFamily: "'Source Sans 3', sans-serif" }}>
          Signature <span style={{ color: BRAND }}>*</span>
        </label>
        <SignaturePad
          value={answers.signature}
          onChange={(v) => onChange("signature", v)}
          error={errors?.signature}
        />
      </div>

      {/* Date */}
      <div className="max-w-xs">
        <Field
          f={{ key: "sigDate", label: "Date", type: "date", required: true }}
          answers={answers}
          onChange={onChange}
          errors={errors}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARD — wraps each step with header + footer
// ═══════════════════════════════════════════════════════════════════════════════
function Card({ step, answers, onChange, onNext, onBack, isFirst, isLast }) {
  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    onChange(key, value);
    // Live-clear error for this field
    if (errors[key]) {
      const field = findField(step, key);
      const err   = field ? validateField(key, value, field.required) : null;
      setErrors((prev) => ({ ...prev, [key]: err }));
    }
  };

  const handleNext = () => {
    const errs = validateStep(step, answers);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onNext();
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-1"
          style={{ fontFamily: "'Lora', Georgia, serif" }}>
          {step.title}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed"
          style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
          {step.subtitle}
        </p>
      </div>

      {/* Content */}
      <div className="px-6 sm:px-8 py-7">
        {step.type === "fields"    && <StepFields    step={step} answers={answers} onChange={handleChange} errors={errors} />}
        {step.type === "insurance" && <StepInsurance step={step} answers={answers} onChange={handleChange} errors={errors} />}
        {step.type === "signature" && <StepSignature step={step} answers={answers} onChange={handleChange} errors={errors} />}
      </div>

      {/* Footer */}
      <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
        <button type="button" onClick={onBack}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border-2 border-slate-200 text-slate-600 hover:bg-slate-100 transition-all focus:outline-none
            ${isFirst ? "opacity-0 pointer-events-none" : ""}`}
          style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <button type="button" onClick={handleNext}
          className="flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm text-white transition-all focus:outline-none"
          style={{ backgroundColor: BRAND, boxShadow: BRAND_SHADOW, fontFamily: "'Source Sans 3', sans-serif" }}>
          {isLast ? "Submit" : "Next"}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// helper: find field definition by key across all field arrays in a step
function findField(step, key) {
  if (step.type === "fields")    return step.fields?.find((f) => f.key === key);
  if (step.type === "insurance") return [...(step.primaryFields || []), ...(step.secondaryFields || [])].find((f) => f.key === key);
  if (step.type === "signature") return key === "sigDate" ? { key: "sigDate", required: true } : null;
  return null;
}

// ── Animated wrapper ──────────────────────────────────────────────────────────
function AnimatedCard({ direction, children }) {
  const [phase, setPhase] = useState("enter");
  const cls = direction === "back" ? "intake-enter-left" : "intake-enter-right";
  return (
    <div className={phase === "enter" ? cls : ""} onAnimationEnd={() => setPhase("idle")}
      style={{ willChange: "transform, opacity" }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function IntakeForm({ currentStep, answers, onChange, onNext, onBack }) {
  const [displayStep, setDisplayStep] = useState(currentStep);
  const [direction,   setDirection]   = useState("forward");
  const [isExiting,   setIsExiting]   = useState(false);
  const pendingStep                   = useRef(null);

  const animateTo = useCallback((target, dir) => {
    if (isExiting) return;
    setDirection(dir);
    setIsExiting(true);
    pendingStep.current = target;
  }, [isExiting]);

  useEffect(() => {
    if (!isExiting) return;
    const t = setTimeout(() => {
      setDisplayStep(pendingStep.current);
      setIsExiting(false);
    }, EXIT_DURATION);
    return () => clearTimeout(t);
  }, [isExiting]);

  useEffect(() => {
    if (!isExiting && currentStep !== displayStep) {
      animateTo(currentStep, currentStep > displayStep ? "forward" : "back");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleNext = useCallback(() => {
    animateTo(currentStep + 1, "forward");
    setTimeout(() => onNext(), EXIT_DURATION);
  }, [animateTo, onNext, currentStep]);

  const handleBack = useCallback(() => {
    animateTo(currentStep - 1, "back");
    setTimeout(() => onBack(), EXIT_DURATION);
  }, [animateTo, onBack, currentStep]);

  const exitClass = direction === "back" ? "intake-exit-right" : "intake-exit-left";
  const step      = INTAKE_STEPS[displayStep] || INTAKE_STEPS[currentStep];
  const isFirst   = displayStep === 0;
  const isLast    = displayStep === INTAKE_STEPS.length - 2; // last real step before thankyou

  return (
    <div className="relative overflow-hidden" style={{ minHeight: "420px" }}>
      {isExiting && (
        <div className={`${exitClass} absolute inset-0`} style={{ willChange: "transform, opacity" }}>
          <Card step={step} answers={answers} onChange={onChange}
            onNext={() => {}} onBack={() => {}} isFirst={isFirst} isLast={isLast} />
        </div>
      )}
      {!isExiting && (
        <AnimatedCard key={displayStep} direction={direction}>
          <Card step={step} answers={answers} onChange={onChange}
            onNext={handleNext} onBack={handleBack} isFirst={isFirst} isLast={isLast} />
        </AnimatedCard>
      )}
    </div>
  );
}
