"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ASRSForm.js — Adult ADHD Self-Report Scale v1.1 UI
// No scoring display — just collects which option was selected per question.
// Auto-advances on selection.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { STEPS, QUESTIONS, OPTION_LABELS } from "./asrsSteps";

const BRAND        = "#7d4f50";
const BRAND_SHADOW = "0 8px 24px rgba(125,79,80,0.18)";
const EXIT_DURATION = 220;

// ── Inject animation CSS once ─────────────────────────────────────────────────
const ASRS_CSS = `
  @keyframes asrsSlideInRight { from{opacity:0;transform:translateX(60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes asrsSlideInLeft  { from{opacity:0;transform:translateX(-60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes asrsSlideOutLeft { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(-60px) scale(0.97)} }
  @keyframes asrsSlideOutRight{ from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(60px) scale(0.97)} }
  .asrs-enter-right{ animation: asrsSlideInRight  0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .asrs-enter-left { animation: asrsSlideInLeft   0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .asrs-exit-left  { animation: asrsSlideOutLeft  0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
  .asrs-exit-right { animation: asrsSlideOutRight 0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
  .asrs-option:hover { border-color: #7d4f50 !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("asrs-styles")) {
  const t = document.createElement("style");
  t.id = "asrs-styles";
  t.textContent = ASRS_CSS;
  document.head.appendChild(t);
}

// ── Step: info ────────────────────────────────────────────────────────────────
function StepInfo({ onNext }) {
  return (
    <div style={{backgroundColor:"white",borderRadius:"24px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #f1f5f9",overflow:"hidden"}}>
      <div style={{padding:"32px",borderBottom:"1px solid #f1f5f9",textAlign:"center"}}>
        <div style={{width:"64px",height:"64px",borderRadius:"50%",backgroundColor:BRAND,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:BRAND_SHADOW}}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <h2 style={{fontSize:"22px",fontWeight:700,color:"#0f172a",marginBottom:"8px",fontFamily:"'Lora', Georgia, serif"}}>Adult ADHD Self-Report Scale v1.1</h2>
        <p style={{fontSize:"14px",color:"#64748b",lineHeight:1.6,fontFamily:"'Source Sans 3', sans-serif",maxWidth:"440px",margin:"0 auto"}}>
          Please rate yourself on each question based on how you have felt and conducted yourself over the{" "}
          <strong style={{color:"#1e293b"}}>past 6 months</strong>.
        </p>
      </div>

      <div style={{padding:"24px 32px",backgroundColor:"#f8fafc"}}>
        <div style={{display:"flex",gap:"12px",marginBottom:"20px",flexWrap:"wrap"}}>
          {[{label:"Part A",desc:"Questions 1–6",color:"#3b82f6"},{label:"Part B",desc:"Questions 7–18",color:"#8b5cf6"}].map(p=>(
            <div key={p.label} style={{flex:1,minWidth:"140px",backgroundColor:"white",borderRadius:"12px",padding:"12px 16px",border:`2px solid ${p.color}20`}}>
              <span style={{fontSize:"12px",fontWeight:700,color:p.color,fontFamily:"'Source Sans 3', sans-serif"}}>{p.label}</span>
              <p style={{fontSize:"12px",color:"#64748b",fontFamily:"'Source Sans 3', sans-serif",margin:"2px 0 0"}}>{p.desc}</p>
            </div>
          ))}
        </div>
        {/* Option labels preview */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"6px"}}>
          {OPTION_LABELS.map(l => (
            <div key={l} style={{textAlign:"center",padding:"10px 4px",borderRadius:"10px",border:"2px solid #e2e8f0",backgroundColor:"white"}}>
              <div style={{fontSize:"10px",fontWeight:600,color:"#64748b",fontFamily:"'Source Sans 3', sans-serif",lineHeight:1.3}}>{l}</div>
            </div>
          ))}
        </div>
        <p style={{fontSize:"11px",color:"#94a3b8",textAlign:"center",marginTop:"14px",fontFamily:"'Source Sans 3', sans-serif"}}>
          18 questions · auto-advances on selection · ~2 minutes
        </p>
      </div>

      <div style={{padding:"20px 32px",borderTop:"1px solid #f1f5f9",display:"flex",justifyContent:"flex-end"}}>
        <button type="button" onClick={onNext}
          style={{display:"flex",alignItems:"center",gap:"8px",padding:"14px 32px",borderRadius:"12px",fontSize:"15px",fontWeight:700,border:"none",color:"white",backgroundColor:BRAND,cursor:"pointer",boxShadow:BRAND_SHADOW,fontFamily:"'Source Sans 3', sans-serif"}}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          Begin Assessment
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Step: question ────────────────────────────────────────────────────────────
function StepQuestion({ step, answers, onChange, onBack, questionNumber }) {
  const selected  = answers[step.key];
  const isPartA   = step.part === "A";
  const partColor = isPartA ? "#3b82f6" : "#8b5cf6";

  const handleSelect = (label) => {
    onChange(step.key, label);
    setTimeout(() => onChange("__autoAdvance", Date.now()), 350);
  };

  return (
    <div style={{backgroundColor:"white",borderRadius:"24px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #f1f5f9",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"24px 32px 20px",borderBottom:"1px solid #f1f5f9"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px",flexWrap:"wrap",gap:"8px"}}>
          <span style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>
            Question {questionNumber} of 18
          </span>
          <span style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",padding:"3px 12px",borderRadius:"20px",backgroundColor:`${partColor}15`,color:partColor,fontFamily:"'Source Sans 3', sans-serif"}}>
            Part {step.part}
          </span>
        </div>
        <p style={{fontSize:"18px",fontWeight:600,color:"#0f172a",lineHeight:1.5,fontFamily:"'Lora', Georgia, serif",margin:0}}>
          {step.text}
        </p>
        <p style={{fontSize:"12px",color:"#94a3b8",marginTop:"8px",fontFamily:"'Source Sans 3', sans-serif"}}>
          Over the past 6 months…
        </p>
      </div>

      {/* Options — label only, no score badge */}
      <div style={{padding:"20px 28px",display:"flex",flexDirection:"column",gap:"8px"}}>
        {OPTION_LABELS.map((label) => {
          const isSelected = selected === label;
          return (
            <button key={label} type="button" onClick={()=>handleSelect(label)}
              className="asrs-option"
              style={{
                display:"flex",alignItems:"center",gap:"12px",
                width:"100%",padding:"13px 18px",
                borderRadius:"14px",cursor:"pointer",textAlign:"left",
                border:`2px solid ${isSelected?BRAND:"#e2e8f0"}`,
                backgroundColor:isSelected?"rgba(125,79,80,0.06)":"#f8fafc",
                transition:"border-color 0.15s, background-color 0.15s",
              }}>
              <div style={{width:"20px",height:"20px",borderRadius:"50%",flexShrink:0,border:`2px solid ${isSelected?BRAND:"#cbd5e1"}`,backgroundColor:isSelected?BRAND:"white",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                {isSelected && <div style={{width:"7px",height:"7px",borderRadius:"50%",backgroundColor:"white"}} />}
              </div>
              <span style={{fontSize:"15px",fontWeight:isSelected?600:500,color:isSelected?BRAND:"#374151",fontFamily:"'Source Sans 3', sans-serif"}}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{padding:"14px 28px 20px"}}>
        <button type="button" onClick={onBack}
          style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 18px",borderRadius:"10px",fontSize:"13px",fontWeight:600,border:"2px solid #e2e8f0",color:"#64748b",backgroundColor:"white",cursor:"pointer",fontFamily:"'Source Sans 3', sans-serif",visibility:questionNumber===1?"hidden":"visible"}}
          onMouseEnter={e=>e.currentTarget.style.backgroundColor="#f1f5f9"}
          onMouseLeave={e=>e.currentTarget.style.backgroundColor="white"}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
      </div>
    </div>
  );
}

// ── Animated wrapper ──────────────────────────────────────────────────────────
function AnimatedCard({ direction, children }) {
  const [phase, setPhase] = useState("enter");
  const cls = direction==="back" ? "asrs-enter-left" : "asrs-enter-right";
  return (
    <div className={phase==="enter"?cls:""} onAnimationEnd={()=>setPhase("idle")} style={{willChange:"transform, opacity"}}>
      {children}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ASRSForm({ currentStep, answers, onChange, onNext, onBack }) {
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

  useEffect(() => {
    if (answers.__autoAdvance) {
      onChange("__autoAdvance", null);
      handleNext();
    }
  }, [answers.__autoAdvance]);

  const handleNext = useCallback(() => {
    animateTo(currentStep + 1, "forward");
    setTimeout(() => onNext(), EXIT_DURATION);
  }, [animateTo, onNext, currentStep]);

  const handleBack = useCallback(() => {
    animateTo(currentStep - 1, "back");
    setTimeout(() => onBack(), EXIT_DURATION);
  }, [animateTo, onBack, currentStep]);

  const exitClass = direction==="back" ? "asrs-exit-right" : "asrs-exit-left";
  const step = STEPS[displayStep] || STEPS[currentStep];
  const questionNumber = step?.type === "question" ? step.questionIndex + 1 : null;

  const renderStep = () => {
    if (!step) return null;
    switch (step.type) {
      case "info":     return <StepInfo onNext={handleNext} />;
      case "question": return <StepQuestion step={step} answers={answers} onChange={onChange} onBack={handleBack} questionNumber={questionNumber} />;
      default:         return null;
    }
  };

  return (
    <div style={{position:"relative",overflow:"hidden",minHeight:"420px"}}>
      {isExiting && (
        <div className={exitClass} style={{position:"absolute",inset:0,willChange:"transform, opacity"}}>
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