"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/hipaa-intake/page.js   →   route: /hipaa-intake
//
// Combines HIPAA Consent + New Patient Intake into one sequential flow.
// On completion, merges both PDFs (HIPAA page + Intake page) into a single
// 2-page PDF for download.
//
// Step mapping (global → component):
//   0 → HIPAAForm  step 0 (Consent)
//   1 → HIPAAForm  step 1 (Signature)
//   2 → IntakeForm step 0 (Personal)
//   3 → IntakeForm step 1 (Location)
//   4 → IntakeForm step 2 (Contact)
//   5 → IntakeForm step 3 (Demographics)
//   6 → IntakeForm step 4 (Emergency)
//   7 → IntakeForm step 5 (Insurance)
//   8 → IntakeForm step 6 (Signature)
//   9 → Thank You
//
// Files needed in same folder:
//   HIPAAForm.js, hipaaSteps.js
//   IntakeForm.js, intakeSteps.js
//   CombinedImageMapper.js
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import Image from "next/image";

import HIPAAForm        from "./HIPAAForm";
import IntakeForm        from "./IntakeForm";
import CombinedImageMapper from "./CombinedImageMapper";

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_GLOBAL_STEPS = 10;   // steps 0..8 = form steps, step 9 = thank you
const THANKYOU_STEP      = 9;
const HIPAA_STEPS        = 2;    // global 0..1 belong to HIPAA
// global 2..8 belong to Intake (intake step = global - 2)

