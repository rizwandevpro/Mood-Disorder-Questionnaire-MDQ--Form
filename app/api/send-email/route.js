// ─────────────────────────────────────────────────────────────────────────────
// app/api/send-email/route.js
//
// Receives the generated PDF (base64) from the client and sends it to:
//   1. A hardcoded clinic email  (CLINIC_EMAIL below)
//   2. The patient's email       (collected from the form)
//
// SETUP — add these to your .env.local file:
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=your-gmail@gmail.com
//   SMTP_PASS=your-app-password        ← Gmail App Password, NOT your login password
//   SMTP_FROM=your-gmail@gmail.com     ← shown as the "From" address
//
// Gmail App Password:
//   Google Account → Security → 2-Step Verification → App Passwords → generate one
//
// Install Nodemailer:
//   npm install nodemailer
// ─────────────────────────────────────────────────────────────────────────────

import nodemailer from "nodemailer";

// ── Hardcoded clinic recipient — change this to any address ──────────────────
const CLINIC_EMAIL = "reports@cambridgemich.com";

// ── Nodemailer transporter — reads credentials from .env.local ───────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request) {
  try {
    const body = await request.json();

    // ── Destructure payload sent from MDQImageMapper ─────────────────────────
    const {
      pdfBase64,    // the full PDF as a base64 string (no data: prefix)
      patientName,  // answers.name
      patientEmail, // answers.email — patient recipient
      patientDate,  // answers.date
      patientPhone, // answers.phone — included in email body for reference
    } = body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!pdfBase64) {
      return Response.json({ error: "Missing pdfBase64" }, { status: 400 });
    }

    // ── Build the PDF attachment ──────────────────────────────────────────────
    const filename   = `MDQ_${patientName || "result"}_${patientDate || "form"}.pdf`;
    const attachment = {
      filename,
      content:     pdfBase64,
      encoding:    "base64",
      contentType: "application/pdf",
    };

    // ── Email body ────────────────────────────────────────────────────────────
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b;">
        <h2 style="color: #1e3a8a; margin-bottom: 4px;">MDQ Questionnaire Result</h2>
        <p style="color: #64748b; margin-top: 0;">Cambridge Psychiatry &amp; Behavioral Institute</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 120px;">Patient Name</td>
            <td style="padding: 6px 0; font-weight: bold;">${patientName || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Date</td>
            <td style="padding: 6px 0;">${patientDate || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Email</td>
            <td style="padding: 6px 0;">${patientEmail || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Phone</td>
            <td style="padding: 6px 0;">${patientPhone || "—"}</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <p style="color: #475569; font-size: 14px;">
          The completed MDQ form is attached as a PDF.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          This questionnaire is not a substitute for a full medical evaluation.
          An accurate diagnosis can only be made by a qualified doctor.
        </p>
      </div>
    `;

    // ── Send to clinic ────────────────────────────────────────────────────────
    await transporter.sendMail({
      from:        `"MDQ System" <${process.env.SMTP_FROM}>`,
      to:          CLINIC_EMAIL,
      subject:     `MDQ Result — ${patientName || "Patient"} (${patientDate || "No date"})`,
      html:        htmlBody,
      attachments: [attachment],
    });

    // ── Send to patient (only if email provided) ──────────────────────────────
    if (patientEmail) {
      await transporter.sendMail({
        from:        `"Cambridge Psychiatry" <${process.env.SMTP_FROM}>`,
        to:          patientEmail,
        subject:     `Your MDQ Questionnaire Result — ${patientDate || ""}`,
        html:        htmlBody,
        attachments: [attachment],
      });
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error("[send-email] Error:", err);
    return Response.json(
      { error: err.message || "Failed to send email" },
      { status: 500 }
    );
  }
}