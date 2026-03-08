"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MDQImageMapper.js
//
// Renders the 1275×1650 filled form canvas.
// Receives `answers` object as a prop from page.js.
//
// ── HOW TO ADJUST BUBBLE POSITIONS ──────────────────────────────────────────
//
//  All coordinates live in the POS object below.
//  The image is 1275 × 1650 px. x goes left→right, y goes top→bottom.
//
//  POS.YES_X        → x pixel for ALL "Yes" column bubbles
//  POS.NO_X         → x pixel for ALL "No" column bubbles
//  POS.Q1_Y[0..12]  → y pixel for each of the 13 Q1 symptom rows
//                      index 0 = first row, index 12 = last row
//  POS.Q2_Y         → y pixel for Question 2 bubble row
//  POS.Q3_X[0..3]   → x pixels for the 4 horizontal Q3 circles
//                      [0]=No problem  [1]=Minor  [2]=Moderate  [3]=Serious
//  POS.Q3_Y         → y pixel shared by all 4 Q3 circles
//  POS.Q4_Y         → y pixel for Question 4 bubble row
//  POS.Q5_Y         → y pixel for Question 5 bubble row
//  POS.NAME_X/Y     → where patient name text is drawn
//  POS.DATE_X/Y     → where date text is drawn
//
//  Example — move only item 3's bubble down by 5px:
//    Q1_Y: [ 310, 359, 390, ...rest ]   ← was 385, now 390
//
//  Example — shift the entire NO column 4px to the right:
//    NO_X: 1090   ← was 1086
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useCallback, useState } from "react";
import { STEPS, Q3_OPTION_INDEX, Q3_LABELS } from "./mdqSteps";

// ═══════════════════════════════════════════════════════════════════════════════
// POSITION CONFIG — edit these values to move any bubble
// ═══════════════════════════════════════════════════════════════════════════════
export const POS = {
  // ── Q1: each item has its own YES and NO coordinate ───────────────────────
  // Format: { yes: { x, y }, no: { x, y } }
  // All YES x values are 991, all NO x values are 1088 — change per-item if needed.
  Q1: [
    { yes: { x: 991, y: 400 }, no: { x: 1086, y: 398 } }, // [0]  item 1  — felt so good / hyper
    { yes: { x: 991, y: 460 }, no: { x: 1086, y: 460 } }, // [1]  item 2  — irritable / fights
    { yes: { x: 991, y: 553 }, no: { x: 1086, y: 506 } }, // [2]  item 3  — self-confident
    { yes: { x: 991, y: 602 }, no: { x: 1086, y: 554 } }, // [3]  item 4  — less sleep
    { yes: { x: 991, y: 650 }, no: { x: 1086, y: 601 } }, // [4]  item 5  — more talkative
    { yes: { x: 991, y: 709 }, no: { x: 1086, y: 648 } }, // [5]  item 6  — racing thoughts
    { yes: { x: 991, y: 770 }, no: { x: 1086, y: 709 } }, // [6]  item 7  — easily distracted
    { yes: { x: 991, y: 820 }, no: { x: 1086, y: 769 } }, // [7]  item 8  — more energy
    { yes: { x: 991, y: 553 }, no: { x: 1086, y: 820 } }, // [8]  item 9  — ⚠ SAME AS ITEM 3 (y=553) — likely a typo, please verify
    { yes: { x: 991, y: 881 }, no: { x: 1086, y: 881 } }, // [9]  item 10 — more social
    { yes: { x: 991, y: 942 }, no: { x: 1086, y: 942 } }, // [10] item 11 — more interested in sex
    { yes: { x: 991, y: 1004 }, no: { x: 1086, y: 1004 } }, // [11] item 12 — risky/unusual behaviour
    { yes: { x: 991, y: 1065 }, no: { x: 1086, y: 1065 } }, // [12] item 13 — spending money trouble
  ],

  // ── Q2 ────────────────────────────────────────────────────────────────────
  Q2: { yes: { x: 991, y: 1130 }, no: { x: 1086, y: 1128 } },

  // ── Q3: 4 horizontal circles ──────────────────────────────────────────────
  // Each option has its own x. Y is shared across all four.
  Q3: [
    { x: 183, y: 1290 }, // [0] No problem
    { x: 343, y: 1290 }, // [1] Minor problem
    { x: 532, y: 1290 }, // [2] Moderate problem
    { x: 756, y: 1290 }, // [3] Serious problem
  ],

  // ── Q4 ────────────────────────────────────────────────────────────────────
  Q4: { yes: { x: 991, y: 1352 }, no: { x: 1086, y: 1353 } },

  // ── Q5 ────────────────────────────────────────────────────────────────────
  Q5: { yes: { x: 991, y: 1430 }, no: { x: 1086, y: 1429 } },

  // ── Name & Date text ──────────────────────────────────────────────────────
  NAME_X: 235,
  NAME_Y: 210,
  DATE_X: 885,
  DATE_Y: 210,
};

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS DIMENSIONS — do not change, must match the background image exactly
// ═══════════════════════════════════════════════════════════════════════════════
const CANVAS_W = 1275;
const CANVAS_H = 1650;

