"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/patient-forms/page.js   →   route: /patient-forms
//
// Unified sequential flow through 8 forms:
//   Stage "info"  → Global Patient Info (GlobalInfoStep.js), prefilled into
//                   every form via prefill.js
//   Stage 0–7     → HIPAA+Intake, Health History, GAD-7, ASRS, PHQ-9, Brown,
//                   MDQ, Cancellation & No-Show Policy  (order = FORMS array)
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

import GlobalInfoStep from "./GlobalInfoStep";
import { INITIAL_INFO, buildFullName, withPrefill } from "./prefill";

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

import MDQForm        from "../mdq-form/MDQForm";
import MDQImageMapper from "../mdq-form/MDQImageMapper";
import { THANKYOU_STEP as MDQ_THANKYOU } from "../mdq-form/mdqSteps";

import QuickConsentForm        from "../cancellation-no-show-policy/QuickConsentForm";
import QuickConsentImageMapper from "../cancellation-no-show-policy/QuickConsentImageMapper";
import { THANKYOU_STEP as CANCELLATION_THANKYOU } from "../cancellation-no-show-policy/quickConsentSteps";

// ── Form sequence ─────────────────────────────────────────────────────────────
const FORMS = [
  { id: "hipaa-intake",   label: "HIPAA & Intake",   icon: "🔒" },
  { id: "health-history", label: "Health History",   icon: "🏥" },
  { id: "gad7",           label: "GAD-7 Anxiety",    icon: "🧠" },
  { id: "asrs",           label: "ASRS ADHD",        icon: "⚡" },
  { id: "phq9",           label: "PHQ-9 Depression", icon: "💙" },
  { id: "brown-scales",   label: "Brown Scales",     icon: "📋" },
  { id: "mdq",            label: "MDQ Mood",         icon: "🌗" },
  { id: "cancellation",   label: "Cancellation Policy", icon: "📅" },
];
const TOTAL_FORMS = FORMS.length;
// Stage index of each form — derived from FORMS order, never hard-coded.
const IDX = Object.fromEntries(FORMS.map((f, i) => [f.id, i]));

// Single source of truth for merge order + names used in the email.
const FORM_NAMES = {
  "hipaa-intake":   "HIPAA Consent & Patient Intake",
  "health-history": "Patient Health History",
  "gad7":           "GAD-7 Anxiety Screener",
  "asrs":           "ADHD Self-Report Scale (ASRS)",
  "phq9":           "Patient Health Questionnaire (PHQ-9)",
  "brown-scales":   "Brown Executive Function/Attention Scales",
  "mdq":            "Mood Disorder Questionnaire (MDQ)",
  "cancellation":   "Cancellation & No-Show Policy",
};

// Initial per-form answers / steps (used on mount AND on reset).
// Step 0 is skipped for forms whose step 0 is a built-in "info" step.
// Cancellation starts at 0: its step 0 is the policy text itself, not an info step.
const initialAnswers = () => Object.fromEntries(FORMS.map(f => [f.id, {}]));
const INITIAL_STEPS = {
  "hipaa-intake":   0,  // uses its own step system
  "health-history": 0,  // no built-in info step
  "gad7":           1,  // skip built-in info step 0
  "asrs":           1,
  "phq9":           1,
  "brown-scales":   1,
  "mdq":            1,  // skip built-in info step 0 (prefilled)
  "cancellation":   0,  // step 0 = policy text — must be shown
};
const MIN_STEP = (formId) => INITIAL_STEPS[formId];

