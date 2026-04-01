"use client";

import { useEffect, useRef } from "react";
import { QUESTIONS, OPTIONS } from "./brownSteps";

const P1_W = 1582; const P1_H = 2239;
const P2_W = 1580; const P2_H = 2238;
const TEAL = "#0f766e";
const CIRCLE_R = 22;

// ── Exact coordinates per question ───────────────────────────────────────────
const P1_ROWS = [
  { key:"q1",  coords:[[1207,1090],[1287,1090],[1370,1090],[1457,1090]] },
  { key:"q2",  coords:[[1207,1135],[1287,1135],[1370,1135],[1457,1135]] },
  { key:"q3",  coords:[[1207,1177],[1287,1177],[1370,1177],[1457,1177]] },
  { key:"q4",  coords:[[1207,1225],[1287,1225],[1370,1225],[1457,1225]] },
  { key:"q5",  coords:[[1207,1269],[1287,1269],[1370,1269],[1457,1269]] },
  { key:"q6",  coords:[[1207,1317],[1287,1317],[1370,1317],[1457,1317]] },
  { key:"q7",  coords:[[1207,1359],[1287,1359],[1370,1359],[1457,1359]] },
  { key:"q8",  coords:[[1207,1407],[1287,1407],[1370,1407],[1457,1407]] },
  { key:"q9",  coords:[[1207,1452],[1287,1452],[1370,1452],[1457,1452]] },
  { key:"q10", coords:[[1207,1493],[1287,1493],[1370,1493],[1457,1493]] },
  { key:"q11", coords:[[1207,1544],[1287,1544],[1370,1544],[1457,1544]] },
  { key:"q12", coords:[[1207,1585],[1287,1585],[1370,1585],[1457,1585]] },
  { key:"q13", coords:[[1207,1634],[1287,1634],[1370,1634],[1457,1634]] },
  { key:"q14", coords:[[1207,1676],[1287,1676],[1370,1676],[1457,1676]] },
  { key:"q15", coords:[[1207,1720],[1287,1720],[1370,1720],[1457,1720]] },
  { key:"q16", coords:[[1207,1768],[1287,1768],[1370,1768],[1457,1768]] },
  { key:"q17", coords:[[1207,1813],[1287,1813],[1370,1813],[1457,1813]] },
  { key:"q18", coords:[[1207,1858],[1287,1858],[1370,1858],[1457,1858]] },
  { key:"q19", coords:[[1207,1903],[1287,1903],[1370,1903],[1457,1903]] },
  { key:"q20", coords:[[1207,1944],[1287,1944],[1370,1944],[1457,1944]] },
];

