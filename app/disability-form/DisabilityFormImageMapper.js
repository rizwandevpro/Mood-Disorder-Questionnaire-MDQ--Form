"use client";

import { useEffect, useRef } from "react";

const CANVAS_W = 1500;
const CANVAS_H = 1941;

const FIELDS = {
  patientInitials: { x: 390, y: 1682 },
  sigDate:         { x: 760, y: 1682 },
};

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
      a.download = "Disability-Form.pdf";
      a.click();
    }, blob);
  }).catch(err => console.error("jsPDF error:", err));
}

export default function DisabilityFormImageMapper({ answers, silentMode, onPdfReady }) {
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

      // Patient initials + date
      drawText(ctx, (answers.patientInitials || "").toUpperCase(), FIELDS.patientInitials.x, FIELDS.patientInitials.y);
      drawText(ctx, formatDate(answers.consentDate),                FIELDS.sigDate.x,         FIELDS.sigDate.y);

      if (silentMode && onPdfReady) buildPdf(canvas, onPdfReady);
    };

    bg.src = "/cancellation-no-show-policy.jpg";
  }, []);  // Run once on mount — answers are captured via closure at mount time

  const hidden  = { display:"block", width:"1px", height:"1px" };
  const visible = { width:"100%", height:"auto", display:"block", borderRadius:"8px" };

  return <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={silentMode ? hidden : visible} />;
}