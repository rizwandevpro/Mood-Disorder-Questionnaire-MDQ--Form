"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Q1_ITEMS, Q3_OPTION_INDEX, Q3_LABELS } from "./mdqSteps";

export const POS = {
  Q1: [
    { yes: { x: 991, y: 399 }, no: { x: 1086, y: 399 } },
    { yes: { x: 991, y: 461 }, no: { x: 1086, y: 461 } },
    { yes: { x: 991, y: 507 }, no: { x: 1086, y: 507 } },
    { yes: { x: 991, y: 554 }, no: { x: 1086, y: 554 } },
    { yes: { x: 991, y: 601 }, no: { x: 1086, y: 601 } },
    { yes: { x: 991, y: 648 }, no: { x: 1086, y: 648 } },
    { yes: { x: 991, y: 709 }, no: { x: 1086, y: 709 } },
    { yes: { x: 991, y: 769 }, no: { x: 1086, y: 769 } },
    { yes: { x: 991, y: 820 }, no: { x: 1086, y: 820 } },
    { yes: { x: 991, y: 881 }, no: { x: 1086, y: 881 } },
    { yes: { x: 991, y: 942 }, no: { x: 1086, y: 942 } },
    { yes: { x: 991, y: 1004 }, no: { x: 1086, y: 1004 } },
    { yes: { x: 991, y: 1065 }, no: { x: 1086, y: 1065 } },
  ],
  Q2: { yes: { x: 991, y: 1130 }, no: { x: 1086, y: 1128 } },
  Q3: [
    { x: 183, y: 1290 },
    { x: 343, y: 1290 },
    { x: 532, y: 1290 },
    { x: 756, y: 1290 },
  ],
  Q4: { yes: { x: 991, y: 1352 }, no: { x: 1086, y: 1353 } },
  Q5: { yes: { x: 991, y: 1430 }, no: { x: 1086, y: 1429 } },
  NAME_X: 235, NAME_Y: 210,
  DATE_X: 885, DATE_Y: 210,
};

const CANVAS_W = 1275;
const CANVAS_H = 1650;

