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
import "./theme.css";
import { INITIAL_INFO, buildFullName, withPrefill, todayISO } from "./prefill";
import { preloadFormAssets } from "./preload";
import { saveProgress, loadProgress, clearProgress } from "./progressStore";

// ── Form components ───────────────────────────────────────────────────────────
import HIPAAForm           from "../hipaa-intake/HIPAAForm";
import IntakeForm          from "../hipaa-intake/IntakeForm";
import CombinedImageMapper from "../hipaa-intake/CombinedImageMapper";
import { INTAKE_THANKYOU_INDEX, DOCUMENT_SLOTS } from "../hipaa-intake/intakeSteps";

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
import { dataUrlToBlob } from "../utils/compressImage";
import { THANKYOU_STEP as BROWN_THANKYOU } from "../brown-scales/brownSteps";

import MDQForm        from "../mdq-form/MDQForm";
import MDQImageMapper from "../mdq-form/MDQImageMapper";
import { THANKYOU_STEP as MDQ_THANKYOU } from "../mdq-form/mdqSteps";

import QuickConsentForm        from "../cancellation-no-show-policy/QuickConsentForm";
import QuickConsentImageMapper from "../cancellation-no-show-policy/QuickConsentImageMapper";
import { THANKYOU_STEP as CANCELLATION_THANKYOU } from "../cancellation-no-show-policy/quickConsentSteps";

// ── Form sequence ─────────────────────────────────────────────────────────────
const FORMS = [
  { id: "hipaa-intake",   label: "HIPAA & Intake",   icon: "🔒", mins: 5 },
  { id: "health-history", label: "Health History",   icon: "🏥", mins: 5 },
  { id: "gad7",           label: "GAD-7 Anxiety",    icon: "🧠", mins: 1 },
  { id: "asrs",           label: "ASRS ADHD",        icon: "⚡", mins: 2 },
  { id: "phq9",           label: "PHQ-9 Depression", icon: "💙", mins: 1 },
  { id: "brown-scales",   label: "Brown Scales",     icon: "📋", mins: 6 },
  { id: "mdq",            label: "MDQ Mood",         icon: "🌗", mins: 2 },
  { id: "cancellation",   label: "Cancellation Policy", icon: "📅", mins: 1 },
];
const TOTAL_FORMS = FORMS.length;
const minsLeftFrom = (idx) => FORMS.slice(idx).reduce((n, f) => n + f.mins, 0);
// Pause between forms ("✓ Done — next up"). Was 2.5 s; tap "Continue" to skip.
const TRANSITION_MS = 900;
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
// Derived from the Intake step list (was hard-coded 9 — adding the Photo ID
// step would have made the Intake signature step count as "done").
const HIPAA_INTAKE_THANKYOU    = HIPAA_STEPS + INTAKE_THANKYOU_INDEX;

// ── PDF watchdog ──────────────────────────────────────────────────────────────
// A form's PDF normally builds in 1–3 s after the form is completed. If it
// hasn't arrived after PDF_TIMEOUT_MS (e.g. a network drop while loading), its
// builder is re-mounted. After PDF_MAX_TRIES the form is marked failed, and the
// submission is sent without it (the clinic email lists it as missing).
const PDF_TIMEOUT_MS = 15000;
const PDF_MAX_TRIES  = 3;

// ── Resume card (saved progress found on this device) ─────────────────────────
function ResumeCard({ saved, onContinue, onFresh }) {
  const font  = "'Source Sans 3', sans-serif";
  const where = typeof saved.stage === "number" ? `Form ${saved.stage + 1} of ${TOTAL_FORMS} — ${FORMS[saved.stage]?.label}`
              : saved.stage === "done" ? "Ready to send" : "Patient information";
  const when  = new Date(saved.savedAt).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const name  = [saved.info?.firstName, saved.info?.lastName].filter(Boolean).join(" ");
  return (
    <div style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 0" }}>
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', serif", margin: "0 0 8px" }}>
          Welcome back{name ? `, ${saved.info.firstName}` : ""}
        </h2>
        <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.6, margin: "0 0 18px", fontFamily: font }}>
          You have unfinished forms saved on this device. Continue where you left off?
        </p>
        <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 16px", marginBottom: "22px", fontFamily: font, fontSize: "14px", color: "#334155" }}>
          <div><strong>Where you stopped:</strong> {where}</div>
          <div style={{ marginTop: "4px" }}><strong>Saved:</strong> {when}</div>
        </div>
        <button onClick={onContinue}
          style={{ width: "100%", padding: "15px", borderRadius: "12px", fontSize: "16px", fontWeight: 700, border: "none", color: "white", backgroundColor: "#7d4f50", cursor: "pointer", fontFamily: font, marginBottom: "10px" }}>
          Continue my forms →
        </button>
        <button onClick={onFresh}
          style={{ width: "100%", padding: "13px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, border: "2px solid #e2e8f0", color: "#475569", backgroundColor: "white", cursor: "pointer", fontFamily: font }}>
          Not {name || "me"}? Start fresh
        </button>
        <p style={{ fontSize: "13px", color: "#5b6475", lineHeight: 1.5, margin: "14px 0 0", fontFamily: font }}>
          &ldquo;Start fresh&rdquo; permanently deletes the saved answers from this device. Saved answers are deleted automatically after 48 hours, or as soon as your forms are sent.
        </p>
      </div>
    </div>
  );
}

