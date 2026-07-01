"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/quick-consent/page.js   →   route: /quick-consent   (TODO: rename folder/route as you like)
//
// Single-page consent form: consent text + email → print name + signature +
// date → PDF generated from the background image → emailed to the patient
// AND the clinic via the existing /api/send-forms endpoint.
//
// Files needed in the same folder:
//   QuickConsentForm.js, quickConsentSteps.js, QuickConsentImageMapper.js
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import Image from "next/image";

import QuickConsentForm        from "./QuickConsentForm";
import QuickConsentImageMapper from "./QuickConsentImageMapper";
import { TOTAL_STEPS, THANKYOU_STEP, FORM_TITLE } from "./quickConsentSteps";

export default function QuickConsentPage() {
  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState({});

  const [downloadFn,  setDownloadFn]  = useState(null);
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | sent | error
  const emailSentRef = useRef(false); // prevents double-send on re-render

  const onThankYou = step === THANKYOU_STEP;

  const handleChange = (key, value) =>
    setAnswers(prev => ({ ...prev, [key]: value }));

  const handleNext = () => {
    if (step + 1 < TOTAL_STEPS) {
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setAnswers({});
    setStep(0);
    setDownloadFn(null);
    setEmailStatus("idle");
    emailSentRef.current = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownload = () => {
    if (downloadFn) downloadFn();
  };

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
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div style={{ width: "40px", height: "40px", backgroundColor: "white", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", flexShrink: 0 }}>
                <Image src="/logo2.png" alt="Logo" width={72} height={36} style={{ objectFit: "contain" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: "white", fontWeight: 700, fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif", margin: 0, lineHeight: 1.2 }}>
                  Cambridge Psychiatry
                </p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif", margin: 0 }}>
                  {onThankYou ? "Complete" : FORM_TITLE}
                </p>
              </div>
            </div>
            {!onThankYou && (
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Source Sans 3', sans-serif", flexShrink: 0 }}>
                Step {step + 1} of {THANKYOU_STEP}
              </p>
            )}
          </div>
        </div>

        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 16px 60px" }}>
          {!onThankYou ? (
            <QuickConsentForm
              currentStep={step}
              answers={answers}
              onChange={handleChange}
              onNext={handleNext}
              onBack={handleBack}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 20px" }}>

              <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>

              <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a", marginBottom: "8px", fontFamily: "'Lora', serif" }}>
                Form Submitted
              </h1>
              <p style={{ fontSize: "15px", color: "#64748b", lineHeight: 1.6, maxWidth: "380px", marginBottom: "6px", fontFamily: "'Source Sans 3', sans-serif" }}>
                Thank you, <strong style={{ color: "#1e293b" }}>{answers.patientInitials}</strong>.
              </p>
              <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "32px", fontFamily: "'Source Sans 3', sans-serif" }}>
                Your signed form has been recorded.
              </p>
              <p className="text-slate-500 text-base leading-relaxed max-w-sm mb-8" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Can't find this email? Please check your spam or junk folder.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "320px" }}>
                {downloadFn ? (
                  <button
                    onClick={handleDownload}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, border: "none", color: "white", backgroundColor: "#7d4f50", cursor: "pointer", boxShadow: "0 4px 14px rgba(125,79,80,0.35)", fontFamily: "'Source Sans 3', sans-serif" }}
                  >
                    Download PDF
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.8)", backgroundColor: "#7d4f50", opacity: 0.6, fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "qcSpin 0.8s linear infinite" }} />
                    Preparing PDF…
                  </div>
                )}

                <button
                  onClick={handleReset}
                  style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, border: "2px solid #e2e8f0", color: "#475569", backgroundColor: "white", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif" }}
                >
                  Start Over
                </button>

                {emailStatus === "sending" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px", color: "#64748b", fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div style={{ width: "12px", height: "12px", border: "2px solid #cbd5e1", borderTopColor: "#7d4f50", borderRadius: "50%", animation: "qcSpin 0.8s linear infinite", flexShrink: 0 }} />
                    Sending forms to your email…
                  </div>
                )}
                {emailStatus === "sent" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "#16a34a", fontFamily: "'Source Sans 3', sans-serif" }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Form emailed to {answers.email ? `you (${answers.email}) and ` : ""}our office
                  </div>
                )}
                {emailStatus === "error" && (
                  <div style={{ fontSize: "13px", color: "#dc2626", textAlign: "center", fontFamily: "'Source Sans 3', sans-serif" }}>
                    Email delivery failed — please download the PDF above.
                  </div>
                )}
              </div>

              {/* ── Off-screen PDF builder ── */}
              <div aria-hidden="true" style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "1px", height: "1px", overflow: "hidden", pointerEvents: "none" }}>
                <QuickConsentImageMapper
                  answers={answers}
                  silentMode
                  onPdfReady={(fn, blob) => {
                    setDownloadFn(() => fn);

                    // Guard against double-fire from React re-renders
                    if (emailSentRef.current) return;
                    emailSentRef.current = true;

                    // Auto-download
                    fn();

                    // Auto-email: blob → base64 → POST /api/send-forms
                    setEmailStatus("sending");
                    const patientName  = answers.patientInitials || "";
                    const patientEmail = (answers.email || "").trim();

                    blob.arrayBuffer()
                      .then(buf => {
                        const bytes = new Uint8Array(buf);
                        let binary = "";
                        const chunk = 8192;
                        for (let i = 0; i < bytes.length; i += chunk) {
                          binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
                        }
                        const base64 = btoa(binary);
                        return fetch("/api/send-forms", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            pdfBase64:    base64,
                            patientEmail: patientEmail,
                            patientName,
                            fileName:     "Cancellation-No-Show-Policy.pdf",
                            formName:     FORM_TITLE,
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

      <style>{`@keyframes qcSpin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}