// HIPAA+Intake internal step config (matches original hipaa-intake/page.js)
const HIPAA_STEPS              = 2;   // globalStep 0–1 = HIPAAForm
const HIPAA_INTAKE_THANKYOU    = 9;   // globalStep 9 = done

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
      {formId === "mdq" && (
        <MDQImageMapper answers={answers} silentMode skipEmail onPdfReady={onPdfReady} />
      )}
      {formId === "cancellation" && (
        <QuickConsentImageMapper answers={answers} silentMode onPdfReady={onPdfReady} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PatientFormsPage() {
  const [stage,        setStage]        = useState("info");
  const [info,         setInfo]         = useState(INITIAL_INFO);
  const infoRef = useRef(INITIAL_INFO); // always fresh
  const [showTransition, setShowTransition] = useState(false);
  const [transitionIdx,  setTransitionIdx]  = useState(null);

  // Per-form answers
  const [formAnswers, setFormAnswers] = useState(initialAnswers);

  // Per-form internal step (see INITIAL_STEPS for why some start at 1)
  const [formSteps, setFormSteps] = useState(INITIAL_STEPS);

  // Which forms have completed (to mount their mappers)
  const [completedForms, setCompletedForms] = useState([]);

  // Pending form to complete (set during render, processed via useEffect)
  const pendingComplete = useRef(null);

  // PDF blobs
  const blobsRef     = useRef({});
  const emailSentRef = useRef(false);
  const cancellationEmailRef = useRef(""); // fresh value for async mergeAndSend
  const prefillCache = useRef({});

  // Final state
  const [mergedUrl,   setMergedUrl]   = useState(null);
  const [emailStatus, setEmailStatus] = useState("idle");

  // ── Info handler ──────────────────────────────────────────────────────────
  const handleInfoChange = (key, value) => {
    setInfo(prev => {
      const next = { ...prev, [key]: value };
      next.fullName = buildFullName(next);
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
    // Don't go below the form's starting step (skipped info steps stay skipped)
    setFormSteps(prev => ({ ...prev, [formId]: Math.max(prev[formId] - 1, MIN_STEP(formId)) }));
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

      const formOrder = FORMS.map(f => f.id);
      const formNames = FORM_NAMES;

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
          // Global email first; fall back to the email typed on the Cancellation
          // Policy step (that step requires one and promises a copy to it).
          patientEmail:   currentInfo.email?.trim() || cancellationEmailRef.current || "",
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
    setInfo(INITIAL_INFO);
    infoRef.current = INITIAL_INFO;
    prefillCache.current = {};
    setFormAnswers(initialAnswers());
    setFormSteps(INITIAL_STEPS);
    cancellationEmailRef.current = "";
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

  // ── Prefilled answers per form (global info → each form's own keys) ──
  // Cached per form so object identity only changes when that form's own
  // answers or the global info change. Mappers with [answers] deps then
  // don't re-render their PDF on every keystroke in a later form.
  const getAnswers = (formId) => {
    const own = formAnswers[formId];
    const c   = prefillCache.current[formId];
    if (c && c.own === own && c.info === info) return c.result;
    const result = withPrefill(formId, own, info);
    prefillCache.current[formId] = { own, info, result };
    return result;
  };
  const hipaaIntakeAnswers  = getAnswers("hipaa-intake");
  const cancellationAnswers = getAnswers("cancellation");
  cancellationEmailRef.current = (cancellationAnswers.email || "").trim();

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
            <GlobalInfoStep forms={FORMS} info={info} onChange={handleInfoChange} onNext={() => { setStage(0); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          )}

          {/* Transition banner */}
          {showTransition && transitionIdx !== null && (
            <TransitionBanner completedIndex={transitionIdx} nextForm={transitionIdx + 1 < TOTAL_FORMS ? FORMS[transitionIdx + 1] : null} />
          )}

          {/* ── HIPAA + Intake ── */}
          {stage === IDX["hipaa-intake"] && !showTransition && (() => {
            if (hiStep === HIPAA_INTAKE_THANKYOU) {
              scheduleComplete(IDX["hipaa-intake"]);
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

          {/* ── Health History ── */}
          {stage === IDX["health-history"] && !showTransition && (() => {
            const step = formSteps["health-history"];
            if (checkAndSchedule("health-history", IDX["health-history"], step, HH_THANKYOU_STEP)) return null;
            return (
              <HealthHistoryForm
                currentStep={step}
                answers={getAnswers("health-history")}
                onChange={(k, v) => handleChange("health-history", k, v)}
                onNext={() => handleNext("health-history")}
                onBack={() => handleBack("health-history")}
              />
            );
          })()}

          {/* ── GAD-7 ── */}
          {stage === IDX["gad7"] && !showTransition && (() => {
            const step = formSteps["gad7"];
            if (checkAndSchedule("gad7", IDX["gad7"], step, GAD7_THANKYOU)) return null;
            return (
              <GAD7Form
                currentStep={step}
                answers={getAnswers("gad7")}
                onChange={(k, v) => handleChange("gad7", k, v)}
                onNext={() => handleNext("gad7")}
                onBack={() => handleBack("gad7")}
              />
            );
          })()}

          {/* ── ASRS ── */}
          {stage === IDX["asrs"] && !showTransition && (() => {
            const step = formSteps["asrs"];
            if (checkAndSchedule("asrs", IDX["asrs"], step, ASRS_THANKYOU)) return null;
            return (
              <ASRSForm
                currentStep={step}
                answers={getAnswers("asrs")}
                onChange={(k, v) => handleChange("asrs", k, v)}
                onNext={() => handleNext("asrs")}
                onBack={() => handleBack("asrs")}
              />
            );
          })()}

          {/* ── PHQ-9 ── */}
          {stage === IDX["phq9"] && !showTransition && (() => {
            const step = formSteps["phq9"];
            if (checkAndSchedule("phq9", IDX["phq9"], step, PHQ9_THANKYOU)) return null;
            return (
              <PHQ9Form
                currentStep={step}
                answers={getAnswers("phq9")}
                onChange={(k, v) => handleChange("phq9", k, v)}
                onNext={() => handleNext("phq9")}
                onBack={() => handleBack("phq9")}
              />
            );
          })()}

          {/* ── Brown Scales ── */}
          {stage === IDX["brown-scales"] && !showTransition && (() => {
            const step = formSteps["brown-scales"];
            if (checkAndSchedule("brown-scales", IDX["brown-scales"], step, BROWN_THANKYOU)) return null;
            return (
              <BrownForm
                currentStep={step}
                answers={getAnswers("brown-scales")}
                onChange={(k, v) => handleChange("brown-scales", k, v)}
                onNext={() => handleNext("brown-scales")}
                onBack={() => handleBack("brown-scales")}
              />
            );
          })()}

          {/* ── MDQ — Mood Disorder Questionnaire ── */}
          {stage === IDX["mdq"] && !showTransition && (() => {
            const step = formSteps["mdq"];
            if (checkAndSchedule("mdq", IDX["mdq"], step, MDQ_THANKYOU)) return null;
            return (
              <MDQForm
                currentStep={step}
                answers={getAnswers("mdq")}
                onChange={(k, v) => handleChange("mdq", k, v)}
                onNext={() => handleNext("mdq")}
                onBack={() => handleBack("mdq")}
              />
            );
          })()}

          {/* ── Cancellation & No-Show Policy ── */}
          {stage === IDX["cancellation"] && !showTransition && (() => {
            const step = formSteps["cancellation"];
            if (checkAndSchedule("cancellation", IDX["cancellation"], step, CANCELLATION_THANKYOU)) return null;
            return (
              <QuickConsentForm
                currentStep={step}
                answers={cancellationAnswers}
                onChange={(k, v) => handleChange("cancellation", k, v)}
                onNext={() => handleNext("cancellation")}
                onBack={() => handleBack("cancellation")}
              />
            );
          })()}

          {/* ── Silent mappers — mount only when form is completed ── */}
          {completedForms.map(idx => {
            const formId = FORMS[idx].id;
            const answers = getAnswers(formId);
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
                Thank you, <strong style={{ color: "#1e293b" }}>{info.fullName}</strong>. All {TOTAL_FORMS} forms have been submitted to Cambridge Psychiatry.
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
                    {(info.email?.trim() || cancellationAnswers.email?.trim()) ? `Emailed to ${info.email?.trim() || cancellationAnswers.email.trim()} and our office` : "Emailed to our office"}
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