"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GAD7ImageMapper.js
//
// Renders answers onto /public/gad-7-anxiety.jpg background, exports PDF.
// Background: 1581 × 2244 px (assumed — adjust if different)
//
// Coordinate map (provided):
//   Q1–Q7 options: x = 794, 932, 1070, 1233  (Not at all / Several / More / Nearly)
//   Q1 y=582  Q2 y=659  Q3 y=730  Q4 y=800
//   Q5 y=864  Q6 y=938  Q7 y=1012
//   Column totals y=1088 at x=817, 967, 1120, 1272
//   Total score: x=1260, y=1150
//   Difficulty x: 201, 579, 884, 1172  y=1380
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { QUESTIONS, OPTIONS, DIFFICULTY_OPTIONS } from "./gad7Steps";

const CANVAS_W = 1581;
const CANVAS_H = 2244;
const BG_SRC   = "/gad-7-anxiety.jpg";
const FONT     = "500 28px Arial, sans-serif";
const BRAND    = "#7d4f50";
const CHECK_SZ = 26; // checkbox square size

// Q coordinate map
const Q_COORDS = [
  { y: 582  },
  { y: 659  },
  { y: 730  },
  { y: 800  },
  { y: 864  },
  { y: 938  },
  { y: 1012 },
];
const OPTION_X = [794, 932, 1070, 1233];

const COL_TOTAL_X = [817, 967, 1120, 1272];
const COL_TOTAL_Y = 1088;

const TOTAL_SCORE_X = 1260;
const TOTAL_SCORE_Y = 1150;

const DIFFICULTY_X = [201, 579, 884, 1172];
const DIFFICULTY_Y = 1380;

function drawCheckbox(ctx, x, y, size, checked) {
  if (!checked) return;
  ctx.save();
  ctx.strokeStyle = BRAND;
  ctx.lineWidth   = 4;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";
  ctx.beginPath();
  ctx.moveTo(x - size * 0.3, y);
  ctx.lineTo(x - size * 0.05, y + size * 0.3);
  ctx.lineTo(x + size * 0.35, y - size * 0.3);
  ctx.stroke();
  ctx.restore();
}

function drawNumber(ctx, value, x, y) {
  ctx.save();
  ctx.font      = FONT;
  ctx.fillStyle = "#1e293b";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value), x, y);
  ctx.restore();
}

export default function GAD7ImageMapper({ answers, silentMode, onPdfReady }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");

    const bg = new window.Image();
    bg.onload = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);

      // ── Q1–Q7: draw checkbox at selected option ──
      QUESTIONS.forEach((q, qi) => {
        const selected = answers[q.key];
        OPTIONS.forEach((opt, oi) => {
          const x = OPTION_X[oi];
          const y = Q_COORDS[qi].y;
          drawCheckbox(ctx, x, y, CHECK_SZ, selected === opt.label);
        });
      });

      // ── Column totals ──
      const colTotals = OPTIONS.map((_, oi) =>
        QUESTIONS.filter(q => answers[q.key] === OPTIONS[oi].label).length
      );
      colTotals.forEach((count, i) => {
        drawNumber(ctx, count, COL_TOTAL_X[i], COL_TOTAL_Y);
      });

      // ── Total score ──
      const total = QUESTIONS.reduce((sum, q) => {
        const opt = OPTIONS.find(o => o.label === answers[q.key]);
        return sum + (opt ? opt.score : 0);
      }, 0);
      ctx.save();
      ctx.font      = "700 32px Arial, sans-serif";
      ctx.fillStyle = BRAND;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(total), TOTAL_SCORE_X, TOTAL_SCORE_Y);
      ctx.restore();

      // ── Difficulty ──
      const diff = answers.difficulty;
      DIFFICULTY_OPTIONS.forEach((opt, i) => {
        drawCheckbox(ctx, DIFFICULTY_X[i], DIFFICULTY_Y, CHECK_SZ, diff === opt);
      });

      // ── Build PDF if silent ──
      if (silentMode && onPdfReady) {
        const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
        import("jspdf").then(({ jsPDF }) => {
          const pdf = new jsPDF({ orientation:"portrait", unit:"pt", format:[CANVAS_W * 0.5, CANVAS_H * 0.5] });
          pdf.addImage(dataUrl, "JPEG", 0, 0, CANVAS_W * 0.5, CANVAS_H * 0.5);
          const blob = pdf.output("blob");
          const url  = URL.createObjectURL(blob);
          onPdfReady(() => {
            const a = document.createElement("a");
            a.href = url; a.download = "GAD7-Anxiety-Screener.pdf"; a.click();
          }, blob);
        });
      }
    };
    bg.src = BG_SRC;
  }, [answers]);

  if (silentMode) {
    return (
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
        style={{display:"block",width:`${CANVAS_W}px`,height:`${CANVAS_H}px`}} />
    );
  }

  return (
    <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
      style={{width:"100%",height:"auto",display:"block",borderRadius:"8px"}} />
  );
}