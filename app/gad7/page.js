"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/gad7/page.js — GAD-7 Anxiety Screener
// Route: /gad7
//
// Step 0  → Patient info (name, email, phone) — collected before form starts
// Step 1+ → GAD7Form steps (questions + difficulty)
// Final   → Thank you screen with auto-download + auto-email
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { STEPS, TOTAL_STEPS, THANKYOU_STEP } from "./gad7Steps";
import GAD7Form        from "./GAD7Form";
import GAD7ImageMapper from "./GAD7ImageMapper";
import { calcScore }   from "./GAD7Form";
import Image from "next/image";

// THANKYOU_STEP from gad7Steps is the original final step index (e.g. 9).
// We insert one extra step at position 0 (patient info), so all original
// step indices shift up by 1.
const INFO_STEP       = 0;
const FORM_START_STEP = 1;                        // original step 0 → now step 1
const TOTAL           = TOTAL_STEPS + 1;          // +1 for the info step
const DONE_STEP       = THANKYOU_STEP + 1;        // thank-you step shifted by 1

function scoreLabel(score) {
  if (score <= 4)  return { label: "Minimal Anxiety",  color: "#16a34a", bg: "#f0fdf4" };
  if (score <= 9)  return { label: "Mild Anxiety",     color: "#ca8a04", bg: "#fefce8" };
  if (score <= 14) return { label: "Moderate Anxiety", color: "#ea580c", bg: "#fff7ed" };
  return                  { label: "Severe Anxiety",   color: "#dc2626", bg: "#fef2f2" };
}

