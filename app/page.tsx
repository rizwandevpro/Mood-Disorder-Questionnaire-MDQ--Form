"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/page.jsx — Cambridge Psychiatry Patient Forms Portal
// Homepage listing all available forms with links to each route
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";

const FORMS = [
  {
    href:        "/hipaa-intake",
    title:       "HIPAA Consent & Patient Intake",
    description: "New patient consent and intake paperwork. Required before your first visit.",
    badge:       "Required",
    badgeColor:  "#dc2626",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href:        "/health-history",
    title:       "Patient Health History",
    description: "Medical history, allergies, medications, surgical history, and family health.",
    badge:       "Required",
    badgeColor:  "#dc2626",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    href:        "/mdq",
    title:       "Mood Disorder Questionnaire",
    description: "Screening tool to help identify symptoms of bipolar disorder.",
    badge:       "Screening",
    badgeColor:  "#7d4f50",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    href:        "/gad7",
    title:       "GAD-7 Anxiety Screener",
    description: "7-question assessment measuring the severity of generalized anxiety disorder.",
    badge:       "Screening",
    badgeColor:  "#7d4f50",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href:        "/phq9",
    title:       "PHQ-9 Depression Screener",
    description: "9-question tool used to screen, diagnose, and measure depression severity.",
    badge:       "Screening",
    badgeColor:  "#7d4f50",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  {
    href:        "/asrs",
    title:       "ADHD Self-Report Scale",
    description: "Adult ADHD self-report screening across two pages of symptom questions.",
    badge:       "Screening",
    badgeColor:  "#7d4f50",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href:        "/brown-scales",
    title:       "Brown Executive Function Scales",
    description: "57-item assessment of executive function and attention across six domains.",
    badge:       "Screening",
    badgeColor:  "#7d4f50",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Source Sans 3', sans-serif" }}>

        {/* ── Header ── */}
        <header style={{ backgroundColor: "#7d4f50", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", backgroundColor: "white", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", padding: "5px", flexShrink: 0 }}>
              <Image src="/logo2.png" alt="Cambridge Psychiatry" width={80} height={40} style={{ objectFit: "contain" }} />
            </div>
            <div>
              <p style={{ color: "white", fontWeight: 700, fontSize: "15px", letterSpacing: "0.07em", textTransform: "uppercase", margin: 0, lineHeight: 1.2 }}>
                Cambridge Psychiatry
              </p>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>
                Patient Forms Portal
              </p>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <div style={{ backgroundColor: "#7d4f50", paddingBottom: "48px" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px 0" }}>
            <h1 style={{ color: "white", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, fontFamily: "'Lora', serif", margin: "0 0 10px", lineHeight: 1.25 }}>
              Patient Resources
            </h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", lineHeight: 1.7, margin: 0, maxWidth: "560px" }}>
              Complete your forms before your appointment — online in minutes. Your responses are submitted securely and sent directly to our team.
            </p>
          </div>
        </div>

        {/* ── Wave divider ── */}
        <div style={{ backgroundColor: "#7d4f50", lineHeight: 0 }}>
          <svg viewBox="0 0 1440 40" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }}>
            <path d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z" fill="#f8fafc" />
          </svg>
        </div>

        {/* ── Main content ── */}
        <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Section header */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "4px", height: "24px", backgroundColor: "#7d4f50", borderRadius: "2px" }} />
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', serif", margin: 0 }}>
                Complete Your Forms Online
              </h2>
            </div>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: "0 0 0 14px", paddingLeft: "10px" }}>
              Select a form below. It opens in this app, takes a few minutes to complete, and submits automatically — no printing or uploading required.
            </p>
          </div>

          {/* How it works — compact */}
          <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "12px", padding: "14px 18px", marginBottom: "32px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ea580c" strokeWidth={2} style={{ flexShrink: 0, marginTop: "2px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontSize: "13px", color: "#9a3412", margin: 0, lineHeight: 1.6 }}>
              <strong>How it works:</strong> Click a form → fill it out → your PDF downloads automatically and is emailed to our office. You'll also receive a copy if you provide your email.
            </p>
          </div>

          {/* Form cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "16px", marginBottom: "56px" }}>
            {FORMS.map((form) => (
              <Link
                key={form.href}
                href={form.href}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "14px",
                    border: "1.5px solid #e2e8f0",
                    padding: "20px 22px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#7d4f50";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(125,79,80,0.12)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Icon */}
                  <div style={{ width: "44px", height: "44px", borderRadius: "10px", backgroundColor: "#fdf2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#7d4f50" }}>
                    {form.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Source Sans 3', sans-serif", lineHeight: 1.3 }}>
                        {form.title}
                      </h3>
                      <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 8px", borderRadius: "20px", backgroundColor: form.badgeColor + "15", color: form.badgeColor, flexShrink: 0 }}>
                        {form.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px", lineHeight: 1.5 }}>
                      {form.description}
                    </p>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#7d4f50", display: "flex", alignItems: "center", gap: "4px" }}>
                      Start Form
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
              Or upload a completed PDF
            </span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
          </div>

          {/* Upload form placeholder — drop your existing upload form here */}
          <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1.5px solid #e2e8f0", padding: "28px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{ width: "4px", height: "20px", backgroundColor: "#7d4f50", borderRadius: "2px" }} />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', serif", margin: 0 }}>
                Upload a Completed Form
              </h2>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", paddingLeft: "14px", lineHeight: 1.6 }}>
              If you've already filled out a paper or PDF form, upload it here.
            </p>

            {/* ── YOUR EXISTING UPLOAD FORM GOES HERE ── */}
            <div style={{ border: "2px dashed #e2e8f0", borderRadius: "12px", padding: "32px", textAlign: "center", backgroundColor: "#f8fafc" }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.5} style={{ margin: "0 auto 10px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, fontFamily: "'Source Sans 3', sans-serif" }}>
                Replace this placeholder with your existing upload form component
              </p>
            </div>

          </div>

          {/* Footer note */}
          <p style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", marginTop: "32px", lineHeight: 1.6 }}>
            All forms are encrypted and transmitted securely.{" "}
            <strong style={{ color: "#64748b" }}>Questions? Call our office before your appointment.</strong>
          </p>

        </main>
      </div>
    </>
  );
}