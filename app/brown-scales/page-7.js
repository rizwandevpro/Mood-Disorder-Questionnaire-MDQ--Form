"use client";

import { useState } from "react";
import { STEPS, TOTAL_STEPS, THANKYOU_STEP, QUESTIONS, OPTIONS } from "./brownSteps";
import BrownForm        from "./BrownForm";
import BrownImageMapper from "./BrownImageMapper";
import Image from "next/image";

// Inject page-level responsive CSS
const PAGE_CSS = `
  .brwn-page-body { max-width:800px; margin:0 auto; padding:24px 16px; }
  .brwn-thankyou-summary { display:grid; gap:8px; }
  @media (max-width:600px) {
    .brwn-page-body { padding:16px 10px; }
  }
`;
if (typeof document !== "undefined" && !document.getElementById("brown-page-styles")) {
  const t = document.createElement("style");
  t.id = "brown-page-styles"; t.textContent = PAGE_CSS; document.head.appendChild(t);
}

export default function BrownPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [downloadFn,  setDownloadFn]  = useState(null);

  const onThankYou = currentStep === THANKYOU_STEP;

  const handleChange = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));
  const handleNext   = () => { if (currentStep + 1 < TOTAL_STEPS) { setCurrentStep(s => s + 1); window.scrollTo({ top:0, behavior:"smooth" }); }};
  const handleBack   = () => { setCurrentStep(s => Math.max(s - 1, 0)); window.scrollTo({ top:0, behavior:"smooth" }); };
  const handleReset  = () => { setAnswers({}); setCurrentStep(0); setDownloadFn(null); window.scrollTo({ top:0, behavior:"smooth" }); };

  const totalScore    = QUESTIONS.reduce((sum, q) => { const o = OPTIONS.find(o => o.label === answers[q.key]); return sum + (o ? o.score : 0); }, 0);
  const maxScore      = QUESTIONS.length * 3;
  const answeredCount = QUESTIONS.filter(q => answers[q.key]).length;

  const questionSteps   = THANKYOU_STEP - 1;
  const progressCurrent = Math.max(0, Math.min(currentStep - 1, questionSteps));
  const progressPct     = onThankYou ? 100 : Math.round((progressCurrent / questionSteps) * 100);

  const stepLabel = () => {
    if (onThankYou) return "Complete";
    if (currentStep === 0) return "Brown Scales";
    const step = STEPS[currentStep];
    if (step?.type === "questions") return `Items ${step.startIndex + 1}–${Math.min(step.startIndex + step.questions.length, 57)}`;
    return "";
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0fdf9 0%,#ffffff 50%,#ecfdf5 100%)" }}>

        {/* ── Sticky header ── */}
        <div style={{ backgroundColor:"#7d4f50", position:"sticky", top:0, zIndex:40, boxShadow:"0 2px 12px rgba(0,0,0,0.15)" }}>
          <div style={{ maxWidth:"800px", margin:"0 auto", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", minWidth:0 }}>
              <div style={{ width:"40px", height:"40px", backgroundColor:"white", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", padding:"4px", flexShrink:0 }}>
                <Image src="/logo2.png" alt="Logo" width={72} height={36} style={{ objectFit:"contain" }} />
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ color:"white", fontWeight:700, fontSize:"13px", letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'Source Sans 3', sans-serif", margin:0, lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Cambridge Psychiatry</p>
                <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"10px", letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"'Source Sans 3', sans-serif", margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Brown Executive Function/Attention Scales</p>
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <p style={{ color:"rgba(255,255,255,0.85)", fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'Source Sans 3', sans-serif", margin:0 }}>{stepLabel()}</p>
              {!onThankYou && currentStep > 0 && (
                <p style={{ color:"rgba(255,255,255,0.55)", fontSize:"10px", fontFamily:"'Source Sans 3', sans-serif", margin:0 }}>{answeredCount}/57 answered</p>
              )}
            </div>
          </div>
          {/* Progress bar */}
          {!onThankYou && currentStep > 0 && (
            <div style={{ maxWidth:"800px", margin:"0 auto", padding:"0 16px 8px" }}>
              <div style={{ height:"4px", backgroundColor:"rgba(255,255,255,0.15)", borderRadius:"999px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${progressPct}%`, background:"linear-gradient(to right,#5eead4,#6ee7b7)", borderRadius:"999px", transition:"width 0.5s ease-out" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="brwn-page-body">

          {!onThankYou && (
            <>
              <BrownForm currentStep={currentStep} answers={answers} onChange={handleChange} onNext={handleNext} onBack={handleBack} />
              <p style={{ textAlign:"center", fontSize:"11px", color:"#94a3b8", marginTop:"16px", lineHeight:1.6, fontFamily:"'Source Sans 3', sans-serif", padding:"0 8px" }}>
                This assessment is not a substitute for clinical evaluation.<br/>
                <strong style={{ color:"#64748b" }}>Please discuss results with your healthcare provider.</strong>
              </p>
            </>
          )}

          {/* ── Thank You ── */}
          {onThankYou && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"32px 8px" }}>

              {/* Score circle */}
              <div style={{ width:"120px", height:"120px", borderRadius:"50%", backgroundColor:"#f0fdf9", border:"4px solid #0f766e", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", marginBottom:"18px", boxShadow:"0 8px 28px rgba(15,118,110,0.2)" }}>
                <span style={{ fontSize:"40px", fontWeight:800, color:"#0f766e", fontFamily:"'Lora', serif", lineHeight:1 }}>{totalScore}</span>
                <span style={{ fontSize:"11px", fontWeight:600, color:"#0f766e", fontFamily:"'Source Sans 3', sans-serif" }}>/ {maxScore}</span>
              </div>

              <h1 style={{ fontSize:"24px", fontWeight:700, color:"#0f172a", marginBottom:"8px", fontFamily:"'Lora', serif" }}>Assessment Complete</h1>
              <p style={{ fontSize:"14px", color:"#64748b", lineHeight:1.6, maxWidth:"360px", marginBottom:"24px", fontFamily:"'Source Sans 3', sans-serif" }}>
                All 57 items answered. Download your completed Brown Executive Function/Attention Scales report below.
              </p>

              {/* Response breakdown */}
              <div style={{ width:"100%", maxWidth:"400px", backgroundColor:"white", borderRadius:"16px", border:"1px solid #e2e8f0", padding:"16px 20px", marginBottom:"24px", textAlign:"left" }}>
                <p style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#94a3b8", marginBottom:"12px", fontFamily:"'Source Sans 3', sans-serif" }}>Response Summary</p>
                {OPTIONS.map(opt => {
                  const count = QUESTIONS.filter(q => answers[q.key] === opt.label).length;
                  const pct   = Math.round((count / 57) * 100);
                  return (
                    <div key={opt.label} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"7px 0", borderBottom:"1px solid #f1f5f9" }}>
                      <span style={{ fontSize:"14px", fontWeight:900, color:"#0f766e", width:"18px", fontFamily:"'Lora', serif", flexShrink:0 }}>{opt.label}</span>
                      <span style={{ fontSize:"12px", color:"#475569", fontFamily:"'Source Sans 3', sans-serif", width:"100px", flexShrink:0 }}>{opt.full}</span>
                      <div style={{ flex:1, height:"6px", backgroundColor:"#f1f5f9", borderRadius:"999px", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, backgroundColor:"#0f766e", borderRadius:"999px" }} />
                      </div>
                      <span style={{ fontSize:"13px", fontWeight:700, color:"#0f766e", width:"28px", textAlign:"right", fontFamily:"'Lora', serif" }}>{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Buttons */}
              <div style={{ display:"flex", flexDirection:"column", gap:"10px", width:"100%", maxWidth:"300px" }}>
                {downloadFn ? (
                  <button onClick={downloadFn}
                    style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", width:"100%", padding:"14px", borderRadius:"12px", fontSize:"15px", fontWeight:700, border:"none", color:"white", backgroundColor:"#7d4f50", cursor:"pointer", boxShadow:"0 4px 14px rgba(125,79,80,0.35)", fontFamily:"'Source Sans 3', sans-serif" }}
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor="#6a4142"}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor="#7d4f50"}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Download PDF Report
                  </button>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", width:"100%", padding:"14px", borderRadius:"12px", fontSize:"15px", fontWeight:700, color:"rgba(255,255,255,0.8)", backgroundColor:"#7d4f50", opacity:0.6, fontFamily:"'Source Sans 3', sans-serif" }}>
                    <div style={{ width:"16px", height:"16px", border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"white", borderRadius:"50%", animation:"brownSpin 0.8s linear infinite" }} />
                    Preparing PDF…
                  </div>
                )}
                <button onClick={handleReset}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", width:"100%", padding:"14px", borderRadius:"12px", fontSize:"14px", fontWeight:600, border:"2px solid #e2e8f0", color:"#475569", backgroundColor:"white", cursor:"pointer", fontFamily:"'Source Sans 3', sans-serif" }}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor="#f8fafc"}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor="white"}>
                  Start New Assessment
                </button>
              </div>

              {/* Silent PDF builder */}
              <div aria-hidden="true" style={{ position:"fixed", top:"-9999px", left:"-9999px", width:"1px", height:"1px", overflow:"hidden", pointerEvents:"none" }}>
                <BrownImageMapper answers={answers} silentMode onPdfReady={fn => setDownloadFn(() => fn)} />
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes brownSpin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}