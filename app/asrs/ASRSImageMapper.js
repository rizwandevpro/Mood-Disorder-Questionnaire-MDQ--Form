"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ASRSImageMapper.js — draws answers onto 2-page ASRS background, exports PDF
//
// Page 1: Adult-ADHD-Self-Report-Scale-Page-1.png  1583×2242  Q1–Q16
// Page 2: Adult-ADHD-Self-Report-Scale-Page-2.png  1586×2243  Q17–Q18
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { QUESTIONS, OPTION_LABELS } from "./asrsSteps";

const PAGE1_W = 1583; const PAGE1_H = 2242;
const PAGE2_W = 1586; const PAGE2_H = 2243;
const BRAND   = "#7d4f50";

// Coordinates per question: [never, rarely, sometimes, often, very often]
const Q_COORDS = {
  q1:  { page:1, xs:[701,878,1051,1227,1390], y:720  },
  q2:  { page:1, xs:[701,878,1051,1227,1390], y:800  },
  q3:  { page:1, xs:[701,878,1051,1227,1390], y:880  },
  q4:  { page:1, xs:[701,878,1051,1227,1390], y:964  },
  q5:  { page:1, xs:[701,878,1051,1227,1390], y:1044 },
  q6:  { page:1, xs:[701,878,1051,1227,1390], y:1130 },
  q7:  { page:1, xs:[701,878,1051,1227,1390], y:1215 },
  q8:  { page:1, xs:[701,878,1051,1227,1390], y:1300 },
  q9:  { page:1, xs:[701,878,1051,1227,1390], y:1380 },
  q10: { page:1, xs:[701,878,1051,1227,1390], y:1457 },
  q11: { page:1, xs:[701,878,1051,1227,1390], y:1537 },
  q12: { page:1, xs:[701,878,1051,1227,1390], y:1620 },
  q13: { page:1, xs:[701,878,1051,1227,1390], y:1700 },
  q14: { page:1, xs:[701,878,1051,1227,1390], y:1784 },
  q15: { page:1, xs:[701,878,1051,1227,1390], y:1870 },
  q16: { page:1, xs:[701,878,1051,1227,1390], y:1947 },
  q17: { page:2, xs:[725,898,1070,1242,1410], y:490  },
  q18: { page:2, xs:[701,878,1051,1227,1390], y:576  },
};

// Draw a checkmark only (no border)
function drawCheck(ctx, x, y) {
  const s = 14; // half-size of check area
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

function renderPage(ctx, bg, answers, pageNum) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(bg, 0, 0, ctx.canvas.width, ctx.canvas.height);

  QUESTIONS.forEach(q => {
    const coord = Q_COORDS[q.key];
    if (coord.page !== pageNum) return;
    const selected = answers[q.key];
    if (!selected) return;
    const optIdx = OPTION_LABELS.findIndex(l => l === selected);
    if (optIdx < 0) return;
    drawCheck(ctx, coord.xs[optIdx], coord.y);
  });
}

export default function ASRSImageMapper({ answers, silentMode, onPdfReady }) {
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);

  useEffect(() => {
    if (!canvas1Ref.current || !canvas2Ref.current) return;

    const bg1 = new window.Image();
    const bg2 = new window.Image();
    let loaded = 0;

    const tryBuild = () => {
      loaded++;
      if (loaded < 2) return;

      const ctx1 = canvas1Ref.current.getContext("2d");
      const ctx2 = canvas2Ref.current.getContext("2d");
      renderPage(ctx1, bg1, answers, 1);
      renderPage(ctx2, bg2, answers, 2);

      if (silentMode && onPdfReady) {
        const d1 = canvas1Ref.current.toDataURL("image/jpeg", 0.7);
        const d2 = canvas2Ref.current.toDataURL("image/jpeg", 0.7);

        import("jspdf").then(({ jsPDF }) => {
          const W1 = PAGE1_W * 0.5, H1 = PAGE1_H * 0.5;
          const W2 = PAGE2_W * 0.5, H2 = PAGE2_H * 0.5;
          const pdf = new jsPDF({ orientation:"portrait", unit:"pt", format:[W1, H1] });
          pdf.addImage(d1, "JPEG", 0, 0, W1, H1);
          pdf.addPage([W2, H2], "portrait");
          pdf.addImage(d2, "JPEG", 0, 0, W2, H2);
          const blob = pdf.output("blob");
          const url  = URL.createObjectURL(blob);
          onPdfReady(() => {
            const a = document.createElement("a");
            a.href = url; a.download = "ASRS-ADHD-Screener.pdf"; a.click();
          }, blob);
        });
      }
    };

    bg1.crossOrigin = "anonymous";
    bg2.crossOrigin = "anonymous";
    bg1.onload = tryBuild;
    bg2.onload = tryBuild;
    bg1.src = "/Adult-ADHD-Self-Report-Scale-Page-1.jpg";
    bg2.src = "/Adult-ADHD-Self-Report-Scale-Page-2.jpg";
  }, [answers]);

  const canvasStyle = silentMode
    ? { display:"block", width:"1px", height:"1px" }
    : { width:"100%", height:"auto", display:"block", borderRadius:"8px", marginBottom:"8px" };

  return (
    <>
      <canvas ref={canvas1Ref} width={PAGE1_W} height={PAGE1_H} style={canvasStyle} />
      <canvas ref={canvas2Ref} width={PAGE2_W} height={PAGE2_H} style={canvasStyle} />
    </>
  );
}