// ─── MDQImageMapper ───────────────────────────────────────────────────────────
// New prop: onPdfReady(downloadFn) — called once the PDF has been built.
// page.js stores that function and calls it when the user clicks Download.
export default function MDQImageMapper({ answers, silentMode = false, onPdfReady }) {
  const canvasRef              = useRef(null);
  const [status, setStatus]    = useState("loading");
  const [emailStatus, setEmailStatus] = useState("idle");

  // ── Draw canvas ─────────────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;

    const img = new window.Image();
    img.src = "/mdq-bg.jpg";

    img.onload = () => {
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);

      const drawBubble = (x, y, r = 11) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(29, 78, 216, 0.90)";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x - 4.5, y + 0.5);
        ctx.lineTo(x - 1,   y + 4);
        ctx.lineTo(x + 5.5, y - 4.5);
        ctx.stroke();
      };

      const drawText = (text, x, y, fontSize = 22, color = "#111827") => {
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
        ctx.fillText(text, x, y);
      };

      if (answers.name) drawText(answers.name, POS.NAME_X, POS.NAME_Y);
      if (answers.date) drawText(answers.date,  POS.DATE_X, POS.DATE_Y);

      Q1_ITEMS.forEach((item, i) => {
        const answer = answers[item.key];
        const coords = POS.Q1[i];
        if (answer === "yes") drawBubble(coords.yes.x, coords.yes.y);
        if (answer === "no")  drawBubble(coords.no.x,  coords.no.y);
      });

      if (answers.q2 === "yes") drawBubble(POS.Q2.yes.x, POS.Q2.yes.y);
      if (answers.q2 === "no")  drawBubble(POS.Q2.no.x,  POS.Q2.no.y);

      if (answers.q3 != null) {
        const idx = Q3_OPTION_INDEX[answers.q3];
        if (idx !== undefined) drawBubble(POS.Q3[idx].x, POS.Q3[idx].y);
      }

      if (answers.q4 === "yes") drawBubble(POS.Q4.yes.x, POS.Q4.yes.y);
      if (answers.q4 === "no")  drawBubble(POS.Q4.no.x,  POS.Q4.no.y);
      if (answers.q5 === "yes") drawBubble(POS.Q5.yes.x, POS.Q5.yes.y);
      if (answers.q5 === "no")  drawBubble(POS.Q5.no.x,  POS.Q5.no.y);

      setStatus("ready");
    };

    img.onerror = () => {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#1e3a8a";
      ctx.font = "bold 34px Arial";
      ctx.fillText("MDQ — Filled Form", 80, 100);
      ctx.fillStyle = "#374151";
      ctx.font = "bold 22px Arial";
      ctx.fillText(`Patient: ${answers.name || "—"}     Date: ${answers.date || "—"}`, 80, 210);
      setStatus("ready");
    };
  }, [answers]);

  const refCallback = useCallback((node) => {
    if (node) {
      canvasRef.current = node;
      drawCanvas();
    }
  }, [drawCanvas]);

  // ── Email ───────────────────────────────────────────────────────────────────
  const sendEmail = async (pdf) => {
    setEmailStatus("sending");
    try {
      const dataUri   = pdf.output("datauristring");
      const pdfBase64 = dataUri.split(",")[1];
      const res = await fetch("/api/send-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          patientName:     answers.name            || "",
          patientEmail:    answers.email           || "",
          patientDate:     answers.date            || "",
          patientPhone:    answers.phone           || "",
          clinicLocation:  answers.clinicLocation  || "",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Server error");
      setEmailStatus("sent");
    } catch (err) {
      console.error("[sendEmail]", err);
      setEmailStatus("error");
    }
  };

  // ── Load jsPDF ──────────────────────────────────────────────────────────────
  const loadJsPDF = () =>
    new Promise((resolve, reject) => {
      if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
      const script   = document.createElement("script");
      script.src     = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload  = () => resolve(window.jspdf.jsPDF);
      script.onerror = () => reject(new Error("Failed to load jsPDF"));
      document.head.appendChild(script);
    });

  // ── Build PDF — returns the jsPDF instance ──────────────────────────────────
  const buildPdf = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const JsPDF   = await loadJsPDF();
    const imgData = canvas.toDataURL("image/jpeg", 0.97);
    const PAGE_W_MM = 210;
    const PAGE_H_MM = 297;

    const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    pdf.addImage(imgData, "JPEG", 0, 0, PAGE_W_MM, PAGE_H_MM);

    await new Promise((resolve) => {
      const page2Img = new window.Image();
      page2Img.src   = "/mdq-bg-2.jpg";
      page2Img.onload = () => {
        const tmp = document.createElement("canvas");
        tmp.width  = page2Img.naturalWidth;
        tmp.height = page2Img.naturalHeight;
        tmp.getContext("2d").drawImage(page2Img, 0, 0);
        pdf.addPage("a4", "portrait");
        pdf.addImage(tmp.toDataURL("image/jpeg", 0.97), "JPEG", 0, 0, PAGE_W_MM, PAGE_H_MM);
        resolve();
      };
      page2Img.onerror = () => {
        pdf.addPage("a4", "portrait");
        pdf.setFontSize(14);
        pdf.setTextColor(180, 0, 0);
        pdf.text("⚠ Page 2 image not found — place mdq-bg-2.jpg in /public", 10, 20);
        resolve();
      };
    });

    return pdf;
  };

  // ── handleDownload — save locally (used by the visible Download button) ─────
  const handleDownload = async () => {
    setEmailStatus("idle");
    try {
      const pdf = await buildPdf();
      if (!pdf) return;
      pdf.save(`MDQ_${answers.name || "result"}_${answers.date || "form"}.pdf`);
      await sendEmail(pdf);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF export failed — check the browser console for details.");
    }
  };

  // ── silentMode: email only when canvas is ready, then tell page.js we're ready
  useEffect(() => {
    if (!silentMode || status !== "ready") return;

    (async () => {
      try {
        const pdf = await buildPdf();
        if (!pdf) return;
        // Email silently — no save()
        await sendEmail(pdf);
        // Give page.js a function it can call to trigger a download later
        if (onPdfReady) {
          onPdfReady(() => {
            pdf.save(`MDQ_${answers.name || "result"}_${answers.date || "form"}.pdf`);
          });
        }
      } catch (err) {
        console.error("Silent PDF failed:", err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [silentMode, status]);

  // ── silentMode render: canvas only ─────────────────────────────────────────
  if (silentMode) {
    return (
      <canvas
        ref={refCallback}
        style={{ display: "block", width: `${CANVAS_W}px`, height: `${CANVAS_H}px` }}
      />
    );
  }

  // ── Normal render ───────────────────────────────────────────────────────────
  return (
    <div className="mt-10">
      <div className="flex items-start justify-between mb-4 px-1 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Lora', serif" }}>
            Filled Form Preview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
            Fixed at 1275 × 1650 px — scroll to view. Download saves as A4 PDF.
          </p>
        </div>
        {status === "ready" && (
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={emailStatus === "sending"}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-900 to-blue-700 text-white font-semibold text-sm rounded-xl hover:from-blue-950 hover:to-blue-800 shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Source Sans 3', sans-serif" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Download PDF
            </button>
            {emailStatus === "sending" && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                Sending emails…
              </div>
            )}
            {emailStatus === "sent" && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Emails sent successfully
              </div>
            )}
            {emailStatus === "error" && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
                </svg>
                Email failed — check console
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className="relative border-2 border-slate-200 rounded-2xl overflow-auto bg-slate-100 shadow-inner"
        style={{ maxHeight: "80vh" }}
      >
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10 rounded-2xl">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                Rendering form…
              </p>
            </div>
          </div>
        )}
        <canvas
          ref={refCallback}
          style={{
            display:  "block",
            width:    `${CANVAS_W}px`,
            height:   `${CANVAS_H}px`,
            minWidth: `${CANVAS_W}px`,
          }}
        />
      </div>

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <p className="text-xs font-bold text-amber-800 mb-3 uppercase tracking-wider" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
          📍 How to adjust bubble positions — edit POS in MDQImageMapper.js
        </p>
        <div className="font-mono text-xs text-amber-900 space-y-1.5 leading-relaxed">
          <p className="text-amber-600 font-semibold">Q1 — per-item coordinates (YES and NO independent):</p>
          {POS.Q1.map((item, i) => (
            <p key={i}>
              <span className="text-blue-700">Q1[{i}]</span>
              {"  "}YES x={item.yes.x} y={item.yes.y}
              {"  "}NO x={item.no.x} y={item.no.y}
            </p>
          ))}
          <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            <p><span className="text-blue-700">Q2</span>{"  "}YES x={POS.Q2.yes.x} y={POS.Q2.yes.y}{"  "}NO x={POS.Q2.no.x} y={POS.Q2.no.y}</p>
            <p><span className="text-blue-700">Q4</span>{"  "}YES x={POS.Q4.yes.x} y={POS.Q4.yes.y}{"  "}NO x={POS.Q4.no.x} y={POS.Q4.no.y}</p>
            <p><span className="text-blue-700">Q5</span>{"  "}YES x={POS.Q5.yes.x} y={POS.Q5.yes.y}{"  "}NO x={POS.Q5.no.x} y={POS.Q5.no.y}</p>
          </div>
          <p className="pt-1 text-amber-600 font-semibold">Q3 — horizontal circles:</p>
          {POS.Q3.map((c, i) => (
            <p key={i}><span className="text-blue-700">Q3[{i}]</span>{"  "}x={c.x} y={c.y}{"  "}← {["No problem", "Minor problem", "Moderate problem", "Serious problem"][i]}</p>
          ))}
        </div>
      </div>
    </div>
  );
}