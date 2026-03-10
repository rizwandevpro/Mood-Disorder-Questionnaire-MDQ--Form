"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { STEPS, QUESTIONS, OPTIONS } from "./brownSteps";

const BRAND        = "#7d4f50";
const TEAL         = "#0f766e";
const EXIT_DURATION = 220;

// ── Inject all CSS including responsive rules ─────────────────────────────────
const BROWN_CSS = `
  @keyframes brwnIn  { from{opacity:0;transform:translateX(60px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes brwnInL { from{opacity:0;transform:translateX(-60px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes brwnOut { from{opacity:1;transform:none} to{opacity:0;transform:translateX(-60px) scale(0.97)} }
  @keyframes brwnOutR{ from{opacity:1;transform:none} to{opacity:0;transform:translateX(60px) scale(0.97)} }
  .brwn-ef { animation: brwnIn   0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .brwn-eb { animation: brwnInL  0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .brwn-xf { animation: brwnOut  0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
  .brwn-xb { animation: brwnOutR 0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }

  /* Info form grids */
  .brwn-name-grid  { display:grid; gap:10px; grid-template-columns:1fr 1fr 1fr; }
  .brwn-date-grid  { display:grid; gap:10px; grid-template-columns:1fr 1fr 1fr 100px; }
  .brwn-school-grid{ display:grid; gap:10px; grid-template-columns:1fr 140px; }
  .brwn-scale-grid { display:grid; gap:8px;  grid-template-columns:repeat(4,1fr); }

  /* Question row layout */
  .brwn-q-row      { display:flex; gap:12px; align-items:flex-start; }
  .brwn-q-text     { flex:1; font-size:16px; font-weight:500; color:#1e293b; line-height:1.6;
                     font-family:"Source Sans 3",sans-serif; margin:0; }
  .brwn-q-opts     { display:flex; gap:8px; flex-shrink:0; }
  .brwn-opt-btn    { width:44px; height:44px; border-radius:50%; border:2px solid #e2e8f0;
                     background:white; color:#64748b; font-family:"Lora",serif;
                     font-size:15px; font-weight:800; cursor:pointer; display:flex;
                     align-items:center; justify-content:center; transition:all 0.15s;
                     flex-shrink:0; }
  .brwn-opt-btn:hover { border-color:#0f766e; color:#0f766e; }
  .brwn-opt-btn.sel   { background:#0f766e; border-color:#0f766e; color:white; }

  /* Legend in question header */
  .brwn-legend     { display:flex; gap:6px; flex-wrap:wrap; }
  .brwn-legend-item{ text-align:center; padding:4px 8px; border-radius:8px;
                     border:1px solid #e2e8f0; background:white; white-space:nowrap; }

  /* Responsive breakpoints */
  @media (max-width: 600px) {
    .brwn-name-grid   { grid-template-columns:1fr 1fr; }
    .brwn-date-grid   { grid-template-columns:1fr 1fr; }
    .brwn-school-grid { grid-template-columns:1fr; }

    /* Stack question row: text on top, options below */
    .brwn-q-row       { flex-direction:column; gap:10px; }
    .brwn-q-opts      { width:100%; justify-content:space-between; }
    .brwn-opt-btn     { flex:1; max-width:64px; height:50px; font-size:16px; }

    /* Hide legend labels, show just letters */
    .brwn-legend-label{ display:none; }
    .brwn-legend-item { padding:4px 6px; }
  }

  @media (max-width: 380px) {
    .brwn-name-grid  { grid-template-columns:1fr; }
    .brwn-date-grid  { grid-template-columns:1fr 1fr; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("brown-styles")) {
  const t = document.createElement("style");
  t.id = "brown-styles";
  t.textContent = BROWN_CSS;
  document.head.appendChild(t);
}

const inputStyle = {
  border:"2px solid #e2e8f0", borderRadius:"10px", padding:"12px 16px",
  fontSize:"16px", fontWeight:500, color:"#1e293b", backgroundColor:"#f8fafc",
  outline:"none", fontFamily:"'Source Sans 3', sans-serif",
  width:"100%", boxSizing:"border-box", appearance:"none",
};

const labelStyle = {
  display:"block", fontSize:"12px", fontWeight:700,
  textTransform:"uppercase", letterSpacing:"0.07em",
  color:"#94a3b8", marginBottom:"6px",
  fontFamily:"'Source Sans 3', sans-serif",
};

// ── Info step ─────────────────────────────────────────────────────────────────
function StepInfo({ answers, onChange, onNext }) {
  const canProceed = answers.patientFirst?.trim();
  const f = (k, v) => onChange(k, v);
  const fi = (key, type, lbl) => (
    <div key={key}>
      <label style={labelStyle}>{lbl}</label>
      <input type={type} value={answers[key]||""} onChange={e=>f(key,e.target.value)}
        placeholder={lbl} style={inputStyle}
        onFocus={e=>e.target.style.borderColor=TEAL}
        onBlur={e=>e.target.style.borderColor="#e2e8f0"} />
    </div>
  );

  return (
    <div style={{backgroundColor:"white",borderRadius:"24px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #f1f5f9",overflow:"hidden"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1e7a6e,#0f766e)",padding:"24px 20px",textAlign:"center"}}>
        <div style={{display:"inline-block",backgroundColor:"rgba(255,255,255,0.15)",borderRadius:"12px",padding:"6px 16px",marginBottom:"10px"}}>
          <span style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"rgba(255,255,255,0.9)",fontFamily:"'Source Sans 3', sans-serif"}}>Adult · Ages 19+ · Self-Report</span>
        </div>
        <h2 style={{fontSize:"26px",fontWeight:800,color:"white",marginBottom:"4px",fontFamily:"'Lora', Georgia, serif"}}>Brown Executive Function</h2>
        <h3 style={{fontSize:"20px",fontWeight:700,color:"rgba(255,255,255,0.85)",margin:0,fontFamily:"'Lora', Georgia, serif",letterSpacing:"0.06em"}}>ATTENTION SCALES</h3>
      </div>

      {/* Instructions */}
      <div style={{padding:"16px 20px",backgroundColor:"#f0fdf9",borderBottom:"1px solid #d1fae5"}}>
        <p style={{fontSize:"15px",color:"#065f46",lineHeight:1.6,fontFamily:"'Source Sans 3', sans-serif",margin:"0 0 12px"}}>
          Select the option that best describes how that feeling or behavior has been a <strong>problem for you over the past 6 months</strong>.
        </p>
        <div className="brwn-scale-grid">
          {OPTIONS.map(o=>(
            <div key={o.label} style={{textAlign:"center",padding:"8px 4px",borderRadius:"10px",border:"2px solid #a7f3d0",backgroundColor:"white"}}>
              <div style={{fontSize:"22px",fontWeight:900,color:TEAL,fontFamily:"'Lora', serif",lineHeight:1}}>{o.label}</div>
              <div style={{fontSize:"12px",fontWeight:600,color:"#065f46",marginTop:"4px",fontFamily:"'Source Sans 3', sans-serif",lineHeight:1.3}}>{o.full}</div>
            </div>
          ))}
        </div>
        <p style={{fontSize:"13px",color:"#6b7280",textAlign:"center",marginTop:"10px",fontFamily:"'Source Sans 3', sans-serif"}}>
          <strong>Please respond to all 57 items.</strong>
        </p>
      </div>

      {/* Patient info */}
      <div style={{padding:"20px",borderBottom:"1px solid #f1f5f9"}}>
        <p style={{...labelStyle,marginBottom:"14px",fontSize:"11px"}}>Patient Information</p>
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>

          {/* Name: First / Middle / Last */}
          <div className="brwn-name-grid">
            <div>
              <label style={labelStyle}>First Name <span style={{color:BRAND}}>*</span></label>
              <input type="text" value={answers.patientFirst||""} onChange={e=>f("patientFirst",e.target.value)}
                placeholder="First" style={inputStyle}
                onFocus={e=>e.target.style.borderColor=TEAL} onBlur={e=>e.target.style.borderColor="#e2e8f0"} />
            </div>
            {fi("patientMiddle","text","Middle Name")}
            {fi("patientLast","text","Last Name")}
          </div>

          {/* Date / Birth Date / Age / Sex */}
          <div className="brwn-date-grid">
            {fi("patientDate","date","Date")}
            {fi("patientBirth","date","Birth Date")}
            {fi("patientAge","number","Age")}
            <div>
              <label style={labelStyle}>Sex</label>
              <select value={answers.patientSex||""} onChange={e=>f("patientSex",e.target.value)}
                style={{...inputStyle,cursor:"pointer"}}>
                <option value="">—</option>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </div>
          </div>

          {/* School / Grade */}
          <div className="brwn-school-grid">
            {fi("patientSchool","text","School / Organization")}
            {fi("patientGrade","text","Grade / Level")}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{padding:"16px 20px",display:"flex",justifyContent:"flex-end"}}>
        <button type="button" onClick={onNext} disabled={!canProceed}
          style={{display:"flex",alignItems:"center",gap:"8px",padding:"13px 28px",borderRadius:"12px",
            fontSize:"15px",fontWeight:700,border:"none",color:"white",
            cursor:canProceed?"pointer":"not-allowed",fontFamily:"'Source Sans 3', sans-serif",
            backgroundColor:canProceed?TEAL:"#cbd5e1",
            boxShadow:canProceed?"0 4px 16px rgba(15,118,110,0.35)":"none"}}>
          Begin Assessment · 57 Items
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Questions step ────────────────────────────────────────────────────────────
function StepQuestions({ step, answers, onChange, onNext, onBack, stepIndex, totalSteps }) {
  const allAnswered = step.questions.every(q => answers[q.key]);
  const remaining   = step.questions.filter(q => !answers[q.key]).length;

  return (
    <div style={{backgroundColor:"white",borderRadius:"24px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #f1f5f9",overflow:"hidden"}}>

      {/* Header with legend */}
      <div style={{padding:"14px 20px",borderBottom:"1px solid #f1f5f9",backgroundColor:"#f8fafc"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
          <span style={{fontSize:"13px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>
            Items {step.startIndex + 1}–{Math.min(step.startIndex + step.questions.length, 57)} of 57
          </span>
          <div className="brwn-legend">
            {OPTIONS.map(o=>(
              <div key={o.label} className="brwn-legend-item">
                <span style={{fontSize:"12px",fontWeight:800,color:TEAL,fontFamily:"'Lora', serif"}}>{o.label}</span>
                <span className="brwn-legend-label" style={{fontSize:"12px",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif",marginLeft:"5px"}}>{o.full}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question rows */}
      <div style={{padding:"4px 0"}}>
        {step.questions.map((q, qi) => {
          const num      = step.startIndex + qi + 1;
          const selected = answers[q.key];
          return (
            <div key={q.key} style={{
              padding:"14px 20px",
              borderBottom:"1px solid #f8fafc",
              backgroundColor:selected?"#fafffe":"white",
              transition:"background-color 0.2s"
            }}>
              <div className="brwn-q-row">
                {/* Number */}
                <span style={{
                  fontSize:"15px",fontWeight:800,flexShrink:0,
                  color:selected?TEAL:"#cbd5e1",
                  fontFamily:"'Lora', serif",minWidth:"26px",
                  lineHeight:"22px",transition:"color 0.2s"
                }}>{num}.</span>

                {/* Text */}
                <p className="brwn-q-text">{q.text}</p>

                {/* N / L / M / B buttons */}
                <div className="brwn-q-opts">
                  {OPTIONS.map(opt => {
                    const isSel = selected === opt.label;
                    return (
                      <button key={opt.label} type="button"
                        onClick={() => onChange(q.key, opt.label)}
                        className={`brwn-opt-btn${isSel?" sel":""}`}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{padding:"14px 20px",borderTop:"1px solid #f1f5f9",backgroundColor:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",flexWrap:"wrap"}}>
        <button type="button" onClick={onBack}
          style={{display:"flex",alignItems:"center",gap:"6px",padding:"12px 20px",borderRadius:"12px",
            fontSize:"15px",fontWeight:600,border:"2px solid #e2e8f0",color:"#475569",
            backgroundColor:"white",cursor:"pointer",fontFamily:"'Source Sans 3', sans-serif",
            visibility:stepIndex===1?"hidden":"visible"}}
          onMouseEnter={e=>e.currentTarget.style.backgroundColor="#f1f5f9"}
          onMouseLeave={e=>e.currentTarget.style.backgroundColor="white"}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>

        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          {!allAnswered && (
            <span style={{fontSize:"14px",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>
              {remaining} left
            </span>
          )}
          <button type="button" onClick={onNext} disabled={!allAnswered}
            style={{display:"flex",alignItems:"center",gap:"6px",padding:"12px 26px",borderRadius:"12px",
              fontSize:"15px",fontWeight:700,border:"none",color:"white",
              cursor:allAnswered?"pointer":"not-allowed",fontFamily:"'Source Sans 3', sans-serif",
              backgroundColor:allAnswered?TEAL:"#cbd5e1",
              boxShadow:allAnswered?"0 4px 14px rgba(15,118,110,0.3)":"none"}}
            onMouseEnter={e=>{if(allAnswered)e.currentTarget.style.backgroundColor="#0e6962"}}
            onMouseLeave={e=>{if(allAnswered)e.currentTarget.style.backgroundColor=TEAL}}>
            {stepIndex === totalSteps - 2 ? "Finish" : "Continue"}
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Animated wrapper ──────────────────────────────────────────────────────────
function AnimatedCard({ direction, children }) {
  const [phase, setPhase] = useState("enter");
  const cls = direction === "back" ? "brwn-eb" : "brwn-ef";
  return (
    <div className={phase==="enter"?cls:""} onAnimationEnd={()=>setPhase("idle")} style={{willChange:"transform,opacity"}}>
      {children}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function BrownForm({ currentStep, answers, onChange, onNext, onBack }) {
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
  }, [currentStep]);

  const handleNext = useCallback(() => {
    animateTo(currentStep + 1, "forward");
    setTimeout(() => onNext(), EXIT_DURATION);
  }, [animateTo, onNext, currentStep]);

  const handleBack = useCallback(() => {
    animateTo(currentStep - 1, "back");
    setTimeout(() => onBack(), EXIT_DURATION);
  }, [animateTo, onBack, currentStep]);

  const exitClass = direction === "back" ? "brwn-xb" : "brwn-xf";
  const step = STEPS[displayStep] || STEPS[currentStep];

  const renderStep = () => {
    if (!step) return null;
    switch (step.type) {
      case "info":      return <StepInfo answers={answers} onChange={onChange} onNext={handleNext} />;
      case "questions": return <StepQuestions step={step} answers={answers} onChange={onChange} onNext={handleNext} onBack={handleBack} stepIndex={displayStep} totalSteps={STEPS.length} />;
      default:          return null;
    }
  };

  return (
    <div style={{position:"relative",overflow:"hidden",minHeight:"480px"}}>
      {isExiting && (
        <div className={exitClass} style={{position:"absolute",inset:0,willChange:"transform,opacity"}}>
          {renderStep()}
        </div>
      )}
      {!isExiting && (
        <AnimatedCard key={displayStep} direction={direction}>
          {renderStep()}
        </AnimatedCard>
      )}
    </div>
  );
}