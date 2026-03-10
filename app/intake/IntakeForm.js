"use client";

// ─────────────────────────────────────────────────────────────────────────────
// IntakeForm.js — New Patient Intake Form UI
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { INTAKE_STEPS } from "./intakeSteps";

const BRAND        = "#7d4f50";
const BRAND_SHADOW = "0 8px 24px rgba(125,79,80,0.18)";
const EXIT_DURATION = 220;

// ── Inject animation + responsive grid CSS once ───────────────────────────────
const ANIM_CSS = `
  @keyframes intakeSlideInRight { from{opacity:0;transform:translateX(60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes intakeSlideInLeft  { from{opacity:0;transform:translateX(-60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes intakeSlideOutLeft { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(-60px) scale(0.97)} }
  @keyframes intakeSlideOutRight{ from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(60px) scale(0.97)} }
  .intake-enter-right { animation: intakeSlideInRight 0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .intake-enter-left  { animation: intakeSlideInLeft  0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .intake-exit-left   { animation: intakeSlideOutLeft  0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
  .intake-exit-right  { animation: intakeSlideOutRight 0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }

  /* Responsive field grid — 4 cols desktop, 2 cols mobile */
  .intake-grid { display:grid; gap:16px; grid-template-columns:repeat(4,1fr); }
  .intake-span-full    { grid-column: span 4; }
  .intake-span-three   { grid-column: span 3; }
  .intake-span-half    { grid-column: span 2; }
  .intake-span-quarter { grid-column: span 1; }

  @media (max-width: 640px) {
    .intake-grid         { grid-template-columns: repeat(2, 1fr); }
    .intake-span-full    { grid-column: span 2; }
    .intake-span-three   { grid-column: span 2; }
    .intake-span-half    { grid-column: span 2; }
    .intake-span-quarter { grid-column: span 1; }
  }

  /* Insurance 2-col grid */
  .intake-ins-grid { display:grid; gap:24px; grid-template-columns:1fr 1fr; }
  @media (max-width: 640px) { .intake-ins-grid { grid-template-columns:1fr; } }
`;
if (typeof document !== "undefined" && !document.getElementById("intake-anim-styles")) {
  const t = document.createElement("style");
  t.id = "intake-anim-styles";
  t.textContent = ANIM_CSS;
  document.head.appendChild(t);
}

