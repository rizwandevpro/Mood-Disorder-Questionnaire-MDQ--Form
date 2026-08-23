"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/patient-forms/page.js   →   route: /patient-forms
//
// Unified sequential flow through 6 forms:
//   Stage "info"  → Global Patient Info (name, phone, email, location)
//   Stage 0–5     → HIPAA+Intake, Health History, GAD-7, ASRS, PHQ-9, Brown
//   Stage "done"  → All PDFs merged → one download + one email
//
// KEY FIXES vs v1:
//   - Each form starts at step 1 (skips built-in "info" step 0)
//   - ImageMappers only mount AFTER form is done (prevents re-render lag)
//   - HIPAA+Intake uses correct globalStep logic from original page
//   - handleFormComplete uses useEffect to avoid calling setState during render
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

// ── Form components ───────────────────────────────────────────────────────────
import HIPAAForm           from "../hipaa-intake/HIPAAForm";
import IntakeForm          from "../hipaa-intake/IntakeForm";
import CombinedImageMapper from "../hipaa-intake/CombinedImageMapper";

import HealthHistoryForm        from "../health-history/HealthHistoryForm";
import HealthHistoryImageMapper from "../health-history/HealthHistoryImageMapper";
import { HH_THANKYOU_STEP }    from "../health-history/healthHistorySteps";

import GAD7Form        from "../gad7/GAD7Form";
import GAD7ImageMapper from "../gad7/GAD7ImageMapper";
import { THANKYOU_STEP as GAD7_THANKYOU } from "../gad7/gad7Steps";

import ASRSForm        from "../asrs/ASRSForm";
import ASRSImageMapper from "../asrs/ASRSImageMapper";
import { THANKYOU_STEP as ASRS_THANKYOU } from "../asrs/asrsSteps";

import PHQ9Form        from "../phq9/PHQ9Form";
import PHQ9ImageMapper from "../phq9/PHQ9ImageMapper";
import { THANKYOU_STEP as PHQ9_THANKYOU } from "../phq9/phq9Steps";

import BrownForm        from "../brown-scales/BrownForm";
import BrownImageMapper from "../brown-scales/BrownImageMapper";
import { THANKYOU_STEP as BROWN_THANKYOU } from "../brown-scales/brownSteps";

// ── Form sequence ─────────────────────────────────────────────────────────────
const FORMS = [
  { id: "hipaa-intake",   label: "HIPAA & Intake",   icon: "🔒" },
  { id: "health-history", label: "Health History",   icon: "🏥" },
  { id: "gad7",           label: "GAD-7 Anxiety",    icon: "🧠" },
  { id: "asrs",           label: "ASRS ADHD",        icon: "⚡" },
  { id: "phq9",           label: "PHQ-9 Depression", icon: "💙" },
  { id: "brown-scales",   label: "Brown Scales",     icon: "📋" },
];
const TOTAL_FORMS = FORMS.length;

// HIPAA+Intake internal step config (matches original hipaa-intake/page.js)
const HIPAA_STEPS              = 2;   // globalStep 0–1 = HIPAAForm
const HIPAA_INTAKE_THANKYOU    = 9;   // globalStep 9 = done

// ── Patient info step ─────────────────────────────────────────────────────────
function GlobalInfoStep({ info, onChange, onNext }) {
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
        {!required && <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: "11px", marginLeft: "6px", textTransform: "none" }}>(optional)</span>}
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
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      {/* Form list */}
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "14px", fontFamily: "'Source Sans 3', sans-serif" }}>
          You will complete {TOTAL_FORMS} forms in sequence
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {FORMS.map((f, i) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "16px" }}>{f.icon}</span>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#374151", margin: 0, fontFamily: "'Source Sans 3', sans-serif" }}>{i + 1}. {f.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info form */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', serif", marginBottom: "6px" }}>Before We Begin</h2>
        <p style={{ fontSize: "14px", color: "#64748b", fontFamily: "'Source Sans 3', sans-serif", lineHeight: 1.6, marginBottom: "24px" }}>
          Please provide your contact information. This will be shared across all 6 forms — you won't need to enter it again.
        </p>

        {field("fullName", "Full Name",    "text",  "e.g. Jane Smith",       true)}
        {field("phone",    "Phone Number", "tel",   "e.g. (555) 123-4567",   true)}
        {field("email",    "Email Address","email", "e.g. jane@example.com", false)}

        <div style={{ marginBottom: "24px" }}>
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
          style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, border: "none", color: "white", backgroundColor: "#7d4f50", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#6a4142"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#7d4f50"}
        >
          Begin Forms →
        </button>
      </div>
    </div>
  );
}

