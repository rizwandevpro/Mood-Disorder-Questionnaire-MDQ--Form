"use client";

import { useEffect, useRef } from "react";

const CANVAS_W = 1584;
const CANVAS_H = 2238;
const BRAND    = "#7d4f50";
const CIRCLE_R = 22;

const YN_COORDS = {
  q1: { YES:[1040,1541], NO:[1091,1541] },
  q2: { YES:[1225,1627], NO:[1280,1627] },
  q3: { YES:[1072,1716], NO:[1129,1716] },
};

const FIELDS = {
  familyLine1: { x: 150, y: 1854 },
  familyLine2: { x: 150, y: 1899 },
  printName:   { x: 515, y: 1940 },
  sigDate:     { x: 934, y: 2026 },
};

const SIG = { x: 150, y: 1970, w: 680, h: 80 };

function drawCircle(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = BRAND;
  ctx.lineWidth   = 4;
  ctx.beginPath();
  ctx.arc(x, y, CIRCLE_R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawText(ctx, text, x, y, fontSize) {
  if (!text) return;
  ctx.save();
  ctx.font         = `600 ${fontSize || 28}px Arial, sans-serif`;
  ctx.fillStyle    = "#1e293b";
  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return (m && d && y) ? `${m}/${d}/${y}` : isoDate;
}

function buildPdf(canvas, onPdfReady) {
  const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
  import("jspdf").then(({ jsPDF }) => {
    const W = CANVAS_W * 0.5, H = CANVAS_H * 0.5;
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [W, H] });
    pdf.addImage(dataUrl, "JPEG", 0, 0, W, H);
    const blob = pdf.output("blob");
    const url  = URL.createObjectURL(blob);
    onPdfReady(() => {
      const a = document.createElement("a");
      a.href = url;
      a.download = "HIPAA-Patient-Consent.pdf";
      a.click();
    });
  }).catch(err => console.error("jsPDF error:", err));
}

export default function HIPAAImageMapper({ answers, silentMode, onPdfReady }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");

    const bg = new window.Image();

    bg.onerror = () => console.error("Failed to load background image");

    bg.onload = () => {
      // Draw background
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);

      // YES/NO circles
      Object.entries(YN_COORDS).forEach(([key, coords]) => {
        const val = answers[key];
        if (!val || !coords[val]) return;
        const [x, y] = coords[val];
        drawCircle(ctx, x, y);
      });

      // Family members text
      const members = (answers.familyMembers || "").split("\n");
      drawText(ctx, members[0] || "", FIELDS.familyLine1.x, FIELDS.familyLine1.y);
      drawText(ctx, members[1] || "", FIELDS.familyLine2.x, FIELDS.familyLine2.y);

      // Print name + date
      drawText(ctx, answers.printName || "",          FIELDS.printName.x, FIELDS.printName.y);
      drawText(ctx, formatDate(answers.consentDate),  FIELDS.sigDate.x,   FIELDS.sigDate.y);

      // Signature — draw then export, or export directly if none
      const sigData = answers.signatureData;
      if (sigData) {
        const sigImg = new window.Image();
        sigImg.onload = () => {
          ctx.drawImage(sigImg, SIG.x, SIG.y, SIG.w, SIG.h);
          if (silentMode && onPdfReady) buildPdf(canvas, onPdfReady);
        };
        sigImg.onerror = () => {
          // Signature failed to load — still export without it
          if (silentMode && onPdfReady) buildPdf(canvas, onPdfReady);
        };
        sigImg.src = sigData;
      } else {
        if (silentMode && onPdfReady) buildPdf(canvas, onPdfReady);
      }
    };

    bg.src = "/HIPAA_Compliance_Patient_Consent_Form.png";
  }, []);  // Run once on mount — answers are captured via closure at mount time

  const hidden  = { display:"block", width:"1px", height:"1px" };
  const visible = { width:"100%", height:"auto", display:"block", borderRadius:"8px" };

  return <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={silentMode ? hidden : visible} />;
}