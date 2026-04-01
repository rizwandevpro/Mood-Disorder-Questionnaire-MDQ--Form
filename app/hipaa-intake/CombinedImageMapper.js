"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CombinedImageMapper.js
//
// Draws HIPAA (page 1) and Intake (page 2) onto separate off-screen canvases,
// then builds a single 2-page PDF and calls onPdfReady(downloadFn).
//
// Props:
//   answers    — combined answers object (all HIPAA + Intake keys merged)
//   silentMode — must be true; this component is always off-screen
//   onPdfReady — called with (downloadFn, blob) once PDF is ready
//                 blob is the raw PDF Blob — use it to send via API without interception
//
// Usage in page.js:
//   <CombinedImageMapper answers={answers} silentMode onPdfReady={(fn, blob) => { setDownloadFn(() => fn); sendByEmail(blob); }} />
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";

// ── HIPAA canvas dimensions (must match HIPAAImageMapper exactly) ─────────────
const HIPAA_W = 1584;
const HIPAA_H = 2238;

// ── Intake canvas dimensions (must match IntakeImageMapper exactly) ───────────
const INTAKE_W = 1581;
const INTAKE_H = 2241;

const BRAND    = "#7d4f50";
const CIRCLE_R = 22;

// ── HIPAA drawing config ──────────────────────────────────────────────────────
const YN_COORDS = {
  q1: { YES: [1040, 1541], NO: [1091, 1541] },
  q2: { YES: [1225, 1627], NO: [1280, 1627] },
  q3: { YES: [1072, 1716], NO: [1129, 1716] },
};
const HIPAA_FIELDS = {
  familyLine1: { x: 150,  y: 1854 },
  familyLine2: { x: 150,  y: 1899 },
  printName:   { x: 515,  y: 1940 },
  sigDate:     { x: 934,  y: 2026 },
};
const HIPAA_SIG = { x: 150, y: 1970, w: 680, h: 80 };

// ── Intake drawing config (positions from IntakeImageMapper POS) ──────────────
const INTAKE_POS = {
  lastName:        { x: 308,  y: 498  },
  firstName:       { x: 744,  y: 498  },
  mi:              { x: 1052, y: 498  },
  dob:             { x: 1206, y: 498  },
  gender:          { x: 247,  y: 570  },
  address:         { x: 523,  y: 570  },
  apt:             { x: 1329, y: 570  },
  city:            { x: 199,  y: 644  },
  state:           { x: 632,  y: 644  },
  zip:             { x: 808,  y: 644  },
  maritalStatus:   { x: 1254, y: 644  },
  cellPhone:       { x: 300,  y: 716  },
  homePhone:       { x: 808,  y: 716  },
  email:           { x: 1206, y: 716  },
  pharmacy:        { x: 526,  y: 785  },
  race:            { x: 213,  y: 860  },
  ethnicity:       { x: 590,  y: 860  },
  primaryLanguage: { x: 1119, y: 860  },
  ecFullName:      { x: 298,  y: 1059 },
  ecTelephone:     { x: 869,  y: 1059 },
  ecRelation:      { x: 1270, y: 1059 },
  priProvider:     { x: 428,  y: 1317 },
  priMemberId:     { x: 319,  y: 1389 },
  priPolicyOwner:  { x: 441,  y: 1461 },
  priPolicyDob:    { x: 430,  y: 1530 },
  priRelationship: { x: 337,  y: 1605 },
  secProvider:     { x: 1097, y: 1317 },
  secMemberId:     { x: 991,  y: 1389 },
  secPolicyOwner:  { x: 1113, y: 1461 },
  secPolicyDob:    { x: 1095, y: 1530 },
  secRelationship: { x: 1010, y: 1605 },
  sigDate:         { x: 1044, y: 2084 },
  signature:       { x: 292,  y: 2084, w: 531, h: 75 },
};