const P2_ROWS = [
  { key:"q21", coords:[[1196,236], [1279,236], [1362,236], [1445,236]]  },
  { key:"q22", coords:[[1196,281], [1279,281], [1362,281], [1445,281]]  },
  { key:"q23", coords:[[1196,329], [1279,329], [1362,329], [1445,329]]  },
  { key:"q24", coords:[[1196,377], [1279,377], [1362,377], [1445,377]]  },
  { key:"q25", coords:[[1196,422], [1279,422], [1362,422], [1445,422]]  },
  { key:"q26", coords:[[1196,466], [1279,466], [1362,466], [1445,466]]  },
  { key:"q27", coords:[[1196,514], [1279,514], [1362,514], [1445,514]]  },
  { key:"q28", coords:[[1196,559], [1279,559], [1362,559], [1445,559]]  },
  { key:"q29", coords:[[1196,607], [1279,607], [1362,607], [1445,607]]  },
  { key:"q30", coords:[[1196,652], [1279,652], [1362,652], [1445,652]]  },
  { key:"q31", coords:[[1196,693], [1279,693], [1362,693], [1445,693]]  },
  { key:"q32", coords:[[1196,741], [1279,741], [1362,741], [1445,741]]  },
  { key:"q33", coords:[[1196,786], [1279,786], [1362,786], [1445,786]]  },
  { key:"q34", coords:[[1196,834], [1279,834], [1362,834], [1445,834]]  },
  { key:"q35", coords:[[1196,879], [1279,879], [1362,879], [1445,879]]  },
  { key:"q36", coords:[[1196,927], [1279,927], [1362,927], [1445,927]]  },
  { key:"q37", coords:[[1196,968], [1279,968], [1362,968], [1445,968]]  },
  { key:"q38", coords:[[1196,1015],[1279,1015],[1362,1015],[1445,1015]] },
  { key:"q39", coords:[[1196,1064],[1279,1064],[1362,1064],[1445,1064]] },
  { key:"q40", coords:[[1196,1106],[1279,1106],[1362,1106],[1445,1106]] },
  { key:"q41", coords:[[1196,1154],[1279,1154],[1362,1154],[1445,1154]] },
  { key:"q42", coords:[[1196,1198],[1279,1198],[1362,1198],[1445,1198]] },
  { key:"q43", coords:[[1196,1240],[1279,1240],[1362,1240],[1445,1240]] },
  { key:"q44", coords:[[1196,1288],[1279,1288],[1362,1288],[1445,1288]] },
  { key:"q45", coords:[[1196,1330],[1279,1330],[1362,1330],[1445,1330]] },
  { key:"q46", coords:[[1196,1377],[1279,1377],[1362,1377],[1445,1377]] },
  { key:"q47", coords:[[1196,1422],[1279,1422],[1362,1422],[1445,1422]] },
  { key:"q48", coords:[[1196,1470],[1279,1470],[1362,1470],[1445,1470]] },
  { key:"q49", coords:[[1196,1515],[1279,1515],[1362,1515],[1445,1515]] },
  { key:"q50", coords:[[1196,1557],[1279,1557],[1362,1557],[1445,1557]] },
  { key:"q51", coords:[[1196,1604],[1279,1604],[1362,1604],[1445,1604]] },
  { key:"q52", coords:[[1196,1649],[1279,1649],[1362,1649],[1445,1649]] },
  { key:"q53", coords:[[1196,1697],[1279,1697],[1362,1697],[1445,1697]] },
  { key:"q54", coords:[[1196,1742],[1279,1742],[1362,1742],[1445,1742]] },
  { key:"q55", coords:[[1196,1790],[1279,1790],[1362,1790],[1445,1790]] },
  { key:"q56", coords:[[1196,1835],[1279,1835],[1362,1835],[1445,1835]] },
  { key:"q57", coords:[[1196,1879],[1279,1879],[1362,1879],[1445,1879]] },
];

// Exact text field positions
const INFO_TEXT = {
  patientFirst:  { x: 634,  y: 214 },
  patientMiddle: { x: 950,  y: 214 },
  patientLast:   { x: 1236, y: 214 },
  // Date split into M/D/Y — stored as patientDate "MM/DD/YYYY"
  patientDateM:  { x: 541,  y: 281 },
  patientDateD:  { x: 618,  y: 281 },
  patientDateY:  { x: 687,  y: 281 },
  // Birth Date split
  patientBirthM: { x: 847,  y: 281 },
  patientBirthD: { x: 915,  y: 281 },
  patientBirthY: { x: 988,  y: 281 },
  patientSchool: { x: 560,  y: 345 },
  patientGrade:  { x: 1341, y: 355 },
};

// Sex checkboxes
const SEX_COORDS = { M: { x: 1278, y: 280 }, F: { x: 1336, y: 280 } };

