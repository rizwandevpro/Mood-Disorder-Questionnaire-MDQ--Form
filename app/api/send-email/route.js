// app/api/send-email/route.js  (MDQ form)
//
// Receives the generated PDF (base64) from MDQImageMapper and sends via Resend.
// Works on Vercel (no SMTP port blocking).
//
// Required .env variables:
//   RESEND_API_KEY   ← from resend.com dashboard

import { Resend } from "resend";

const resend       = new Resend(process.env.RESEND_API_KEY);
const CLINIC_EMAIL = process.env.CLINIC_EMAIL || "reports@cambridgemich.com";
const FROM_FORMS   = "Cambridge Psychiatry Forms <reports@cambridgemich.com>";
const FROM_REPLY   = "Cambridge Psychiatry <reports@cambridgemich.com>";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      pdfBase64,
      patientName,
      patientEmail,
      patientDate,
      patientPhone,
      clinicLocation,
    } = body;
    const displayLocation = clinicLocation || "";

    if (!pdfBase64) {
      return Response.json({ error: "Missing pdfBase64" }, { status: 400 });
    }

    const filename   = `MDQ_${patientName || "result"}_${patientDate || "form"}.pdf`;
    const pdfBuffer  = Buffer.from(pdfBase64, "base64");
    const attachment = { filename, content: pdfBuffer };

    // ── Clinic email HTML ────────────────────────────────────────────────────
    const clinicHtml = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
        <div style="background:#7d4f50;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;font-size:18px;">New Patient Form Submission</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 12px;">A new patient has completed their <strong>Mood Disorder Questionnaire (MDQ)</strong>.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#64748b;width:110px;">Patient</td>
                <td style="padding:6px 0;font-weight:600;">${patientName || "—"}</td></tr>
            ${patientEmail ? `<tr><td style="padding:6px 0;color:#64748b;">Email</td>
                <td style="padding:6px 0;">${patientEmail}</td></tr>` : ""}
            ${patientPhone ? `<tr><td style="padding:6px 0;color:#64748b;">Phone</td>
                <td style="padding:6px 0;">${patientPhone}</td></tr>` : ""}
            ${displayLocation ? `<tr><td style="padding:6px 0;color:#64748b;">Location</td>
                <td style="padding:6px 0;font-weight:600;">${displayLocation}</td></tr>` : ""}
            <tr><td style="padding:6px 0;color:#64748b;">Date</td>
                <td style="padding:6px 0;">${patientDate || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Form</td>
                <td style="padding:6px 0;">Mood Disorder Questionnaire (MDQ)</td></tr>
          </table>
          <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">The completed PDF report is attached.</p>
        </div>
      </div>`;

    // ── Patient email HTML ───────────────────────────────────────────────────
    const patientHtml = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
        <div style="background:#7d4f50;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;font-size:18px;">Form Received</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 12px;">Dear ${patientName || "Patient"},</p>
          <p style="margin:0 0 16px;">
            Thank you for completing your <strong>Mood Disorder Questionnaire (MDQ)</strong>. Your form has been received successfully.
            A copy is attached to this email for your records.
          </p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">Your Submission Details</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:5px 0;color:#64748b;width:90px;">Name</td>
                  <td style="padding:5px 0;font-weight:600;">${patientName || "—"}</td></tr>
              ${patientEmail ? `<tr><td style="padding:5px 0;color:#64748b;">Email</td>
                  <td style="padding:5px 0;">${patientEmail}</td></tr>` : ""}
              ${patientPhone ? `<tr><td style="padding:5px 0;color:#64748b;">Phone</td>
                  <td style="padding:5px 0;">${patientPhone}</td></tr>` : ""}
              ${displayLocation ? `<tr><td style="padding:5px 0;color:#64748b;">Location</td>
                  <td style="padding:5px 0;font-weight:600;">${displayLocation}</td></tr>` : ""}
            </table>
          </div>
          <p style="margin:0 0 12px;font-size:14px;">Please bring a copy of your insurance card to your first appointment.</p>
          <p style="margin:0 0 12px;font-size:13px;color:#94a3b8;">
            This questionnaire is not a substitute for a full medical evaluation.
            An accurate diagnosis can only be made by a qualified doctor.
          </p>
          <p style="margin:0;font-size:12px;color:#cbd5e1;">Can't find this email? Please check your spam or junk folder.</p>
        </div>
      </div>`;

    // ── Send both ────────────────────────────────────────────────────────────
    const sends = [
      resend.emails.send({
        from:        FROM_FORMS,
        to:          CLINIC_EMAIL,
        subject:     `New Patient Forms — ${displayLocation ? displayLocation + " — " : ""}Mood Disorder Questionnaire (MDQ) — ${patientName || "Patient"}`,
        html:        clinicHtml,
        attachments: [attachment],
      }),
    ];

    if (patientEmail) {
      sends.push(
        resend.emails.send({
          from:        FROM_REPLY,
          to:          patientEmail,
          subject:     `Your Cambridge Psychiatry Mood Disorder Questionnaire (MDQ)${displayLocation ? " — " + displayLocation : ""} — Submission Confirmed`,
          html:        patientHtml,
          attachments: [attachment],
        })
      );
    }

    await Promise.all(sends);

    return Response.json({ success: true });

  } catch (err) {
    console.error("[send-email] Error:", err);
    return Response.json(
      { error: err.message || "Failed to send email" },
      { status: 500 }
    );
  }
}