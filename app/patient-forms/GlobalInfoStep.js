"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/patient-forms/GlobalInfoStep.js
//
// Collects shared patient info ONCE. prefill.js maps it into every form.
// Today's date is taken from the device (local time) and age is derived
// from DOB — the patient never types either.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { GENDER_OPTIONS, MARITAL_OPTIONS, todayISO, calcAge } from "./prefill";

const BRAND = "#7d4f50";
const FONT  = "'Source Sans 3', sans-serif";

// Same internal size as the Intake / Health History pads (560×120) so the
// saved PNG restores 1:1 inside those forms and maps identically onto PDFs.
const SIG_W = 560;
const SIG_H = 120;

function fmtUS(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

// ── Signature pad ────────────────────────────────────────────────────────────
function SignaturePad({ value, mode, onChange, onModeChange, error }) {
  const canvasRef = useRef(null);
  const fileRef   = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [uploadErr, setUploadErr] = useState("");

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    const img = new window.Image();
    img.onload = () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, SIG_W, SIG_H);
      ctx.drawImage(img, 0, 0);
      setIsEmpty(false);
    };
    img.src = value;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- restore once on mount

  const getPos = (e, c) => {
    const r = c.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    return { x: (s.clientX - r.left) * (c.width / r.width), y: (s.clientY - r.top) * (c.height / r.height) };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const move  = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const c = canvasRef.current, ctx = c.getContext("2d"), pos = getPos(e, c);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke();
    lastPos.current = pos; setIsEmpty(false);
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };
  const clear = () => {
    canvasRef.current.getContext("2d").clearRect(0, 0, SIG_W, SIG_H);
    setIsEmpty(true);
    setUploadErr("");
    if (fileRef.current) fileRef.current.value = "";
    onChange(null);
  };

  // Upload: fit the image (aspect preserved, centred) into the same 560×120
  // canvas, so drawn and uploaded signatures produce identical PNG output.
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadErr("Please choose an image file (PNG or JPG)."); return; }
    if (file.size > 5 * 1024 * 1024)     { setUploadErr("Image is too large (max 5 MB)."); return; }
    setUploadErr("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const c = canvasRef.current, ctx = c.getContext("2d");
        ctx.clearRect(0, 0, SIG_W, SIG_H);
        const r = Math.min(SIG_W / img.width, SIG_H / img.height);
        const w = img.width * r, h = img.height * r;
        ctx.drawImage(img, (SIG_W - w) / 2, (SIG_H - h) / 2, w, h);
        setIsEmpty(false);
        onChange(c.toDataURL("image/png"));
      };
      img.onerror = () => setUploadErr("Could not read that image.");
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const tab = (active) => ({
    padding: "6px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
    border: `2px solid ${active ? BRAND : "#e2e8f0"}`, backgroundColor: active ? BRAND : "white",
    color: active ? "white" : "#64748b", fontFamily: FONT,
  });

  const isUpload = mode === "upload";

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <button type="button" onClick={() => onModeChange("draw")}   style={tab(!isUpload)}>✍️ Draw</button>
        <button type="button" onClick={() => onModeChange("upload")} style={tab(isUpload)}>📁 Upload</button>
      </div>
      <div style={{ position: "relative", borderRadius: "12px", border: `2px solid ${error ? "#dc2626" : "#e2e8f0"}`, overflow: "hidden", backgroundColor: "white", touchAction: "none" }}>
        {/* Canvas stays mounted in both modes — it holds the signature either way */}
        <canvas ref={canvasRef} width={SIG_W} height={SIG_H}
          style={{ display: "block", width: "100%", cursor: isUpload ? "pointer" : "crosshair" }}
          onClick={isUpload ? () => fileRef.current?.click() : undefined}
          onMouseDown={isUpload ? undefined : start} onMouseMove={isUpload ? undefined : move}
          onMouseUp={isUpload ? undefined : end}     onMouseLeave={isUpload ? undefined : end}
          onTouchStart={isUpload ? undefined : start} onTouchMove={isUpload ? undefined : move}
          onTouchEnd={isUpload ? undefined : end} />
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        {isEmpty && isUpload && (
          <div onClick={() => fileRef.current?.click()} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <p style={{ color: "#94a3b8", fontSize: "14px", fontFamily: FONT, margin: 0 }}>Click to upload signature image</p>
          </div>
        )}
        {isEmpty && !isUpload && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <p style={{ color: "#cbd5e1", fontSize: "18px", fontFamily: "'Lora', serif", margin: 0 }}>Sign here</p>
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        {(uploadErr || error)
          ? <p style={{ fontSize: "12px", color: "#dc2626", fontFamily: FONT, margin: 0 }}>{uploadErr || error}</p>
          : <p style={{ fontSize: "12px", color: "#94a3b8", fontFamily: FONT, margin: 0 }}>
              {isUpload ? (isEmpty ? "PNG or JPG, max 5 MB" : "Click the box to choose a different image") : "Draw with mouse or finger"}
            </p>}
        {!isEmpty && (
          <button type="button" onClick={clear} style={{ fontSize: "12px", color: "#f87171", fontWeight: 600, cursor: "pointer", background: "none", border: "none", fontFamily: FONT }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main step ────────────────────────────────────────────────────────────────
export default function GlobalInfoStep({ info, onChange, onNext, forms }) {
  const [errors, setErrors] = useState({});

  // Device date, set client-side only (page is statically prerendered —
  // computing it during render would bake in the build date).
  useEffect(() => { onChange("todayDate", todayISO()); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const age = calcAge(info.dob, info.todayDate);

  const set = (key, value) => {
    onChange(key, value);
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    const req = (k, msg) => { if (!String(info[k] ?? "").trim()) e[k] = msg; };
    req("firstName",     "First name is required.");
    req("lastName",      "Last name is required.");
    req("phone",         "Phone number is required.");
    req("location",      "Please select a clinic location.");
    req("dob",           "Date of birth is required.");
    req("gender",        "Please select a gender.");
    req("maritalStatus", "Please select marital status.");
    req("address",       "Address is required.");
    req("city",          "City is required.");
    req("state",         "State is required.");
    req("zip",           "Zip is required.");
    if (info.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email.trim()))
      e.email = "Please enter a valid email.";
    if (info.dob) {
      const a = Number(calcAge(info.dob, todayISO()));
      if (info.dob > todayISO())       e.dob = "Date of birth cannot be in the future.";
      else if (!(a >= 0 && a <= 120))  e.dob = "Please check the date of birth.";
    }
    if (!info.signature) e.signature = "Please sign above.";
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      const first = document.querySelector(`[data-field="${Object.keys(e)[0]}"]`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onChange("todayDate", todayISO()); // refresh in case the tab sat open past midnight
    onNext();
  };

  // ── UI helpers ──
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.06em" };
  const inputStyle = (k) => ({ width: "100%", padding: "11px 13px", borderRadius: "10px", border: `1.5px solid ${errors[k] ? "#dc2626" : "#e2e8f0"}`, fontSize: "15px", fontFamily: FONT, color: "#1e293b", outline: "none", boxSizing: "border-box", backgroundColor: "white" });
  const lbl = (text, required) => (
    <label style={labelStyle}>
      {text}
      {required
        ? <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>
        : <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: "11px", marginLeft: "6px", textTransform: "none" }}>(optional)</span>}
    </label>
  );
  const err = (k) => errors[k] ? <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontFamily: FONT }}>{errors[k]}</p> : null;

  const input = (k, label, { type = "text", placeholder = "", required = true, ...rest } = {}) => (
    <div data-field={k}>
      {lbl(label, required)}
      <input type={type} value={info[k] || ""} placeholder={placeholder} onChange={e => set(k, e.target.value)} style={inputStyle(k)} {...rest} />
      {err(k)}
    </div>
  );
  const select = (k, label, options) => (
    <div data-field={k}>
      {lbl(label, true)}
      <select value={info[k] || ""} onChange={e => set(k, e.target.value)} style={{ ...inputStyle(k), cursor: "pointer", color: info[k] ? "#1e293b" : "#94a3b8" }}>
        <option value="" disabled>Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {err(k)}
    </div>
  );
  const grid = (cols, children) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cols}px, 1fr))`, gap: "16px", marginBottom: "16px" }}>{children}</div>
  );
  const section = (title) => (
    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: BRAND, margin: "8px 0 12px", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9", fontFamily: FONT }}>{title}</p>
  );
  const readOnly = (label, value) => (
    <div>
      <label style={labelStyle}>{label}<span style={{ color: "#94a3b8", fontWeight: 400, fontSize: "11px", marginLeft: "6px", textTransform: "none" }}>(automatic)</span></label>
      <div style={{ ...inputStyle(""), backgroundColor: "#f8fafc", color: "#475569" }}>{value}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto" }}>
      {/* Form list */}
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "14px", fontFamily: FONT }}>
          You will complete {forms.length} forms in sequence
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {forms.map((f, i) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "16px" }}>{f.icon}</span>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#374151", margin: 0, fontFamily: FONT }}>{i + 1}. {f.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", fontFamily: "'Lora', serif", marginBottom: "6px" }}>Before We Begin</h2>
        <p style={{ fontSize: "14px", color: "#64748b", fontFamily: FONT, lineHeight: 1.6, marginBottom: "24px" }}>
          Enter your details once. They will be filled into all {forms.length} forms automatically. You can still review and change them inside each form.
        </p>

        {section("Name")}
        {grid(160, <>
          {input("firstName",  "First Name",  { placeholder: "Jane" })}
          {input("middleName", "Middle Name", { placeholder: "A.", required: false })}
          {input("lastName",   "Last Name",   { placeholder: "Smith" })}
        </>)}

        {section("Personal")}
        {grid(160, <>
          {input("dob", "Date of Birth", { type: "date", max: info.todayDate || undefined })}
          {readOnly("Age", age !== "" ? age : "—")}
          {readOnly("Today's Date", fmtUS(info.todayDate))}
        </>)}
        {grid(200, <>
          {select("gender",        "Gender",         GENDER_OPTIONS)}
          {select("maritalStatus", "Marital Status", MARITAL_OPTIONS)}
        </>)}
        {section("Work / Education")}
        {grid(180, <>
          {input("occupation", "Occupation",            { placeholder: "e.g. Teacher",                 required: false })}
          {input("school",     "School / Organization", { placeholder: "School, college or employer", required: false })}
          {input("grade",      "Grade / Level",         { placeholder: "e.g. 12th, College, Graduate", required: false })}
        </>)}

        {section("Contact")}
        {grid(200, <>
          {input("phone", "Phone Number",  { type: "tel",   placeholder: "(555) 123-4567" })}
          {input("email", "Email Address", { type: "email", placeholder: "jane@example.com", required: false })}
        </>)}

        {section("Address")}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "16px", marginBottom: "16px" }}>
          {input("address", "Street Address", { placeholder: "123 Main St" })}
          {input("apt",     "Apt #",          { placeholder: "4B", required: false })}
        </div>
        {grid(140, <>
          {input("city",  "City",  { placeholder: "Westland" })}
          {input("state", "State", { placeholder: "MI" })}
          {input("zip",   "Zip",   { placeholder: "48185", inputMode: "numeric" })}
        </>)}

        {section("Clinic")}
        <div data-field="location" style={{ marginBottom: "16px" }}>
          {lbl("Clinic Location", true)}
          <select value={info.location || ""} onChange={e => set("location", e.target.value)}
            style={{ ...inputStyle("location"), cursor: "pointer", color: info.location ? "#1e293b" : "#94a3b8" }}>
            <option value="" disabled>Select a location…</option>
            <option value="Westland">Westland</option>
            <option value="Hamtramck">Hamtramck</option>
            <option value="Roseville">Roseville</option>
          </select>
          {err("location")}
        </div>

        {section("Signature")}
        <div data-field="signature" style={{ marginBottom: "8px" }}>
          <SignaturePad
            value={info.signature}
            mode={info.signatureMode || "draw"}
            onChange={v => set("signature", v)}
            onModeChange={m => onChange("signatureMode", m)}
            error={errors.signature} />
        </div>
        <p style={{ fontSize: "12px", color: "#64748b", fontFamily: FONT, lineHeight: 1.5, marginBottom: "24px" }}>
          This signature will be placed on each form that requires one. You will still review every form before it is signed, and can re-sign any individual form.
        </p>

        <button
          onClick={handleNext}
          style={{ width: "100%", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, border: "none", color: "white", backgroundColor: BRAND, cursor: "pointer", fontFamily: FONT }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#6a4142"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = BRAND}
        >
          Begin Forms →
        </button>
      </div>
    </div>
  );
}
