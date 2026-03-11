"use client";

import { useState } from "react";
import { STEPS, TOTAL_STEPS, THANKYOU_STEP } from "./asrsSteps";
import ASRSForm        from "./ASRSForm";
import ASRSImageMapper from "./ASRSImageMapper";
import Image from "next/image";

export default function ASRSPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [downloadFn,  setDownloadFn]  = useState(null);

  const onThankYou = currentStep === THANKYOU_STEP;

  const handleChange = (key, value) =>
    setAnswers(prev => ({ ...prev, [key]: value }));

  const handleNext = () => {
    const next = currentStep + 1;
    if (next >= TOTAL_STEPS) return;
    setCurrentStep(next);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const handleBack = () => {
    setCurrentStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setDownloadFn(null);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const progressSteps   = THANKYOU_STEP - 1;
  const progressCurrent = Math.max(0, Math.min(currentStep - 1, progressSteps));
  const progressPct     = onThankYou ? 100 : Math.round((progressCurrent / progressSteps) * 100);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0f9ff 0%,#ffffff 50%,#eff6ff 100%)"}}>

        {/* ── Sticky header ── */}
        <div style={{backgroundColor:"#7d4f50",position:"sticky",top:0,zIndex:40,boxShadow:"0 2px 12px rgba(0,0,0,0.15)"}}>
          <div style={{maxWidth:"600px",margin:"0 auto",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{width:"44px",height:"44px",backgroundColor:"white",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",padding:"4px",flexShrink:0}}>
                <Image src="/logo2.png" alt="Logo" width={80} height={40} style={{objectFit:"contain"}} />
              </div>
              <div>
                <p style={{color:"white",fontWeight:700,fontSize:"14px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Source Sans 3', sans-serif",margin:0,lineHeight:1.2}}>Cambridge Psychiatry</p>
                <p style={{color:"rgba(255,255,255,0.75)",fontSize:"10px",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"'Source Sans 3', sans-serif",margin:0}}>ADHD Self-Report Scale (ASRS)</p>
              </div>
            </div>
            <p style={{color:"rgba(255,255,255,0.8)",fontSize:"12px",textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'Source Sans 3', sans-serif",flexShrink:0}}>
              {onThankYou ? "Complete" : currentStep===0 ? "Assessment" : `Q${currentStep} of 18`}
            </p>
          </div>
          {!onThankYou && currentStep > 0 && (
            <div style={{maxWidth:"600px",margin:"0 auto",padding:"0 16px 10px"}}>
              <div style={{height:"4px",backgroundColor:"rgba(255,255,255,0.15)",borderRadius:"999px",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progressPct}%`,background:"linear-gradient(to right,#93c5fd,#6ee7b7)",borderRadius:"999px",transition:"width 0.5s ease-out"}} />
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{maxWidth:"600px",margin:"0 auto",padding:"32px 16px"}}>

          {!onThankYou && (
            <>
              <ASRSForm
                currentStep={currentStep}
                answers={answers}
                onChange={handleChange}
                onNext={handleNext}
                onBack={handleBack}
              />
              <p style={{textAlign:"center",fontSize:"11px",color:"#94a3b8",marginTop:"20px",lineHeight:1.6,fontFamily:"'Source Sans 3', sans-serif",padding:"0 16px"}}>
                This screener is not a diagnostic tool.<br/>
                <strong style={{color:"#64748b"}}>An accurate diagnosis can only be made by a qualified clinician.</strong>
              </p>
            </>
          )}

          {/* ── Thank You ── */}
          {onThankYou && (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",padding:"48px 16px"}}>

              <div style={{width:"80px",height:"80px",borderRadius:"50%",backgroundColor:"#7d4f50",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"24px",boxShadow:"0 8px 24px rgba(125,79,80,0.28)"}}>
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>

              <h1 style={{fontSize:"28px",fontWeight:700,color:"#0f172a",marginBottom:"10px",fontFamily:"'Lora', serif"}}>Assessment Complete</h1>
              <p style={{fontSize:"15px",color:"#64748b",lineHeight:1.6,maxWidth:"380px",marginBottom:"32px",fontFamily:"'Source Sans 3', sans-serif"}}>
                Your completed ASRS form has been prepared. Download your PDF report below and share it with your clinician.
              </p>

              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",width:"100%",maxWidth:"320px"}}>
                {downloadFn ? (
                  <button onClick={downloadFn}
                    style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",width:"100%",padding:"14px",borderRadius:"12px",fontSize:"15px",fontWeight:700,border:"none",color:"white",backgroundColor:"#7d4f50",cursor:"pointer",boxShadow:"0 4px 14px rgba(125,79,80,0.35)",fontFamily:"'Source Sans 3', sans-serif"}}
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor="#6a4142"}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor="#7d4f50"}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Download PDF Report
                  </button>
                ) : (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",width:"100%",padding:"14px",borderRadius:"12px",fontSize:"15px",fontWeight:700,color:"rgba(255,255,255,0.8)",backgroundColor:"#7d4f50",opacity:0.6,fontFamily:"'Source Sans 3', sans-serif"}}>
                    <div style={{width:"16px",height:"16px",border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"white",borderRadius:"50%",animation:"asrsSpin 0.8s linear infinite"}} />
                    Preparing PDF…
                  </div>
                )}
                <button onClick={handleReset}
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",width:"100%",padding:"14px",borderRadius:"12px",fontSize:"14px",fontWeight:600,border:"2px solid #e2e8f0",color:"#475569",backgroundColor:"white",cursor:"pointer",fontFamily:"'Source Sans 3', sans-serif"}}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor="#f8fafc"}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor="white"}>
                  Start New Assessment
                </button>
              </div>

              {/* Silent PDF builder */}
              <div aria-hidden="true" style={{position:"fixed",top:"-9999px",left:"-9999px",width:"1px",height:"1px",overflow:"hidden",pointerEvents:"none"}}>
                <ASRSImageMapper answers={answers} silentMode onPdfReady={fn=>setDownloadFn(()=>fn)} />
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes asrsSpin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}