// ── Span → injected CSS class ─────────────────────────────────────────────────
function getSpanClass(span) {
  switch (span) {
    case "full":         return "intake-span-full";
    case "threequarter": return "intake-span-three";
    case "half":         return "intake-span-half";
    case "quarter":      return "intake-span-quarter";
    case "third":        return "intake-span-half";
    default:             return "intake-span-half";
  }
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateField(key, value, required) {
  const v = (value || "").toString().trim();
  if (required && !v) return "This field is required";
  if (key === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return "Please enter a valid email address";
  if ((key === "cellPhone" || key === "homePhone" || key === "ecTelephone") && v) {
    const d = v.replace(/[\s\-().+]/g, "");
    if (!/^\d+$/.test(d) || d.length < 7 || d.length > 15) return "Must be 7–15 digits";
  }
  if (key === "zip" && v && !/^\d{4,10}$/.test(v.replace(/\s/g, "")))
    return "Please enter a valid zip code";
  return null;
}

function validateStep(step, answers) {
  const errors = {};
  if (step.type === "fields")
    step.fields.forEach((f) => { const e = validateField(f.key, answers[f.key], f.required); if (e) errors[f.key] = e; });
  if (step.type === "insurance")
    step.primaryFields.forEach((f) => { const e = validateField(f.key, answers[f.key], f.required); if (e) errors[f.key] = e; });
  if (step.type === "signature") {
    if (!answers.signature) errors.signature = "Please provide your signature";
    if (!answers.sigDate)   errors.sigDate   = "Please enter the date";
  }
  return errors;
}

// ── Shared input style helper ─────────────────────────────────────────────────
function inputStyle(err, focused) {
  return {
    width: "100%", boxSizing: "border-box",
    border: `2px solid ${err ? "#dc2626" : focused ? "#3b82f6" : "#e2e8f0"}`,
    borderRadius: "12px", padding: "12px 16px",
    fontSize: "14px", fontWeight: 500, color: "#1e293b",
    backgroundColor: "#f8fafc", outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "'Source Sans 3', sans-serif",
  };
}

// ── Field component ───────────────────────────────────────────────────────────
function Field({ f, answers, onChange, errors }) {
  const err = errors?.[f.key];
  const val = answers[f.key] || "";
  const [focused, setFocused] = useState(false);
  const iStyle = inputStyle(err, focused);

  return (
    <div>
      <label style={{
        display:"block", fontSize:"10px", fontWeight:700,
        textTransform:"uppercase", letterSpacing:"0.1em",
        marginBottom:"6px", fontFamily:"'Source Sans 3', sans-serif",
        color: err ? "#dc2626" : "#94a3b8",
      }}>
        {f.label}
        {f.required  && <span style={{color:BRAND}}> *</span>}
        {!f.required && <span style={{textTransform:"none",letterSpacing:"normal",fontWeight:400,color:"#cbd5e1"}}> (optional)</span>}
      </label>

      {f.type === "select" ? (
        <select value={val} onChange={e => onChange(f.key, e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={iStyle}>
          <option value="">Select…</option>
          {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={f.type} inputMode={f.type==="tel"?"numeric":undefined}
          value={val} onChange={e => onChange(f.key, e.target.value)}
          placeholder={f.placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={iStyle} />
      )}

      {err && (
        <p style={{marginTop:"4px",fontSize:"12px",color:"#ef4444",display:"flex",alignItems:"center",gap:"4px",fontFamily:"'Source Sans 3', sans-serif"}}>
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {err}
        </p>
      )}
    </div>
  );
}

// ── Step: fields ──────────────────────────────────────────────────────────────
function StepFields({ step, answers, onChange, errors }) {
  return (
    <div className="intake-grid">
      {step.fields.map(f => (
        <div key={f.key} className={getSpanClass(f.span)}>
          <Field f={f} answers={answers} onChange={onChange} errors={errors} />
        </div>
      ))}
    </div>
  );
}

// ── Step: insurance ───────────────────────────────────────────────────────────
function StepInsurance({ step, answers, onChange, errors }) {
  const panelStyle = { borderRadius:"16px", border:"2px solid #e2e8f0", padding:"20px" };
  const titleStyle = { fontSize:"15px", fontWeight:700, color:"#374151", marginBottom:"16px", paddingBottom:"8px", borderBottom:"1px solid #f1f5f9", fontFamily:"'Lora', serif" };
  return (
    <div className="intake-ins-grid">
      <div style={panelStyle}>
        <p style={titleStyle}>Primary Insurance <span style={{color:BRAND}}>*</span></p>
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          {step.primaryFields.map(f => <Field key={f.key} f={f} answers={answers} onChange={onChange} errors={errors} />)}
        </div>
      </div>
      <div style={panelStyle}>
        <p style={titleStyle}>Secondary Insurance <span style={{fontSize:"12px",fontWeight:400,color:"#94a3b8"}}>(optional)</span></p>
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          {step.secondaryFields.map(f => <Field key={f.key} f={f} answers={answers} onChange={onChange} errors={errors} />)}
        </div>
      </div>
    </div>
  );
}

// ── Signature pad ─────────────────────────────────────────────────────────────
function SignaturePad({ value, onChange, error }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);
  const fileRef   = useRef(null);
  const [mode,    setMode]    = useState("draw");
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new window.Image();
      img.onload = () => { const ctx = canvasRef.current.getContext("2d"); ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height); ctx.drawImage(img,0,0); setIsEmpty(false); };
      img.src = value;
    }
  }, []);

  const getPos = (e, c) => { const r = c.getBoundingClientRect(); const s = e.touches ? e.touches[0] : e; return { x:(s.clientX-r.left)*(c.width/r.width), y:(s.clientY-r.top)*(c.height/r.height) }; };
  const startDraw = e => { e.preventDefault(); drawing.current=true; lastPos.current=getPos(e,canvasRef.current); };
  const draw = e => {
    e.preventDefault(); if (!drawing.current) return;
    const c=canvasRef.current, ctx=c.getContext("2d"), pos=getPos(e,c);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x,lastPos.current.y); ctx.lineTo(pos.x,pos.y);
    ctx.strokeStyle="#1e293b"; ctx.lineWidth=2; ctx.lineCap="round"; ctx.stroke();
    lastPos.current=pos; setIsEmpty(false);
  };
  const endDraw = () => { if (!drawing.current) return; drawing.current=false; onChange(canvasRef.current.toDataURL()); };
  const clearSig = () => { canvasRef.current.getContext("2d").clearRect(0,0,canvasRef.current.width,canvasRef.current.height); setIsEmpty(true); onChange(null); };

  const btnStyle = active => ({
    padding:"6px 16px", borderRadius:"8px", fontSize:"12px", fontWeight:600, cursor:"pointer",
    border:`2px solid ${active ? BRAND : "#e2e8f0"}`,
    backgroundColor: active ? BRAND : "white",
    color: active ? "white" : "#64748b",
    fontFamily:"'Source Sans 3', sans-serif",
  });

  return (
    <div>
      <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
        <button type="button" onClick={() => setMode("draw")}  style={btnStyle(mode==="draw")}>✍️ Draw</button>
        <button type="button" onClick={() => setMode("upload")} style={btnStyle(mode==="upload")}>📁 Upload</button>
      </div>
      <div style={{position:"relative",borderRadius:"12px",border:`2px solid ${error?"#dc2626":"#e2e8f0"}`,overflow:"hidden",backgroundColor:"white",touchAction:"none"}}>
        <canvas ref={canvasRef} width={560} height={120}
          style={{display:mode==="draw"?"block":"none",width:"100%",cursor:"crosshair"}}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        {mode==="upload" && (
          <div onClick={() => fileRef.current?.click()}
            style={{height:"120px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",cursor:"pointer"}}>
            <p style={{fontSize:"14px",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>Click to upload signature image</p>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e => {
              const file=e.target.files?.[0]; if (!file) return;
              const reader=new FileReader();
              reader.onload=ev => { const img=new window.Image(); img.onload=()=>{ const c=canvasRef.current,ctx=c.getContext("2d"); ctx.clearRect(0,0,c.width,c.height); const r=Math.min(c.width/img.width,c.height/img.height),w=img.width*r,h=img.height*r; ctx.drawImage(img,(c.width-w)/2,(c.height-h)/2,w,h); setIsEmpty(false); onChange(c.toDataURL()); }; img.src=ev.target.result; };
              reader.readAsDataURL(file);
            }} />
          </div>
        )}
        {isEmpty && mode==="draw" && (
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
            <p style={{color:"#e2e8f0",fontSize:"18px",fontFamily:"'Lora', serif"}}>Sign here</p>
          </div>
        )}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"8px"}}>
        {error ? <p style={{fontSize:"12px",color:"#ef4444",fontFamily:"'Source Sans 3', sans-serif"}}>⚠ {error}</p>
               : <p style={{fontSize:"12px",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>{mode==="draw"?"Draw your signature above":"Upload a signature image"}</p>}
        {!isEmpty && <button type="button" onClick={clearSig} style={{fontSize:"12px",color:"#f87171",fontWeight:600,cursor:"pointer",background:"none",border:"none",fontFamily:"'Source Sans 3', sans-serif"}}>Clear</button>}
      </div>
    </div>
  );
}

// ── Step: signature ───────────────────────────────────────────────────────────
function StepSignature({ step, answers, onChange, errors }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
      <div style={{backgroundColor:"#f8fafc",borderRadius:"12px",padding:"16px",border:"1px solid #e2e8f0"}}>
        <p style={{fontSize:"14px",color:"#475569",lineHeight:1.6,fontFamily:"'Source Sans 3', sans-serif"}}>{step.text}</p>
      </div>
      <div>
        <label style={{display:"block",fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"8px",color:errors?.signature?"#dc2626":"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>
          Signature <span style={{color:BRAND}}>*</span>
        </label>
        <SignaturePad value={answers.signature} onChange={v => onChange("signature",v)} error={errors?.signature} />
      </div>
      <div style={{maxWidth:"260px"}}>
        <Field f={{key:"sigDate",label:"Date",type:"date",required:true}} answers={answers} onChange={onChange} errors={errors} />
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function findField(step, key) {
  if (step.type === "fields")    return step.fields?.find(f => f.key===key);
  if (step.type === "insurance") return [...(step.primaryFields||[]),...(step.secondaryFields||[])].find(f => f.key===key);
  if (step.type === "signature") return key==="sigDate" ? {key:"sigDate",required:true} : null;
  return null;
}

function Card({ step, answers, onChange, onNext, onBack, isFirst, isLast }) {
  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    onChange(key, value);
    if (errors[key]) { const field=findField(step,key); setErrors(p => ({...p, [key]: field ? validateField(key,value,field.required) : null})); }
  };
  const handleNext = () => {
    const errs = validateStep(step, answers);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({}); onNext();
  };

  return (
    <div style={{backgroundColor:"white",borderRadius:"24px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #f1f5f9",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"28px 32px 20px",borderBottom:"1px solid #f1f5f9"}}>
        <h2 style={{fontSize:"22px",fontWeight:700,color:"#0f172a",marginBottom:"4px",fontFamily:"'Lora', Georgia, serif"}}>{step.title}</h2>
        <p  style={{fontSize:"14px",color:"#64748b",lineHeight:1.5,fontFamily:"'Source Sans 3', sans-serif"}}>{step.subtitle}</p>
      </div>

      {/* Content */}
      <div style={{padding:"28px 32px"}}>
        {step.type==="fields"    && <StepFields    step={step} answers={answers} onChange={handleChange} errors={errors} />}
        {step.type==="insurance" && <StepInsurance step={step} answers={answers} onChange={handleChange} errors={errors} />}
        {step.type==="signature" && <StepSignature step={step} answers={answers} onChange={handleChange} errors={errors} />}
      </div>

      {/* Footer */}
      <div style={{padding:"20px 32px",backgroundColor:"#f8fafc",borderTop:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px"}}>
        <button type="button" onClick={onBack}
          style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 20px",borderRadius:"12px",fontSize:"14px",fontWeight:600,border:"2px solid #e2e8f0",color:"#475569",backgroundColor:"white",cursor:"pointer",fontFamily:"'Source Sans 3', sans-serif",visibility:isFirst?"hidden":"visible"}}
          onMouseEnter={e=>e.currentTarget.style.backgroundColor="#f1f5f9"}
          onMouseLeave={e=>e.currentTarget.style.backgroundColor="white"}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <button type="button" onClick={handleNext}
          style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 28px",borderRadius:"12px",fontSize:"14px",fontWeight:600,border:"none",color:"white",backgroundColor:BRAND,cursor:"pointer",boxShadow:BRAND_SHADOW,fontFamily:"'Source Sans 3', sans-serif"}}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          {isLast?"Submit":"Next"}
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Animated wrapper ──────────────────────────────────────────────────────────
function AnimatedCard({ direction, children }) {
  const [phase, setPhase] = useState("enter");
  const cls = direction === "back" ? "intake-enter-left" : "intake-enter-right";
  return (
    <div className={phase==="enter" ? cls : ""} onAnimationEnd={() => setPhase("idle")} style={{willChange:"transform, opacity"}}>
      {children}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function IntakeForm({ currentStep, answers, onChange, onNext, onBack }) {
  const [displayStep, setDisplayStep] = useState(currentStep);
  const [direction,   setDirection]   = useState("forward");
  const [isExiting,   setIsExiting]   = useState(false);
  const pendingStep = useRef(null);

  const animateTo = useCallback((target, dir) => {
    if (isExiting) return;
    setDirection(dir); setIsExiting(true); pendingStep.current = target;
  }, [isExiting]);

  useEffect(() => {
    if (!isExiting) return;
    const t = setTimeout(() => { setDisplayStep(pendingStep.current); setIsExiting(false); }, EXIT_DURATION);
    return () => clearTimeout(t);
  }, [isExiting]);

  useEffect(() => {
    if (!isExiting && currentStep !== displayStep)
      animateTo(currentStep, currentStep > displayStep ? "forward" : "back");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleNext = useCallback(() => { animateTo(currentStep+1,"forward"); setTimeout(()=>onNext(),EXIT_DURATION); }, [animateTo,onNext,currentStep]);
  const handleBack = useCallback(() => { animateTo(currentStep-1,"back");    setTimeout(()=>onBack(),EXIT_DURATION); }, [animateTo,onBack,currentStep]);

  const exitClass = direction==="back" ? "intake-exit-right" : "intake-exit-left";
  const step      = INTAKE_STEPS[displayStep] || INTAKE_STEPS[currentStep];
  const isFirst   = displayStep === 0;
  const isLast    = displayStep === INTAKE_STEPS.length - 2;

  return (
    <div style={{position:"relative",overflow:"hidden",minHeight:"420px"}}>
      {isExiting && (
        <div className={exitClass} style={{position:"absolute",inset:0,willChange:"transform, opacity"}}>
          <Card step={step} answers={answers} onChange={onChange} onNext={()=>{}} onBack={()=>{}} isFirst={isFirst} isLast={isLast} />
        </div>
      )}
      {!isExiting && (
        <AnimatedCard key={displayStep} direction={direction}>
          <Card step={step} answers={answers} onChange={onChange} onNext={handleNext} onBack={handleBack} isFirst={isFirst} isLast={isLast} />
        </AnimatedCard>
      )}
    </div>
  );
}