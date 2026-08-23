// app/api/merge-pdf/route.js
//
// Receives 6 PDF base64 strings, merges them into one PDF using pdf-lib,
// sends one email to clinic + one to patient with all 6 as separate attachments.
//
// Required .env variables:
//   RESEND_API_KEY
//   CLINIC_EMAIL  (optional — defaults to reports@cambridgemich.com)

import { NextResponse } from "next/server";
import { PDFDocument }  from "pdf-lib";
import { Resend }       from "resend";

const CLINIC_EMAIL = process.env.CLINIC_EMAIL || "reports@cambridgemich.com";
const FROM_FORMS   = "Cambridge Psychiatry Forms <reports@cambridgemich.com>";
const FROM_REPLY   = "Cambridge Psychiatry <reports@cambridgemich.com>";

// Extend Vercel timeout — merging 6 large PDFs needs time
export const maxDuration = 60;

export async function POST(req) {
  // Initialize inside handler so missing env var doesn't crash at module load
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { attachments, patientName, patientEmail, patientPhone, clinicLocation } = await req.json();

    if (!attachments || attachments.length === 0) {
      return NextResponse.json({ error: "No PDF attachments received" }, { status: 400 });
    }

    const displayName     = patientName   || "Patient";
    const displayLocation = clinicLocation || "";
    const cleanEmail      = (patientEmail || "").trim();

    // ── Merge all PDFs into one using pdf-lib ────────────────────────────────
    const mergedPdf = await PDFDocument.create();

    for (const att of attachments) {
      try {
        const pdfBytes  = Buffer.from(att.base64, "base64");
        const srcPdf    = await PDFDocument.load(pdfBytes);
        const pageCount = srcPdf.getPageCount();
        const pages     = await mergedPdf.copyPages(srcPdf, Array.from({ length: pageCount }, (_, i) => i));
        pages.forEach(p => mergedPdf.addPage(p));
      } catch (err) {
        console.error(`Failed to merge ${att.formName}:`, err);
      }
    }

    const mergedBytes   = await mergedPdf.save();
    const mergedFileName = `${displayName.replace(/\s+/g, "_")}_Cambridge_Psychiatry_All_Forms.pdf`;

    // ── Build attachments array for Resend ───────────────────────────────────
    const resendAttachments = [
      { filename: mergedFileName, content: Buffer.from(mergedBytes) },
      ...attachments.map(att => ({
        filename: att.fileName,
        content:  Buffer.from(att.base64, "base64"),
      })),
    ];

    // ── Clinic email HTML ────────────────────────────────────────────────────
    const clinicHtml = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
        <div style="background:#7d4f50;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;font-size:18px;">New Patient — Complete Form Package</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 12px;">A new patient has completed all <strong>6 intake forms</strong>.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#64748b;width:110px;">Patient</td>
                <td style="padding:6px 0;font-weight:600;">${displayName}</td></tr>
            ${cleanEmail ? `<tr><td style="padding:6px 0;color:#64748b;">Email</td>
                <td style="padding:6px 0;">${cleanEmail}</td></tr>` : ""}
            ${patientPhone ? `<tr><td style="padding:6px 0;color:#64748b;">Phone</td>
                <td style="padding:6px 0;">${patientPhone}</td></tr>` : ""}
            ${displayLocation ? `<tr><td style="padding:6px 0;color:#64748b;">Location</td>
                <td style="padding:6px 0;font-weight:600;">${displayLocation}</td></tr>` : ""}
          </table>

          <div style="margin:16px 0;padding:14px;background:white;border:1px solid #e2e8f0;border-radius:8px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">Forms Included</p>
            ${attachments.map((att, i) => `
              <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f1f5f9;">
                <span style="font-size:13px;color:#16a34a;font-weight:700;">${i + 1}.</span>
                <span style="font-size:13px;color:#374151;">${att.formName}</span>
              </div>`).join("")}
          </div>

          <p style="margin:0;font-size:13px;color:#94a3b8;">
            The merged PDF (all forms combined) and individual form PDFs are attached.
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
          <p style="margin:0 0 12px;">Dear ${displayName},</p>
          <p style="margin:0 0 16px;">
            Thank you for completing your intake forms. All 6 forms have been received successfully.
            A combined PDF and individual copies are attached to this email for your records.
          </p>

          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">Your Submission Details</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:5px 0;color:#64748b;width:90px;">Name</td>
                  <td style="padding:5px 0;font-weight:600;">${displayName}</td></tr>
              ${cleanEmail ? `<tr><td style="padding:5px 0;color:#64748b;">Email</td>
                  <td style="padding:5px 0;">${cleanEmail}</td></tr>` : ""}
              ${patientPhone ? `<tr><td style="padding:5px 0;color:#64748b;">Phone</td>
                  <td style="padding:5px 0;">${patientPhone}</td></tr>` : ""}
              ${displayLocation ? `<tr><td style="padding:5px 0;color:#64748b;">Location</td>
                  <td style="padding:5px 0;font-weight:600;">${displayLocation}</td></tr>` : ""}
            </table>
          </div>

          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">Forms Completed</p>
            ${attachments.map((att, i) => `
              <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f1f5f9;">
                <span style="color:#16a34a;font-size:14px;">✓</span>
                <span style="font-size:13px;color:#374151;">${att.formName}</span>
              </div>`).join("")}
          </div>

          <p style="margin:0 0 12px;font-size:14px;">Please bring a copy of your insurance card to your first appointment.</p>
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">If you have any questions, please contact our office directly.</p>
          <p style="margin:0;font-size:12px;color:#cbd5e1;">Can't find this email? Please check your spam or junk folder.</p>
        </div>
      </div>`;

    // ── Send emails ──────────────────────────────────────────────────────────
    const sends = [
      resend.emails.send({
        from:        FROM_FORMS,
        to:          CLINIC_EMAIL,
        subject:     `New Patient Forms${displayLocation ? " — " + displayLocation : ""} — Complete Package — ${displayName}`,
        html:        clinicHtml,
        attachments: resendAttachments,
      }),
    ];

    if (cleanEmail) {
      sends.push(
        resend.emails.send({
          from:        FROM_REPLY,
          to:          cleanEmail,
          subject:     `Your Cambridge Psychiatry Forms${displayLocation ? " — " + displayLocation : ""} — Submission Confirmed`,
          html:        patientHtml,
          attachments: resendAttachments,
        })
      );
    }

    await Promise.all(sends);

    return NextResponse.json({
      success: true,
      sentTo:  [CLINIC_EMAIL, cleanEmail].filter(Boolean),
    });

  } catch (err) {
    console.error("merge-pdf error:", err);
    return NextResponse.json({ error: err.message || "Merge/send failed" }, { status: 500 });
  }
}