function drawCircle(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = TEAL;
  ctx.lineWidth   = 4;
  ctx.beginPath();
  ctx.arc(x, y, CIRCLE_R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawField(ctx, text, x, y, fontSize) {
  if (!text) return;
  ctx.save();
  ctx.font = `500 ${fontSize||22}px Arial, sans-serif`;
  ctx.fillStyle = "#1e293b";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawCheckMark(ctx, x, y) {
  const s = 10;
  ctx.save();
  ctx.strokeStyle = "#0f766e";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - s * 0.6, y);
  ctx.lineTo(x, y + s * 0.55);
  ctx.lineTo(x + s * 0.8, y - s * 0.55);
  ctx.stroke();
  ctx.restore();
}

function drawInfoFields(ctx, answers) {
  // Names
  drawField(ctx, answers.patientFirst,  654,  214, 22);
  drawField(ctx, answers.patientMiddle, 950,  214, 22);
  drawField(ctx, answers.patientLast,   1236, 214, 22);

  // Date: split "YYYY-MM-DD" (from date input) into parts
  if (answers.patientDate) {
    const parts = answers.patientDate.split("-");
    if (parts.length === 3) {
      drawField(ctx, parts[1], 548, 281, 20); // Month
      drawField(ctx, parts[2], 618, 281, 20); // Day
      drawField(ctx, parts[0], 690, 281, 20); // Year (just last 2 if needed)
    }
  }
  // Birth Date
  if (answers.patientBirth) {
    const parts = answers.patientBirth.split("-");
    if (parts.length === 3) {
      drawField(ctx, parts[1], 849, 281, 20);
      drawField(ctx, parts[2], 915, 281, 20);
      drawField(ctx, parts[0], 995, 281, 20);
    }
  }

  // School / Grade
  drawField(ctx, answers.patientSchool, 600,  345, 22);
  drawField(ctx, answers.patientGrade,  1341, 355, 22);

  // Sex checkbox
  if (answers.patientSex && SEX_COORDS[answers.patientSex]) {
    const { x, y } = SEX_COORDS[answers.patientSex];
    drawCheckMark(ctx, x, y);
  }
}

function renderRows(ctx, rows, answers) {
  rows.forEach(({ key, coords }) => {
    const selected = answers[key];
    if (!selected) return;
    const optIdx = OPTIONS.findIndex(o => o.label === selected);
    if (optIdx < 0) return;
    const [x, y] = coords[optIdx];
    drawCircle(ctx, x, y);
  });
}

export default function BrownImageMapper({ answers, silentMode, onPdfReady }) {
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
      ctx1.clearRect(0, 0, P1_W, P1_H);
      ctx1.drawImage(bg1, 0, 0, P1_W, P1_H);
      drawInfoFields(ctx1, answers);
      renderRows(ctx1, P1_ROWS, answers);

      const ctx2 = canvas2Ref.current.getContext("2d");
      ctx2.clearRect(0, 0, P2_W, P2_H);
      ctx2.drawImage(bg2, 0, 0, P2_W, P2_H);
      renderRows(ctx2, P2_ROWS, answers);

      if (silentMode && onPdfReady) {
        const d1 = canvas1Ref.current.toDataURL("image/jpeg", 0.7);
        const d2 = canvas2Ref.current.toDataURL("image/jpeg", 0.7);
        import("jspdf").then(({ jsPDF }) => {
          const W1 = P1_W * 0.5, H1 = P1_H * 0.5;
          const W2 = P2_W * 0.5, H2 = P2_H * 0.5;
          const pdf = new jsPDF({ orientation:"portrait", unit:"pt", format:[W1,H1] });
          pdf.addImage(d1, "JPEG", 0, 0, W1, H1);
          pdf.addPage([W2, H2], "portrait");
          pdf.addImage(d2, "JPEG", 0, 0, W2, H2);
          const blob = pdf.output("blob");
          const url  = URL.createObjectURL(blob);
          onPdfReady(() => {
            const a = document.createElement("a");
            a.href = url; a.download = "Brown-Executive-Function-Scales.pdf"; a.click();
          }, blob);
        });
      }
    };

    bg1.onload = tryBuild;
    bg2.onload = tryBuild;
    bg1.src = "/brown-executive-scale-1.jpg";
    bg2.src = "/brown-executive-scale-2.jpg";
  }, [answers]);

  const hidden  = { display:"block", width:"1px", height:"1px" };
  const visible = { width:"100%", height:"auto", display:"block", borderRadius:"8px", marginBottom:"8px" };

  return (
    <>
      <canvas ref={canvas1Ref} width={P1_W} height={P1_H} style={silentMode ? hidden : visible} />
      <canvas ref={canvas2Ref} width={P2_W} height={P2_H} style={silentMode ? hidden : visible} />
    </>
  );
}