"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/health-history/page.js  →  route: /health-history
//
// Step 0  → Patient info (full name required, phone required, email optional)
// Step 1+ → HealthHistoryForm steps
// Final   → Thank you screen with auto-download + auto-email
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { HH_STEPS, HH_TOTAL_STEPS, HH_THANKYOU_STEP } from "./healthHistorySteps";
import HealthHistoryForm        from "./HealthHistoryForm";
import HealthHistoryImageMapper from "./HealthHistoryImageMapper";

const STEP_LABELS = ["Personal","Health Maint.","Conditions","Allergies","Habits","Surgical","Pregnancy","Family","Signature"];

const INFO_STEP       = 0;
const FORM_START_STEP = 1;
const DONE_STEP       = HH_THANKYOU_STEP + 1;

// ── Patient info step ─────────────────────────────────────────────────────────
function PatientInfoStep({ info, onChange, onNext }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!info.fullName?.trim()) e.fullName = "Full name is required.";
    if (!info.phone?.trim())    e.phone    = "Phone number is required.";
    if (info.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email.trim()))
                                e.email    = "Please enter a valid email.";
    if (!info.location)         e.location = "Please select a clinic location.";
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext();
  };

  const field = (key, label, type, placeholder, required) => (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "6px", fontFamily: "'Source Sans 3', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>}
      </label>
      <input
        type={type}
        value={info[key] || ""}
        placeholder={placeholder}
        onChange={e => { onChange(key, e.target.value); setErrors(prev => ({ ...prev, [key]: "" })); }}
        style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: `1.5px solid ${errors[key] ? "#dc2626" : "#e2e8f0"}`, fontSize: "15px", fontFamily: "'Source Sans 3', sans-serif", color: "#1e293b", outline: "none", boxSizing: "border-box", backgroundColor: "white" }}
      />
      {errors[key] && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontFamily: "'Source Sans 3', sans-serif" }}>{errors[key]}</p>}
    </div>
  );

  return (
    <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', serif", marginBottom: "8px" }}>
          Before We Begin
        </h2>
        <p style={{ fontSize: "14px", color: "#64748b", fontFamily: "'Source Sans 3', sans-serif", lineHeight: 1.6 }}>
          Please provide your contact information. If you include an email, your completed form will be sent to you automatically.
        </p>
      </div>

      {field("fullName", "Full Name",    "text",  "e.g. Jane Smith",       true)}
      {field("phone",    "Phone Number", "tel",   "e.g. (555) 123-4567",   true)}
      {field("email",    "Email Address","email", "e.g. jane@example.com", false)}

      {/* Clinic Location */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "6px", fontFamily: "'Source Sans 3', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Clinic Location<span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>
        </label>
        <select
          value={info.location || ""}
          onChange={e => { onChange("location", e.target.value); setErrors(prev => ({ ...prev, location: "" })); }}
          style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: `1.5px solid ${errors.location ? "#dc2626" : "#e2e8f0"}`, fontSize: "15px", fontFamily: "'Source Sans 3', sans-serif", color: info.location ? "#1e293b" : "#94a3b8", outline: "none", boxSizing: "border-box", backgroundColor: "white", cursor: "pointer" }}
        >
          <option value="" disabled>Select a location…</option>
          <option value="Westland">Westland</option>
          <option value="Hamtramck">Hamtramck</option>
          <option value="Roseville">Roseville</option>
        </select>
        {errors.location && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontFamily: "'Source Sans 3', sans-serif" }}>{errors.location}</p>}
      </div>

      <button
        onClick={handleNext}
        style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, border: "none", color: "white", backgroundColor: "#7d4f50", cursor: "pointer", boxShadow: "0 4px 14px rgba(125,79,80,0.25)", fontFamily: "'Source Sans 3', sans-serif", marginTop: "8px" }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#6a4142"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = "#7d4f50"}
      >
        Start Form →
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HealthHistoryPage() {
  const [currentStep, setCurrentStep] = useState(INFO_STEP);
  const [answers,     setAnswers]     = useState({});
  const [info,        setInfo]        = useState({ fullName: "", phone: "", email: "", location: "" });
  const [downloadFn,  setDownloadFn]  = useState(null);
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | sent | error
  const emailSentRef = useRef(false);

  const onInfoStep = currentStep === INFO_STEP;
  const onThankYou = currentStep === DONE_STEP;
  const inForm     = !onInfoStep && !onThankYou;
  const formStep   = currentStep - FORM_START_STEP;

  const handleInfoChange = (key, value) => setInfo(prev => ({ ...prev, [key]: value }));
  const handleChange     = useCallback((key, value) => setAnswers(prev => ({ ...prev, [key]: value })), []);

  const handleNext = () => {
    setCurrentStep(s => Math.min(s + 1, DONE_STEP));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setAnswers({});
    setInfo({ fullName: "", phone: "", email: "", location: "" });
    setCurrentStep(INFO_STEP);
    setDownloadFn(null);
    setEmailStatus("idle");
    emailSentRef.current = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const progressPct = Math.round((Math.min(formStep, HH_THANKYOU_STEP - 1) / (HH_THANKYOU_STEP - 1)) * 100);

  // Header step label — uses formStep so step numbers match original
  const stepLabel = onThankYou  ? "Complete"
    : onInfoStep                ? "Patient Info"
    : `Step ${formStep + 1} of ${HH_THANKYOU_STEP}`;
  const sectionLabel = inForm ? (STEP_LABELS[formStep] || "") : "";

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">

        {/* ── Header ── */}
        <div className="bg-[#7d4f50] px-4 py-4 sticky top-0 z-40 shadow-md">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg border border-white/20 flex items-center justify-center p-1">
                <Image src="/logo2.png" alt="Logo" width={100} height={50} />
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-bold text-xl tracking-widest uppercase" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>Cambridge Psychiatry</p>
                <p className="text-white/80 text-xs tracking-widest uppercase" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>Patient Health History (Confidential)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm uppercase tracking-widest" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                {stepLabel}
              </p>
              {(inForm || onInfoStep) && (
                <p className="text-white/60 text-xs uppercase tracking-widest" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  {onInfoStep ? "Contact Info" : sectionLabel}
                </p>
              )}
            </div>
          </div>

          {inForm && (
            <div className="max-w-3xl mx-auto mt-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-300 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex justify-between mt-2 px-0.5">
                {STEP_LABELS.map((label, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < formStep ? "bg-emerald-400" : i === formStep ? "bg-white scale-125" : "bg-white/20"
                    }`} />
                    <span className="hidden lg:block text-[8px] uppercase tracking-wider"
                      style={{ color: i <= formStep ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", fontFamily: "'Source Sans 3', sans-serif" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* ── Patient info step ── */}
          {onInfoStep && (
            <PatientInfoStep info={info} onChange={handleInfoChange} onNext={handleNext} />
          )}

          {/* ── Form steps ── */}
          {inForm && (
            <>
              <HealthHistoryForm
                currentStep={formStep}
                answers={answers}
                onChange={handleChange}
                onNext={handleNext}
                onBack={handleBack}
              />
              <p className="text-center text-xs text-slate-400 mt-6" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                This form is confidential. Fields marked <span style={{ color: "#7d4f50" }}>*</span> are required.
              </p>
            </>
          )}

          {/* ── Thank You ── */}
          {onThankYou && (
            <div className="flex flex-col items-center text-center py-12 px-4">
              <div className="w-20 h-20 rounded-full bg-[#7d4f50] flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: "'Lora', serif" }}>Form Submitted!</h1>
              <p className="text-slate-500 text-base max-w-sm mb-8" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Thank you, <strong className="text-slate-700">{answers.hhName || info.fullName}</strong>. Your health history has been submitted.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                {downloadFn ? (
                  <button onClick={downloadFn}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white"
                    style={{ backgroundColor: "#7d4f50", boxShadow: "0 4px 14px rgba(125,79,80,0.35)", fontFamily: "'Source Sans 3', sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#6a4142"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#7d4f50"}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF Report
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white/80"
                    style={{ backgroundColor: "#7d4f50", opacity: 0.6, fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Preparing PDF…
                  </div>
                )}

                <button onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm"
                  style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                  Start New Form
                </button>
              </div>

              {/* Email status */}
              {emailStatus === "sending" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", fontFamily: "'Source Sans 3', sans-serif", marginBottom: "8px" }}>
                  <div style={{ width: "12px", height: "12px", border: "2px solid #cbd5e1", borderTopColor: "#7d4f50", borderRadius: "50%", animation: "hhSpin 0.8s linear infinite", flexShrink: 0 }} />
                  {info.email ? `Sending to ${info.email}…` : "Sending to our office…"}
                </div>
              )}
              {emailStatus === "sent" && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#16a34a", fontFamily: "'Source Sans 3', sans-serif", marginBottom: "8px" }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {info.email ? `Emailed to ${info.email} and our office` : "Emailed to our office"}
                </div>
              )}
              {emailStatus === "error" && (
                <div style={{ fontSize: "13px", color: "#dc2626", textAlign: "center", fontFamily: "'Source Sans 3', sans-serif", marginBottom: "8px" }}>
                  Email delivery failed — please download the PDF above.
                </div>
              )}

              {/* Silent PDF builder */}
              <div aria-hidden="true" style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "1px", height: "1px", overflow: "hidden", pointerEvents: "none" }}>
                <HealthHistoryImageMapper
                  answers={answers}
                  silentMode
                  onPdfReady={(fn, blob) => {
                    setDownloadFn(() => fn);

                    // Guard against double-fire
                    if (emailSentRef.current) return;
                    emailSentRef.current = true;

                    // Auto-download
                    fn();

                    // Auto-email using blob passed directly from mapper
                    setEmailStatus("sending");
                    const patientName = answers.hhName || info.fullName || "Patient";
                    const fileName    = `${patientName.replace(/\s+/g, "_")}_Patient_Health_History.pdf`;

                    new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result.split(",")[1]);
                      reader.readAsDataURL(blob);
                    })
                      .then(base64 => fetch("/api/send-forms", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          pdfBase64:    base64,
                          patientEmail: info.email?.trim() || "",
                          patientName,
                          patientPhone: info.phone || "",
                          clinicLocation: info.location || "",
                          fileName,
                          formName:     "Patient Health History",
                        }),
                      }))
                      .then(r => r.json())
                      .then(data => {
                        if (data.success) setEmailStatus("sent");
                        else { console.error("Email error:", data.error); setEmailStatus("error"); }
                      })
                      .catch(err => { console.error("Email failed:", err); setEmailStatus("error"); });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes hhSpin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}