// ── Patient info step ─────────────────────────────────────────────────────────
function PatientInfoStep({ info, onChange, onNext }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!info.fullName?.trim())  e.fullName = "Full name is required.";
    if (!info.phone?.trim())     e.phone    = "Phone number is required.";
    if (info.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email.trim()))
                                 e.email    = "Please enter a valid email.";
    if (!info.location)          e.location = "Please select a clinic location.";
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
          Please provide your contact information. If you provide an email, your completed assessment will be emailed to you automatically.
        </p>
      </div>

      {field("fullName", "Full Name",    "text",  "e.g. Jane Smith",        true)}
      {field("email",    "Email Address","email", "e.g. jane@example.com",  false)}
      {field("phone",    "Phone Number", "tel",   "e.g. (555) 123-4567",    true)}

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
        Start Assessment →
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GAD7Page() {
  const [currentStep, setCurrentStep] = useState(INFO_STEP);
  const [answers,     setAnswers]     = useState({});
  const [info,        setInfo]        = useState({ fullName: "", email: "", phone: "", location: "" });
  const [downloadFn,  setDownloadFn]  = useState(null);
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | sent | error
  const emailSentRef = useRef(false);

  const onInfoStep  = currentStep === INFO_STEP;
  const onThankYou  = currentStep === DONE_STEP;
  const inForm      = !onInfoStep && !onThankYou;

  // currentStep for GAD7Form = currentStep - 1 (shift back)
  const formStep = currentStep - FORM_START_STEP;

  const handleInfoChange = (key, value) =>
    setInfo(prev => ({ ...prev, [key]: value }));

  const handleChange = (key, value) =>
    setAnswers(prev => ({ ...prev, [key]: value }));

  const handleNext = () => {
    const next = currentStep + 1;
    if (next > DONE_STEP) return;
    setCurrentStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setAnswers({});
    setInfo({ fullName: "", email: "", phone: "", location: "" });
    setCurrentStep(INFO_STEP);
    setDownloadFn(null);
    setEmailStatus("idle");
    emailSentRef.current = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalScore = calcScore(answers);
  const severity   = scoreLabel(totalScore);

  // Progress bar — only during form steps
  const progressSteps   = THANKYOU_STEP - 1;
  const progressCurrent = Math.max(0, Math.min(formStep - 1, progressSteps));
  const progressPct     = onThankYou ? 100 : Math.round((progressCurrent / progressSteps) * 100);

  // Header step label
  const stepLabel = onThankYou  ? "Complete"
    : onInfoStep                ? "Patient Info"
    : formStep === 0            ? "Assessment"
    : `Step ${formStep} of ${THANKYOU_STEP - 1}`;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0f9ff 0%,#ffffff 50%,#eff6ff 100%)" }}>

        {/* ── Sticky header ── */}
        <div style={{ backgroundColor: "#7d4f50", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "44px", height: "44px", backgroundColor: "white", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", flexShrink: 0 }}>
                <Image src="/logo2.png" alt="Logo" width={80} height={40} style={{ objectFit: "contain" }} />
              </div>
              <div>
                <p style={{ color: "white", fontWeight: 700, fontSize: "14px", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif", margin: 0, lineHeight: 1.2 }}>
                  Cambridge Psychiatry
                </p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif", margin: 0 }}>
                  GAD-7 Anxiety Screener
                </p>
              </div>
            </div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Source Sans 3', sans-serif", flexShrink: 0 }}>
              {stepLabel}
            </p>
          </div>

          {/* Progress bar — only during form questions */}
          {inForm && formStep > 0 && (
            <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 16px 10px" }}>
              <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(to right,#93c5fd,#6ee7b7)", borderRadius: "999px", transition: "width 0.5s ease-out" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 16px" }}>

          {/* ── Patient info step ── */}
          {onInfoStep && (
            <PatientInfoStep
              info={info}
              onChange={handleInfoChange}
              onNext={handleNext}
            />
          )}

          {/* ── Form steps ── */}
          {inForm && (
            <>
              <GAD7Form
                currentStep={formStep}
                answers={answers}
                onChange={handleChange}
                onNext={handleNext}
                onBack={handleBack}
              />
              <p style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", marginTop: "20px", lineHeight: 1.6, fontFamily: "'Source Sans 3', sans-serif", padding: "0 16px" }}>
                This screener is not a substitute for a full clinical evaluation.<br />
                <strong style={{ color: "#64748b" }}>An accurate diagnosis can only be made by your doctor.</strong>
              </p>
            </>
          )}

          {/* ── Thank You ── */}
          {onThankYou && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 16px" }}>

              {/* Score badge */}
              <div style={{ width: "96px", height: "96px", borderRadius: "50%", backgroundColor: severity.bg, border: `3px solid ${severity.color}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: "24px", boxShadow: `0 4px 20px ${severity.color}30` }}>
                <span style={{ fontSize: "34px", fontWeight: 800, color: severity.color, fontFamily: "'Lora', serif", lineHeight: 1 }}>{totalScore}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: severity.color, fontFamily: "'Source Sans 3', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>/ 21</span>
              </div>

              <span style={{ display: "inline-block", padding: "6px 20px", borderRadius: "20px", fontSize: "14px", fontWeight: 700, backgroundColor: severity.bg, color: severity.color, border: `2px solid ${severity.color}40`, marginBottom: "16px", fontFamily: "'Source Sans 3', sans-serif" }}>
                {severity.label}
              </span>

              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: "8px", fontFamily: "'Lora', serif" }}>
                Assessment Complete
              </h1>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, maxWidth: "360px", marginBottom: "28px", fontFamily: "'Source Sans 3', sans-serif" }}>
                Your results have been recorded. A copy of your completed form will be downloaded and emailed.
              </p>

              {/* Scoring guide */}
              <div style={{ width: "100%", maxWidth: "380px", backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: "28px", textAlign: "left" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "12px", fontFamily: "'Source Sans 3', sans-serif" }}>Scoring Guide</p>
                {[{ r: "0–4", l: "Minimal anxiety" }, { r: "5–9", l: "Mild anxiety" }, { r: "10–14", l: "Moderate anxiety" }, { r: "15–21", l: "Severe anxiety" }].map(({ r, l }, i) => {
                  const colors = ["#16a34a", "#ca8a04", "#ea580c", "#dc2626"];
                  return (
                    <div key={r} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? "1px solid #f1f5f9" : "none" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: colors[i], fontFamily: "'Source Sans 3', sans-serif" }}>{r}</span>
                      <span style={{ fontSize: "13px", color: "#374151", fontFamily: "'Source Sans 3', sans-serif" }}>{l}</span>
                    </div>
                  );
                })}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%", maxWidth: "320px" }}>
                {downloadFn ? (
                  <button
                    onClick={downloadFn}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, border: "none", color: "white", backgroundColor: "#7d4f50", cursor: "pointer", boxShadow: "0 4px 14px rgba(125,79,80,0.35)", fontFamily: "'Source Sans 3', sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#6a4142"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#7d4f50"}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF Report
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.8)", backgroundColor: "#7d4f50", opacity: 0.6, fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Preparing PDF…
                  </div>
                )}

                {/* Email status */}
                {emailStatus === "sending" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div style={{ width: "12px", height: "12px", border: "2px solid #cbd5e1", borderTopColor: "#7d4f50", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                    {info.email ? `Sending to ${info.email}…` : "Sending to our office…"}
                  </div>
                )}
                {emailStatus === "sent" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#16a34a", fontFamily: "'Source Sans 3', sans-serif" }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {info.email ? `Emailed to ${info.email} and our office` : "Emailed to our office"}
                    <p className="text-slate-500 text-base leading-relaxed max-w-sm mb-8"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Can't find this email? Please check your spam or junk folder.
              </p>
                  </div>
                )}
                {emailStatus === "error" && (
                  <div style={{ fontSize: "13px", color: "#dc2626", textAlign: "center", fontFamily: "'Source Sans 3', sans-serif" }}>
                    Email delivery failed — please download the PDF above.
                  </div>
                )}

                <button
                  onClick={handleReset}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, border: "2px solid #e2e8f0", color: "#475569", backgroundColor: "white", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}
                >
                  Start New Assessment
                </button>
              </div>

              {/* ── Silent PDF builder ── */}
              <div aria-hidden="true" style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "1px", height: "1px", overflow: "hidden", pointerEvents: "none" }}>
                <GAD7ImageMapper
                  answers={answers}
                  silentMode
                  onPdfReady={fn => {
                    setDownloadFn(() => fn);

                    // Guard against double-fire
                    if (emailSentRef.current) return;
                    emailSentRef.current = true;

                    // Auto-download
                    fn();

                    // Auto-email
                    setEmailStatus("sending");
                    const fileName = `${(info.fullName || "Patient").replace(/\s+/g, "_")}_GAD7_Anxiety_Screener.pdf`;

                    // GAD7ImageMapper uses window.jspdf CDN — intercept prototype.save
                    // to get the blob without triggering a download
                    const sendEmail = (blob) => {
                      new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result.split(",")[1]);
                        reader.readAsDataURL(blob);
                      }).then(base64 => fetch("/api/send-forms", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            pdfBase64:    base64,
                            patientEmail: info.email?.trim() || "",
                            patientName:  info.fullName,
                            patientPhone: info.phone || "",
                            clinicLocation: info.location || "",
                            fileName,
                            formName: "GAD-7 Anxiety Screener",
                          }),
                        }))
                        .then(r => r.json())
                        .then(data => {
                          if (data.success) setEmailStatus("sent");
                          else { console.error("Email error:", data.error); setEmailStatus("error"); }
                        })
                        .catch(err => { console.error("Email failed:", err); setEmailStatus("error"); });
                    };

                    // Intercept URL.createObjectURL to grab the blob
                    // (GAD7ImageMapper uses import("jspdf") which calls URL.createObjectURL)
                    const origCreate = URL.createObjectURL.bind(URL);
                    URL.createObjectURL = (blob) => {
                      URL.createObjectURL = origCreate;
                      sendEmail(blob);
                      return origCreate(blob);
                    };
                  }}
                />
              </div>

            </div>
          )}

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}