"use client";

// ─────────────────────────────────────────────────────────────────────────────
// HealthHistoryImageMapper.js
//
// Renders both pages of the Patient Health History form onto canvas,
// then exports as a 2-page PDF.
//
// Page 1 bg: /public/patient-health-history-page-1.png  (1584 × 2244)
// Page 2 bg: /public/patient-health-history-page-2.png  (1585 × 2244)
//
// CHECKBOX DRAWING:
//   drawCheck(ctx, x, y) — draws a ✓ mark at the given coordinate
//   x, y = top-left corner of the checkbox square on the form image
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useCallback, useState, useEffect } from "react";

const P1W = 1584; const P1H = 2244;
const P2W = 1585; const P2H = 2244;
const FONT_SIZE  = 26;   // px — text fields
const FONT_FACE  = "Arial, sans-serif";
const FONT_WEIGHT = "500"; // medium weight for visibility
const TEXT_COLOR = "#111827";
const CHECK_SIZE = 32;   // checkbox tick size

// ── Helpers ───────────────────────────────────────────────────────────────────
function drawText(ctx, text, x, y, maxWidth = 300, size = FONT_SIZE) {
  if (!text) return;
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `${FONT_WEIGHT} ${size}px ${FONT_FACE}`;
  ctx.fillText(String(text), x, y, maxWidth);
}

function drawCheck(ctx, x, y, size = CHECK_SIZE) {
  ctx.strokeStyle = "#111827";
  ctx.lineWidth   = 4;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.15, y + size * 0.5);
  ctx.lineTo(x + size * 0.4,  y + size * 0.75);
  ctx.lineTo(x + size * 0.85, y + size * 0.2);
  ctx.stroke();
}