const SECTION_LABELS = [
  // HIPAA section
  { label: "Consent",   section: "HIPAA" },
  { label: "Signature", section: "HIPAA" },
  // Intake section
  { label: "Personal",     section: "Intake" },
  { label: "Location",     section: "Intake" },
  { label: "Contact",      section: "Intake" },
  { label: "Demographics", section: "Intake" },
  { label: "Emergency",    section: "Intake" },
  { label: "Insurance",    section: "Intake" },
  { label: "Signature",    section: "Intake" },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HIPAAIntakePage() {
  const [globalStep, setGlobalStep] = useState(0);
  const [answers,    setAnswers]    = useState({});

  // PDF state — we wait for both ImageMappers to fire before enabling download
  const [downloadFn,  setDownloadFn]  = useState(null);
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | sent | error
  const emailSentRef = useRef(false); // prevents double-send on re-render

  const onThankYou  = globalStep === THANKYOU_STEP;
  const inHIPAA     = globalStep < HIPAA_STEPS;
  const inIntake    = globalStep >= HIPAA_STEPS && !onThankYou;
  const hipaaStep   = inHIPAA ? globalStep : 0;
  const intakeStep  = inIntake ? globalStep - HIPAA_STEPS : 0;

  // ── Answers ─────────────────────────────────────────────────────────────────
  const handleChange = (key, value) =>
    setAnswers(prev => ({ ...prev, [key]: value }));

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (globalStep + 1 < TOTAL_GLOBAL_STEPS) {
      setGlobalStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setGlobalStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setAnswers({});
    setGlobalStep(0);
    setDownloadFn(null);
    emailSentRef.current = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── PDF merge — runs once when both mappers have fired ─────────────────────
  // Called by each mapper's onPdfReady. We intercept the blob URL via
  // createElement override and store the fn + blob url together.
  // Once both are ready, merge with pdf-lib.

  const handleDownload = () => {
    if (downloadFn) downloadFn();
  };

  // ── Progress ──────────────────────────────────────────────────────────────────
  const progressPct = onThankYou
    ? 100
    : Math.round((globalStep / (THANKYOU_STEP - 1)) * 100);

  const currentLabel = onThankYou
    ? "Complete"
    : SECTION_LABELS[globalStep]?.label || "";

  const currentSection = onThankYou
    ? ""
    : SECTION_LABELS[globalStep]?.section || "";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#fdf8f8 0%,#ffffff 50%,#fdf8f8 100%)" }}>

        {/* ── Sticky header ────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: "#7d4f50", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>

            {/* Logo + title */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div style={{ width: "40px", height: "40px", backgroundColor: "white", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", flexShrink: 0 }}>
                <Image src="/logo2.png" alt="Logo" width={72} height={36} style={{ objectFit: "contain" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: "white", fontWeight: 700, fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif", margin: 0, lineHeight: 1.2 }}>
                  Cambridge Psychiatry
                </p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif", margin: 0 }}>
                  {onThankYou ? "Forms Complete" : `${currentSection} — ${currentLabel}`}
                </p>
              </div>
            </div>

            {/* Step counter */}
            {!onThankYou && (
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Source Sans 3', sans-serif", flexShrink: 0 }}>
                Step {globalStep + 1} of {THANKYOU_STEP}
              </p>
            )}
          </div>

          {/* Progress bar */}
          {!onThankYou && (
            <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px 10px" }}>
              <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "linear-gradient(to right,#93c5fd,#6ee7b7)",
                  borderRadius: "999px",
                  transition: "width 0.5s ease-out",
                }} />
              </div>

              {/* Section divider labels */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", paddingRight: "2px" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Source Sans 3', sans-serif", color: globalStep < HIPAA_STEPS ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)" }}>
                  HIPAA
                </span>
                <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Source Sans 3', sans-serif", color: globalStep >= HIPAA_STEPS ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)" }}>
                  Intake
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "28px 16px" }}>

          {/* ── HIPAA form steps (global 0–1) ── */}
          {inHIPAA && (
            <HIPAAForm
              currentStep={hipaaStep}
              answers={answers}
              onChange={handleChange}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {/* ── Intake form steps (global 2–8) ── */}
          {inIntake && (
            <>
              <IntakeForm
                currentStep={intakeStep}
                answers={answers}
                onChange={handleChange}
                onNext={handleNext}
                onBack={handleBack}
              />
              <p style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", marginTop: "20px", lineHeight: 1.6, fontFamily: "'Source Sans 3', sans-serif" }}>
                Your information is kept confidential and used only for medical purposes.
                <br />
                <strong style={{ color: "#64748b" }}>Fields marked with * are required.</strong>
              </p>
            </>
          )}

          {/* ── Thank You ── */}
          {onThankYou && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 16px" }}>

              {/* Success icon */}
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#7d4f50", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: "0 8px 24px rgba(125,79,80,0.3)" }}>
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a", marginBottom: "8px", fontFamily: "'Lora', serif" }}>
                Forms Submitted
              </h1>
              <p style={{ fontSize: "15px", color: "#64748b", lineHeight: 1.6, maxWidth: "380px", marginBottom: "6px", fontFamily: "'Source Sans 3', sans-serif" }}>
                Thank you, <strong style={{ color: "#1e293b" }}>{answers.firstName || answers.printName} {answers.lastName || ""}</strong>.
              </p>
              <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "32px", fontFamily: "'Source Sans 3', sans-serif" }}>
                Your HIPAA consent and patient intake forms have been recorded.
              </p>

              {/* Forms included summary */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: "32px" }}>
                {[
                  { label: "HIPAA Consent",    icon: "🔒" },
                  { label: "Patient Intake",   icon: "📋" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "12px", backgroundColor: "white", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "18px" }}>{item.icon}</span>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", fontFamily: "'Source Sans 3', sans-serif" }}>{item.label}</span>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                ))}
              </div>

              {/* Download button */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "320px" }}>
                {downloadFn ? (
                  <button
                    onClick={handleDownload}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, border: "none", color: "white", backgroundColor: "#7d4f50", cursor: "pointer", boxShadow: "0 4px 14px rgba(125,79,80,0.35)", fontFamily: "'Source Sans 3', sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#6a4142"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#7d4f50"}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Combined PDF (2 pages)
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.8)", backgroundColor: "#7d4f50", opacity: 0.6, fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "combinedSpin 0.8s linear infinite" }} />
                    Preparing PDF…
                  </div>
                )}

                <button
                  onClick={handleReset}
                  style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, border: "2px solid #e2e8f0", color: "#475569", backgroundColor: "white", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}
                >
                  Start Over
                </button>

                {/* Email status */}
                {emailStatus === "sending" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px", color: "#64748b", fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div style={{ width: "12px", height: "12px", border: "2px solid #cbd5e1", borderTopColor: "#7d4f50", borderRadius: "50%", animation: "combinedSpin 0.8s linear infinite", flexShrink: 0 }} />
                    Sending forms to your email…
                  </div>
                )}
                {emailStatus === "sent" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "#16a34a", fontFamily: "'Source Sans 3', sans-serif" }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Forms emailed to {answers.email ? `you (${answers.email}) and ` : ""}our office
                  </div>
                )}
                {emailStatus === "error" && (
                  <div style={{ fontSize: "13px", color: "#dc2626", textAlign: "center", fontFamily: "'Source Sans 3', sans-serif" }}>
                    Email delivery failed — please download the PDF above.
                  </div>
                )}
              </div>

              {/* ── Combined PDF builder — single 2-page PDF ── */}
              <div
                aria-hidden="true"
                style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "1px", height: "1px", overflow: "hidden", pointerEvents: "none" }}
              >
                <CombinedImageMapper
                  answers={answers}
                  silentMode
                  onPdfReady={(fn, blob) => {
                    // fn      = download trigger (anchor click)
                    // blob    = raw PDF Blob passed directly from CombinedImageMapper
                    setDownloadFn(() => fn);

                    // Guard against double-fire from React re-renders
                    if (emailSentRef.current) return;
                    emailSentRef.current = true;

                    // Auto-download
                    fn();

                    // Auto-email: blob → base64 → POST /api/send-forms
                    setEmailStatus("sending");
                    const patientName = [answers.firstName || answers.printName, answers.lastName].filter(Boolean).join(" ");
                    const patientEmail = (answers.email || "").trim();
                    console.log("[hipaa-intake] Sending PDF email — patientEmail:", patientEmail, "patientName:", patientName);
                    blob.arrayBuffer()
                      .then(buf => {
                        // btoa on large buffers needs chunked approach to avoid stack overflow
                        const bytes = new Uint8Array(buf);
                        let binary = "";
                        const chunk = 8192;
                        for (let i = 0; i < bytes.length; i += chunk) {
                          binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
                        }
                        const base64 = btoa(binary);
                        return fetch("/api/send-forms", {
                          method:  "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            pdfBase64:    base64,
                            patientEmail: patientEmail,
                            patientName,
                            fileName:     "Cambridge-Psychiatry-HIPAA-and-Intake.pdf",
                          }),
                        });
                      })
                      .then(r => r.json())
                      .then(data => {
                        if (data.success) setEmailStatus("sent");
                        else { console.error("Email error:", data.error); setEmailStatus("error"); }
                      })
                      .catch(err => { console.error("Email send failed:", err); setEmailStatus("error"); });
                  }}
                />
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes combinedSpin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}