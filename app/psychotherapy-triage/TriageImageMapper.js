"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TriageImageMapper.js
//
// Renders the single-page Psychotherapy Triage Questions form onto canvas,
// then exports as a 1-page PDF.
//
// Page bg: /public/psychotherapy-triage-questions.jpg  (1024 × 1536)
//
// CHECKBOX DRAWING:
//   drawCheck(ctx, x, y) — draws a ✓ mark at the given coordinate
//   x, y = top-left corner of the checkbox square on the form image
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useCallback, useState } from "react";
import { TQ_QUESTIONS, tqMultiKey } from "./triageSteps";

const PW = 1024; const PH = 1536;
const FONT_SIZE   = 20;   // px — text fields (smaller image than Health History, scale down)
const FONT_FACE   = "Arial, sans-serif";
const FONT_WEIGHT = "500";
const TEXT_COLOR  = "#111827";
const CHECK_SIZE  = 26;   // checkbox tick size

// ── Helpers ───────────────────────────────────────────────────────────────────
function drawText(ctx, text, x, y, maxWidth = 300, size = FONT_SIZE) {
  if (!text) return;
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `${FONT_WEIGHT} ${size}px ${FONT_FACE}`;
  ctx.fillText(String(text), x, y, maxWidth);
}

function drawCheck(ctx, x, y, size = CHECK_SIZE) {
  ctx.strokeStyle = "#111827";
  ctx.lineWidth   = 3.5;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.15, y + size * 0.5);
  ctx.lineTo(x + size * 0.4,  y + size * 0.75);
  ctx.lineTo(x + size * 0.85, y + size * 0.2);
  ctx.stroke();
}

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
// COORDINATE MAPS — one entry per checkbox, [x, y] = top-left of the box
// ─────────────────────────────────────────────────────────────────────────────
const Q1_MAP = {
  "Anxiety or excessive worry":      [72, 434],
  "Relationship or family problems": [385, 434],
  "Anger or irritability":           [706, 434],
  "Depression or low mood":          [72, 479],
  "Grief or loss":                   [385, 479],
  "ADHD/executive functioning":      [706, 479],
  "Stress from work or school":      [72, 527],
  "Trauma or PTSD symptoms":         [385, 527],
  "Other":                           [706, 527],
};
const Q1_OTHER_TEXT_XY = [814, 544];

const Q2_MAP = {
  "Not at all":  [72, 681],
  "A little":    [299, 681],
  "Moderately":  [501, 681],
  "Severely":    [714, 681],
};

const Q3_MAP = {
  "Healthy coping (exercise, prayer, meditation, hobbies)": [72, 821],
  "Talking with family or friends":                         [72, 886],
  "Counseling or therapy skills":                           [72, 924],
  "Avoiding situations":                                    [513, 821],
  "Alcohol or drug use":                                    [513, 863],
  "No coping strategies":                                   [513, 898],
  "Other":                                                  [513, 937],
};
const Q3_OTHER_TEXT_XY = [615, 953];

const Q4_MAP = {
  "Reduce anxiety":               [72, 1063],
  "Improve mood":                 [72, 1100],
  "Improve focus/concentration":  [72, 1137],
  "Better sleep":                 [384, 1063],
  "Improve relationships":        [384, 1100],
  "Manage stress":                [384, 1137],
  "Better emotional control":     [705, 1063],
  "Increase motivation":          [705, 1100],
  "Other":                        [705, 1137],
};
const Q4_OTHER_TEXT_XY = [807, 1159];

const Q5_MAP = {
  "Excessive worrying":              [72, 1269],
  "Negative thoughts about myself":  [72, 1307],
  "Feeling hopeless":                [72, 1343],
  "Racing thoughts":                 [384, 1269],
  "Intrusive or unwanted thoughts":  [384, 1307],
  "Anger or resentment":             [384, 1343],
  "None of the above":               [705, 1269],
  "Other":                           [705, 1307],
};
const Q5_OTHER_TEXT_XY = [806, 1323];

const NAME_XY = [131, 1429];
const DATE_XY = [705, 1429];