function drawRadioFill(ctx, x, y, size = CHECK_SIZE) {
  // Filled circle for radio / checkbox
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1 DRAW
// ─────────────────────────────────────────────────────────────────────────────
function drawPage1(ctx, answers) {
  const t  = (text, x, y, maxW, size) => drawText(ctx, text, x, y, maxW, size);
  const cb = (val, x, y)  => { if (val) drawCheck(ctx, x, y); };

  // ── Header ─────────────────────────────────────────────────────────────────
  t(answers.hhName,        137,  424, 450);
  t(answers.hhTodayDate,   753,  424, 300);
  t(answers.hhLastExam,   1378,  424, 220);
  t(answers.hhAge,          99,  467, 120);
  t(answers.hhBirthdateM,  596,  467,  60);
  t(answers.hhBirthdateD,  641,  467,  60);
  t(answers.hhBirthdateY,  695,  467,  60);
  t(answers.hhMarital,     974,  467, 220);
  cb(answers.hhGender === "Male",   1308, 444);
  cb(answers.hhGender === "Female", 1420, 444);
  t(answers.hhOccupation,  202,  515, 400);
  t(answers.hhVisitReason, 907,  515, 600);

  // ── Health Maintenance ─────────────────────────────────────────────────────
  t(answers.hmMenstrual,    35,  691, 200);
  t(answers.hmMammogram,    35,  723, 200);
  t(answers.hmPapSmear,     35,  762, 200);
  t(answers.hmCholesterol, 404,  691, 200);
  t(answers.hmColonoscopy, 404,  727, 200);
  t(answers.hmTetanus,     404,  762, 200);
  t(answers.hmPneumonia,   782,  691, 200);
  t(answers.hmBoneDensity, 785,  727, 200);
  t(answers.hmDigitalRectal, 1147, 691, 300);
  t(answers.hmPSA,          1147, 727, 300);

  // ── Conditions checkboxes ──────────────────────────────────────────────────
  const condMap = {
    "AIDS":                    [47,  885],
    "Alcoholism":              [47,  926],
    "Anemia":                  [47,  962],
    "Anorexia":                [47,  997],
    "Anxiety":                 [47, 1032],
    "Arthritis":               [47, 1067],
    "Asthma":                  [47, 1102],
    "Bleeding Disorder":       [47, 1138],
    "Breast Lump":             [47, 1173],
    "Bronchitis":             [329,  888],
    "Bulimia":                [329,  926],
    "CAD / heart disease":    [329,  962],
    "Cancer":                 [329,  998],
    "Chemical Dependency":    [329, 1067],
    "Depression":             [329, 1102],
    "Diabetes":               [329, 1138],
    "Emphysema / COPD":       [329, 1172],
    "Epilepsy":               [329, 1208],
    "GERD (reflux)":          [665,  888],
    "Glaucoma":               [665,  926],
    "Goiter":                 [665,  962],
    "Gout":                   [665,  997],
    "Headaches":              [665, 1032],
    "Heart attack":           [665, 1067],
    "Hepatitis":              [665, 1102],
    "Herpes":                 [665, 1138],
    "High blood pressure":    [665, 1176],
    "HIV positive":           [973,  888],
    "Kidney disease":         [973,  926],
    "Liver disease":          [973,  962],
    "Multiple sclerosis":     [973,  997],
    "Pacemaker":              [973, 1032],
    "Pneumonia":              [973, 1067],
    "Prostate problem":       [973, 1102],
    "Psychiatric care":       [973, 1138],
    "Rheumatic fever":        [973, 1176],
    "Rhinitis":              [1249,  888],
    "Sexually Transmitted":  [1249,  926],
    "Infection":             [1249,  962],
    "Stroke":                [1249,  997],
    "Suicide attempt":       [1249, 1032],
    "Thyroid problem":       [1249, 1067],
    "Tuberculosis":          [1249, 1102],
    "Ulcer(s)":              [1249, 1138],
    "Vaginal infections":    [1249, 1176],
  };

  Object.entries(condMap).forEach(([cond, [x, y]]) => {
    const key = "cond_" + cond.replace(/[^a-zA-Z0-9]/g, "_");
    cb(answers[key], x, y);
  });

  // Cancer type text (below Cancer checkbox)
  if (answers["cond_Cancer"]) {
    t(answers.cancerType, 400, 1034, 200, 18);
  }

  cb(answers.cond_Other, 47, 1272);
  if (answers.cond_Other) {
    t(answers.condOtherText, 100, 1277, 700);
  }

  // ── Allergies ──────────────────────────────────────────────────────────────
  cb(answers.allergyNone, 47,  1409);
  cb(answers.allergyYes, 381,  1407);
  if (answers.allergyYes && answers.allergyList) {
    // Draw allergy text — wrap manually across multiple lines
    const lines = wrapText(ctx, answers.allergyList, 1100, FONT_SIZE);
    lines.forEach((line, i) => t(line, 413, 1447 + i * (FONT_SIZE + 6), 1100));
  }

  // ── Medications ────────────────────────────────────────────────────────────
  if (answers.medications) {
    const lines = wrapText(ctx, answers.medications, 1520, FONT_SIZE);
    lines.forEach((line, i) => t(line, 32, 1600 + i * (FONT_SIZE + 8), 1520));
  }

  // ── Health Habits ──────────────────────────────────────────────────────────
  // Caffeine
  cb(answers.habCaffeineUse,  314, 1830);
  cb(answers.habCaffeineNone, 354, 1830);
  t(answers.habCaffeineDrinks, 682, 1851, 200);
  t(answers.habCaffeinePer,    929, 1851, 200);

  // Tobacco
  cb(answers.habTobaccoUse,   314, 1880);
  cb(answers.habTobaccoNone,  354, 1880);
  t(answers.habTobaccoCigs,   682, 1882, 200);
  cb(answers.habTobaccoQuit, 1135, 1880);
  t(answers.habTobaccoQuitDate, 1135, 1880, 300);

  // Alcohol
  cb(answers.habAlcoholUse,   314, 1918);
  cb(answers.habAlcoholNone,  654, 1918);
  t(answers.habAlcoholDrinks, 682, 1920, 200);
  t(answers.habAlcoholPer,    936, 1920, 200);

  // Drugs
  cb(answers.habDrugsUse,  314, 1953);
  cb(answers.habDrugsNone, 654, 1953);
  t(answers.habDrugsDesc,  811, 1960, 700);

  // Diet / Exercise
  t(answers.habDietDesc,     436, 1995, 1100);
  t(answers.habExerciseDesc, 436, 2030, 1100);

  // Seatbelts
  cb(answers.habSeatbelt === "Always",    314, 2062);
  cb(answers.habSeatbelt === "Never",     654, 2062);
  cb(answers.habSeatbelt === "Sometimes", 1135, 2062);
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 DRAW
// ─────────────────────────────────────────────────────────────────────────────
function drawPage2(ctx, answers) {
  const t  = (text, x, y, maxW, size) => drawText(ctx, text, x, y, maxW, size);
  const cb = (val, x, y)  => { if (val) drawCheck(ctx, x, y); };

  // ── Surgical History (up to 8 rows) ───────────────────────────────────────
  const surgCoords = [
    [35, 390,  144, 390,  487, 390],
    [35, 425,  144, 425,  487, 425],
    [35, 470,  144, 470,  487, 470],
    [35, 506,  144, 506,  487, 506],
    [35, 547,  144, 547,  487, 547],
    [35, 586,  144, 586,  487, 586],
    [35, 618,  144, 618,  487, 618],
    [35, 659,  144, 659,  487, 659],
  ];
  (answers.surgicalRows || []).forEach((row, i) => {
    if (i >= surgCoords.length) return;
    const [yx, yy, hx, hy, sx, sy] = surgCoords[i];
    t(row.year,     yx,  yy,  90);
    t(row.hospital, hx,  hy, 290);
    t(row.surgery,  sx,  sy, 980);
  });

  // ── Pregnancy History ──────────────────────────────────────────────────────
  // Stats — need coords from form. Using estimated positions near top-right of pregnancy header
  t(answers.pregNum,        1132, 342, 100);
  t(answers.pregLiving,    1440, 342, 100);
  t(answers.pregDeliveries, 1248, 374, 100);
  t(answers.pregVaginal,   1437, 371, 100);

  const childCoords = [
    [940, 470,  1116, 470,  1203, 470],
    [940, 506,  1116, 506,  1203, 506],
    [940, 547,  1116, 547,  1203, 547],
    [940, 586,  1116, 586,  1203, 586],
    [940, 618,  1116, 618,  1203, 618],
    [940, 659,  1116, 659,  1203, 659],
  ];
  (answers.pregnancyChildRows || []).forEach((row, i) => {
    if (i >= childCoords.length) return;
    const [bx, by, mx, my, cx, cy] = childCoords[i];
    t(row.birthYear,    bx, by, 140);
    t(row.mf,           mx, my,  60);
    t(row.complications,cx, cy, 330);
  });

  // ── Other Hospitalizations (up to 5 rows) ─────────────────────────────────
  const hospCoords = [
    [35, 826,  144, 826,  487, 826],
    [35, 867,  144, 867,  487, 867],
    [35, 912,  144, 912,  487, 912],
    [35, 948,  144, 948,  487, 948],
    [35, 986,  144, 986,  487, 986],
  ];
  (answers.otherHospRows || []).forEach((row, i) => {
    if (i >= hospCoords.length) return;
    const [yx, yy, hx, hy, rx, ry] = hospCoords[i];
    t(row.year,     yx, yy,  90);
    t(row.hospital, hx, hy, 290);
    t(row.reason,   rx, ry, 980);
  });

  // ── Blood Transfusion ──────────────────────────────────────────────────────
  cb(answers.bloodTransfusion === "No",  513, 998);
  cb(answers.bloodTransfusion === "Yes", 593, 998);
  if (answers.bloodTransfusion === "Yes") {
    t(answers.bloodTransDates, 776, 1016, 600);
  }

  // ── Family History — member rows ──────────────────────────────────────────
  const famCoords = {
    father:   [[173, 1217], [314, 1217], [468, 1217]],
    mother:   [[173, 1258], [314, 1258], [468, 1258]],
    brother1: [[173, 1306], [314, 1306], [468, 1306]],
    brother2: [[173, 1341], [314, 1341], [468, 1341]],
    brother3: [[173, 1380], [314, 1380], [468, 1380]],
    brother4: [[173, 1418], [314, 1418], [468, 1418]],
    sister1:  [[173, 1457], [314, 1457], [468, 1457]],
    sister2:  [[173, 1495], [314, 1495], [468, 1495]],
    sister3:  [[173, 1534], [314, 1535], [468, 1534]],
    sister4:  [[173, 1570], [314, 1570], [468, 1570]],
  };

  Object.entries(famCoords).forEach(([key, [[ax, ay], [bx, by], [cx, cy]]]) => {
    t(answers[`fam_${key}_AgeLiving`],  ax, ay, 120);
    t(answers[`fam_${key}_AgeDeath`],   bx, by, 120);
    t(answers[`fam_${key}_Conditions`], cx, cy, 450);
  });

  // ── Disease checkboxes + relationship ─────────────────────────────────────
  const diseases = [
    ["Arthritis",          970, 1200],
    ["Asthma",             970, 1242],
    ["Cancer",             970, 1290],
    ["Diabetes",           970, 1332],
    ["Gout",               970, 1367],
    ["Heart Disease",      970, 1406],
    ["High blood pressure",970, 1444],
    ["Kidney Disease",     970, 1482],
    ["Stroke",             970, 1518],
    ["Other",              970, 1556],
  ];

  diseases.forEach(([name, x, y]) => {
    const dkey   = `famDis_${name.replace(/\s/g,"_")}`;
    const relKey = `famDisRel_${name.replace(/\s/g,"_")}`;
    cb(answers[dkey], x, y - 14);
    // Relationship text sits to the right of the checkbox column (~1280px)
    t(answers[relKey], 1280, y, 280);
  });

  // ── Additional Information ─────────────────────────────────────────────────
  if (answers.additionalInfo) {
    const lines = wrapText(ctx, answers.additionalInfo, 1520, FONT_SIZE);
    lines.forEach((line, i) => t(line, 32, 1668 + i * (FONT_SIZE + 8), 1520));
  }

  // ── Signature ─────────────────────────────────────────────────────────────
  if (answers.hhSignature) {
    const sigImg = new window.Image();
    sigImg.src = answers.hhSignature;
    // Drawn async — handled in drawPage2Async
  }
  t(answers.hhSigDate, 1264, 2069, 240);
}

// Wrap text helper
function wrapText(ctx, text, maxWidth, fontSize) {
  ctx.font = `${fontSize}px ${FONT_FACE}`;
  const words = text.split(" ");
  const lines = [];
  let current = "";
  words.forEach(word => {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function HealthHistoryImageMapper({ answers, silentMode = false, onPdfReady }) {
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);
  const [status, setStatus] = useState("loading");

  const drawBothPages = useCallback(() => {
    const c1 = canvas1Ref.current;
    const c2 = canvas2Ref.current;
    if (!c1 || !c2) return;

    c1.width = P1W; c1.height = P1H;
    c2.width = P2W; c2.height = P2H;

    const ctx1 = c1.getContext("2d");
    const ctx2 = c2.getContext("2d");

    const bg1 = new window.Image();
    const bg2 = new window.Image();
    
    bg1.src = "/patient-health-history-page-1.jpg";
    bg2.src = "/patient-health-history-page-2.jpg";

    let loaded = 0;
    const onBothLoaded = () => {
      loaded++;
      if (loaded < 2) return;

      // Draw page 1
      ctx1.drawImage(bg1, 0, 0, P1W, P1H);
      drawPage1(ctx1, answers);

      // Draw page 2 — handle async signature
      ctx2.drawImage(bg2, 0, 0, P2W, P2H);
      drawPage2(ctx2, answers);

      if (answers.hhSignature) {
        const sigImg = new window.Image();
        sigImg.onload = () => {
          const sw = 500, sh = 60;
          ctx2.drawImage(sigImg, 275, 2069 - sh, sw, sh);
          setStatus("ready");
        };
        sigImg.src = answers.hhSignature;
      } else {
        setStatus("ready");
      }
    };

    bg1.onload = onBothLoaded;
    bg2.onload = onBothLoaded;
    bg1.onerror = () => { ctx1.fillStyle="#fff"; ctx1.fillRect(0,0,P1W,P1H); ctx1.fillStyle="#374151"; ctx1.font="bold 28px Arial"; ctx1.fillText("⚠ Place patient-health-history-page-1.jpg in /public",40,80); drawPage1(ctx1,answers); setStatus("ready"); };
    bg2.onerror = () => { ctx2.fillStyle="#fff"; ctx2.fillRect(0,0,P2W,P2H); ctx2.fillStyle="#374151"; ctx2.font="bold 28px Arial"; ctx2.fillText("⚠ Place patient-health-history-page-2.jpg in /public",40,80); drawPage2(ctx2,answers); setStatus("ready"); };
  }, [answers]);

  const refCallback1 = useCallback(node => { if (node) { canvas1Ref.current = node; drawBothPages(); } }, [drawBothPages]);
  const refCallback2 = useCallback(node => { if (node) { canvas2Ref.current = node; } }, []);

  // ── PDF ───────────────────────────────────────────────────────────────────
  const buildPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const img1  = canvas1Ref.current?.toDataURL("image/jpeg", 0.7);
    const img2  = canvas2Ref.current?.toDataURL("image/jpeg", 0.7);
    if (img1) pdf.addImage(img1, "JPEG", 0, 0, 210, 297);
    if (img2) { pdf.addPage(); pdf.addImage(img2, "JPEG", 0, 0, 210, 297); }
    return pdf;
  };

  const handleDownload = async () => {
    try {
      const pdf = await buildPdf();
      pdf.save(`HealthHistory_${answers.hhName || "patient"}_${answers.hhTodayDate || "form"}.pdf`);
    } catch (err) {
      console.error("PDF failed:", err);
    }
  };

  // Silent mode
  useEffect(() => {
    if (!silentMode || status !== "ready") return;
    (async () => {
      try {
        const pdf  = await buildPdf();
        const blob = pdf.output("blob");
        if (onPdfReady) onPdfReady(() => pdf.save(`HealthHistory_${answers.hhName || "patient"}.pdf`), blob);
      } catch (err) { console.error("Silent PDF failed:", err); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [silentMode, status]);

  if (silentMode) {
    return (
      <>
        <canvas ref={refCallback1} style={{ display:"block", width:`${P1W}px`, height:`${P1H}px` }} />
        <canvas ref={refCallback2} style={{ display:"block", width:`${P2W}px`, height:`${P2H}px` }} />
      </>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      <div className="flex items-start justify-between mb-4 px-1 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily:"'Lora', serif" }}>Filled Form Preview</h2>
          <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>2 pages — A4. Download saves as PDF.</p>
        </div>
        {status === "ready" && (
          <button onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
            style={{ backgroundColor:"#7d4f50", fontFamily:"'Source Sans 3', sans-serif" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF (2 pages)
          </button>
        )}
      </div>

      {["Page 1", "Page 2"].map((label, pi) => (
        <div key={pi}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>{label}</p>
          <div className="relative border-2 border-slate-200 rounded-2xl overflow-auto bg-slate-100 shadow-inner" style={{ maxHeight:"80vh" }}>
            {status === "loading" && pi === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10 rounded-2xl">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
              </div>
            )}
            <canvas
              ref={pi === 0 ? refCallback1 : refCallback2}
              style={{ display:"block", width:`${pi===0 ? P1W : P2W}px`, height:`${pi===0 ? P1H : P2H}px`, minWidth:`${pi===0 ? P1W : P2W}px` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}