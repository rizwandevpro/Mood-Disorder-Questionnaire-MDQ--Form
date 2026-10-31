// app/api/send-forms/route.js
//
// Receives a base64-encoded PDF + patient info, sends it via Resend API.
// Works on Vercel (no SMTP port blocking).
//
// Required .env variables:
//   RESEND_API_KEY   ← from resend.com dashboard
//   CLINIC_EMAIL     ← optional, defaults to reports@cambridgemich.com

import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend      = new Resend(process.env.RESEND_API_KEY);
const CLINIC_EMAIL = process.env.CLINIC_EMAIL || "reports@cambridgemich.com";
const FROM_FORMS  = "Cambridge Psychiatry Forms <reports@cambridgemich.com>";
const FROM_REPLY  = "Cambridge Psychiatry <reports@cambridgemich.com>";

export async function POST(req) {
  try {
    const body = await req.json();
    const { pdfBase64, patientEmail, patientName, patientPhone, fileName, formName, clinicLocation, selfPay } = body;

    // Optional ID / insurance photos (HIPAA+Intake page). CLINIC EMAIL ONLY.
    // [{ label, fileName, base64 }] — JPEG, ≤ ~300 KB each from the client.
    const documents = (Array.isArray(body.documents) ? body.documents : []).slice(0, 3)
      .map(d => ({ label: String(d.label || "Document"), fileName: String(d.fileName || "document.jpg").replace(/[^\w.\-]+/g, "_"), content: Buffer.from(String(d.base64 || ""), "base64") }))
      .filter(d => d.content.length > 3 && d.content.length <= 1024 * 1024 && d.content[0] === 0xff && d.content[1] === 0xd8);
    const displayForm     = formName      || "Patient Form";
    const displayLocation = clinicLocation || "";
    const displayName     = patientName   || "Patient";

    console.log("[send-forms] patientEmail:", patientEmail, "| patientName:", patientName);

    if (!pdfBase64) {
      return NextResponse.json({ error: "No PDF data received" }, { status: 400 });
    }

    const attachmentName = fileName || "Cambridge-Psychiatry-Form.pdf";
    const pdfBuffer      = Buffer.from(pdfBase64, "base64");

    // Resend attachment format
    const attachment = {
      filename: attachmentName,
      content:  pdfBuffer,
    };

    // ── Clinic email HTML ────────────────────────────────────────────────────
    const clinicHtml = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
        <div style="background:#7d4f50;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;font-size:18px;">New Patient Form Submission</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 12px;">A new patient has completed their <strong>${displayForm}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#64748b;width:110px;">Patient</td>
                <td style="padding:6px 0;font-weight:600;">${displayName}</td></tr>
            ${patientEmail ? `<tr><td style="padding:6px 0;color:#64748b;">Email</td>
                <td style="padding:6px 0;">${patientEmail}</td></tr>` : ""}
            ${patientPhone ? `<tr><td style="padding:6px 0;color:#64748b;">Phone</td>
                <td style="padding:6px 0;">${patientPhone}</td></tr>` : ""}
            ${displayLocation ? `<tr><td style="padding:6px 0;color:#64748b;">Location</td>
                <td style="padding:6px 0;font-weight:600;">${displayLocation}</td></tr>` : ""}
            <tr><td style="padding:6px 0;color:#64748b;">Form</td>
                <td style="padding:6px 0;">${displayForm}</td></tr>
          </table>
          ${documents.length || selfPay ? `
          <div style="margin:16px 0 0;padding:14px;background:white;border:1px solid #e2e8f0;border-radius:8px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">ID &amp; Insurance Photos</p>
            ${documents.map(d => `<div style="font-size:13px;color:#374151;padding:3px 0;">✓ ${d.label}</div>`).join("")}
            ${selfPay ? `<p style="margin:8px 0 0;font-size:13px;color:#b45309;font-weight:600;">Patient selected: no insurance / self-pay</p>` : ""}
          </div>` : ""}
          <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">The completed PDF report is attached${documents.length ? ", along with the ID/insurance photos" : ""}.</p>
        </div>
      </div>`;

    // ── Patient email HTML ───────────────────────────────────────────────────
    const cleanPatientEmail = (patientEmail || "").trim();
    const patientHtml = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
        <div style="background:#7d4f50;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;font-size:18px;">Forms Received</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 12px;">Dear ${displayName},</p>
          <p style="margin:0 0 16px;">
            Thank you for completing your <strong>${displayForm}</strong>. Your form has been received successfully.
            A copy is attached to this email for your records.
          </p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">Your Submission Details</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:5px 0;color:#64748b;width:90px;">Name</td>
                  <td style="padding:5px 0;font-weight:600;">${displayName}</td></tr>
              ${cleanPatientEmail ? `<tr><td style="padding:5px 0;color:#64748b;">Email</td>
                  <td style="padding:5px 0;">${cleanPatientEmail}</td></tr>` : ""}
              ${patientPhone ? `<tr><td style="padding:5px 0;color:#64748b;">Phone</td>
                  <td style="padding:5px 0;">${patientPhone}</td></tr>` : ""}
              ${displayLocation ? `<tr><td style="padding:5px 0;color:#64748b;">Location</td>
                  <td style="padding:5px 0;font-weight:600;">${displayLocation}</td></tr>` : ""}
            </table>
          </div>
          <p style="margin:0 0 12px;font-size:14px;">${documents.length
            ? "We also received the photo(s) of your ID and insurance card. For your privacy, they are not included in this email."
            : "Please bring a copy of your insurance card to your first appointment."}</p>
          <p style="margin:0 0 12px;font-size:13px;color:#94a3b8;">If you have any questions, please contact our office directly.</p>
          <p style="margin:0;font-size:12px;color:#cbd5e1;">Can't find this email? Please check your spam or junk folder.</p>
        </div>
      </div>`;

    // ── Send clinic email ────────────────────────────────────────────────────
    const sends = [
      resend.emails.send({
        from:        FROM_FORMS,
        to:          CLINIC_EMAIL,
        subject:     `New Patient Forms — ${displayLocation ? displayLocation + " — " : ""}${displayForm} — ${displayName}`,
        html:        clinicHtml,
        attachments: [attachment, ...documents.map(d => ({ filename: d.fileName, content: d.content }))],
      }),
    ];

    // ── Send patient email (only if provided) ────────────────────────────────
    if (cleanPatientEmail) {
      sends.push(
        resend.emails.send({
          from:        FROM_REPLY,
          to:          cleanPatientEmail,
          subject:     `Your Cambridge Psychiatry ${displayForm}${displayLocation ? " — " + displayLocation : ""} — Submission Confirmed`,
          html:        patientHtml,
          attachments: [attachment],
        })
      );
    }

    // Resend returns { error } instead of throwing — treat it as a failure.
    const results = await Promise.all(sends);
    const failed  = results.find(r => r && r.error);
    if (failed) throw new Error(failed.error.message || "Email provider rejected the message");

    return NextResponse.json({
      success: true,
      sentTo:  [CLINIC_EMAIL, cleanPatientEmail].filter(Boolean),
    });

  } catch (err) {
    console.error("send-forms error:", err);
    return NextResponse.json(
      { error: err.message || "Email send failed" },
      { status: 500 }
    );
  }
}