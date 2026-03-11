"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PHQ9ImageMapper.js
// Background: Patient-Health-Questionnaire-PHQ-9.png (assumed ~1700×2244)
//
// Q1–Q9: 4 options each [Not at all, Several days, More than half, Nearly every day]
// Q coords provided — draws checkmark only (no border)
//
// Add columns (scores 1,2,3 only — "Not at all" col not counted):
//   score=1 → x=1274, score=2 → x=1452, score=3 → x=1627, y=1764
//
// Q10 difficulty — line mark at right side:
//   Not difficult at all: x=1620, y=1975
//   Somewhat difficult:   x=1620, y=2040
//   Very difficult:       x=1620, y=2110
//   Extremely difficult:  x=1620, y=2170
//
// Name: drawn at top (approximate coords based on form layout)
// Date: drawn at top right
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { QUESTIONS, OPTIONS, DIFFICULTY_OPTIONS } from "./phq9Steps";

const CANVAS_W = 1809;
const CANVAS_H = 2352;
const BG_SRC   = "/Patient-Health-Questionnaire-PHQ-9.png";
const BRAND    = "#7d4f50";

// Q1–Q9 option x positions: [Not at all, Several days, More than half, Nearly every day]
const OPTION_X = [1055, 1230, 1395, 1572];

const Q_COORDS = [
  { key:"q1", y: 524  },
  { key:"q2", y: 640  },
  { key:"q3", y: 745  },
  { key:"q4", y: 846  },
  { key:"q5", y: 960  },
  { key:"q6", y: 1095 },
  { key:"q7", y: 1245 },
  { key:"q8", y: 1435 },
  { key:"q9", y: 1635 },
];

// Column totals — score 1,2,3 (no "Not at all" column)
const COL_TOTAL = [
  { score: 1, x: 1274, y: 1764 },
  { score: 2, x: 1452, y: 1764 },
  { score: 3, x: 1627, y: 1764 },
];

const DIFFICULTY_COORDS = [
  { label: "Not difficult at all", x: 1620, y: 1975 },
  { label: "Somewhat difficult",   x: 1620, y: 2040 },
  { label: "Very difficult",       x: 1620, y: 2110 },
  { label: "Extremely difficult",  x: 1620, y: 2170 },
];

// Name/Date approximate positions on form
const NAME_X = 403;  const NAME_Y = 241;
const DATE_X = 1412; const DATE_Y = 241;

function drawCheck(ctx, x, y) {
  const s = 14;
  ctx.save();
  ctx.strokeStyle = BRAND;
  ctx.lineWidth   = 5;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";
  ctx.beginPath();
  ctx.moveTo(x - s * 0.7, y);
  ctx.lineTo(x - s * 0.1, y + s * 0.6);
  ctx.lineTo(x + s * 0.8, y - s * 0.6);
  ctx.stroke();
  ctx.restore();
}

function drawText(ctx, text, x, y, font) {
  ctx.save();
  ctx.font         = font || "500 26px Arial, sans-serif";
  ctx.fillStyle    = "#1e293b";
  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawNumber(ctx, value, x, y) {
  ctx.save();
  ctx.font         = "700 28px Arial, sans-serif";
  ctx.fillStyle    = "#1e293b";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value), x, y);
  ctx.restore();
}

export default function PHQ9ImageMapper({ answers, silentMode, onPdfReady }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");

    const bg = new window.Image();
    bg.onload = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);

      // ── Name & Date ──
      if (answers.patientName) drawText(ctx, answers.patientName, NAME_X, NAME_Y);
      if (answers.patientDate) drawText(ctx, answers.patientDate, DATE_X, DATE_Y);

      // ── Q1–Q9 checkmarks ──
      Q_COORDS.forEach(({ key, y }) => {
        const selected = answers[key];
        if (!selected) return;
        const optIdx = OPTIONS.findIndex(o => o.label === selected);
        if (optIdx < 0) return;
        drawCheck(ctx, OPTION_X[optIdx], y);
      });

      // ── Add columns (count of each score 1, 2, 3) ──
      COL_TOTAL.forEach(({ score, x, y }) => {
        const count = QUESTIONS.filter(q => {
          const opt = OPTIONS.find(o => o.label === answers[q.key]);
          return opt && opt.score === score;
        }).length;
        drawNumber(ctx, count, x, y);
      });

      // ── Total score ──
      const total = QUESTIONS.reduce((sum, q) => {
        const opt = OPTIONS.find(o => o.label === answers[q.key]);
        return sum + (opt ? opt.score : 0);
      }, 0);
      // Draw total to the right of "TOTAL:" label (approximate position)
      ctx.save();
      ctx.font      = "700 30px Arial, sans-serif";
      ctx.fillStyle = BRAND;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(total), 1350, 1864);
      ctx.restore();

      // ── Q10 difficulty ──
      const diff = answers.difficulty;
      if (diff) {
        const coord = DIFFICULTY_COORDS.find(d => d.label === diff);
        if (coord) drawCheck(ctx, coord.x, coord.y);
      }

      // ── PDF export ──
      if (silentMode && onPdfReady) {
        const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
        import("jspdf").then(({ jsPDF }) => {
          const W = CANVAS_W * 0.5, H = CANVAS_H * 0.5;
          const pdf = new jsPDF({ orientation:"portrait", unit:"pt", format:[W, H] });
          pdf.addImage(dataUrl, "JPEG", 0, 0, W, H);
          const blob = pdf.output("blob");
          const url  = URL.createObjectURL(blob);
          onPdfReady(() => {
            const a = document.createElement("a");
            a.href = url; a.download = "PHQ9-Depression-Screener.pdf"; a.click();
          });
        });
      }
    };
    bg.src = BG_SRC;
  }, [answers]);

  if (silentMode) {
    return <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{display:"block",width:"1px",height:"1px"}} />;
  }
  return <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{width:"100%",height:"auto",display:"block",borderRadius:"8px"}} />;
}
