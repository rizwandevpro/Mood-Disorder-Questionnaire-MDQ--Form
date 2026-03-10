"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { STEPS, QUESTIONS, OPTIONS, DIFFICULTY_OPTIONS } from "./phq9Steps";

const BRAND        = "#7d4f50";
const BRAND_SHADOW = "0 8px 24px rgba(125,79,80,0.18)";
const EXIT_DURATION = 220;

const PHQ9_CSS = `
  @keyframes phqSlideInRight { from{opacity:0;transform:translateX(60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes phqSlideInLeft  { from{opacity:0;transform:translateX(-60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes phqSlideOutLeft { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(-60px) scale(0.97)} }
  @keyframes phqSlideOutRight{ from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(60px) scale(0.97)} }
  .phq-enter-right{ animation: phqSlideInRight 0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .phq-enter-left { animation: phqSlideInLeft  0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .phq-exit-left  { animation: phqSlideOutLeft  0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
  .phq-exit-right { animation: phqSlideOutRight 0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
  .phq-option:hover { border-color: #7d4f50 !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("phq9-styles")) {
  const t = document.createElement("style");
  t.id = "phq9-styles";
  t.textContent = PHQ9_CSS;
  document.head.appendChild(t);
}

export function calcScore(answers) {
  return QUESTIONS.reduce((sum, q) => {
    const opt = OPTIONS.find(o => o.label === answers[q.key]);
    return sum + (opt ? opt.score : 0);
  }, 0);
}

function scoreLabel(score) {
  if (score <= 4)  return { label: "Minimal Depression",  color: "#16a34a" };
  if (score <= 9)  return { label: "Mild Depression",     color: "#ca8a04" };
  if (score <= 14) return { label: "Moderate Depression", color: "#ea580c" };
  if (score <= 19) return { label: "Moderately Severe Depression", color: "#dc2626" };
  return                  { label: "Severe Depression",   color: "#991b1b" };
}

// ── Info step ─────────────────────────────────────────────────────────────────
function StepInfo({ answers, onChange, onNext }) {
  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    border: "2px solid #e2e8f0", borderRadius: "12px",
    padding: "12px 16px", fontSize: "14px", fontWeight: 500,
    color: "#1e293b", backgroundColor: "#f8fafc", outline: "none",
    fontFamily: "'Source Sans 3', sans-serif",
  };
  return (
    <div style={{backgroundColor:"white",borderRadius:"24px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #f1f5f9",overflow:"hidden"}}>
      <div style={{padding:"32px",borderBottom:"1px solid #f1f5f9",textAlign:"center"}}>
        <div style={{width:"64px",height:"64px",borderRadius:"50%",backgroundColor:BRAND,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:BRAND_SHADOW}}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 style={{fontSize:"22px",fontWeight:700,color:"#0f172a",marginBottom:"8px",fontFamily:"'Lora', Georgia, serif"}}>Patient Health Questionnaire</h2>
        <p style={{fontSize:"14px",color:"#64748b",lineHeight:1.6,fontFamily:"'Source Sans 3', sans-serif",maxWidth:"420px",margin:"0 auto"}}>
          Over the last <strong style={{color:"#1e293b"}}>2 weeks</strong>, how often have you been bothered by any of the following problems?
        </p>
      </div>

      {/* Name + Date fields */}
      <div style={{padding:"24px 32px",borderBottom:"1px solid #f1f5f9",display:"flex",flexDirection:"column",gap:"14px"}}>
        <div>
          <label style={{display:"block",fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"6px",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>
            Name <span style={{color:BRAND}}>*</span>
          </label>
          <input type="text" value={answers.patientName||""} onChange={e=>onChange("patientName",e.target.value)}
            placeholder="Full name"
            style={inputStyle}
            onFocus={e=>e.target.style.borderColor="#3b82f6"}
            onBlur={e=>e.target.style.borderColor="#e2e8f0"} />
        </div>
        <div style={{maxWidth:"240px"}}>
          <label style={{display:"block",fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"6px",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>
            Date
          </label>
          <input type="date" value={answers.patientDate||""} onChange={e=>onChange("patientDate",e.target.value)}
            style={inputStyle}
            onFocus={e=>e.target.style.borderColor="#3b82f6"}
            onBlur={e=>e.target.style.borderColor="#e2e8f0"} />
        </div>
      </div>

      {/* Scale preview */}
      <div style={{padding:"20px 32px",backgroundColor:"#f8fafc",borderBottom:"1px solid #f1f5f9"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px"}}>
          {OPTIONS.map(o=>(
            <div key={o.label} style={{textAlign:"center",padding:"10px 6px",borderRadius:"10px",border:"2px solid #e2e8f0",backgroundColor:"white"}}>
              <div style={{fontSize:"20px",fontWeight:800,color:BRAND,fontFamily:"'Lora', serif",lineHeight:1}}>{o.score}</div>
              <div style={{fontSize:"10px",fontWeight:600,color:"#64748b",marginTop:"4px",fontFamily:"'Source Sans 3', sans-serif",lineHeight:1.3}}>{o.label}</div>
            </div>
          ))}
        </div>
        <p style={{fontSize:"11px",color:"#94a3b8",textAlign:"center",marginTop:"12px",fontFamily:"'Source Sans 3', sans-serif"}}>9 questions · auto-advances on selection · ~1 minute</p>
      </div>

      <div style={{padding:"20px 32px",display:"flex",justifyContent:"flex-end"}}>
        <button type="button" onClick={onNext} disabled={!answers.patientName?.trim()}
          style={{display:"flex",alignItems:"center",gap:"8px",padding:"14px 32px",borderRadius:"12px",fontSize:"15px",fontWeight:700,border:"none",color:"white",backgroundColor:answers.patientName?.trim()?BRAND:"#cbd5e1",cursor:answers.patientName?.trim()?"pointer":"not-allowed",boxShadow:answers.patientName?.trim()?BRAND_SHADOW:"none",fontFamily:"'Source Sans 3', sans-serif"}}
          onMouseEnter={e=>{if(answers.patientName?.trim())e.currentTarget.style.opacity="0.9"}}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          Begin Assessment
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Question step ─────────────────────────────────────────────────────────────
function StepQuestion({ step, answers, onChange, onBack, questionNumber }) {
  const selected = answers[step.key];

  // Q9 is about self-harm — show a supportive note
  const isSensitive = step.key === "q9";

  const handleSelect = (label) => {
    onChange(step.key, label);
    setTimeout(() => onChange("__autoAdvance", Date.now()), 350);
  };

  return (
    <div style={{backgroundColor:"white",borderRadius:"24px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #f1f5f9",overflow:"hidden"}}>
      <div style={{padding:"24px 32px 20px",borderBottom:"1px solid #f1f5f9"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
          <span style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>
            Question {questionNumber} of 9
          </span>
          <span style={{fontSize:"11px",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>Over the last 2 weeks…</span>
        </div>
        <p style={{fontSize:"18px",fontWeight:600,color:"#0f172a",lineHeight:1.5,fontFamily:"'Lora', Georgia, serif",margin:0}}>
          <span style={{color:BRAND,fontWeight:800}}>{questionNumber}.</span> {step.text}
        </p>
        {isSensitive && (
          <div style={{marginTop:"12px",padding:"10px 14px",borderRadius:"10px",backgroundColor:"#fef9ec",border:"1px solid #fcd34d"}}>
            <p style={{fontSize:"12px",color:"#92400e",fontFamily:"'Source Sans 3', sans-serif",margin:0,lineHeight:1.5}}>
              💛 If you are having thoughts of hurting yourself, please reach out to a crisis line or your healthcare provider immediately.
            </p>
          </div>
        )}
      </div>

      <div style={{padding:"20px 28px",display:"flex",flexDirection:"column",gap:"8px"}}>
        {OPTIONS.map(opt => {
          const isSelected = selected === opt.label;
          return (
            <button key={opt.label} type="button" onClick={()=>handleSelect(opt.label)}
              className="phq-option"
              style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                width:"100%",padding:"13px 18px",borderRadius:"14px",cursor:"pointer",textAlign:"left",
                border:`2px solid ${isSelected?BRAND:"#e2e8f0"}`,
                backgroundColor:isSelected?"rgba(125,79,80,0.06)":"#f8fafc",
                transition:"border-color 0.15s, background-color 0.15s",
              }}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"20px",height:"20px",borderRadius:"50%",flexShrink:0,border:`2px solid ${isSelected?BRAND:"#cbd5e1"}`,backgroundColor:isSelected?BRAND:"white",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                  {isSelected && <div style={{width:"7px",height:"7px",borderRadius:"50%",backgroundColor:"white"}} />}
                </div>
                <span style={{fontSize:"15px",fontWeight:isSelected?600:500,color:isSelected?BRAND:"#374151",fontFamily:"'Source Sans 3', sans-serif"}}>
                  {opt.label}
                </span>
              </div>
              <span style={{fontSize:"13px",fontWeight:700,color:isSelected?"white":"#94a3b8",backgroundColor:isSelected?BRAND:"#e2e8f0",borderRadius:"8px",padding:"3px 10px",fontFamily:"'Lora', serif",transition:"all 0.15s"}}>
                {opt.score}
              </span>
            </button>
          );
        })}
      </div>

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

// ── Difficulty step ───────────────────────────────────────────────────────────
function StepDifficulty({ answers, onChange, onNext, onBack }) {
  const selected   = answers.difficulty;
  const totalScore = calcScore(answers);
  const { label: sevLabel, color: sevColor } = scoreLabel(totalScore);

  const colTotals = [1,2,3].map(score =>
    QUESTIONS.filter(q => {
      const opt = OPTIONS.find(o => o.label === answers[q.key]);
      return opt && opt.score === score;
    }).length
  );

  return (
    <div style={{backgroundColor:"white",borderRadius:"24px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #f1f5f9",overflow:"hidden"}}>

      {/* Score summary */}
      <div style={{padding:"24px 32px",borderBottom:"1px solid #f1f5f9",backgroundColor:"#fafaf9"}}>
        <p style={{fontSize:"12px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#94a3b8",marginBottom:"12px",fontFamily:"'Source Sans 3', sans-serif"}}>Score Summary</p>
        <div style={{display:"flex",alignItems:"center",gap:"20px",flexWrap:"wrap"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:"42px",fontWeight:800,color:sevColor,fontFamily:"'Lora', serif",lineHeight:1}}>{totalScore}</div>
            <div style={{fontSize:"11px",fontWeight:600,color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif",marginTop:"2px"}}>Total / 27</div>
          </div>
          <div style={{flex:1}}>
            <span style={{display:"inline-block",padding:"6px 16px",borderRadius:"20px",fontSize:"13px",fontWeight:700,backgroundColor:`${sevColor}18`,color:sevColor,fontFamily:"'Source Sans 3', sans-serif",marginBottom:"10px"}}>
              {sevLabel}
            </span>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {["Several days","More than half the days","Nearly every day"].map((lbl,i)=>(
                <div key={lbl} style={{textAlign:"center",padding:"6px 8px",borderRadius:"8px",border:"1px solid #e2e8f0",backgroundColor:"white",minWidth:"44px"}}>
                  <div style={{fontSize:"15px",fontWeight:700,color:BRAND,fontFamily:"'Lora', serif"}}>{colTotals[i]}</div>
                  <div style={{fontSize:"9px",fontWeight:600,color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif",lineHeight:1.2,marginTop:"2px"}}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Q10 */}
      <div style={{padding:"24px 32px 20px",borderBottom:"1px solid #f1f5f9"}}>
        <p style={{fontSize:"15px",fontWeight:600,color:"#0f172a",lineHeight:1.5,marginBottom:"16px",fontFamily:"'Lora', Georgia, serif"}}>
          <span style={{color:BRAND,fontWeight:800}}>10.</span> If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {DIFFICULTY_OPTIONS.map(opt=>{
            const isSel = selected===opt;
            return (
              <button key={opt} type="button" onClick={()=>onChange("difficulty",opt)}
                className="phq-option"
                style={{
                  display:"flex",alignItems:"center",gap:"12px",
                  width:"100%",padding:"13px 18px",borderRadius:"14px",cursor:"pointer",textAlign:"left",
                  border:`2px solid ${isSel?BRAND:"#e2e8f0"}`,
                  backgroundColor:isSel?"rgba(125,79,80,0.06)":"#f8fafc",
                  transition:"border-color 0.15s, background-color 0.15s",
                }}>
                <div style={{width:"20px",height:"20px",borderRadius:"50%",flexShrink:0,border:`2px solid ${isSel?BRAND:"#cbd5e1"}`,backgroundColor:isSel?BRAND:"white",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                  {isSel && <div style={{width:"7px",height:"7px",borderRadius:"50%",backgroundColor:"white"}} />}
                </div>
                <span style={{fontSize:"15px",fontWeight:isSel?600:500,color:isSel?BRAND:"#374151",fontFamily:"'Source Sans 3', sans-serif"}}>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{padding:"20px 32px",backgroundColor:"#f8fafc",borderTop:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px"}}>
        <button type="button" onClick={onBack}
          style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 20px",borderRadius:"12px",fontSize:"14px",fontWeight:600,border:"2px solid #e2e8f0",color:"#475569",backgroundColor:"white",cursor:"pointer",fontFamily:"'Source Sans 3', sans-serif"}}
          onMouseEnter={e=>e.currentTarget.style.backgroundColor="#f1f5f9"}
          onMouseLeave={e=>e.currentTarget.style.backgroundColor="white"}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <button type="button" onClick={onNext} disabled={!selected}
          style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 28px",borderRadius:"12px",fontSize:"14px",fontWeight:600,border:"none",color:"white",backgroundColor:selected?BRAND:"#cbd5e1",cursor:selected?"pointer":"not-allowed",boxShadow:selected?BRAND_SHADOW:"none",fontFamily:"'Source Sans 3', sans-serif"}}>
          Submit
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Animated wrapper ──────────────────────────────────────────────────────────
function AnimatedCard({ direction, children }) {
  const [phase, setPhase] = useState("enter");
  const cls = direction==="back" ? "phq-enter-left" : "phq-enter-right";
  return (
    <div className={phase==="enter"?cls:""} onAnimationEnd={()=>setPhase("idle")} style={{willChange:"transform, opacity"}}>
      {children}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PHQ9Form({ currentStep, answers, onChange, onNext, onBack }) {
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

  const exitClass = direction==="back" ? "phq-exit-right" : "phq-exit-left";
  const step = STEPS[displayStep] || STEPS[currentStep];
  const questionNumber = step?.type === "question" ? step.questionIndex + 1 : null;

  const renderStep = () => {
    if (!step) return null;
    switch (step.type) {
      case "info":       return <StepInfo answers={answers} onChange={onChange} onNext={handleNext} />;
      case "question":   return <StepQuestion step={step} answers={answers} onChange={onChange} onBack={handleBack} questionNumber={questionNumber} />;
      case "difficulty": return <StepDifficulty answers={answers} onChange={onChange} onNext={handleNext} onBack={handleBack} />;
      default:           return null;
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