// ── Transition banner ─────────────────────────────────────────────────────────
function TransitionBanner({ completedIndex, nextForm }) {
  return (
    <div style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 0" }}>
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "40px 32px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#f0fdf4", border: "3px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', serif", marginBottom: "8px" }}>
          {FORMS[completedIndex].label} Complete
        </h2>
        <p style={{ fontSize: "14px", color: "#64748b", fontFamily: "'Source Sans 3', sans-serif", marginBottom: "24px" }}>
          Your PDF is being prepared in the background.
        </p>
        {nextForm && (
          <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Source Sans 3', sans-serif", marginBottom: "6px" }}>Next up</p>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", fontFamily: "'Source Sans 3', sans-serif", margin: 0 }}>
              {nextForm.icon} {nextForm.label}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Silent mapper wrapper — only mounts when form is done ─────────────────────
function SilentMapper({ formId, answers, info, onPdfReady }) {
  const hipaaIntakeAnswers = formId === "hipaa-intake" ? answers : null;

  return (
    <div aria-hidden="true" style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "1px", height: "1px", overflow: "hidden", pointerEvents: "none" }}>
      {formId === "hipaa-intake" && (
        <CombinedImageMapper answers={hipaaIntakeAnswers} silentMode onPdfReady={onPdfReady} />
      )}
      {formId === "health-history" && (
        <HealthHistoryImageMapper answers={{ ...answers, hhName: answers.hhName || info.fullName }} silentMode onPdfReady={onPdfReady} />
      )}
      {formId === "gad7" && (
        <GAD7ImageMapper answers={answers} silentMode onPdfReady={onPdfReady} />
      )}
      {formId === "asrs" && (
        <ASRSImageMapper answers={answers} silentMode onPdfReady={onPdfReady} />
      )}
      {formId === "phq9" && (
        <PHQ9ImageMapper answers={answers} silentMode onPdfReady={onPdfReady} />
      )}
      {formId === "brown-scales" && (
        <BrownImageMapper answers={answers} silentMode onPdfReady={onPdfReady} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PatientFormsPage() {
  const [stage,        setStage]        = useState("info");
  const [info,         setInfo]         = useState({ fullName: "", phone: "", email: "", location: "" });
  const infoRef = useRef({ fullName: "", phone: "", email: "", location: "" }); // always fresh
  const [showTransition, setShowTransition] = useState(false);
  const [transitionIdx,  setTransitionIdx]  = useState(null);

  // Per-form answers
  const [formAnswers, setFormAnswers] = useState({
    "hipaa-intake":   {},
    "health-history": {},
    "gad7":           {},
    "asrs":           {},
    "phq9":           {},
    "brown-scales":   {},
  });

  // Per-form internal step — starts at 1 to skip built-in info step
  // EXCEPTION: hipaa-intake uses its own globalStep starting at 0
  const [formSteps, setFormSteps] = useState({
    "hipaa-intake":   0,  // uses its own step system
    "health-history": 0,  // no built-in info step
    "gad7":           1,  // skip built-in info step 0
    "asrs":           1,
    "phq9":           1,
    "brown-scales":   1,
  });

  // Which forms have completed (to mount their mappers)
  const [completedForms, setCompletedForms] = useState([]);

  // Pending form to complete (set during render, processed via useEffect)
  const pendingComplete = useRef(null);

  // PDF blobs
  const blobsRef     = useRef({});
  const emailSentRef = useRef(false);

  // Final state
  const [mergedUrl,   setMergedUrl]   = useState(null);
  const [emailStatus, setEmailStatus] = useState("idle");

  // ── Info handler ──────────────────────────────────────────────────────────
  const handleInfoChange = (key, value) => {
    setInfo(prev => {
      const next = { ...prev, [key]: value };
      infoRef.current = next;
      return next;
    });
  };

  // ── Answer handler ────────────────────────────────────────────────────────
  const handleChange = useCallback((formId, key, value) => {
    setFormAnswers(prev => ({ ...prev, [formId]: { ...prev[formId], [key]: value } }));
  }, []);

  // ── Step navigation ───────────────────────────────────────────────────────
  const handleNext = useCallback((formId) => {
    setFormSteps(prev => ({ ...prev, [formId]: prev[formId] + 1 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBack = useCallback((formId) => {
    // Don't go below 1 for forms with skipped info step
    const minStep = formId === "hipaa-intake" || formId === "health-history" ? 0 : 1;
    setFormSteps(prev => ({ ...prev, [formId]: Math.max(prev[formId] - 1, minStep) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ── Form completion — queue via ref, process in useEffect ────────────────
  // This avoids calling setState during render
  const scheduleComplete = useCallback((formIndex) => {
    if (pendingComplete.current === null) {
      pendingComplete.current = formIndex;
    }
  }, []);

  useEffect(() => {
    if (pendingComplete.current === null) return;
    const idx = pendingComplete.current;
    pendingComplete.current = null;

    // Mark form as completed (mounts its mapper)
    setCompletedForms(prev => prev.includes(idx) ? prev : [...prev, idx]);
    setShowTransition(true);
    setTransitionIdx(idx);

    setTimeout(() => {
      setShowTransition(false);
      setTransitionIdx(null);
      setStage(idx + 1 < TOTAL_FORMS ? idx + 1 : "done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 2500);
  });

  // ── Merge + send ──────────────────────────────────────────────────────────
  const mergeAndSend = async () => {
    setEmailStatus("sending");
    const currentInfo = infoRef.current;

    try {
      const toBase64 = (blob) => new Promise(resolve => {
        const r = new FileReader();
        r.onload = () => resolve(r.result.split(",")[1]);
        r.readAsDataURL(blob);
      });

      const formOrder = ["hipaa-intake", "health-history", "gad7", "asrs", "phq9", "brown-scales"];
      const formNames = {
        "hipaa-intake":   "HIPAA Consent & Patient Intake",
        "health-history": "Patient Health History",
        "gad7":           "GAD-7 Anxiety Screener",
        "asrs":           "ADHD Self-Report Scale (ASRS)",
        "phq9":           "Patient Health Questionnaire (PHQ-9)",
        "brown-scales":   "Brown Executive Function/Attention Scales",
      };

      const name = currentInfo.fullName || "Patient";

      // ── Step 1: Merge PDFs client-side using pdf-lib ──────────────────────
      const { PDFDocument } = await import("pdf-lib");
      const mergedPdf = await PDFDocument.create();

      for (const id of formOrder) {
        try {
          const blob      = blobsRef.current[id];
          const arrayBuf  = await blob.arrayBuffer();
          const srcPdf    = await PDFDocument.load(arrayBuf);
          const pageCount = srcPdf.getPageCount();
          const pages     = await mergedPdf.copyPages(srcPdf, Array.from({ length: pageCount }, (_, i) => i));
          pages.forEach(p => mergedPdf.addPage(p));
        } catch (err) {
          console.error(`[unified] failed to merge ${id}:`, err);
        }
      }

      const mergedBytes = await mergedPdf.save();
      const merged      = new Blob([mergedBytes], { type: "application/pdf" });
      setMergedUrl(URL.createObjectURL(merged));
      console.log("[unified] merged PDF ready for download");

      // ── Step 2: Send email via API (non-blocking for download) ────────────
      const attachments = await Promise.all(
        formOrder.map(async id => ({
          formName: formNames[id],
          base64:   await toBase64(blobsRef.current[id]),
          fileName: `${name.replace(/\s+/g, "_")}_${id}.pdf`,
        }))
      );

      const res = await fetch("/api/merge-pdf", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments,
          patientName:    name,
          patientEmail:   currentInfo.email?.trim() || "",
          patientPhone:   currentInfo.phone || "",
          clinicLocation: currentInfo.location || "",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailStatus("sent");
      } else {
        console.error("Email error:", data.error);
        setEmailStatus("error");
      }
    } catch (err) {
      console.error("mergeAndSend failed:", err);
      setEmailStatus("error");
    }
  };

  // ── PDF blob ready ────────────────────────────────────────────────────────
  const handlePdfReady = useCallback((formId, fn, blob) => {
    if (blobsRef.current[formId]) return;
    blobsRef.current[formId] = blob;

    const collected = Object.keys(blobsRef.current).length;
    console.log(`[unified] blob collected: ${formId} (${collected}/${TOTAL_FORMS})`);

    if (collected === TOTAL_FORMS && !emailSentRef.current) {
      emailSentRef.current = true;
      console.log("[unified] all blobs collected — merging and sending");
      mergeAndSend();
    }
  }, []);

  const handleDownload = () => {
    if (!mergedUrl) return;
    const a = document.createElement("a");
    a.href = mergedUrl;
    a.download = `${(info.fullName || "Patient").replace(/\s+/g, "_")}_Cambridge_Psychiatry_Forms.pdf`;
    a.click();
  };

  const handleReset = () => {
    setStage("info");
    setInfo({ fullName: "", phone: "", email: "", location: "" });
    setFormAnswers({ "hipaa-intake": {}, "health-history": {}, "gad7": {}, "asrs": {}, "phq9": {}, "brown-scales": {} });
    setFormSteps({ "hipaa-intake": 0, "health-history": 0, "gad7": 1, "asrs": 1, "phq9": 1, "brown-scales": 1 });
    setCompletedForms([]);
    blobsRef.current = {};
    emailSentRef.current = false;
    pendingComplete.current = null;
    setMergedUrl(null);
    setEmailStatus("idle");
    setShowTransition(false);
    setTransitionIdx(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentFormIndex = typeof stage === "number" ? stage : null;
  const formsDone        = typeof stage === "number" ? stage : stage === "done" ? TOTAL_FORMS : 0;

  // HIPAA+Intake step state
  const hiStep     = formSteps["hipaa-intake"];
  const inHIPAA    = hiStep < HIPAA_STEPS;
  const inIntake   = hiStep >= HIPAA_STEPS && hiStep < HIPAA_INTAKE_THANKYOU;
  const hipaaStep  = inHIPAA  ? hiStep : 0;
  const intakeStep = inIntake ? hiStep - HIPAA_STEPS : 0;

  // Pre-fill HIPAA+Intake from global info
  const hipaaIntakeAnswers = {
    ...formAnswers["hipaa-intake"],
    firstName:      formAnswers["hipaa-intake"].firstName      || info.fullName?.split(" ")[0] || "",
    lastName:       formAnswers["hipaa-intake"].lastName       || info.fullName?.split(" ").slice(1).join(" ") || "",
    cellPhone:      formAnswers["hipaa-intake"].cellPhone      || info.phone || "",
    email:          formAnswers["hipaa-intake"].email          || info.email || "",
    clinicLocation: formAnswers["hipaa-intake"].clinicLocation || info.location || "",
  };

  const headerLabel = stage === "info" ? "Patient Information"
    : stage === "done"                 ? "All Forms Complete"
    : showTransition && transitionIdx !== null ? `${FORMS[transitionIdx]?.label} Complete`
    : currentFormIndex !== null        ? `Form ${currentFormIndex + 1} of ${TOTAL_FORMS} — ${FORMS[currentFormIndex].label}`
    : "";

  // ── Check if current form reached its thank-you step ─────────────────────
  // Called during render — queues completion via ref to avoid setState-in-render
  const checkAndSchedule = (formId, formIndex, step, thankyouStep) => {
    if (step >= thankyouStep) {
      scheduleComplete(formIndex);
      return true; // form is done
    }
    return false;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#fdf8f8 0%,#ffffff 50%,#fdf8f8 100%)" }}>

        {/* ── Header ── */}
        <div style={{ backgroundColor: "#7d4f50", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div style={{ width: "40px", height: "40px", backgroundColor: "white", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", flexShrink: 0 }}>
                <Image src="/logo2.png" alt="Logo" width={72} height={36} style={{ objectFit: "contain" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: "white", fontWeight: 700, fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif", margin: 0, lineHeight: 1.2 }}>Cambridge Psychiatry</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{headerLabel}</p>
              </div>
            </div>
            {stage !== "info" && (
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                {FORMS.map((f, i) => (
                  <div key={f.id} title={f.label} style={{
                    width: "8px", height: "8px", borderRadius: "50%", transition: "background-color 0.3s",
                    backgroundColor: i < formsDone ? "#6ee7b7" : i === currentFormIndex ? "white" : "rgba(255,255,255,0.25)",
                  }} />
                ))}
              </div>
            )}
          </div>
          {stage !== "info" && stage !== "done" && (
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 16px 8px" }}>
              <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(formsDone / TOTAL_FORMS) * 100}%`, background: "linear-gradient(to right,#93c5fd,#6ee7b7)", borderRadius: "999px", transition: "width 0.5s ease-out" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "28px 16px" }}>

          {/* Global info */}
          {stage === "info" && (
            <GlobalInfoStep info={info} onChange={handleInfoChange} onNext={() => { setStage(0); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          )}

          {/* Transition banner */}
          {showTransition && transitionIdx !== null && (
            <TransitionBanner completedIndex={transitionIdx} nextForm={transitionIdx + 1 < TOTAL_FORMS ? FORMS[transitionIdx + 1] : null} />
          )}

          {/* ── FORM 0: HIPAA + Intake ── */}
          {stage === 0 && !showTransition && (() => {
            if (hiStep === HIPAA_INTAKE_THANKYOU) {
              scheduleComplete(0);
              return null;
            }
            return (
              <>
                {inHIPAA && (
                  <HIPAAForm
                    currentStep={hipaaStep}
                    answers={hipaaIntakeAnswers}
                    onChange={(k, v) => handleChange("hipaa-intake", k, v)}
                    onNext={() => handleNext("hipaa-intake")}
                    onBack={() => handleBack("hipaa-intake")}
                  />
                )}
                {inIntake && (
                  <IntakeForm
                    currentStep={intakeStep}
                    answers={hipaaIntakeAnswers}
                    onChange={(k, v) => handleChange("hipaa-intake", k, v)}
                    onNext={() => handleNext("hipaa-intake")}
                    onBack={() => handleBack("hipaa-intake")}
                  />
                )}
              </>
            );
          })()}

          {/* ── FORM 1: Health History ── */}
          {stage === 1 && !showTransition && (() => {
            const step = formSteps["health-history"];
            if (checkAndSchedule("health-history", 1, step, HH_THANKYOU_STEP)) return null;
            return (
              <HealthHistoryForm
                currentStep={step}
                answers={formAnswers["health-history"]}
                onChange={(k, v) => handleChange("health-history", k, v)}
                onNext={() => handleNext("health-history")}
                onBack={() => handleBack("health-history")}
              />
            );
          })()}

          {/* ── FORM 2: GAD-7 ── */}
          {stage === 2 && !showTransition && (() => {
            const step = formSteps["gad7"];
            if (checkAndSchedule("gad7", 2, step, GAD7_THANKYOU)) return null;
            return (
              <GAD7Form
                currentStep={step}
                answers={formAnswers["gad7"]}
                onChange={(k, v) => handleChange("gad7", k, v)}
                onNext={() => handleNext("gad7")}
                onBack={() => handleBack("gad7")}
              />
            );
          })()}

          {/* ── FORM 3: ASRS ── */}
          {stage === 3 && !showTransition && (() => {
            const step = formSteps["asrs"];
            if (checkAndSchedule("asrs", 3, step, ASRS_THANKYOU)) return null;
            return (
              <ASRSForm
                currentStep={step}
                answers={formAnswers["asrs"]}
                onChange={(k, v) => handleChange("asrs", k, v)}
                onNext={() => handleNext("asrs")}
                onBack={() => handleBack("asrs")}
              />
            );
          })()}

          {/* ── FORM 4: PHQ-9 ── */}
          {stage === 4 && !showTransition && (() => {
            const step = formSteps["phq9"];
            if (checkAndSchedule("phq9", 4, step, PHQ9_THANKYOU)) return null;
            return (
              <PHQ9Form
                currentStep={step}
                answers={formAnswers["phq9"]}
                onChange={(k, v) => handleChange("phq9", k, v)}
                onNext={() => handleNext("phq9")}
                onBack={() => handleBack("phq9")}
              />
            );
          })()}

          {/* ── FORM 5: Brown Scales ── */}
          {stage === 5 && !showTransition && (() => {
            const step = formSteps["brown-scales"];
            if (checkAndSchedule("brown-scales", 5, step, BROWN_THANKYOU)) return null;
            return (
              <BrownForm
                currentStep={step}
                answers={formAnswers["brown-scales"]}
                onChange={(k, v) => handleChange("brown-scales", k, v)}
                onNext={() => handleNext("brown-scales")}
                onBack={() => handleBack("brown-scales")}
              />
            );
          })()}

          {/* ── Silent mappers — mount only when form is completed ── */}
          {completedForms.map(idx => {
            const formId = FORMS[idx].id;
            const answers = formId === "hipaa-intake" ? hipaaIntakeAnswers : formAnswers[formId];
            if (blobsRef.current[formId]) return null; // already got blob
            return (
              <SilentMapper
                key={formId}
                formId={formId}
                answers={answers}
                info={info}
                onPdfReady={(fn, blob) => handlePdfReady(formId, fn, blob)}
              />
            );
          })}

          {/* ── Final screen ── */}
          {stage === "done" && !showTransition && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 16px" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#7d4f50", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: "0 8px 24px rgba(125,79,80,0.3)" }}>
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', serif", marginBottom: "8px" }}>All Forms Complete!</h1>
              <p style={{ fontSize: "15px", color: "#64748b", maxWidth: "400px", lineHeight: 1.6, marginBottom: "6px", fontFamily: "'Source Sans 3', sans-serif" }}>
                Thank you, <strong style={{ color: "#1e293b" }}>{info.fullName}</strong>. All 6 forms have been submitted to Cambridge Psychiatry.
              </p>
              <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "28px", fontFamily: "'Source Sans 3', sans-serif" }}>
                Can't find the email? Please check your spam or junk folder.
              </p>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "32px", maxWidth: "500px" }}>
                {FORMS.map(f => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", backgroundColor: "white", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "14px" }}>{f.icon}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", fontFamily: "'Source Sans 3', sans-serif" }}>{f.label}</span>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px" }}>
                {mergedUrl ? (
                  <button
                    onClick={handleDownload}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, border: "none", color: "white", backgroundColor: "#7d4f50", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#6a4142"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#7d4f50"}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download All Forms (PDF)
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.8)", backgroundColor: "#7d4f50", opacity: 0.6, fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "uSpin 0.8s linear infinite" }} />
                    Preparing PDF…
                  </div>
                )}

                {emailStatus === "sending" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px", color: "#64748b", fontFamily: "'Source Sans 3', sans-serif" }}>
                    <div style={{ width: "12px", height: "12px", border: "2px solid #cbd5e1", borderTopColor: "#7d4f50", borderRadius: "50%", animation: "uSpin 0.8s linear infinite" }} />
                    Sending forms to our office…
                  </div>
                )}
                {emailStatus === "sent" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "#16a34a", fontFamily: "'Source Sans 3', sans-serif" }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {info.email ? `Emailed to ${info.email} and our office` : "Emailed to our office"}
                  </div>
                )}
                {emailStatus === "error" && (
                  <p style={{ fontSize: "13px", color: "#dc2626", fontFamily: "'Source Sans 3', sans-serif" }}>
                    Email delivery failed — please download the PDF above.
                  </p>
                )}

                <button
                  onClick={handleReset}
                  style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, border: "2px solid #e2e8f0", color: "#475569", backgroundColor: "white", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes uSpin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}