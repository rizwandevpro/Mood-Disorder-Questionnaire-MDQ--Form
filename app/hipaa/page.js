"use client";

import { useState } from "react";
import { STEPS, TOTAL_STEPS, THANKYOU_STEP } from "./hipaaSteps";
import HIPAAForm        from "./HIPAAForm";
import HIPAAImageMapper from "./HIPAAImageMapper";
import Image from "next/image";

export default function HIPAAPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [downloadFn,  setDownloadFn]  = useState(null);

  const onThankYou = currentStep === THANKYOU_STEP;

  const handleChange = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));
  const handleNext   = () => { if (currentStep + 1 < TOTAL_STEPS) { setCurrentStep(s => s + 1); window.scrollTo({ top:0, behavior:"smooth" }); }};
  const handleBack   = () => { setCurrentStep(s => Math.max(s - 1, 0)); window.scrollTo({ top:0, behavior:"smooth" }); };
  const handleReset  = () => { setAnswers({}); setCurrentStep(0); setDownloadFn(null); window.scrollTo({ top:0, behavior:"smooth" }); };

  const stepLabels = ["Consent Form", "Signature", "Complete"];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#fdf8f8 0%,#ffffff 50%,#fdf8f8 100%)" }}>

        {/* ── Sticky header ── */}
        <div style={{ backgroundColor:"#7d4f50", position:"sticky", top:0, zIndex:40, boxShadow:"0 2px 12px rgba(0,0,0,0.15)" }}>
          <div style={{ maxWidth:"680px", margin:"0 auto", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", minWidth:0 }}>
              <div style={{ width:"40px", height:"40px", backgroundColor:"white", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", padding:"4px", flexShrink:0 }}>
                <Image src="/logo2.png" alt="Logo" width={72} height={36} style={{ objectFit:"contain" }} />
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ color:"white", fontWeight:700, fontSize:"13px", letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'Source Sans 3', sans-serif", margin:0, lineHeight:1.2 }}>Cambridge Psychiatry</p>
                <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"10px", letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"'Source Sans 3', sans-serif", margin:0 }}>HIPAA Compliance Patient Consent</p>
              </div>
            </div>
            {/* Step dots */}
            {!onThankYou && (
              <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
                {[0,1].map(i => (
                  <div key={i} style={{
                    width: currentStep===i ? "24px" : "8px",
                    height:"8px", borderRadius:"999px",
                    backgroundColor: currentStep===i ? "white" : "rgba(255,255,255,0.35)",
                    transition:"all 0.3s"
                  }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ maxWidth:"680px", margin:"0 auto", padding:"28px 16px" }}>

          {!onThankYou && (
            <HIPAAForm
              currentStep={currentStep}
              answers={answers}
              onChange={handleChange}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {/* ── Thank You ── */}
          {onThankYou && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"48px 16px" }}>

              <div style={{ width:"80px", height:"80px", borderRadius:"50%", backgroundColor:"#7d4f50", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"20px", boxShadow:"0 8px 24px rgba(125,79,80,0.3)" }}>
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>

              <h1 style={{ fontSize:"26px", fontWeight:700, color:"#0f172a", marginBottom:"8px", fontFamily:"'Lora', serif" }}>Consent Form Submitted</h1>
              <p style={{ fontSize:"15px", color:"#64748b", lineHeight:1.6, maxWidth:"360px", marginBottom:"10px", fontFamily:"'Source Sans 3', sans-serif" }}>
                Thank you, <strong style={{ color:"#1e293b" }}>{answers.printName}</strong>. Your HIPAA consent has been recorded.
              </p>
              <p style={{ fontSize:"13px", color:"#94a3b8", marginBottom:"32px", fontFamily:"'Source Sans 3', sans-serif" }}>
                Download a copy of your signed consent form below.
              </p>

              {/* Summary badges */}
              <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", justifyContent:"center", marginBottom:"28px" }}>
                {[
                  { label:"Appointments contact", val:answers.q1 },
                  { label:"Voicemail messages",   val:answers.q2 },
                  { label:"Family discussion",    val:answers.q3 },
                ].map(item => (
                  <div key={item.label} style={{ padding:"10px 16px", borderRadius:"12px", backgroundColor:"white", border:"1px solid #e2e8f0", textAlign:"left" }}>
                    <p style={{ fontSize:"11px", fontWeight:600, color:"#94a3b8", margin:"0 0 2px", fontFamily:"'Source Sans 3', sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>{item.label}</p>
                    <p style={{ fontSize:"15px", fontWeight:700, margin:0, fontFamily:"'Lora', serif", color:item.val==="YES"?"#16a34a":"#dc2626" }}>{item.val}</p>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:"10px", width:"100%", maxWidth:"300px" }}>
                {downloadFn ? (
                  <button onClick={downloadFn}
                    style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", width:"100%", padding:"14px", borderRadius:"12px", fontSize:"15px", fontWeight:700, border:"none", color:"white", backgroundColor:"#7d4f50", cursor:"pointer", boxShadow:"0 4px 14px rgba(125,79,80,0.35)", fontFamily:"'Source Sans 3', sans-serif" }}
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor="#6a4142"}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor="#7d4f50"}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Download PDF
                  </button>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", width:"100%", padding:"14px", borderRadius:"12px", fontSize:"15px", fontWeight:700, color:"rgba(255,255,255,0.8)", backgroundColor:"#7d4f50", opacity:0.6, fontFamily:"'Source Sans 3', sans-serif" }}>
                    <div style={{ width:"16px", height:"16px", border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"white", borderRadius:"50%", animation:"hipaaSpin 0.8s linear infinite" }} />
                    Preparing PDF…
                  </div>
                )}
                <button onClick={handleReset}
                  style={{ width:"100%", padding:"14px", borderRadius:"12px", fontSize:"14px", fontWeight:600, border:"2px solid #e2e8f0", color:"#475569", backgroundColor:"white", cursor:"pointer", fontFamily:"'Source Sans 3', sans-serif" }}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor="#f8fafc"}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor="white"}>
                  Start Over
                </button>
              </div>

              {/* Silent PDF builder */}
              <div aria-hidden="true" style={{ position:"fixed", top:"-9999px", left:"-9999px", width:"1px", height:"1px", overflow:"hidden", pointerEvents:"none" }}>
                <HIPAAImageMapper answers={answers} silentMode onPdfReady={fn => setDownloadFn(() => fn)} />
              </div>

            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes hipaaSpin { to { transform:rotate(360deg) } }`}</style>
    </>
  );
}