// ── Shared drawing helpers ────────────────────────────────────────────────────
function drawCircle(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = BRAND;
  ctx.lineWidth   = 4;
  ctx.beginPath();
  ctx.arc(x, y, CIRCLE_R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawText(ctx, text, x, y, fontSize, maxWidth) {
  if (!text) return;
  ctx.save();
  ctx.font         = `600 ${fontSize || 28}px Arial, sans-serif`;
  ctx.fillStyle    = "#1e293b";
  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  if (maxWidth) ctx.fillText(String(text), x, y, maxWidth);
  else          ctx.fillText(String(text), x, y);
  ctx.restore();
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return (m && d && y) ? `${m}/${d}/${y}` : isoDate;
}

// ── Draw HIPAA page onto a canvas ─────────────────────────────────────────────
// Returns a Promise that resolves when drawing (including any signature image) is done.
function drawHipaaPage(canvas, answers) {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, HIPAA_W, HIPAA_H);

    const bg = new window.Image();
    bg.crossOrigin = "anonymous";
    bg.onerror = () => reject(new Error("Failed to load HIPAA background"));
    bg.onload  = () => {
      ctx.drawImage(bg, 0, 0, HIPAA_W, HIPAA_H);

      // YES/NO circles
      Object.entries(YN_COORDS).forEach(([key, coords]) => {
        const val = answers[key];
        if (!val || !coords[val]) return;
        const [x, y] = coords[val];
        drawCircle(ctx, x, y);
      });

      // Family members text
      const members = (answers.familyMembers || "").split("\n");
      drawText(ctx, members[0] || "", HIPAA_FIELDS.familyLine1.x, HIPAA_FIELDS.familyLine1.y);
      drawText(ctx, members[1] || "", HIPAA_FIELDS.familyLine2.x, HIPAA_FIELDS.familyLine2.y);

      // Print name + date
      drawText(ctx, answers.printName  || "",          HIPAA_FIELDS.printName.x, HIPAA_FIELDS.printName.y);
      drawText(ctx, formatDate(answers.consentDate),   HIPAA_FIELDS.sigDate.x,   HIPAA_FIELDS.sigDate.y);

      // Signature
      const sigData = answers.signatureData;
      if (sigData) {
        const sigImg = new window.Image();
        sigImg.crossOrigin = "anonymous";
        sigImg.onload  = () => {
          ctx.drawImage(sigImg, HIPAA_SIG.x, HIPAA_SIG.y, HIPAA_SIG.w, HIPAA_SIG.h);
          resolve();
        };
        sigImg.onerror = () => resolve(); // continue without signature
        sigImg.src = sigData;
      } else {
        resolve();
      }
    };
    bg.src = "/HIPAA_Compliance_Patient_Consent_Form.jpg";
  });
}

// ── Draw Intake page onto a canvas ────────────────────────────────────────────
// Returns a Promise that resolves when drawing (including any signature image) is done.
function drawIntakePage(canvas, answers) {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext("2d");
    canvas.width  = INTAKE_W;
    canvas.height = INTAKE_H;

    const bg = new window.Image();
    bg.crossOrigin = "anonymous";
    bg.onerror = () => reject(new Error("Failed to load Intake background"));
    bg.onload  = () => {
      ctx.drawImage(bg, 0, 0, INTAKE_W, INTAKE_H);

      const t = (text, x, y, maxWidth, fontSize) => {
        drawText(ctx, text, x, y, fontSize || 30, maxWidth || 320);
      };

      // Personal
      t(answers.lastName,   INTAKE_POS.lastName.x,   INTAKE_POS.lastName.y,   320);
      t(answers.firstName,  INTAKE_POS.firstName.x,  INTAKE_POS.firstName.y,  290);
      t(answers.mi,         INTAKE_POS.mi.x,         INTAKE_POS.mi.y,          48);
      t(answers.dob,        INTAKE_POS.dob.x,        INTAKE_POS.dob.y,         210);
      t(answers.gender,     INTAKE_POS.gender.x,     INTAKE_POS.gender.y,      146);
      t(answers.address,    INTAKE_POS.address.x,    INTAKE_POS.address.y,     425);
      t(answers.apt,        INTAKE_POS.apt.x,        INTAKE_POS.apt.y,         106);

      // Location
      t(answers.city,          INTAKE_POS.city.x,          INTAKE_POS.city.y,          290);
      t(answers.state,         INTAKE_POS.state.x,         INTAKE_POS.state.y,          45);
      t(answers.zip,           INTAKE_POS.zip.x,           INTAKE_POS.zip.y,             65);
      t(answers.maritalStatus, INTAKE_POS.maritalStatus.x, INTAKE_POS.maritalStatus.y,  239);

      // Contact
      t(answers.cellPhone, INTAKE_POS.cellPhone.x, INTAKE_POS.cellPhone.y, 290);
      t(answers.homePhone, INTAKE_POS.homePhone.x, INTAKE_POS.homePhone.y, 290);
      t(answers.email,     INTAKE_POS.email.x,     INTAKE_POS.email.y,     346);

      // Demographics
      t(answers.pharmacy,        INTAKE_POS.pharmacy.x,        INTAKE_POS.pharmacy.y,        904);
      t(answers.race,            INTAKE_POS.race.x,            INTAKE_POS.race.y,             239);
      t(answers.ethnicity,       INTAKE_POS.ethnicity.x,       INTAKE_POS.ethnicity.y,        290);
      t(answers.primaryLanguage, INTAKE_POS.primaryLanguage.x, INTAKE_POS.primaryLanguage.y,  320);

      // Emergency
      t(answers.ecFullName,  INTAKE_POS.ecFullName.x,  INTAKE_POS.ecFullName.y,  452);
      t(answers.ecTelephone, INTAKE_POS.ecTelephone.x, INTAKE_POS.ecTelephone.y, 290);
      t(answers.ecRelation,  INTAKE_POS.ecRelation.x,  INTAKE_POS.ecRelation.y,  239);

      // Primary Insurance
      t(answers.priProvider,     INTAKE_POS.priProvider.x,     INTAKE_POS.priProvider.y,     531);
      t(answers.priMemberId,     INTAKE_POS.priMemberId.x,     INTAKE_POS.priMemberId.y,     531);
      t(answers.priPolicyOwner,  INTAKE_POS.priPolicyOwner.x,  INTAKE_POS.priPolicyOwner.y,  531);
      t(answers.priPolicyDob,    INTAKE_POS.priPolicyDob.x,    INTAKE_POS.priPolicyDob.y,    531);
      t(answers.priRelationship, INTAKE_POS.priRelationship.x, INTAKE_POS.priRelationship.y, 531);

      // Secondary Insurance
      t(answers.secProvider,     INTAKE_POS.secProvider.x,     INTAKE_POS.secProvider.y,     531);
      t(answers.secMemberId,     INTAKE_POS.secMemberId.x,     INTAKE_POS.secMemberId.y,     531);
      t(answers.secPolicyOwner,  INTAKE_POS.secPolicyOwner.x,  INTAKE_POS.secPolicyOwner.y,  531);
      t(answers.secPolicyDob,    INTAKE_POS.secPolicyDob.x,    INTAKE_POS.secPolicyDob.y,    531);
      t(answers.secRelationship, INTAKE_POS.secRelationship.x, INTAKE_POS.secRelationship.y, 531);

      // Signature image
      if (answers.signature) {
        const sigImg = new window.Image();
        sigImg.crossOrigin = "anonymous";
        sigImg.onload = () => {
          const sp = INTAKE_POS.signature;
          ctx.drawImage(sigImg, sp.x, sp.y - sp.h, sp.w, sp.h);
          t(answers.sigDate, INTAKE_POS.sigDate.x, INTAKE_POS.sigDate.y, 266);
          resolve();
        };
        sigImg.onerror = () => {
          t(answers.sigDate, INTAKE_POS.sigDate.x, INTAKE_POS.sigDate.y, 266);
          resolve();
        };
        sigImg.src = answers.signature;
      } else {
        t(answers.sigDate, INTAKE_POS.sigDate.x, INTAKE_POS.sigDate.y, 100);
        resolve();
      }
    };
    bg.src = "/intake-bg.jpg";
  });
}

