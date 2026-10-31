// app/api/merge-pdf/route.js
//
// Combined /patient-forms submission → one email to the clinic + one to the patient.
//
// REQUEST FORMATS
//   multipart/form-data (current client) — raw binary files, no base64 overhead.
//     meta       JSON string: { patientName, patientEmail, patientPhone,
//                               clinicLocation, selfPay,
//                               forms:     [{ field, formName, fileName }],
//                               documents: [{ field, label, fileName }] }
//     <field>    one File per form PDF and per photo (image/jpeg)
//   application/json (legacy client — tabs opened before this deploy)
//     { attachments: [{ base64, formName, fileName }], patientName, ... }
//
// Why multipart: Vercel rejects function requests over 4.5 MB. Eight form PDFs
// are ~2.9 MB; as base64 JSON that was already ~3.8 MB, so adding ID and
// insurance photos as base64 would have failed every submission.
//
// WHO GETS WHAT
//   Clinic:  merged PDF only (forms + photo pages) + each photo JPG
//            (no individual form PDFs — clinic asked for the merged PDF only)
//   Patient: merged PDF only (forms only) — no individual PDFs, no ID/insurance photos
//
// Required .env variables:
//   RESEND_API_KEY
//   CLINIC_EMAIL  (optional — defaults to reports@cambridgemich.com)

import { NextResponse }              from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Resend }                    from "resend";

const CLINIC_EMAIL = process.env.CLINIC_EMAIL || "reports@cambridgemich.com";
const FROM_FORMS   = "Cambridge Psychiatry Forms <reports@cambridgemich.com>";
const FROM_REPLY   = "Cambridge Psychiatry <reports@cambridgemich.com>";

const MAX_DOCUMENTS   = 3;
const MAX_PHOTO_BYTES = 1024 * 1024;   // client sends ≤ 300 KB; reject anything odd

