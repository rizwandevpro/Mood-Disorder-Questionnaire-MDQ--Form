"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { STEPS, YES_NO_QUESTIONS } from "./hipaaSteps";


const BRAND        = "#7d4f50";
const EXIT_DURATION = 220;

const HIPAA_CSS = `
  @keyframes hipaaIn  { from{opacity:0;transform:translateX(60px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes hipaaInL { from{opacity:0;transform:translateX(-60px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes hipaaOut { from{opacity:1;transform:none} to{opacity:0;transform:translateX(-60px) scale(0.97)} }
  @keyframes hipaaOutR{ from{opacity:1;transform:none} to{opacity:0;transform:translateX(60px) scale(0.97)} }
  .hipaa-ef { animation: hipaaIn   0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .hipaa-eb { animation: hipaaInL  0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .hipaa-xf { animation: hipaaOut  0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
  .hipaa-xb { animation: hipaaOutR 0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }

  .hipaa-yn-btn { padding:10px 28px; border-radius:10px; border:2px solid #e2e8f0;
    font-size:16px; font-weight:700; cursor:pointer; font-family:"Source Sans 3",sans-serif;
    transition:all 0.15s; background:white; }
  .hipaa-yn-btn.yes.sel { background:#16a34a; border-color:#16a34a; color:white; }
  .hipaa-yn-btn.no.sel  { background:#dc2626; border-color:#dc2626; color:white; }
  .hipaa-yn-btn:not(.sel):hover { border-color:#7d4f50; color:#7d4f50; }

  .hipaa-sig-canvas { width:100%; height:160px; border:2px solid #e2e8f0;
    border-radius:12px; cursor:crosshair; background:#f8fafc; display:block; touch-action:none; }
  .hipaa-sig-canvas.has-sig { border-color:#7d4f50; background:white; }

  .hipaa-input { border:2px solid #e2e8f0; border-radius:10px; padding:12px 16px;
    font-size:16px; font-weight:500; color:#1e293b; background:#f8fafc;
    outline:none; font-family:"Source Sans 3",sans-serif; width:100%; box-sizing:border-box; }
  .hipaa-input:focus { border-color:#7d4f50; background:white; }

  .hipaa-textarea { border:2px solid #e2e8f0; border-radius:10px; padding:12px 16px;
    font-size:15px; font-weight:500; color:#1e293b; background:#f8fafc;
    outline:none; font-family:"Source Sans 3",sans-serif; width:100%; box-sizing:border-box;
    resize:vertical; min-height:80px; line-height:1.5; }
  .hipaa-textarea:focus { border-color:#7d4f50; background:white; }

  @media(max-width:600px) {
    .hipaa-yn-btn { padding:10px 20px; font-size:15px; }
    .hipaa-sig-canvas { height:130px; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("hipaa-styles")) {
  const t = document.createElement("style");
  t.id = "hipaa-styles"; t.textContent = HIPAA_CSS; document.head.appendChild(t);
}

// ── Step 1: Consent + YES/NO questions ───────────────────────────────────────
function StepConsent({ answers, onChange, onNext }) {
  const allAnswered = YES_NO_QUESTIONS.every(q => answers[q.key]);

  const YesNo = ({ qkey }) => (
    <div style={{ display:"flex", gap:"10px" }}>
      {["YES","NO"].map(opt => (
        <button key={opt} type="button"
          onClick={() => onChange(qkey, opt)}
          className={`hipaa-yn-btn ${opt.toLowerCase()} ${answers[qkey]===opt?"sel":""}`}>
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ backgroundColor:"white", borderRadius:"24px", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", border:"1px solid #f1f5f9", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ backgroundColor:BRAND, padding:"24px 28px" }}>
        <h2 style={{ fontSize:"22px", fontWeight:700, color:"white", margin:0, fontFamily:"'Lora', Georgia, serif" }}>
          HIPAA Compliance Patient Consent Form
        </h2>
      </div>

      {/* Body text */}
      <div style={{ padding:"24px 28px", borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ fontSize:"15px", color:"#374151", lineHeight:1.75, fontFamily:"'Source Sans 3', sans-serif" }}>
          <p style={{ marginTop:0 }}>
            Our Notice of Privacy Practices provides information about how we may use or disclose protected health information. The notice contains a patient's rights section describing your rights under the law. You ascertain that by your signature you have reviewed our notice before signing this consent. The terms of the notice may change, if so, you will be notified at your next visit to update your signature/date.
          </p>
          <p>
            You have the right to restrict how your protected health information is used and disclosed for treatment, payment, or healthcare operations. We are not required to agree with this restriction, but if we do, we shall honor this agreement. The HIPAA (Health Insurance Portability and Accountability Act of 1996) law allows for the use of the information for treatment, payment, or healthcare operations.
          </p>
          <p>
            By signing this form, you consent to our use and disclosure of your protected healthcare information and potentially anonymous usage in a publication. You have the right to revoke this consent in writing, signed by you. However, such a revocation will not be retroactive.
          </p>

          <p style={{ fontWeight:600, color:"#1e293b" }}>By signing this form, I understand that:</p>
          <ul style={{ paddingLeft:"24px", margin:"8px 0 16px", display:"flex", flexDirection:"column", gap:"8px" }}>
            {[
              "Protected health information may be disclosed or used for treatment, payment, or healthcare operations.",
              "The practice reserves the right to change the privacy policy as allowed by law.",
              "The practice has the right to restrict the use of the information but the practice does not have to agree to those restrictions.",
              "The patient has the right to revoke this consent in writing at any time and all full disclosures will then cease.",
              "The practice may condition receipt of treatment upon execution of this consent.",
            ].map((item, i) => (
              <li key={i} style={{ fontSize:"15px", color:"#374151", lineHeight:1.6 }}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* YES/NO Questions */}
      <div style={{ padding:"20px 28px", display:"flex", flexDirection:"column", gap:"20px", borderBottom:"1px solid #f1f5f9" }}>
        {YES_NO_QUESTIONS.map(q => (
          <div key={q.key}>
            <p style={{ fontSize:"16px", fontWeight:600, color:"#1e293b", margin:"0 0 10px", fontFamily:"'Source Sans 3', sans-serif", lineHeight:1.5 }}>
              {q.text}
            </p>
            <YesNo qkey={q.key} />
          </div>
        ))}

        {/* Family members field — only show if q3 === YES */}
        {answers.q3 === "YES" && (
          <div>
            <label style={{ display:"block", fontSize:"14px", fontWeight:600, color:"#374151", marginBottom:"8px", fontFamily:"'Source Sans 3', sans-serif" }}>
              If YES, please name the members allowed:
            </label>
            <textarea
              className="hipaa-textarea"
              value={answers.familyMembers || ""}
              onChange={e => onChange("familyMembers", e.target.value)}
              placeholder="Enter family member names..."
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:"20px 28px", display:"flex", justifyContent:"flex-end" }}>
        <button type="button" onClick={onNext} disabled={!allAnswered}
          style={{ display:"flex", alignItems:"center", gap:"8px", padding:"14px 32px", borderRadius:"12px",
            fontSize:"16px", fontWeight:700, border:"none", color:"white", cursor:allAnswered?"pointer":"not-allowed",
            fontFamily:"'Source Sans 3', sans-serif",
            backgroundColor:allAnswered?BRAND:"#cbd5e1",
            boxShadow:allAnswered?"0 4px 16px rgba(125,79,80,0.35)":"none" }}>
          Continue to Signature
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Signature ─────────────────────────────────────────────────────────
function StepSignature({ answers, onChange, onNext, onBack }) {
  const canvasRef  = useRef(null);
  const fileRef    = useRef(null);
  const drawing    = useRef(false);
  const lastPos    = useRef(null);
  const [hasSig,   setHasSig]   = useState(!!answers.signatureData);
  const [sigMode,  setSigMode]  = useState(answers.sigMode || "draw"); // "draw" | "upload"
  const [uploadPreview, setUploadPreview] = useState(answers.sigMode === "upload" ? answers.signatureData : null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width  = canvas.offsetWidth  * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    // Restore existing signature
    if (answers.signatureData) {
      const img = new window.Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
      img.src = answers.signatureData;
    }
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
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
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    const data = canvasRef.current.toDataURL("image/png");
    onChange("signatureData", data);
    setHasSig(true);
  };

  const clearSig = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setHasSig(false);
    setUploadPreview(null);
    onChange("signatureData", null);
    onChange("sigMode", sigMode);
  };

  const switchMode = (mode) => {
    clearSig();
    setSigMode(mode);
    onChange("sigMode", mode);
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setUploadPreview(dataUrl);
      setHasSig(true);
      onChange("signatureData", dataUrl);
      onChange("sigMode", "upload");
    };
    reader.readAsDataURL(file);
  };

  const canProceed = answers.printName?.trim() && hasSig && answers.consentDate;

  return (
    <div style={{ backgroundColor:"white", borderRadius:"24px", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", border:"1px solid #f1f5f9", overflow:"hidden" }}>

      <div style={{ backgroundColor:BRAND, padding:"20px 28px" }}>
        <h2 style={{ fontSize:"20px", fontWeight:700, color:"white", margin:0, fontFamily:"'Lora', Georgia, serif" }}>
          Sign & Complete
        </h2>
        <p style={{ color:"rgba(255,255,255,0.8)", fontSize:"14px", margin:"4px 0 0", fontFamily:"'Source Sans 3', sans-serif" }}>
          Please print your name, sign, and add today's date.
        </p>
      </div>

      <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:"20px" }}>

        {/* Print Name */}
        <div>
          <label style={{ display:"block", fontSize:"12px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#94a3b8", marginBottom:"8px", fontFamily:"'Source Sans 3', sans-serif" }}>
            Print Name <span style={{ color:BRAND }}>*</span>
          </label>
          <input type="text" className="hipaa-input"
            value={answers.printName || ""}
            onChange={e => onChange("printName", e.target.value)}
            placeholder="Your full name" />
        </div>

        {/* Date */}
        <div>
          <label style={{ display:"block", fontSize:"12px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#94a3b8", marginBottom:"8px", fontFamily:"'Source Sans 3', sans-serif" }}>
            Date <span style={{ color:BRAND }}>*</span>
          </label>
          <input type="date" className="hipaa-input" style={{ maxWidth:"240px" }}
            value={answers.consentDate || ""}
            onChange={e => onChange("consentDate", e.target.value)} />
        </div>

        {/* Signature section */}
        <div>
          {/* Label row */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
            <label style={{ fontSize:"12px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#94a3b8", fontFamily:"'Source Sans 3', sans-serif" }}>
              Signature <span style={{ color:BRAND }}>*</span>
            </label>
            {hasSig && (
              <button type="button" onClick={clearSig}
                style={{ fontSize:"12px", fontWeight:600, color:"#94a3b8", background:"none", border:"none", cursor:"pointer", fontFamily:"'Source Sans 3', sans-serif", textDecoration:"underline" }}>
                Clear
              </button>
            )}
          </div>

          {/* Mode tabs */}
          <div style={{ display:"flex", gap:"0", marginBottom:"12px", border:"2px solid #e2e8f0", borderRadius:"10px", overflow:"hidden", width:"fit-content" }}>
            {[["draw","✏️ Draw"],["upload","📁 Upload"]].map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => switchMode(mode)}
                style={{
                  padding:"8px 20px", fontSize:"13px", fontWeight:700, border:"none", cursor:"pointer",
                  fontFamily:"'Source Sans 3', sans-serif", transition:"all 0.15s",
                  backgroundColor: sigMode === mode ? BRAND : "white",
                  color: sigMode === mode ? "white" : "#64748b",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Draw mode */}
          {sigMode === "draw" && (
            <>
              <canvas ref={canvasRef} className={`hipaa-sig-canvas${hasSig?" has-sig":""}`}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
              <p style={{ fontSize:"12px", color:"#94a3b8", marginTop:"6px", fontFamily:"'Source Sans 3', sans-serif" }}>
                Draw your signature above using mouse or finger
              </p>
            </>
          )}

          {/* Upload mode */}
          {sigMode === "upload" && (
            <div>
              {!uploadPreview ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border:"2px dashed #e2e8f0", borderRadius:"12px", padding:"32px 20px",
                    textAlign:"center", cursor:"pointer", backgroundColor:"#f8fafc",
                    transition:"border-color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = BRAND}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" style={{ marginBottom:"8px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  <p style={{ fontSize:"14px", fontWeight:600, color:"#475569", margin:"0 0 4px", fontFamily:"'Source Sans 3', sans-serif" }}>
                    Click to upload signature image
                  </p>
                  <p style={{ fontSize:"12px", color:"#94a3b8", margin:0, fontFamily:"'Source Sans 3', sans-serif" }}>
                    PNG, JPG, or GIF supported
                  </p>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload}
                    style={{ display:"none" }} />
                </div>
              ) : (
                <div style={{ border:"2px solid #7d4f50", borderRadius:"12px", padding:"12px", backgroundColor:"white", position:"relative" }}>
                  <img src={uploadPreview} alt="Uploaded signature"
                    style={{ width:"100%", maxHeight:"140px", objectFit:"contain", display:"block" }} />
                </div>
              )}
              <p style={{ fontSize:"12px", color:"#94a3b8", marginTop:"6px", fontFamily:"'Source Sans 3', sans-serif" }}>
                Upload an image of your signature
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:"16px 28px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:"1px solid #f1f5f9" }}>
        <button type="button" onClick={onBack}
          style={{ display:"flex", alignItems:"center", gap:"6px", padding:"12px 20px", borderRadius:"12px",
            fontSize:"15px", fontWeight:600, border:"2px solid #e2e8f0", color:"#475569",
            backgroundColor:"white", cursor:"pointer", fontFamily:"'Source Sans 3', sans-serif" }}
          onMouseEnter={e=>e.currentTarget.style.backgroundColor="#f1f5f9"}
          onMouseLeave={e=>e.currentTarget.style.backgroundColor="white"}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <button type="button" onClick={onNext} disabled={!canProceed}
          style={{ display:"flex", alignItems:"center", gap:"8px", padding:"13px 28px", borderRadius:"12px",
            fontSize:"16px", fontWeight:700, border:"none", color:"white", cursor:canProceed?"pointer":"not-allowed",
            fontFamily:"'Source Sans 3', sans-serif",
            backgroundColor:canProceed?BRAND:"#cbd5e1",
            boxShadow:canProceed?"0 4px 16px rgba(125,79,80,0.35)":"none" }}>
          Submit Consent
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Animated wrapper ──────────────────────────────────────────────────────────
function AnimatedCard({ direction, children }) {
  const [phase, setPhase] = useState("enter");
  const cls = direction === "back" ? "hipaa-eb" : "hipaa-ef";
  return (
    <div className={phase==="enter"?cls:""} onAnimationEnd={()=>setPhase("idle")} style={{willChange:"transform,opacity"}}>
      {children}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HIPAAForm({ currentStep, answers, onChange, onNext, onBack }) {
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

  const exitClass = direction === "back" ? "hipaa-xb" : "hipaa-xf";
  const step = STEPS[displayStep] || STEPS[currentStep];

  const renderStep = () => {
    switch (step?.type) {
      case "consent":   return <StepConsent   answers={answers} onChange={onChange} onNext={handleNext} />;
      case "signature": return <StepSignature answers={answers} onChange={onChange} onNext={handleNext} onBack={handleBack} />;
      default:          return null;
    }
  };

  return (
    <div style={{ position:"relative", overflow:"hidden", minHeight:"400px" }}>
      {isExiting && (
        <div className={exitClass} style={{ position:"absolute", inset:0, willChange:"transform,opacity" }}>
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