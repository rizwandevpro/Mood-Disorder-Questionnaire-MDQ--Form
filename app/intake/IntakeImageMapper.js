"use client";

// ─────────────────────────────────────────────────────────────────────────────
// IntakeImageMapper.js
//
// Renders the 595×842 New Patient Intake Form canvas, generates PDF.
//
// Background image: /public/intake-bg.png  (595 × 842 px)
//
// ── HOW TO ADJUST TEXT POSITIONS ────────────────────────────────────────────
//  All coordinates live in the POS object below.
//  x = left→right, y = top→bottom (baseline of text).
//  Font size is 9px throughout to match the printed form lines.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useCallback, useState, useEffect } from "react";

// Canvas dimensions — match the actual background image size exactly
const CANVAS_W = 1581;
const CANVAS_H = 2241;

// No artificial scaling needed — image is already high-resolution.
// SCALE = 1 means canvas renders at native image size for crisp PDF output.
const SCALE = 1;

// ═══════════════════════════════════════════════════════════════════════════════
// POSITION CONFIG — edit x/y values to fine-tune text placement on the form
// ═══════════════════════════════════════════════════════════════════════════════
export const POS = {
  // Row 1: Last Name / First Name / M.I. / DOB
  lastName:   { x: 308,  y: 498 },
  firstName:  { x: 744,  y: 498 },
  mi:         { x: 1052, y: 498 },
  dob:        { x: 1206, y: 498 },

  // Row 2: Gender / Address / Apt#
  gender:     { x: 247,  y: 570 },
  address:    { x: 523,  y: 570 },
  apt:        { x: 1329, y: 570 },

  // Row 3: City / State / Zip / Marital Status
  city:          { x: 199,  y: 644 },
  state:         { x: 632,  y: 644 },
  zip:           { x: 808,  y: 644 },
  maritalStatus: { x: 1254, y: 644 },

  // Row 4: Cell / Home / Email
  cellPhone:  { x: 300,  y: 716 },
  homePhone:  { x: 808,  y: 716 },
  email:      { x: 1206, y: 716 },

  // Row 5: Pharmacy
  pharmacy:   { x: 526, y: 785 },

  // Row 6: Race / Ethnicity / Primary Language
  race:            { x: 213,  y: 860 },
  ethnicity:       { x: 590,  y: 860 },
  primaryLanguage: { x: 1119, y: 860 },

  // Emergency Contact
  ecFullName:  { x: 298,  y: 1059 },
  ecTelephone: { x: 869,  y: 1059 },
  ecRelation:  { x: 1270, y: 1059 },

  // Primary Insurance
  priProvider:     { x: 428, y: 1317 },
  priMemberId:     { x: 319, y: 1389 },
  priPolicyOwner:  { x: 441, y: 1461 },
  priPolicyDob:    { x: 430, y: 1530 },
  priRelationship: { x: 337, y: 1605 },

  // Secondary Insurance
  secProvider:     { x: 1097, y: 1317 },
  secMemberId:     { x: 991,  y: 1389 },
  secPolicyOwner:  { x: 1113, y: 1461 },
  secPolicyDob:    { x: 1095, y: 1530 },
  secRelationship: { x: 1010, y: 1605 },

  // Signature & Date
  signature: { x: 292, y: 2084, w: 531, h: 75 },
  sigDate:   { x: 1044, y: 2084 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function IntakeImageMapper({ answers, silentMode = false, onPdfReady }) {
  const canvasRef              = useRef(null);
  const [status, setStatus]    = useState("loading");
  const [emailStatus, setEmailStatus] = useState("idle");

  // ── Draw ──────────────────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Render at SCALE x logical size for crisp PDF output
    canvas.width  = CANVAS_W * SCALE;
    canvas.height = CANVAS_H * SCALE;
    ctx.scale(SCALE, SCALE);

    const bg = new window.Image();
    bg.src = "/intake-bg.jpg";

    bg.onload = () => {
      ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);

      const t = (text, x, y, maxWidth = 320, fontSize = 30) => {
        if (!text) return;
        ctx.fillStyle = "#111827";
        ctx.font = `600 ${fontSize}px Arial, sans-serif`;
        ctx.fillText(String(text), x, y, maxWidth);
      };

      // Personal
      t(answers.lastName,   POS.lastName.x,   POS.lastName.y,   320);
      t(answers.firstName,  POS.firstName.x,  POS.firstName.y,  290);
      t(answers.mi,         POS.mi.x,         POS.mi.y,           48);
      t(answers.dob,        POS.dob.x,        POS.dob.y,          210);
      t(answers.gender,     POS.gender.x,     POS.gender.y,       146);
      t(answers.address,    POS.address.x,    POS.address.y,      425);
      t(answers.apt,        POS.apt.x,        POS.apt.y,          106);

      // Location
      t(answers.city,          POS.city.x,          POS.city.y,          290);
      t(answers.state,         POS.state.x,         POS.state.y,          45);
      t(answers.zip,           POS.zip.x,           POS.zip.y,            65);
      t(answers.maritalStatus, POS.maritalStatus.x, POS.maritalStatus.y,  239);

      // Contact
      t(answers.cellPhone, POS.cellPhone.x, POS.cellPhone.y, 290);
      t(answers.homePhone, POS.homePhone.x, POS.homePhone.y, 290);
      t(answers.email,     POS.email.x,     POS.email.y,     346);

      // Demographics
      t(answers.pharmacy,        POS.pharmacy.x,        POS.pharmacy.y,        904);
      t(answers.race,            POS.race.x,            POS.race.y,             239);
      t(answers.ethnicity,       POS.ethnicity.x,       POS.ethnicity.y,       290);
      t(answers.primaryLanguage, POS.primaryLanguage.x, POS.primaryLanguage.y, 320);

      // Emergency
      t(answers.ecFullName,  POS.ecFullName.x,  POS.ecFullName.y,  452);
      t(answers.ecTelephone, POS.ecTelephone.x, POS.ecTelephone.y, 290);
      t(answers.ecRelation,  POS.ecRelation.x,  POS.ecRelation.y,   239);

      // Primary Insurance
      t(answers.priProvider,     POS.priProvider.x,     POS.priProvider.y,     531);
      t(answers.priMemberId,     POS.priMemberId.x,     POS.priMemberId.y,     531);
      t(answers.priPolicyOwner,  POS.priPolicyOwner.x,  POS.priPolicyOwner.y,  531);
      t(answers.priPolicyDob,    POS.priPolicyDob.x,    POS.priPolicyDob.y,    531);
      t(answers.priRelationship, POS.priRelationship.x, POS.priRelationship.y, 531);

      // Secondary Insurance
      t(answers.secProvider,     POS.secProvider.x,     POS.secProvider.y,     531);
      t(answers.secMemberId,     POS.secMemberId.x,     POS.secMemberId.y,     531);
      t(answers.secPolicyOwner,  POS.secPolicyOwner.x,  POS.secPolicyOwner.y,  531);
      t(answers.secPolicyDob,    POS.secPolicyDob.x,    POS.secPolicyDob.y,    531);
      t(answers.secRelationship, POS.secRelationship.x, POS.secRelationship.y, 531);

      // Signature image
      if (answers.signature) {
        const sigImg = new window.Image();
        sigImg.onload = () => {
          const sp = POS.signature;
          ctx.drawImage(sigImg, sp.x, sp.y - sp.h, sp.w, sp.h);
          t(answers.sigDate, POS.sigDate.x, POS.sigDate.y, 266);
          setStatus("ready");
        };
        sigImg.src = answers.signature;
      } else {
        t(answers.sigDate, POS.sigDate.x, POS.sigDate.y, 100);
        setStatus("ready");
      }
    };

    bg.onerror = () => {
      // Fallback — white background with text
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#1e3a8a";
      ctx.font = "bold 18px Arial";
      ctx.fillText("New Patient Intake Form", 40, 60);
      ctx.fillStyle = "#ef4444";
      ctx.font = "11px Arial";
      ctx.fillText("⚠ Place intake-bg.jpg in /public to see the form background.", 40, 90);
      ctx.fillStyle = "#374151";
      ctx.font = "10px Arial";
      let y = 130;
      const fields = [
        ["Last Name", answers.lastName], ["First Name", answers.firstName],
        ["DOB", answers.dob], ["Gender", answers.gender],
        ["Address", answers.address], ["City", answers.city],
        ["Cell", answers.cellPhone], ["Email", answers.email],
      ];
      fields.forEach(([label, val]) => {
        if (val) { ctx.fillText(`${label}: ${val}`, 40, y); y += 18; }
      });
      setStatus("ready");
    };
  }, [answers]);

  const refCallback = useCallback((node) => {
    if (node) { canvasRef.current = node; drawCanvas(); }
  }, [drawCanvas]);

  // ── PDF helpers ───────────────────────────────────────────────────────────
  const loadJsPDF = () => new Promise((resolve, reject) => {
    if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => resolve(window.jspdf.jsPDF);
    s.onerror = () => reject(new Error("Failed to load jsPDF"));
    document.head.appendChild(s);
  });

  const buildPdf = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const JsPDF   = await loadJsPDF();
    const imgData = canvas.toDataURL("image/jpeg", 0.7); // max quality — canvas is 3x so file size is fine
    const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
    return pdf;
  };

  const handleDownload = async () => {
    setEmailStatus("idle");
    try {
      const pdf = await buildPdf();
      if (!pdf) return;
      pdf.save(`Intake_${answers.lastName || "patient"}_${answers.sigDate || "form"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF export failed — check browser console.");
    }
  };

  // ── silentMode: build PDF then expose download fn to parent ──────────────
  useEffect(() => {
    if (!silentMode || status !== "ready") return;
    (async () => {
      try {
        const pdf = await buildPdf();
        if (!pdf) return;
        if (onPdfReady) {
          onPdfReady(() => {
            pdf.save(`Intake_${answers.lastName || "patient"}_${answers.sigDate || "form"}.pdf`);
          });
        }
      } catch (err) {
        console.error("Silent PDF failed:", err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [silentMode, status]);

  // ── silentMode render ─────────────────────────────────────────────────────
  if (silentMode) {
    return (
      <canvas ref={refCallback}
        style={{ display: "block", width: `${CANVAS_W}px`, height: `${CANVAS_H}px`,
                 imageRendering: "high-quality" }} />
    );
  }

  // ── Normal render — preview + download ───────────────────────────────────
  return (
    <div className="mt-10">
      <div className="flex items-start justify-between mb-4 px-1 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Lora', serif" }}>
            Filled Form Preview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
            595 × 842 px — A4. Download saves as PDF.
          </p>
        </div>
        {status === "ready" && (
          <button onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
            style={{ backgroundColor: "#7d4f50", fontFamily: "'Source Sans 3', sans-serif" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        )}
      </div>

      <div className="relative border-2 border-slate-200 rounded-2xl overflow-auto bg-slate-100 shadow-inner"
        style={{ maxHeight: "80vh" }}>
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10 rounded-2xl">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        )}
        <canvas ref={refCallback}
          style={{ display: "block", width: `${CANVAS_W}px`, height: `${CANVAS_H}px`,
                   minWidth: `${CANVAS_W}px`, imageRendering: "high-quality" }} />
      </div>

      {/* Position guide */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <p className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wider"
          style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
          📍 Adjust text positions — edit POS in IntakeImageMapper.js
        </p>
        <div className="font-mono text-xs text-amber-900 space-y-1 leading-relaxed columns-2">
          {Object.entries(POS).map(([k, v]) => (
            <p key={k}><span className="text-blue-700">{k}</span> x={v.x} y={v.y}</p>
          ))}
        </div>
      </div>
    </div>
  );
}