// Extend Vercel timeout — merging several large PDFs needs time
export const maxDuration = 60;

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeFile = (v) => String(v || "file").replace(/[^\w.\-]+/g, "_").slice(0, 120);
const isJpeg = (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;

// ── Parse either request format into one shape ─────────────────────────────
async function readRequest(req) {
  const type = req.headers.get("content-type") || "";

  if (type.includes("multipart/form-data")) {
    const fd   = await req.formData();
    const meta = JSON.parse(fd.get("meta") || "{}");
    const fileBuf = async (field) => {
      const f = fd.get(field);
      return f && typeof f.arrayBuffer === "function" ? Buffer.from(await f.arrayBuffer()) : null;
    };
    const forms = [];
    for (const f of meta.forms || []) {
      const content = await fileBuf(f.field);
      if (content) forms.push({ formName: f.formName, fileName: safeFile(f.fileName), content });
    }
    const documents = [];
    for (const d of (meta.documents || []).slice(0, MAX_DOCUMENTS)) {
      const content = await fileBuf(d.field);
      if (content && content.length <= MAX_PHOTO_BYTES && isJpeg(content))
        documents.push({ label: String(d.label || "Document"), fileName: safeFile(d.fileName), content });
      else console.warn(`[merge-pdf] skipped invalid document: ${d.label}`);
    }
    return { ...meta, forms, documents };
  }

  // Legacy JSON (base64)
  const body = await req.json();
  return {
    ...body,
    forms: (body.attachments || []).map((a) => ({
      formName: a.formName, fileName: safeFile(a.fileName), content: Buffer.from(a.base64, "base64"),
    })),
    documents: [],
  };
}

// ── Build a merged PDF; optionally append one page per photo ────────────────
async function buildMerged(forms, documents, patientName) {
  const merged = await PDFDocument.create();

  for (const f of forms) {
    try {
      const src   = await PDFDocument.load(f.content);
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    } catch (err) {
      console.error(`Failed to merge ${f.formName}:`, err);
    }
  }

  if (documents.length) {
    const font = await merged.embedFont(StandardFonts.Helvetica);
    const bold = await merged.embedFont(StandardFonts.HelveticaBold);
    const W = 612, H = 792, M = 40;                 // US Letter, points
    for (const d of documents) {
      try {
        const img  = await merged.embedJpg(d.content);
        const page = merged.addPage([W, H]);
        page.drawText("Patient Documents", { x: M, y: H - M - 6, size: 16, font: bold, color: rgb(0.49, 0.31, 0.31) });
        page.drawText(`${patientName}  —  ${d.label}`, { x: M, y: H - M - 28, size: 11, font, color: rgb(0.2, 0.25, 0.33) });
        const boxW = W - 2 * M, boxH = H - 2 * M - 50;
        const s    = Math.min(boxW / img.width, boxH / img.height, 1.5);
        const w = img.width * s, h = img.height * s;
        page.drawImage(img, { x: M + (boxW - w) / 2, y: M + (boxH - h), width: w, height: h });
      } catch (err) {
        console.error(`Failed to add document page ${d.label}:`, err);
      }
    }
  }
  return Buffer.from(await merged.save());
}

// Resend returns { data, error } instead of throwing — surface its errors.
async function send(resend, payload, who) {
  const { data, error } = await resend.emails.send(payload);
  if (error) throw new Error(`${who} email failed: ${error.message || JSON.stringify(error)}`);
  return data;
}

export async function POST(req) {
  // Initialize inside handler so missing env var doesn't crash at module load
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { forms, documents, patientName, patientEmail, patientPhone, clinicLocation, selfPay, missing: rawMissing } = await readRequest(req);
    // Forms the patient completed but whose PDF couldn't be built on their
    // device (e.g. connection dropped) — sent anyway, and flagged here.
    const missing = (Array.isArray(rawMissing) ? rawMissing : []).map(String).slice(0, 20);

    if (!forms.length) {
      return NextResponse.json({ error: "No PDF attachments received" }, { status: 400 });
    }

    const displayName     = patientName   || "Patient";
    const displayLocation = clinicLocation || "";
    const cleanEmail      = (patientEmail || "").trim();
    const baseName        = safeFile(displayName);

    // Two merged PDFs: clinic copy includes the photo pages, patient copy doesn't.
    const clinicMerged  = await buildMerged(forms, documents, displayName);
    const patientMerged = documents.length ? await buildMerged(forms, [], displayName) : clinicMerged;
    const mergedFileName = `${baseName}_Cambridge_Psychiatry_All_Forms.pdf`;

    const clinicAttachments = [
      { filename: mergedFileName, content: clinicMerged },
      ...documents.map((d) => ({ filename: d.fileName, content: d.content })),
    ];
    // Patient gets the merged PDF only (no individual form PDFs, no ID photos)
    const patientAttachments = [
      { filename: mergedFileName, content: patientMerged },
    ];

    const row = (label, value, bold) => value
      ? `<tr><td style="padding:6px 0;color:#64748b;width:110px;">${label}</td><td style="padding:6px 0;${bold ? "font-weight:600;" : ""}">${esc(value)}</td></tr>` : "";
    const list = (items, mark) => items.map((t, i) => `
      <div style="padding:5px 0;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:13px;color:#16a34a;font-weight:700;">${mark === "num" ? `${i + 1}.` : "✓"}</span>
        <span style="font-size:13px;color:#374151;margin-left:6px;">${esc(t)}</span>
      </div>`).join("");

    // ── Clinic email HTML ────────────────────────────────────────────────────
    const docsBlock = documents.length || selfPay ? `
          <div style="margin:16px 0;padding:14px;background:white;border:1px solid #e2e8f0;border-radius:8px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">ID &amp; Insurance Photos</p>
            ${list(documents.map((d) => d.label), "check")}
            ${selfPay ? `<p style="margin:8px 0 0;font-size:13px;color:#b45309;font-weight:600;">Patient selected: no insurance / self-pay</p>` : ""}
          </div>` : "";

    const clinicHtml = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
        <div style="background:#7d4f50;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;font-size:18px;">New Patient — Complete Form Package</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
          ${missing.length ? `
          <div style="margin:0 0 14px;padding:12px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#b91c1c;">⚠ Incomplete package — ${missing.length} form${missing.length > 1 ? "s" : ""} could not be prepared on the patient's device</p>
            ${missing.map((m) => `<div style="font-size:13px;color:#7f1d1d;">• ${esc(m)}</div>`).join("")}
            <p style="margin:6px 0 0;font-size:12px;color:#7f1d1d;">The patient answered these, but the PDF failed (usually a connection drop). Please have the patient complete them at check-in.</p>
          </div>` : ""}
          <p style="margin:0 0 12px;">A new patient has submitted <strong>${forms.length} intake form${forms.length === 1 ? "" : "s"}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${row("Patient", displayName, true)}
            ${row("Email", cleanEmail)}
            ${row("Phone", patientPhone)}
            ${row("Location", displayLocation, true)}
          </table>

          <div style="margin:16px 0;padding:14px;background:white;border:1px solid #e2e8f0;border-radius:8px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">Forms Included</p>
            ${list(forms.map((f) => f.formName), "num")}
          </div>
          ${docsBlock}
          <p style="margin:0;font-size:13px;color:#94a3b8;">
            Attached: one merged PDF with all forms${documents.length ? " + ID/insurance photo pages, plus each photo as a JPG" : ""}.
          </p>
        </div>
      </div>`;

    // ── Patient email HTML ───────────────────────────────────────────────────
    const patientHtml = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
        <div style="background:#7d4f50;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;font-size:18px;">Your Forms Have Been Received</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 12px;">Dear ${esc(displayName)},</p>
          <p style="margin:0 0 16px;">
            Thank you for completing your intake forms. All ${forms.length} forms have been received successfully.
            A single PDF with all your completed forms is attached to this email for your records.
          </p>

          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">Your Submission Details</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              ${row("Name", displayName, true)}
              ${row("Email", cleanEmail)}
              ${row("Phone", patientPhone)}
              ${row("Location", displayLocation, true)}
            </table>
          </div>

          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">Forms Completed</p>
            ${list(forms.map((f) => f.formName), "check")}
          </div>

          ${missing.length ? `<p style="margin:0 0 12px;font-size:14px;color:#b45309;">We couldn't receive: ${missing.map(esc).join(", ")}. Our office may ask you to complete ${missing.length > 1 ? "these" : "this"} at your visit.</p>` : ""}
          <p style="margin:0 0 12px;font-size:14px;">${documents.length
            ? "We also received the photo(s) of your ID and insurance card. For your privacy, they are not included in this email."
            : "Please bring a copy of your insurance card to your first appointment."}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">If you have any questions, please contact our office directly.</p>
          <p style="margin:0;font-size:12px;color:#cbd5e1;">Can't find this email? Please check your spam or junk folder.</p>
        </div>
      </div>`;

    // ── Send emails ──────────────────────────────────────────────────────────
    const sends = [
      send(resend, {
        from:        FROM_FORMS,
        to:          CLINIC_EMAIL,
        subject:     `New Patient Forms${displayLocation ? " — " + displayLocation : ""} — ${missing.length ? `INCOMPLETE (${missing.length} missing)` : "Complete Package"} — ${displayName}`,
        html:        clinicHtml,
        attachments: clinicAttachments,
      }, "Clinic"),
    ];
    if (cleanEmail) {
      sends.push(send(resend, {
        from:        FROM_REPLY,
        to:          cleanEmail,
        subject:     `Your Cambridge Psychiatry Forms${displayLocation ? " — " + displayLocation : ""} — Submission Confirmed`,
        html:        patientHtml,
        attachments: patientAttachments,
      }, "Patient"));
    }

    // Clinic delivery is what matters; a bad patient address shouldn't mark the
    // whole submission failed.
    const [clinicResult, patientResult] = await Promise.allSettled(sends);
    if (clinicResult.status === "rejected") throw clinicResult.reason;
    if (patientResult?.status === "rejected") console.error(patientResult.reason);

    return NextResponse.json({
      success:   true,
      sentTo:    [CLINIC_EMAIL, patientResult?.status === "fulfilled" ? cleanEmail : null].filter(Boolean),
      documents: documents.length,
    });

  } catch (err) {
    console.error("merge-pdf error:", err);
    return NextResponse.json({ error: err.message || "Merge/send failed" }, { status: 500 });
  }
}
