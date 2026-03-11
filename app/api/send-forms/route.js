// app/api/send-forms/route.js
//
// Receives a base64-encoded PDF + patient info, sends it to:
//   1. The patient's own email (from answers.email)
//   2. The clinic email (CLINIC_EMAIL env var, fallback: rizudevs@gmail.com)
//
// Required .env variables:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//   CLINIC_EMAIL  (optional — defaults to rizudevs@gmail.com)

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const CLINIC_EMAIL = process.env.CLINIC_EMAIL || "rizudevs@gmail.com";

export async function POST(req) {
  try {
    const body = await req.json();
    const { pdfBase64, patientEmail, patientName, fileName } = body;
    console.log("[send-forms] patientEmail:", patientEmail, "| patientName:", patientName);

    if (!pdfBase64) {
      return NextResponse.json({ error: "No PDF data received" }, { status: 400 });
    }

    // ── Build transporter ────────────────────────────────────────────────────
    const port   = Number(process.env.SMTP_PORT) || 587;
    const secure = port === 465; // true = SSL from start, false = STARTTLS

    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Required for Gmail on Windows dev environments — avoids TLS socket errors
      tls: {
        rejectUnauthorized: false,
      },
    });

    const pdfBuffer     = Buffer.from(pdfBase64, "base64");
    const attachmentName = fileName || "Cambridge-Psychiatry-HIPAA-and-Intake.pdf";
    const displayName   = patientName || "Patient";

    const attachment = {
      filename:    attachmentName,
      content:     pdfBuffer,
      contentType: "application/pdf",
    };

    // ── Email to clinic ──────────────────────────────────────────────────────
    const clinicMail = {
      from:        `"Cambridge Psychiatry Forms" <${process.env.SMTP_FROM}>`,
      to:          CLINIC_EMAIL,
      subject:     `New Patient Forms — ${displayName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
          <div style="background:#7d4f50;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h2 style="color:white;margin:0;font-size:18px;">New Patient Form Submission</h2>
          </div>
          <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
            <p style="margin:0 0 12px;">A new patient has completed their intake forms.</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#64748b;width:110px;">Patient</td>
                  <td style="padding:6px 0;font-weight:600;">${displayName}</td></tr>
              ${patientEmail ? `<tr><td style="padding:6px 0;color:#64748b;">Email</td>
                  <td style="padding:6px 0;">${patientEmail}</td></tr>` : ""}
              <tr><td style="padding:6px 0;color:#64748b;">Forms</td>
                  <td style="padding:6px 0;">HIPAA Consent + Patient Intake</td></tr>
            </table>
            <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
              The completed 2-page PDF is attached.
            </p>
          </div>
        </div>`,
      attachments: [attachment],
    };

    // ── Email to patient ─────────────────────────────────────────────────────
    const cleanPatientEmail = (patientEmail || "").trim();
    const patientMail = cleanPatientEmail ? {
      from:        `"Cambridge Psychiatry" <${process.env.SMTP_FROM}>`,
      to:          cleanPatientEmail,
      subject:     "Your Cambridge Psychiatry Forms — Submission Confirmed",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
          <div style="background:#7d4f50;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h2 style="color:white;margin:0;font-size:18px;">Forms Received</h2>
          </div>
          <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
            <p style="margin:0 0 12px;">Dear ${displayName},</p>
            <p style="margin:0 0 12px;">
              Thank you for completing your intake paperwork. Your HIPAA Consent and
              Patient Intake forms have been received successfully.
            </p>
            <p style="margin:0 0 16px;">
              A copy of your completed forms is attached to this email for your records.
              Please bring a copy of your insurance card to your first appointment.
            </p>
            <p style="margin:0;font-size:13px;color:#94a3b8;">
              If you have any questions, please contact our office directly.
            </p>
          </div>
        </div>`,
      attachments: [attachment],
    } : null;

    // ── Send both ────────────────────────────────────────────────────────────
    const sends = [transporter.sendMail(clinicMail)];
    if (cleanPatientEmail && patientMail) sends.push(transporter.sendMail(patientMail));
    await Promise.all(sends);

    return NextResponse.json({
      success: true,
      sentTo: [CLINIC_EMAIL, patientEmail].filter(Boolean),
    });

  } catch (err) {
    console.error("send-forms error:", err);
    return NextResponse.json(
      { error: err.message || "Email send failed" },
      { status: 500 }
    );
  }
}