// ── Build single 2-page PDF from both canvases ────────────────────────────────
function buildCombinedPdf(hipaaCanvas, intakeCanvas, onPdfReady) {
  import("jspdf").then(({ jsPDF }) => {
    // Page 1 — HIPAA (native canvas size × 0.5 to match original)
    const H_W = HIPAA_W  * 0.5;
    const H_H = HIPAA_H  * 0.5;
    // Page 2 — Intake (A4 mm, matching IntakeImageMapper's format)
    const I_W_MM = 210;
    const I_H_MM = 297;

    // Start with HIPAA page (use pt units, custom page size)
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [H_W, H_H] });

    // Page 1: HIPAA
    const hipaaDataUrl = hipaaCanvas.toDataURL("image/jpeg", 0.7);
    pdf.addImage(hipaaDataUrl, "JPEG", 0, 0, H_W, H_H);

    // Page 2: Intake — add new page with A4 dimensions in pt
    const I_W_PT = I_W_MM * 2.8346; // mm → pt
    const I_H_PT = I_H_MM * 2.8346;
    pdf.addPage([I_W_PT, I_H_PT]);
    const intakeDataUrl = intakeCanvas.toDataURL("image/jpeg", 0.7);
    pdf.addImage(intakeDataUrl, "JPEG", 0, 0, I_W_PT, I_H_PT);

    // Deliver — pass both the download fn AND the raw blob to onPdfReady
    const blob = pdf.output("blob");
    const url  = URL.createObjectURL(blob);
    onPdfReady(
      () => {
        const a = document.createElement("a");
        a.href     = url;
        a.download = "Cambridge-Psychiatry-HIPAA-and-Intake.pdf";
        a.click();
      },
      blob   // second arg — raw Blob for email sending without interception
    );
  }).catch(err => console.error("jsPDF error:", err));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CombinedImageMapper({ answers, silentMode, onPdfReady }) {
  const hipaaCanvasRef  = useRef(null);
  const intakeCanvasRef = useRef(null);

  useEffect(() => {
    if (!hipaaCanvasRef.current || !intakeCanvasRef.current) return;

    const hipaaCanvas  = hipaaCanvasRef.current;
    const intakeCanvas = intakeCanvasRef.current;

    // Draw both pages, then build the PDF
    Promise.all([
      drawHipaaPage(hipaaCanvas, answers),
      drawIntakePage(intakeCanvas, answers),
    ])
      .then(() => {
        if (silentMode && onPdfReady) {
          buildCombinedPdf(hipaaCanvas, intakeCanvas, onPdfReady);
        }
      })
      .catch(err => console.error("CombinedImageMapper draw error:", err));

  }, []); // Run once on mount — answers captured via closure

  const hidden = { display: "block", position: "absolute", top: "-9999px", left: "-9999px", width: "1px", height: "1px" };

  return (
    <>
      <canvas ref={hipaaCanvasRef}  width={HIPAA_W}  height={HIPAA_H}  style={hidden} />
      <canvas ref={intakeCanvasRef} width={INTAKE_W} height={INTAKE_H} style={hidden} />
    </>
  );
}