// ═══════════════════════════════════════════════════════════════════════════════
// MDQImageMapper Component
//
// Props:
//   answers  {object}  — the collected form answers from page.js
// ═══════════════════════════════════════════════════════════════════════════════
export default function MDQImageMapper({ answers }) {
  const canvasRef = useRef(null);
  const [status,      setStatus]      = useState("loading"); // "loading" | "ready"
  const [emailStatus, setEmailStatus] = useState("idle");    // "idle" | "sending" | "sent" | "error"

  // ── Draw everything onto the canvas ────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;

    const img = new window.Image();
    // Background image must be placed at: /public/mdq-bg.jpg
    img.src = "/mdq-bg.jpg";

    img.onload = () => {
      // ── 1. Draw the form background ──────────────────────────────────────
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);

      // ── 2. drawBubble — filled circle with a white tick ──────────────────
      //    x, y  = center pixel coordinates from POS
      //    r     = radius in pixels (default 11 — matches the printed circles)
      //    To change the dot color, edit fillStyle below.
      const drawBubble = (x, y, r = 11) => {
        // Filled circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(29, 78, 216, 0.90)"; // blue-700 @ 90% opacity
        ctx.fill();

        // White tick mark inside the circle
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth   = 2.5;
        ctx.lineCap     = "round";
        ctx.lineJoin    = "round";
        ctx.beginPath();
        ctx.moveTo(x - 4.5, y + 0.5);
        ctx.lineTo(x - 1,   y + 4);
        ctx.lineTo(x + 5.5, y - 4.5);
        ctx.stroke();
      };

       // ── 3. drawText — patient name / date on form lines ──────────────────
      const drawText = (text, x, y, fontSize = 22, color = "#111827") => {
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
        ctx.fillText(text, x, y);
      };

      // ── 4. Name & Date ────────────────────────────────────────────────────
      if (answers.name) drawText(answers.name, POS.NAME_X, POS.NAME_Y);
      if (answers.date) drawText(answers.date,  POS.DATE_X, POS.DATE_Y);

      // ── 5. Q1 — 13 symptom items ─────────────────────────────────────────
      //    POS.Q1[i].yes and POS.Q1[i].no each have their own {x, y}.
      //    To move a single bubble: edit POS.Q1[i].yes.x / .y above.
      STEPS[1].items.forEach((item, i) => {
        const answer = answers[item.key];
        const coords = POS.Q1[i];
        if (answer === "yes") drawBubble(coords.yes.x, coords.yes.y);
        if (answer === "no")  drawBubble(coords.no.x,  coords.no.y);
      });

      // ── 6. Q2 ─────────────────────────────────────────────────────────────
      //    POS.Q2.yes and POS.Q2.no each have {x, y}.
      if (answers.q2 === "yes") drawBubble(POS.Q2.yes.x, POS.Q2.yes.y);
      if (answers.q2 === "no")  drawBubble(POS.Q2.no.x,  POS.Q2.no.y);

      // ── 7. Q3 — 4 horizontal circles ─────────────────────────────────────
      //    POS.Q3[0..3] each have {x, y} for that specific option.
      //    Q3_OPTION_INDEX maps answer string → array index.
      if (answers.q3 != null) {
        const idx = Q3_OPTION_INDEX[answers.q3];
        if (idx !== undefined) drawBubble(POS.Q3[idx].x, POS.Q3[idx].y);
      }

      // ── 8. Q4 ─────────────────────────────────────────────────────────────
      if (answers.q4 === "yes") drawBubble(POS.Q4.yes.x, POS.Q4.yes.y);
      if (answers.q4 === "no")  drawBubble(POS.Q4.no.x,  POS.Q4.no.y);

      // ── 9. Q5 ─────────────────────────────────────────────────────────────
      if (answers.q5 === "yes") drawBubble(POS.Q5.yes.x, POS.Q5.yes.y);
      if (answers.q5 === "no")  drawBubble(POS.Q5.no.x,  POS.Q5.no.y);

      setStatus("ready");
    };

    // Fallback if /public/mdq-bg.jpg is missing
    img.onerror = () => {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = "#1e3a8a";
      ctx.font = "bold 34px Arial";
      ctx.fillText("MDQ — Filled Form", 80, 100);

      ctx.fillStyle = "#ef4444";
      ctx.font = "20px Arial";
      ctx.fillText("⚠  Place mdq-bg.jpg in /public to see the form background.", 80, 148);

      ctx.fillStyle = "#374151";
      ctx.font = "bold 22px Arial";
      ctx.fillText(`Patient: ${answers.name || "—"}     Date: ${answers.date || "—"}`, 80, 210);

      ctx.font = "18px Arial";
      let y = 270;
      STEPS[1].items.forEach((item, i) => {
        const ans   = answers[item.key];
        const mark  = ans === "yes" ? "✓" : ans === "no" ? "✗" : "—";
        const label = item.label.slice(1, 65);
        ctx.fillText(`${i + 1}. [${mark}]  ${label}…`, 80, y);
        y += 28;
      });
      y += 12;
      ctx.font = "bold 20px Arial";
      ctx.fillText(`Q2: ${answers.q2 || "—"}   Q3: ${answers.q3 ? Q3_LABELS[answers.q3] : "—"}   Q4: ${answers.q4 || "—"}   Q5: ${answers.q5 || "—"}`, 80, y);

      setStatus("ready");
    };
  }, [answers]);

  // Attach canvas ref + trigger draw on mount
  const refCallback = useCallback(
    (node) => {
      if (node) {
        canvasRef.current = node;
        drawCanvas();
      }
    },
    [drawCanvas]
  );

  // ── Send PDF via API route ──────────────────────────────────────────────────
  // Converts the jsPDF doc to base64 and POSTs to /api/send-email.
  // The API sends to the hardcoded clinic email + the patient's email from the form.
  const sendEmail = async (pdf) => {
    setEmailStatus("sending");
    try {
      // jsPDF output("datauristring") gives "data:application/pdf;base64,XXXX"
      // We strip the prefix so Nodemailer gets a clean base64 string
      const dataUri   = pdf.output("datauristring");
      const pdfBase64 = dataUri.split(",")[1];

      const res = await fetch("/api/send-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          patientName:  answers.name  || "",
          patientEmail: answers.email || "",
          patientDate:  answers.date  || "",
          patientPhone: answers.phone || "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Server error");
      }

      setEmailStatus("sent");
    } catch (err) {
      console.error("[sendEmail]", err);
      setEmailStatus("error");
    }
  };

  // ── Load jsPDF from CDN once ────────────────────────────────────────────────
  // jsPDF turns the canvas PNG into a properly-sized PDF page (no server needed).
  const loadJsPDF = () =>
    new Promise((resolve, reject) => {
      if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
      const script    = document.createElement("script");
      script.src      = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload   = () => resolve(window.jspdf.jsPDF);
      script.onerror  = () => reject(new Error("Failed to load jsPDF"));
      document.head.appendChild(script);
    });

  // ── PDF download handler ────────────────────────────────────────────────────
  // Canvas is 1275 × 1650 px — proportionally matches A4 (210 × 297 mm).
  // Image is stretched edge-to-edge on the page with no margins.
  // Change PAGE_W_MM / PAGE_H_MM below if you want a different paper size.
  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setEmailStatus("idle"); // reset on each new download

    try {
      const JsPDF   = await loadJsPDF();
      const imgData = canvas.toDataURL("image/jpeg", 0.97); // JPEG keeps file size small

      const PAGE_W_MM = 210; // A4 width in mm
      const PAGE_H_MM = 297; // A4 height in mm

      const pdf = new JsPDF({
        orientation: "portrait",
        unit:        "mm",
        format:      "a4",
      });

      // ── Page 1: filled form canvas ────────────────────────────────────────
      pdf.addImage(imgData, "JPEG", 0, 0, PAGE_W_MM, PAGE_H_MM);

      // ── Page 2: static mdq-bg-2.jpg from /public ─────────────────────────
      // To swap the image, replace mdq-bg-2.jpg in /public with a new file
      // (keep the same filename), or change the src string below.
      await new Promise((resolve, reject) => {
        const page2Img = new window.Image();
        page2Img.src   = "/mdq-bg-2.jpg";

        page2Img.onload = () => {
          // Draw page2 image onto a temporary canvas so jsPDF can read it
          const tmpCanvas     = document.createElement("canvas");
          tmpCanvas.width     = page2Img.naturalWidth;
          tmpCanvas.height    = page2Img.naturalHeight;
          tmpCanvas.getContext("2d").drawImage(page2Img, 0, 0);

          const page2Data = tmpCanvas.toDataURL("image/jpeg", 0.97);

          pdf.addPage("a4", "portrait");
          pdf.addImage(page2Data, "JPEG", 0, 0, PAGE_W_MM, PAGE_H_MM);
          resolve();
        };

        page2Img.onerror = () => {
          // If the image is missing, add a blank page with a warning instead
          pdf.addPage("a4", "portrait");
          pdf.setFontSize(14);
          pdf.setTextColor(180, 0, 0);
          pdf.text("⚠ Page 2 image not found — place mdq-bg-2.jpg in /public", 10, 20);
          resolve(); // don't block the save
        };
      });

      const filename = `MDQ_${answers.name || "result"}_${answers.date || "form"}.pdf`;
      pdf.save(filename);

      // ── Send PDF to clinic + patient email ──────────────────────────────────
      // Runs after the download so a network error never blocks the local save.
      await sendEmail(pdf);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF export failed — check the browser console for details.");
    }
  };

  return (
    <div className="mt-10">

      {/* ── Header row ── */}
      <div className="flex items-start justify-between mb-4 px-1 gap-4">
        <div>
          <h2
            className="text-xl font-bold text-slate-800"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Filled Form Preview
          </h2>
          <p
            className="text-xs text-slate-400 mt-0.5"
            style={{ fontFamily: "'Source Sans 3', sans-serif" }}
          >
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
              Click to Send PDF
            </button>

            {/* Email status badge */}
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

      {/* ── Canvas wrapper — horizontally scrollable on small screens ── */}
      <div
        className="relative border-2 border-slate-200 rounded-2xl overflow-auto bg-slate-100 shadow-inner"
        style={{ maxHeight: "80vh" }}
      >
        {/* Loading overlay */}
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10 rounded-2xl">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mx-auto mb-3" />
              <p
                className="text-slate-500 text-sm"
                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
              >
                Rendering form…
              </p>
            </div>
          </div>
        )}

        {/*
          CANVAS SIZING RULES — do not change:
          • canvas width/height attributes = 1275 × 1650  (actual pixel buffer)
          • style width/height = 1275px / 1650px          (rendered at true size)
          • minWidth keeps the scroll container wide enough on small screens
          • Never add CSS transform scale here — it breaks pixel-accurate download
        */}
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

      {/* ── Position reference guide ── */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <p
          className="text-xs font-bold text-amber-800 mb-3 uppercase tracking-wider"
          style={{ fontFamily: "'Source Sans 3', sans-serif" }}
        >
          📍 How to adjust bubble positions — edit POS in MDQImageMapper.js
        </p>
        <div className="font-mono text-xs text-amber-900 space-y-1.5 leading-relaxed">
          <p className="text-amber-600 font-semibold">Q1 — per-item coordinates (YES and NO independent):</p>
          {POS.Q1.map((item, i) => (
            <p key={i}>
              <span className="text-blue-700">Q1[{i}]</span>
              {"  "}YES x={item.yes.x} y={item.yes.y}
              {"  "}NO x={item.no.x} y={item.no.y}
              {i === 8 ? <span className="text-red-500 ml-2">⚠ check y — same as item 3</span> : ""}
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