// ── Transition banner ─────────────────────────────────────────────────────────
function TransitionBanner({ completedIndex, nextForm, onContinue }) {
  const done = completedIndex + 1;
  return (
    <div className="pf-pop" style={{ maxWidth: "520px", margin: "0 auto", padding: "32px 0" }}>
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "32px 28px", textAlign: "center", border: "1px solid #e3e8ef" }}>
        <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#ecf6f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <svg className="pf-check" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2f7d5a" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 style={{ fontSize: "21px", fontWeight: 700, margin: "0 0 4px" }}>{FORMS[completedIndex].label} done</h2>
        <p style={{ fontSize: "15px", color: "#4b5563", margin: "0 0 18px" }}>
          {done} of {TOTAL_FORMS} complete{nextForm ? ` · about ${minsLeftFrom(done)} min left` : ""}
        </p>
        {nextForm && (
          <button type="button" onClick={onContinue}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "14px 18px", borderRadius: "14px", border: "1px solid #d6dce4", backgroundColor: "#f6f8fb", cursor: "pointer", textAlign: "left" }}>
            <span>
              <span style={{ display: "block", fontSize: "13px", color: "#4b5563" }}>Next up · about {nextForm.mins} min</span>
              <span style={{ display: "block", fontSize: "17px", fontWeight: 600, color: "#0b1c30" }}>{nextForm.icon} {nextForm.label}</span>
            </span>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "#7d4f50", whiteSpace: "nowrap" }}>Continue →</span>
          </button>
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

  const transitionTimerRef   = useRef(null);
  const transitionAdvanceRef = useRef(null);   // "Continue" on the transition card

  // Comfort: bigger text toggle + "saved" reassurance
  const [largeText, setLargeText] = useState(false);
  const [savedFlash, setSavedFlash] = useState(0);
  useEffect(() => { try { setLargeText(localStorage.getItem("pf-large") === "1"); } catch {} }, []);
  const toggleLarge = () => setLargeText(v => { try { localStorage.setItem("pf-large", v ? "0" : "1"); } catch {} return !v; });

  // Pending form to complete (set during render, processed via useEffect)
  const pendingComplete = useRef(null);

  // PDF blobs
  const blobsRef       = useRef({});
  const sendStartedRef = useRef(false);
  const [blobCount,   setBlobCount]   = useState(0);      // re-render when a PDF arrives
  const [mapperKeys,  setMapperKeys]  = useState({});     // formId → remount counter
  const pdfTriesRef   = useRef({});                       // formId → tries used
  const [failedForms, setFailedForms] = useState([]);     // gave up after PDF_MAX_TRIES
  const [sentMissing, setSentMissing] = useState([]);     // names sent as missing

  // Save-on-device / resume
  const [resumeOffer, setResumeOffer] = useState(null);   // saved state awaiting choice
  const [restored,    setRestored]    = useState(false);  // true once load check is done
  const deliveredRef = useRef(false);                     // set on successful send → stop saving
  const cancellationEmailRef = useRef(""); // fresh value for async mergeAndSend
  const intakeDocsRef        = useRef({}); // ID/insurance photos + selfPay, fresh for mergeAndSend
  const prefillCache = useRef({});

  // Final state
  const [mergedUrl,   setMergedUrl]   = useState(null);
  const [emailStatus, setEmailStatus] = useState("idle");

  // ── On mount: start preloading form assets; look for saved progress ──────
  useEffect(() => {
    preloadFormAssets();
    loadProgress().then(saved => {
      const meaningful = saved && (saved.stage !== "info" || saved.info?.firstName || saved.info?.lastName);
      if (meaningful) setResumeOffer(saved); else setRestored(true);
    });
  }, []);

  const resumeSaved = () => {
    const saved = resumeOffer;
    // Forms not yet completed should be dated today, not the day they started.
    const nextInfo = { ...INITIAL_INFO, ...saved.info, todayDate: todayISO() };
    infoRef.current = nextInfo;
    setInfo(nextInfo);
    setFormAnswers({ ...initialAnswers(), ...saved.formAnswers });
    setFormSteps({ ...INITIAL_STEPS, ...saved.formSteps });
    setCompletedForms(saved.completedForms || []);   // their PDFs rebuild from saved answers
    setStage(saved.stage ?? "info");
    setResumeOffer(null);
    setRestored(true);
    window.scrollTo({ top: 0 });
  };
  const discardSaved = () => {
    clearProgress();
    setResumeOffer(null);
    setRestored(true);
  };

  // Save progress (debounced). Never before the resume choice is made, and
  // never after a successful send (the saved copy is deleted then).
  useEffect(() => {
    if (!restored || deliveredRef.current) return;
    const t = setTimeout(() => {
      if (deliveredRef.current) return;                                    // sent while waiting
      if (stage === "info" && !info.firstName && !info.lastName) return;   // nothing worth saving yet
      saveProgress({ info, formAnswers, formSteps, stage, completedForms })
        .then(ok => { if (ok && stage !== "info") setSavedFlash(Date.now()); });
    }, 600);
    return () => clearTimeout(t);
  }, [restored, info, formAnswers, formSteps, stage, completedForms]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Freeze this form's prefilled values (dates, signature, name) into its own
    // answers, so a next-day resume doesn't re-date an already-signed form.
    const doneId = FORMS[idx].id;
    const frozen = getAnswers(doneId);
    setFormAnswers(prev => ({ ...prev, [doneId]: frozen }));

    // Mark form as completed (mounts its mapper)
    setCompletedForms(prev => prev.includes(idx) ? prev : [...prev, idx]);
    setShowTransition(true);
    setTransitionIdx(idx);

    const advance = () => {
      clearTimeout(transitionTimerRef.current);
      transitionAdvanceRef.current = null;
      setShowTransition(false);
      setTransitionIdx(null);
      setStage(idx + 1 < TOTAL_FORMS ? idx + 1 : "done");
      window.scrollTo({ top: 0 });
    };
    transitionAdvanceRef.current = advance;
    transitionTimerRef.current = setTimeout(advance, idx + 1 < TOTAL_FORMS ? TRANSITION_MS : 600);
  });

  // ── Merge + send ──────────────────────────────────────────────────────────
  const mergeAndSend = async () => {
    setEmailStatus("sending");
    const currentInfo = infoRef.current;

    try {
      // Only forms whose PDF was built; the rest are reported as missing.
      const formOrder = FORMS.map(f => f.id).filter(id => blobsRef.current[id]);
      const missing   = FORMS.filter(f => !blobsRef.current[f.id]).map(f => FORM_NAMES[f.id]);
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
      // Raw binary multipart, NOT base64 JSON: Vercel caps a request at 4.5 MB
      // and base64 adds 33%. 8 forms (~2.9 MB) + 3 photos (≤ 0.9 MB) fit;
      // the same data as base64 JSON would not.
      const safeName = name.replace(/[^\w\-]+/g, "_");
      const docs     = intakeDocsRef.current;
      const fd       = new FormData();
      const meta     = {
        patientName:    name,
        // Global email first; fall back to the email typed on the Cancellation
        // Policy step (that step requires one and promises a copy to it).
        patientEmail:   currentInfo.email?.trim() || cancellationEmailRef.current || "",
        patientPhone:   currentInfo.phone || "",
        clinicLocation: currentInfo.location || "",
        selfPay:        docs.selfPay,
        forms:          [],
        documents:      [],
        missing,
      };
      formOrder.forEach((id, i) => {
        const field = `form_${i}`;
        fd.append(field, blobsRef.current[id], `${safeName}_${id}.pdf`);
        meta.forms.push({ field, formName: formNames[id], fileName: `${safeName}_${id}.pdf` });
      });
      DOCUMENT_SLOTS.forEach((d, i) => {
        if (d.insurance && docs.selfPay) return;
        const dataUrl = docs[d.key];
        if (!dataUrl) return;
        const field    = `doc_${i}`;
        const fileName = `${safeName}_${d.key.replace(/^doc/, "")}.jpg`;
        fd.append(field, dataUrlToBlob(dataUrl), fileName);
        meta.documents.push({ field, label: d.short, fileName });
      });
      fd.append("meta", JSON.stringify(meta));

      // No Content-Type header: the browser sets the multipart boundary.
      const res = await fetch("/api/merge-pdf", { method: "POST", body: fd });

      const data = await res.json();
      if (data.success) {
        deliveredRef.current = true;   // stops any queued save from re-writing it
        setSentMissing(missing);
        setEmailStatus("sent");
        clearProgress();               // delivered — don't keep health data on the device
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
    setBlobCount(collected);              // send is triggered by the effect below
  }, []);

  // ── Watchdog: rebuild a form's PDF if it hasn't arrived in time ──────────
  useEffect(() => {
    const timers = [];
    completedForms.forEach(idx => {
      const id = FORMS[idx].id;
      if (blobsRef.current[id] || failedForms.includes(id)) return;
      timers.push(setTimeout(() => {
        if (blobsRef.current[id]) return;
        const used = (pdfTriesRef.current[id] || 1);
        if (used < PDF_MAX_TRIES) {
          pdfTriesRef.current[id] = used + 1;
          console.warn(`[unified] ${id} PDF not ready — rebuilding (try ${used + 1}/${PDF_MAX_TRIES})`);
          preloadFormAssets();                                   // no-op if already loaded
          setMapperKeys(k => ({ ...k, [id]: (k[id] || 0) + 1 })); // remount its builder
        } else {
          console.error(`[unified] ${id} PDF failed after ${PDF_MAX_TRIES} tries`);
          setFailedForms(f => f.includes(id) ? f : [...f, id]);
        }
      }, PDF_TIMEOUT_MS));
    });
    return () => timers.forEach(clearTimeout);
  }, [completedForms, mapperKeys, failedForms, blobCount]);

  // ── Send once every completed form has a PDF (or has definitively failed) ─
  useEffect(() => {
    if (sendStartedRef.current || completedForms.length < TOTAL_FORMS) return;
    const pending = FORMS.filter(f => !blobsRef.current[f.id] && !failedForms.includes(f.id));
    if (pending.length) return;
    if (Object.keys(blobsRef.current).length === 0) return;      // nothing to send — wait for Try again
    sendStartedRef.current = true;
    console.log("[unified] merging and sending", failedForms.length ? `(missing: ${failedForms.join(", ")})` : "");
    mergeAndSend();
  }, [completedForms, blobCount, failedForms]); // eslint-disable-line react-hooks/exhaustive-deps

  // On reaching the end, give any PDF that failed mid-flow one fresh round —
  // the connection has often recovered by then.
  const finalRoundRef = useRef(false);
  useEffect(() => {
    if (completedForms.length < TOTAL_FORMS || finalRoundRef.current) return;
    finalRoundRef.current = true;
    if (!failedForms.length) return;
    failedForms.forEach(id => { pdfTriesRef.current[id] = 1; });
    preloadFormAssets();
    setMapperKeys(k => ({ ...k, ...Object.fromEntries(failedForms.map(id => [id, (k[id] || 0) + 1])) }));
    setFailedForms([]);
  }, [completedForms, failedForms]);

  // "Try again": rebuild any missing PDFs with fresh tries, then resend.
  const retryAll = () => {
    const missingIds = FORMS.map(f => f.id).filter(id => !blobsRef.current[id]);
    missingIds.forEach(id => { pdfTriesRef.current[id] = 1; });
    preloadFormAssets();
    setMapperKeys(k => ({ ...k, ...Object.fromEntries(missingIds.map(id => [id, (k[id] || 0) + 1])) }));
    setFailedForms([]);
    setEmailStatus("idle");
    sendStartedRef.current = false;
  };

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
    sendStartedRef.current = false;
    pdfTriesRef.current = {};
    setBlobCount(0);
    setMapperKeys({});
    setFailedForms([]);
    setSentMissing([]);
    finalRoundRef.current = false;
    deliveredRef.current = false;
    clearProgress();
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
  intakeDocsRef.current = {
    selfPay: !!hipaaIntakeAnswers.selfPay,
    ...Object.fromEntries(DOCUMENT_SLOTS.map(d => [d.key, hipaaIntakeAnswers[d.key] || null])),
  };

  const headerLabel = stage === "info" ? "Patient Information"
    : stage === "done"                 ? (emailStatus === "sent" ? "All Forms Complete" : "Finishing up")
    : showTransition && transitionIdx !== null ? `${FORMS[transitionIdx]?.label} Complete`
    : currentFormIndex !== null        ? `Form ${currentFormIndex + 1} of ${TOTAL_FORMS} · ~${minsLeftFrom(currentFormIndex)} min left · ${FORMS[currentFormIndex].label}`
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
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&family=Roboto+Slab:wght@500;600;700&display=swap" rel="stylesheet" />

      <div className={`pf-theme${largeText ? " pf-large" : ""}`} style={{ minHeight: "100vh" }}>

        {/* ── Header ── */}
        <div style={{ backgroundColor: "#1e3a5f", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 4px 14px rgba(11,28,48,0.18)" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div style={{ width: "40px", height: "40px", backgroundColor: "white", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", flexShrink: 0 }}>
                <Image src="/logo2.png" alt="Logo" width={72} height={36} style={{ objectFit: "contain" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: "white", fontWeight: 600, fontSize: "15px", margin: 0, lineHeight: 1.25 }}>Cambridge Psychiatry</p>
                <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "13px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{headerLabel}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {savedFlash > 0 && stage !== "info" && emailStatus !== "sent" && (
              <span key={savedFlash} className="pf-saved" title="Your progress is saved on this device" style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>✓ Saved</span>
            )}
            <button type="button" onClick={toggleLarge} aria-pressed={largeText} aria-label={largeText ? "Normal text size" : "Larger text"} title={largeText ? "Normal text size" : "Larger text"}
              style={{ minHeight: "36px", height: "36px", padding: "0 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.35)", backgroundColor: largeText ? "rgba(255,255,255,0.18)" : "transparent", color: "white", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>
              <span style={{ fontSize: "12px" }}>A</span>A
            </button>
            {stage !== "info" && (
              <div style={{ display: "flex", gap: "5px", flexShrink: 0 }} className="pf-dots">
                {FORMS.map((f, i) => (
                  <div key={f.id} title={f.label} style={{
                    width: "8px", height: "8px", borderRadius: "50%", transition: "background-color 0.3s",
                    backgroundColor: i < formsDone ? "#8fd3b0" : i === currentFormIndex ? "white" : "rgba(255,255,255,0.28)",
                  }} />
                ))}
              </div>
            )}
            </div>
          </div>
          {stage !== "info" && stage !== "done" && (
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 16px 8px" }}>
              <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(formsDone / TOTAL_FORMS) * 100}%`, background: "linear-gradient(to right,#9cc3e6,#8fd3b0)", borderRadius: "999px", transition: "width 0.5s ease-out" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "28px 16px" }}>

          {/* Global info */}
          {stage === "info" && resumeOffer && (
            <ResumeCard saved={resumeOffer} onContinue={resumeSaved} onFresh={discardSaved} />
          )}
          {stage === "info" && restored && !resumeOffer && (
            <GlobalInfoStep forms={FORMS} info={info} onChange={handleInfoChange} onNext={() => { setStage(0); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          )}

          {/* Transition banner */}
          {showTransition && transitionIdx !== null && (
            <TransitionBanner completedIndex={transitionIdx} nextForm={transitionIdx + 1 < TOTAL_FORMS ? FORMS[transitionIdx + 1] : null} onContinue={() => transitionAdvanceRef.current?.()} />
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
                key={`${formId}-${mapperKeys[formId] || 0}`}
                formId={formId}
                answers={answers}
                info={info}
                onPdfReady={(fn, blob) => handlePdfReady(formId, fn, blob)}
              />
            );
          })}

          {/* ── Final screen ── */}
          {stage === "done" && !showTransition && (() => {
            const readyIds   = FORMS.map(f => f.id).filter(id => blobsRef.current[id]);
            const pendingIds = FORMS.map(f => f.id).filter(id => !blobsRef.current[id] && !failedForms.includes(id));
            const slow       = pendingIds.some(id => (pdfTriesRef.current[id] || 1) > 1);
            const sent       = emailStatus === "sent";
            const failedAll  = !sent && emailStatus !== "sending" && !pendingIds.length && !readyIds.length;
            const showError  = emailStatus === "error" || failedAll;
            const font = "'Source Sans 3', sans-serif";
            const patientEmail = info.email?.trim() || cancellationAnswers.email?.trim();
            const statusIcon = (id) => blobsRef.current[id]
              ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              : failedForms.includes(id) || showError
                ? <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "13px" }}>!</span>
                : <div style={{ width: "11px", height: "11px", border: "2px solid #cbd5e1", borderTopColor: "#7d4f50", borderRadius: "50%", animation: "uSpin 0.8s linear infinite" }} />;

            return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 16px" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: showError ? "#dc2626" : "#7d4f50", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: "0 8px 24px rgba(125,79,80,0.3)" }}>
                {sent || !showError
                  ? <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  : <span style={{ color: "white", fontSize: "38px", fontWeight: 700, lineHeight: 1 }}>!</span>}
              </div>

              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', serif", marginBottom: "8px" }}>
                {sent ? "Forms Submitted!" : showError ? "Your forms weren't sent yet" : "Almost done…"}
              </h1>
              <p style={{ fontSize: "15px", color: "#4b5563", maxWidth: "420px", lineHeight: 1.6, marginBottom: "6px", fontFamily: font }}>
                {sent
                  ? <>Thank you, <strong style={{ color: "#1e293b" }}>{info.fullName}</strong>. {sentMissing.length ? `${TOTAL_FORMS - sentMissing.length} of ${TOTAL_FORMS}` : `All ${TOTAL_FORMS}`} forms have been sent to Cambridge Psychiatry.</>
                  : showError
                    ? <>This is usually a connection problem. Check your internet connection and tap <strong>Try again</strong>. Your answers are saved on this device, so nothing needs to be re-entered.</>
                    : <>Please keep this page open while we prepare and send your forms ({readyIds.length} of {TOTAL_FORMS} ready).{slow && <><br /><span style={{ color: "#b45309" }}>Your connection seems slow — still trying…</span></>}</>}
              </p>
              {sent && sentMissing.length > 0 && (
                <p style={{ fontSize: "13px", color: "#b45309", maxWidth: "420px", marginBottom: "6px", fontFamily: font }}>
                  We couldn&apos;t prepare: {sentMissing.join(", ")}. Our office has been notified and may ask you to complete {sentMissing.length > 1 ? "them" : "it"} at your visit.
                </p>
              )}
              {sent && (
                <p style={{ fontSize: "13px", color: "#5b6475", marginBottom: "28px", fontFamily: font }}>
                  Can&apos;t find the email? Please check your spam or junk folder.
                </p>
              )}
              {!sent && <div style={{ height: "22px" }} />}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "32px", maxWidth: "500px" }}>
                {FORMS.map(f => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", backgroundColor: "white", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "14px" }}>{f.icon}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", fontFamily: font }}>{f.label}</span>
                    {statusIcon(f.id)}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px" }}>
                {showError && (
                  <button
                    onClick={retryAll}
                    style={{ width: "100%", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: 700, border: "none", color: "white", backgroundColor: "#7d4f50", cursor: "pointer", fontFamily: font }}
                  >
                    Try again
                  </button>
                )}

                {emailStatus === "sending" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "14px", color: "#4b5563", fontFamily: font }}>
                    <div style={{ width: "14px", height: "14px", border: "2px solid #cbd5e1", borderTopColor: "#7d4f50", borderRadius: "50%", animation: "uSpin 0.8s linear infinite" }} />
                    Sending forms to our office…
                  </div>
                )}
                {sent && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "#16a34a", fontFamily: font }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {patientEmail ? `Emailed to ${patientEmail} and our office` : "Emailed to our office"}
                  </div>
                )}

                {mergedUrl && (
                  <button
                    onClick={handleDownload}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, border: sent ? "none" : "2px solid #7d4f50", color: sent ? "white" : "#7d4f50", backgroundColor: sent ? "#7d4f50" : "white", cursor: "pointer", fontFamily: font }}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download a copy (PDF)
                  </button>
                )}

                {sent && (
                  <button
                    onClick={handleReset}
                    style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, border: "2px solid #e2e8f0", color: "#475569", backgroundColor: "white", cursor: "pointer", fontFamily: font }}
                  >
                    Start Over
                  </button>
                )}
              </div>
            </div>
            );
          })()}
        </div>
      </div>
      <style>{`@keyframes uSpin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}