// ─────────────────────────────────────────────────────────────────────────────
// PAGE DRAW
// ─────────────────────────────────────────────────────────────────────────────
function drawPage(ctx, answers) {
  const cb = (x, y) => drawCheck(ctx, x, y);

  // ── Q1 (single-select) ────────────────────────────────────────────────────
  const q1 = answers.ptqQ1;
  if (q1 && Q1_MAP[q1]) {
    const [x, y] = Q1_MAP[q1];
    cb(x, y);
    if (q1 === "Other" && answers.ptqQ1Other) {
      drawText(ctx, answers.ptqQ1Other, Q1_OTHER_TEXT_XY[0], Q1_OTHER_TEXT_XY[1], 190, 18);
    }
  }

  // ── Q2 (single-select) ────────────────────────────────────────────────────
  const q2 = answers.ptqQ2;
  if (q2 && Q2_MAP[q2]) {
    const [x, y] = Q2_MAP[q2];
    cb(x, y);
  }

  // ── Q3 (multi-select) ─────────────────────────────────────────────────────
  const q3Question = TQ_QUESTIONS.find(q => q.id === "q3");
  q3Question.options.forEach(opt => {
    const key = tqMultiKey("q3", opt);
    if (answers[key] && Q3_MAP[opt]) {
      const [x, y] = Q3_MAP[opt];
      cb(x, y);
    }
  });
  if (answers[tqMultiKey("q3", "Other")] && answers.ptqQ3Other) {
    drawText(ctx, answers.ptqQ3Other, Q3_OTHER_TEXT_XY[0], Q3_OTHER_TEXT_XY[1], 300, 18);
  }

  // ── Q4 (single-select) ────────────────────────────────────────────────────
  const q4 = answers.ptqQ4;
  if (q4 && Q4_MAP[q4]) {
    const [x, y] = Q4_MAP[q4];
    cb(x, y);
    if (q4 === "Other" && answers.ptqQ4Other) {
      drawText(ctx, answers.ptqQ4Other, Q4_OTHER_TEXT_XY[0], Q4_OTHER_TEXT_XY[1], 190, 18);
    }
  }

  // ── Q5 (single-select) ────────────────────────────────────────────────────
  const q5 = answers.ptqQ5;
  if (q5 && Q5_MAP[q5]) {
    const [x, y] = Q5_MAP[q5];
    cb(x, y);
    if (q5 === "Other" && answers.ptqQ5Other) {
      drawText(ctx, answers.ptqQ5Other, Q5_OTHER_TEXT_XY[0], Q5_OTHER_TEXT_XY[1], 190, 18);
    }
  }

  // ── Name / Date ────────────────────────────────────────────────────────────
  drawText(ctx, answers.ptqName, NAME_XY[0], NAME_XY[1], 500);
  drawText(ctx, answers.ptqDate, DATE_XY[0], DATE_XY[1], 250);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function TriageImageMapper({ answers, silentMode = false, onPdfReady }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("loading");

  const drawPageAndMaybeBuildPdf = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;

    c.width = PW; c.height = PH;
    const ctx = c.getContext("2d");

    const bg = new window.Image();
    bg.crossOrigin = "anonymous";
    bg.src = "/psychotherapy-triage-questions.jpg";

    const finish = () => {
      drawPage(ctx, answers);

      if (silentMode && onPdfReady) {
        const dataUrl = c.toDataURL("image/jpeg", 0.85);
        import("jspdf").then(({ jsPDF }) => {
          const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
          pdf.addImage(dataUrl, "JPEG", 0, 0, 210, 297);
          const blob = pdf.output("blob");
          const url  = URL.createObjectURL(blob);
          onPdfReady(() => {
            const a = document.createElement("a");
            a.href = url;
            a.download = `TriageQuestions_${answers.ptqName || "patient"}.pdf`;
            a.click();
          }, blob);
        });
      }
      setStatus("ready");
    };

    bg.onload = () => { ctx.drawImage(bg, 0, 0, PW, PH); finish(); };
    bg.onerror = () => {
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, PW, PH);
      ctx.fillStyle = "#374151"; ctx.font = "bold 22px Arial";
      ctx.fillText("⚠ Place psychotherapy-triage-questions.jpg in /public", 30, 60);
      finish();
    };
  }, [answers, silentMode, onPdfReady]);

  const refCallback = useCallback(node => {
    if (node) { canvasRef.current = node; drawPageAndMaybeBuildPdf(); }
  }, [drawPageAndMaybeBuildPdf]);

  const handleDownload = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const img = canvasRef.current?.toDataURL("image/jpeg", 0.85);
      if (img) pdf.addImage(img, "JPEG", 0, 0, 210, 297);
      pdf.save(`TriageQuestions_${answers.ptqName || "patient"}_${answers.ptqDate || "form"}.pdf`);
    } catch (err) { console.error("PDF failed:", err); }
  };

  if (silentMode) {
    return <canvas ref={refCallback} style={{ display: "block", width: `${PW}px`, height: `${PH}px` }} />;
  }

  return (
    <div className="mt-10 space-y-8">
      <div className="flex items-start justify-between mb-4 px-1 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Lora', serif" }}>Filled Form Preview</h2>
          <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>1 page — A4. Download saves as PDF.</p>
        </div>
        {status === "ready" && (
          <button onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
            style={{ backgroundColor: "#7d4f50", fontFamily: "'Source Sans 3', sans-serif" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        )}
      </div>

      <div className="relative border-2 border-slate-200 rounded-2xl overflow-auto bg-slate-100 shadow-inner" style={{ maxHeight: "80vh" }}>
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10 rounded-2xl">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        )}
        <canvas ref={refCallback} style={{ display: "block", width: `${PW}px`, height: `${PH}px`, minWidth: `${PW}px` }} />
      </div>
    </div>
  );
}
