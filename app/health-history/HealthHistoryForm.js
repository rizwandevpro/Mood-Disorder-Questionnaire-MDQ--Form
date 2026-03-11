"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HH_STEPS } from "./healthHistorySteps";

const BRAND        = "#7d4f50";
const BRAND_LIGHT  = "rgba(125,79,80,0.07)";
const BRAND_SHADOW = "0 8px 24px rgba(125,79,80,0.18)";
const EXIT_DURATION = 220;

// ── Inject all CSS once (animations + responsive grids) ───────────────────────
const HH_CSS = `
  @keyframes hhSlideInRight  { from{opacity:0;transform:translateX(60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes hhSlideInLeft   { from{opacity:0;transform:translateX(-60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes hhSlideOutLeft  { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(-60px) scale(0.97)} }
  @keyframes hhSlideOutRight { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(60px) scale(0.97)} }
  .hh-enter-right { animation: hhSlideInRight  0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .hh-enter-left  { animation: hhSlideInLeft   0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .hh-exit-left   { animation: hhSlideOutLeft  0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
  .hh-exit-right  { animation: hhSlideOutRight 0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }

  /* ── Personal info field grid: 4-col desktop → 2-col mobile ── */
  .hh-field-grid               { display:grid; gap:16px; grid-template-columns:repeat(4,1fr); }
  .hh-span-full                { grid-column: span 4; }
  .hh-span-three               { grid-column: span 3; }
  .hh-span-half                { grid-column: span 2; }
  .hh-span-quarter             { grid-column: span 1; }
  @media(max-width:640px) {
    .hh-field-grid             { grid-template-columns: repeat(2,1fr); }
    .hh-span-full              { grid-column: span 2; }
    .hh-span-three             { grid-column: span 2; }
    .hh-span-half              { grid-column: span 2; }
    .hh-span-quarter           { grid-column: span 1; }
  }

  /* ── Health maintenance: 3-col desktop → 1-col mobile ── */
  .hh-maint-grid               { display:grid; gap:24px; grid-template-columns: repeat(3,1fr); }
  @media(max-width:640px)      { .hh-maint-grid { grid-template-columns:1fr; } }

  /* ── Conditions pill grid: 4-col → 3-col → 2-col ── */
  .hh-cond-grid                { display:grid; gap:8px; grid-template-columns: repeat(4,1fr); }
  @media(max-width:900px)      { .hh-cond-grid { grid-template-columns: repeat(3,1fr); } }
  @media(max-width:600px)      { .hh-cond-grid { grid-template-columns: repeat(2,1fr); } }

  /* ── Health habits label+controls row ── */
  .hh-habit-row                { display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid #f1f5f9; }
  .hh-habit-label              { width:90px; flex-shrink:0; padding-top:6px; }
  .hh-habit-controls           { flex:1; display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
  @media(max-width:500px) {
    .hh-habit-row              { flex-direction:column; gap:6px; }
    .hh-habit-label            { width:auto; padding-top:0; }
  }

  /* ── Pregnancy stats: 4-col → 2-col ── */
  .hh-preg-stats               { display:grid; gap:16px; grid-template-columns:repeat(4,1fr); margin-bottom:16px; }
  @media(max-width:640px)      { .hh-preg-stats { grid-template-columns:repeat(2,1fr); } }

  /* ── Dynamic table: scrollable on mobile ── */
  .hh-table-wrap               { border-radius:12px; border:1px solid #e2e8f0; overflow-x:auto; }
  .hh-table                    { width:100%; border-collapse:collapse; font-size:13px; }
  .hh-table th                 { text-align:left; padding:10px 12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#475569; background:#f8fafc; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
  .hh-table td                 { padding:8px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
  .hh-table tr:last-child td   { border-bottom:none; }
  .hh-table input              { width:100%; box-sizing:border-box; border:2px solid #e2e8f0; border-radius:8px; padding:8px 10px; font-size:13px; font-weight:500; color:#1e293b; background:white; outline:none; font-family:"Source Sans 3", sans-serif; transition:border-color 0.15s; min-width:60px; }
  .hh-table input:focus        { border-color:#3b82f6; }

  /* ── Family history table ── */
  .hh-fam-table th             { white-space:nowrap; }

  /* ── Pill checkbox hover ── */
  .hh-pill:hover               { border-color:#7d4f50 !important; }
`;

if (typeof document !== "undefined" && !document.getElementById("hh-styles")) {
  const t = document.createElement("style");
  t.id = "hh-styles";
  t.textContent = HH_CSS;
  document.head.appendChild(t);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getSpanClass(span) {
  switch (span) {
    case "full":         return "hh-span-full";
    case "threequarter": return "hh-span-three";
    case "half":         return "hh-span-half";
    case "quarter":      return "hh-span-quarter";
    default:             return "hh-span-half";
  }
}

function inputStyle(err, focused) {
  return {
    width:"100%", boxSizing:"border-box",
    border:`2px solid ${err?"#dc2626":focused?"#3b82f6":"#e2e8f0"}`,
    borderRadius:"12px", padding:"12px 16px",
    fontSize:"14px", fontWeight:500, color:"#1e293b",
    backgroundColor:"#f8fafc", outline:"none",
    transition:"border-color 0.15s",
    fontFamily:"'Source Sans 3', sans-serif",
  };
}

function labelStyle(err) {
  return {
    display:"block", fontSize:"10px", fontWeight:700,
    textTransform:"uppercase", letterSpacing:"0.1em",
    marginBottom:"6px", color: err?"#dc2626":"#94a3b8",
    fontFamily:"'Source Sans 3', sans-serif",
  };
}

function sectionTitle(text) {
  return (
    <p style={{fontSize:"15px",fontWeight:700,color:"#1e293b",marginBottom:"14px",fontFamily:"'Lora', serif"}}>{text}</p>
  );
}

function divider() {
  return <div style={{height:"1px",backgroundColor:"#f1f5f9",margin:"24px 0"}} />;
}

// ── Shared Field ──────────────────────────────────────────────────────────────
function FieldInput({ f, answers, onChange, error }) {
  const val = answers[f.key] || "";
  const [focused, setFocused] = useState(false);
  const iStyle = inputStyle(error, focused);

  return (
    <div>
      <label style={labelStyle(error)}>
        {f.label}
        {f.required && <span style={{color:BRAND}}> *</span>}
        {f.required === false && <span style={{textTransform:"none",letterSpacing:"normal",fontWeight:400,color:"#cbd5e1"}}> (optional)</span>}
      </label>
      {f.type === "select" ? (
        <select value={val} onChange={e=>onChange(f.key,e.target.value)}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={iStyle}>
          <option value="">Select…</option>
          {f.options?.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      ) : f.type === "textarea" ? (
        <textarea value={val} onChange={e=>onChange(f.key,e.target.value)}
          placeholder={f.placeholder} rows={f.rows||4}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{...iStyle, resize:"vertical"}} />
      ) : (
        <input type={f.type} value={val} onChange={e=>onChange(f.key,e.target.value)}
          placeholder={f.placeholder}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={iStyle} />
      )}
      {error && <p style={{marginTop:"4px",fontSize:"12px",color:"#ef4444",fontFamily:"'Source Sans 3', sans-serif"}}>⚠ {error}</p>}
    </div>
  );
}

// ── Step 0: Personal ──────────────────────────────────────────────────────────
function StepFields({ step, answers, onChange, errors }) {
  return (
    <div className="hh-field-grid">
      {step.fields.map(f => (
        <div key={f.key} className={getSpanClass(f.span)}>
          <FieldInput f={f} answers={answers} onChange={onChange} error={errors?.[f.key]} />
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Health Maintenance ────────────────────────────────────────────────
function StepHealthMaint({ answers, onChange }) {
  const col = (title, fields) => (
    <div>
      <p style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#475569",marginBottom:"14px",paddingBottom:"8px",borderBottom:"2px solid #f1f5f9",fontFamily:"'Source Sans 3', sans-serif"}}>{title}</p>
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        {fields.map(([key,label]) => (
          <div key={key}>
            <label style={labelStyle(false)}>{label}</label>
            <input type="date" value={answers[key]||""} onChange={e=>onChange(key,e.target.value)}
              style={inputStyle(false,false)} />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="hh-maint-grid">
      {col("Women Only",[["hmMenstrual","Menstrual Period"],["hmMammogram","Mammogram"],["hmPapSmear","Pap Smear"]])}
      {col("Both Men & Women",[["hmCholesterol","Cholesterol Testing"],["hmColonoscopy","Colonoscopy"],["hmTetanus","Tetanus Booster"],["hmPneumonia","Pneumonia Vaccine"],["hmBoneDensity","Bone Density (DEXA)"]])}
      {col("Men Only",[["hmDigitalRectal","Digital Rectal Exam"],["hmPSA","PSA (Prostate Blood Test)"]])}
    </div>
  );
}

// ── Step 2: Conditions ────────────────────────────────────────────────────────
function StepConditions({ answers, onChange }) {
  const ALL_CONDITIONS = [
    "AIDS","Alcoholism","Anemia","Anorexia","Anxiety","Arthritis","Asthma",
    "Bleeding Disorder","Breast Lump","Bronchitis","Bulimia","CAD / heart disease",
    "Cancer","Chemical Dependency","Depression","Diabetes","Emphysema / COPD",
    "Epilepsy","GERD (reflux)","Glaucoma","Goiter","Gout","Headaches",
    "Heart attack","Hepatitis","Herpes","High blood pressure","HIV positive",
    "Kidney disease","Liver disease","Multiple sclerosis","Pacemaker","Pneumonia",
    "Prostate problem","Psychiatric care","Rheumatic fever","Rhinitis",
    "Sexually Transmitted","Infection","Stroke","Suicide attempt","Thyroid problem",
    "Tuberculosis","Ulcer(s)","Vaginal infections",
  ];
  const ckey = c => "cond_" + c.replace(/[^a-zA-Z0-9]/g,"_");

  const Pill = ({ label, condKey }) => {
    const checked = !!answers[condKey];
    return (
      <div
        role="checkbox" aria-checked={checked} tabIndex={0}
        onClick={() => onChange(condKey, !checked)}
        onKeyDown={e => (e.key===" "||e.key==="Enter") && onChange(condKey, !checked)}
        className="hh-pill"
        style={{
          display:"flex", alignItems:"center", gap:"8px",
          cursor:"pointer", borderRadius:"10px",
          border:`2px solid ${checked?BRAND:"#e2e8f0"}`,
          backgroundColor: checked ? BRAND_LIGHT : "#f8fafc",
          padding:"8px 10px", userSelect:"none",
          transition:"border-color 0.15s, background-color 0.15s",
        }}>
        <div style={{
          flexShrink:0, width:"16px", height:"16px", borderRadius:"4px",
          border:`2px solid ${checked?BRAND:"#cbd5e1"}`,
          backgroundColor: checked?BRAND:"white",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all 0.15s",
        }}>
          {checked && (
            <svg width="10" height="10" fill="none" viewBox="0 0 12 12" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/>
            </svg>
          )}
        </div>
        <span style={{fontSize:"12px",fontWeight:600,color:checked?BRAND:"#475569",fontFamily:"'Source Sans 3', sans-serif",lineHeight:1.3}}>{label}</span>
      </div>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
      <div className="hh-cond-grid">
        {ALL_CONDITIONS.map(c => (
          <div key={c}>
            <Pill label={c} condKey={ckey(c)} />
            {c==="Cancer" && answers[ckey(c)] && (
              <input type="text" value={answers.cancerType||""} onChange={e=>onChange("cancerType",e.target.value)}
                placeholder="Cancer type…"
                style={{marginTop:"6px",width:"100%",boxSizing:"border-box",border:"2px solid #e2e8f0",borderRadius:"8px",padding:"6px 10px",fontSize:"12px",fontWeight:500,fontFamily:"'Source Sans 3', sans-serif",outline:"none"}} />
            )}
          </div>
        ))}
      </div>
      <div style={{paddingTop:"12px",borderTop:"2px solid #f1f5f9",display:"flex",flexWrap:"wrap",alignItems:"center",gap:"10px"}}>
        <Pill label="Other" condKey="cond_Other" />
        {answers.cond_Other && (
          <input type="text" value={answers.condOtherText||""} onChange={e=>onChange("condOtherText",e.target.value)}
            placeholder="Describe other conditions…"
            style={{flex:1,minWidth:"180px",border:"2px solid #e2e8f0",borderRadius:"10px",padding:"10px 14px",fontSize:"13px",fontWeight:500,color:"#1e293b",backgroundColor:"#f8fafc",outline:"none",fontFamily:"'Source Sans 3', sans-serif"}} />
        )}
      </div>
    </div>
  );
}

// ── AllergyCheckRow — defined outside to prevent remount on each render
function AllergyCheckRow({ label, checked, onToggle }) {
  return (
    <div onClick={onToggle} style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",padding:"10px 12px",borderRadius:"10px",border:`2px solid ${checked?BRAND:"#e2e8f0"}`,backgroundColor:checked?BRAND_LIGHT:"#f8fafc",userSelect:"none",transition:"all 0.15s"}}>
      <div style={{width:"18px",height:"18px",borderRadius:"5px",border:`2px solid ${checked?BRAND:"#cbd5e1"}`,backgroundColor:checked?BRAND:"white",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
        {checked && <svg width="11" height="11" fill="none" viewBox="0 0 12 12" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/></svg>}
      </div>
      <span style={{fontSize:"14px",fontWeight:600,color:checked?BRAND:"#374151",fontFamily:"'Source Sans 3', sans-serif"}}>{label}</span>
    </div>
  );
}

// ── Step 3: Allergies & Medications ──────────────────────────────────────────
function StepAllergiesMeds({ answers, onChange }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
      <div>
        {sectionTitle("Allergies")}
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <AllergyCheckRow label="No known allergies" checked={!!answers.allergyNone} onToggle={()=>{onChange("allergyNone",!answers.allergyNone);if(!answers.allergyNone)onChange("allergyYes",false);}} />
          <AllergyCheckRow label="Yes, I have the following allergies:" checked={!!answers.allergyYes} onToggle={()=>{onChange("allergyYes",!answers.allergyYes);if(!answers.allergyYes)onChange("allergyNone",false);}} />
          {answers.allergyYes && (
            <textarea value={answers.allergyList||""} onChange={e=>onChange("allergyList",e.target.value)}
              placeholder="List all known allergies to medications or substances…" rows={3}
              style={{...inputStyle(false,false),resize:"vertical"}} />
          )}
        </div>
      </div>
      {divider()}
      <div>
        {sectionTitle("Medications")}
        <p style={{fontSize:"13px",color:"#94a3b8",marginBottom:"8px",fontFamily:"'Source Sans 3', sans-serif"}}>List all medications including dose and frequency.</p>
        <textarea value={answers.medications||""} onChange={e=>onChange("medications",e.target.value)}
          placeholder="Medication name — dose — frequency…" rows={5}
          style={{...inputStyle(false,false),resize:"vertical"}} />
      </div>
    </div>
  );
}
// ── Habit helpers — defined OUTSIDE StepHealthHabits so React doesn't
//    treat them as new component types on each render (which would steal focus)
function SmallInput({ fieldKey, value, onChange, placeholder, width="100px" }) {
  return (
    <input type="text" value={value||""} onChange={e=>onChange(fieldKey,e.target.value)} placeholder={placeholder}
      style={{width,boxSizing:"border-box",border:"2px solid #e2e8f0",borderRadius:"8px",padding:"8px 10px",fontSize:"13px",fontWeight:500,color:"#1e293b",backgroundColor:"#f8fafc",outline:"none",fontFamily:"'Source Sans 3', sans-serif",transition:"border-color 0.15s",minWidth:"70px"}}
      onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e2e8f0"} />
  );
}

function HabitSmallCheck({ label, checked, onToggle }) {
  return (
    <div onClick={onToggle} style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",border:`2px solid ${checked?BRAND:"#e2e8f0"}`,backgroundColor:checked?BRAND_LIGHT:"#f8fafc",userSelect:"none",transition:"all 0.15s",flexShrink:0}}>
      <div style={{width:"14px",height:"14px",borderRadius:"3px",border:`2px solid ${checked?BRAND:"#cbd5e1"}`,backgroundColor:checked?BRAND:"white",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
        {checked && <svg width="9" height="9" fill="none" viewBox="0 0 12 12" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/></svg>}
      </div>
      <span style={{fontSize:"12px",fontWeight:600,color:checked?BRAND:"#374151",fontFamily:"'Source Sans 3', sans-serif",whiteSpace:"nowrap"}}>{label}</span>
    </div>
  );
}

function HabitRow({ label, children }) {
  return (
    <div className="hh-habit-row">
      <div className="hh-habit-label">
        <span style={{fontSize:"14px",fontWeight:700,color:"#374151",fontFamily:"'Source Sans 3', sans-serif"}}>{label}</span>
      </div>
      <div className="hh-habit-controls">{children}</div>
    </div>
  );
}

function StepHealthHabits({ answers, onChange }) {
  const note = t => <span style={{fontSize:"12px",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif",whiteSpace:"nowrap"}}>{t}</span>;

  return (
    <div style={{backgroundColor:"white",borderRadius:"12px",border:"1px solid #f1f5f9",padding:"0 4px"}}>
      <HabitRow label="Caffeine">
        <HabitSmallCheck label="Uses" checked={!!answers.habCaffeineUse} onToggle={()=>onChange("habCaffeineUse",!answers.habCaffeineUse)} />
        <HabitSmallCheck label="None"  checked={!!answers.habCaffeineNone} onToggle={()=>{onChange("habCaffeineNone",!answers.habCaffeineNone);if(!answers.habCaffeineNone)onChange("habCaffeineUse",false);}} />
        <SmallInput fieldKey="habCaffeineDrinks" value={answers.habCaffeineDrinks} onChange={onChange} placeholder="Amount" />
        {note("drinks per")}
        <SmallInput fieldKey="habCaffeinePer" value={answers.habCaffeinePer} onChange={onChange} placeholder="Day/week" />
      </HabitRow>
      <HabitRow label="Tobacco">
        <HabitSmallCheck label="Uses" checked={!!answers.habTobaccoUse} onToggle={()=>onChange("habTobaccoUse",!answers.habTobaccoUse)} />
        <HabitSmallCheck label="None" checked={!!answers.habTobaccoNone} onToggle={()=>{onChange("habTobaccoNone",!answers.habTobaccoNone);if(!answers.habTobaccoNone)onChange("habTobaccoUse",false);}} />
        <SmallInput fieldKey="habTobaccoCigs" value={answers.habTobaccoCigs} onChange={onChange} placeholder="Amount" />
        {note("cigs/day")}
        <HabitSmallCheck label="Quit?" checked={!!answers.habTobaccoQuit} onToggle={()=>onChange("habTobaccoQuit",!answers.habTobaccoQuit)} />
        {answers.habTobaccoQuit && <SmallInput fieldKey="habTobaccoQuitDate" value={answers.habTobaccoQuitDate} onChange={onChange} placeholder="Around when?" width="130px" />}
      </HabitRow>
      <HabitRow label="Alcohol">
        <HabitSmallCheck label="Uses" checked={!!answers.habAlcoholUse} onToggle={()=>onChange("habAlcoholUse",!answers.habAlcoholUse)} />
        <HabitSmallCheck label="None" checked={!!answers.habAlcoholNone} onToggle={()=>{onChange("habAlcoholNone",!answers.habAlcoholNone);if(!answers.habAlcoholNone)onChange("habAlcoholUse",false);}} />
        <SmallInput fieldKey="habAlcoholDrinks" value={answers.habAlcoholDrinks} onChange={onChange} placeholder="Amount" />
        {note("drinks per")}
        <SmallInput fieldKey="habAlcoholPer" value={answers.habAlcoholPer} onChange={onChange} placeholder="Day/week" />
      </HabitRow>
      <HabitRow label="Drugs">
        <HabitSmallCheck label="Uses" checked={!!answers.habDrugsUse} onToggle={()=>onChange("habDrugsUse",!answers.habDrugsUse)} />
        <HabitSmallCheck label="None" checked={!!answers.habDrugsNone} onToggle={()=>{onChange("habDrugsNone",!answers.habDrugsNone);if(!answers.habDrugsNone)onChange("habDrugsUse",false);}} />
        {note("Describe:")}
        <SmallInput fieldKey="habDrugsDesc" value={answers.habDrugsDesc} onChange={onChange} placeholder="Description" width="200px" />
      </HabitRow>
      <HabitRow label="Diet">
        <input type="text" value={answers.habDietDesc||""} onChange={e=>onChange("habDietDesc",e.target.value)}
          placeholder="Describe your diet…"
          style={{flex:1,minWidth:"120px",border:"2px solid #e2e8f0",borderRadius:"8px",padding:"8px 10px",fontSize:"13px",fontWeight:500,color:"#1e293b",backgroundColor:"#f8fafc",outline:"none",fontFamily:"'Source Sans 3', sans-serif"}}
          onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e2e8f0"} />
      </HabitRow>
      <HabitRow label="Exercise">
        <input type="text" value={answers.habExerciseDesc||""} onChange={e=>onChange("habExerciseDesc",e.target.value)}
          placeholder="Describe your exercise…"
          style={{flex:1,minWidth:"120px",border:"2px solid #e2e8f0",borderRadius:"8px",padding:"8px 10px",fontSize:"13px",fontWeight:500,color:"#1e293b",backgroundColor:"#f8fafc",outline:"none",fontFamily:"'Source Sans 3', sans-serif"}}
          onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e2e8f0"} />
      </HabitRow>
      <div className="hh-habit-row" style={{borderBottom:"none"}}>
        <div className="hh-habit-label">
          <span style={{fontSize:"14px",fontWeight:700,color:"#374151",fontFamily:"'Source Sans 3', sans-serif"}}>Seatbelts</span>
        </div>
        <div className="hh-habit-controls">
          {["Always","Never","Sometimes"].map(v => (
            <HabitSmallCheck key={v} label={v} checked={answers.habSeatbelt===v} onToggle={()=>onChange("habSeatbelt",v)} />
          ))}
        </div>
      </div>
    </div>
  );
}
// ── Dynamic Table ─────────────────────────────────────────────────────────────
function DynamicTable({ title, columns, rows, setRows, maxRows, rowTemplate }) {
  return (
    <div style={{marginBottom:"24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
        {sectionTitle(title)}
        {rows.length < maxRows && (
          <button type="button" onClick={()=>setRows([...rows,{...rowTemplate}])}
            style={{display:"flex",alignItems:"center",gap:"4px",padding:"6px 14px",borderRadius:"8px",fontSize:"12px",fontWeight:600,border:`2px solid ${BRAND}`,color:BRAND,backgroundColor:"white",cursor:"pointer",fontFamily:"'Source Sans 3', sans-serif",flexShrink:0}}>
            + Add Row
          </button>
        )}
      </div>
      <div className="hh-table-wrap">
        <table className="hh-table">
          <thead>
            <tr>{columns.map(c=><th key={c.key} style={{width:c.width}}>{c.label}</th>)}<th style={{width:"32px"}}></th></tr>
          </thead>
          <tbody>
            {rows.map((row,i)=>(
              <tr key={i}>
                {columns.map(c=>(
                  <td key={c.key}>
                    <input value={row[c.key]||""} onChange={e=>{const nr=[...rows];nr[i]={...nr[i],[c.key]:e.target.value};setRows(nr);}} placeholder={c.placeholder||""} />
                  </td>
                ))}
                <td style={{textAlign:"center"}}>
                  {rows.length>1 && (
                    <button type="button" onClick={()=>setRows(rows.filter((_,ri)=>ri!==i))}
                      style={{background:"none",border:"none",cursor:"pointer",fontSize:"18px",color:"#cbd5e1",lineHeight:1}}
                      onMouseEnter={e=>e.currentTarget.style.color="#f87171"}
                      onMouseLeave={e=>e.currentTarget.style.color="#cbd5e1"}>×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Step 5: Surgical History ──────────────────────────────────────────────────
function StepSurgicalHistory({ answers, onChange }) {
  const [rows, setRows] = useState(answers.surgicalRows||[{year:"",hospital:"",surgery:""}]);
  useEffect(()=>onChange("surgicalRows",rows),[rows]);
  return (
    <DynamicTable title="Surgical History" maxRows={8} rows={rows} setRows={setRows}
      rowTemplate={{year:"",hospital:"",surgery:""}}
      columns={[
        {key:"year",    label:"Year",                   width:"80px", placeholder:"Year"},
        {key:"hospital",label:"Hospital / City / State",width:"35%",  placeholder:"Hospital, city, state"},
        {key:"surgery", label:"Type of Surgery / Complications",       placeholder:"Type and any complications"},
      ]} />
  );
}

// ── Step 6: Pregnancy & Other Hospitalizations ────────────────────────────────
function StepPregnancyOther({ answers, onChange }) {
  const [childRows, setChildRows] = useState(answers.pregnancyChildRows||[{birthYear:"",mf:"",complications:""}]);
  const [hospRows,  setHospRows]  = useState(answers.otherHospRows||[{year:"",hospital:"",reason:""}]);
  useEffect(()=>onChange("pregnancyChildRows",childRows),[childRows]);
  useEffect(()=>onChange("otherHospRows",hospRows),[hospRows]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      {sectionTitle("Pregnancy History")}
      <div className="hh-preg-stats">
        {[["pregNum","# Pregnancies"],["pregLiving","# Living Children"],["pregDeliveries","# Deliveries / C-sections"],["pregVaginal","# Vaginal"]].map(([k,l])=>(
          <div key={k}>
            <label style={labelStyle(false)}>{l}</label>
            <input type="text" value={answers[k]||""} onChange={e=>onChange(k,e.target.value)} placeholder="0"
              style={inputStyle(false,false)} />
          </div>
        ))}
      </div>
      <DynamicTable title="Children" maxRows={6} rows={childRows} setRows={setChildRows}
        rowTemplate={{birthYear:"",mf:"",complications:""}}
        columns={[
          {key:"birthYear",    label:"Birth Year",       width:"100px",placeholder:"Year"},
          {key:"mf",           label:"M / F",            width:"70px", placeholder:"M/F"},
          {key:"complications",label:"Complications, if any",          placeholder:"None"},
        ]} />
      {divider()}
      <DynamicTable title="Other Hospitalizations, Serious Illnesses, Injuries" maxRows={5}
        rows={hospRows} setRows={setHospRows}
        rowTemplate={{year:"",hospital:"",reason:""}}
        columns={[
          {key:"year",    label:"Year",                   width:"80px",placeholder:"Year"},
          {key:"hospital",label:"Hospital / City / State",width:"35%", placeholder:"Hospital, city, state"},
          {key:"reason",  label:"Reason / Nature of Illness",          placeholder:"Reason for hospitalization"},
        ]} />
      {divider()}
      <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"14px",paddingTop:"4px"}}>
        <span style={{fontSize:"14px",color:"#374151",fontFamily:"'Source Sans 3', sans-serif",fontWeight:500}}>Have you ever had a blood transfusion?</span>
        {["No","Yes"].map(v=>(
          <label key={v} style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",fontSize:"14px",color:"#374151",fontFamily:"'Source Sans 3', sans-serif"}}>
            <input type="radio" name="bloodTrans" value={v} checked={answers.bloodTransfusion===v} onChange={()=>onChange("bloodTransfusion",v)}
              style={{accentColor:BRAND,width:"15px",height:"15px"}} />
            {v}
          </label>
        ))}
        {answers.bloodTransfusion==="Yes" && (
          <input type="text" value={answers.bloodTransDates||""} onChange={e=>onChange("bloodTransDates",e.target.value)}
            placeholder="Date(s)"
            style={{border:"2px solid #e2e8f0",borderRadius:"8px",padding:"8px 12px",fontSize:"13px",fontWeight:500,width:"160px",fontFamily:"'Source Sans 3', sans-serif",outline:"none"}} />
        )}
      </div>
    </div>
  );
}

// ── Step 7: Family History ────────────────────────────────────────────────────
function StepFamilyHistory({ answers, onChange }) {
  const members = [
    {key:"father",  label:"Father"},
    {key:"mother",  label:"Mother"},
    {key:"brother1",label:"Brother"},
    {key:"brother2",label:"Brother"},
    {key:"brother3",label:"Brother"},
    {key:"brother4",label:"Brother"},
    {key:"sister1", label:"Sister"},
    {key:"sister2", label:"Sister"},
    {key:"sister3", label:"Sister"},
    {key:"sister4", label:"Sister"},
  ];
  const diseases = ["Arthritis","Asthma","Cancer","Diabetes","Gout","Heart Disease","High blood pressure","Kidney Disease","Stroke","Other"];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
      {/* Family member rows */}
      <div>
        {sectionTitle("Family Members")}
        <div className="hh-table-wrap">
          <table className="hh-table hh-fam-table">
            <thead>
              <tr>
                <th style={{width:"80px"}}>Relation</th>
                <th style={{width:"110px"}}>Age if Living</th>
                <th style={{width:"110px"}}>Age at Death</th>
                <th>Medical Conditions / Cause of Death</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m=>(
                <tr key={m.key}>
                  <td><span style={{fontSize:"13px",fontWeight:600,color:"#475569",fontFamily:"'Source Sans 3', sans-serif",whiteSpace:"nowrap"}}>{m.label}</span></td>
                  {["AgeLiving","AgeDeath","Conditions"].map(f=>(
                    <td key={f}>
                      <input value={answers[`fam_${m.key}_${f}`]||""} onChange={e=>onChange(`fam_${m.key}_${f}`,e.target.value)}
                        placeholder={f==="Conditions"?"Conditions…":"Age"} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disease checkboxes */}
      <div>
        {sectionTitle("Blood Relative Diseases")}
        <p style={{fontSize:"13px",color:"#94a3b8",marginBottom:"12px",fontFamily:"'Source Sans 3', sans-serif"}}>Check if a blood relative has any of the below, and note their relationship to you.</p>
        <div className="hh-table-wrap">
          <table className="hh-table">
            <thead>
              <tr>
                <th style={{width:"200px"}}>Disease</th>
                <th>Relationship to You</th>
              </tr>
            </thead>
            <tbody>
              {diseases.map(d=>{
                const dkey=`famDis_${d.replace(/\s/g,"_")}`;
                const rkey=`famDisRel_${d.replace(/\s/g,"_")}`;
                return (
                  <tr key={d}>
                    <td>
                      <div onClick={()=>onChange(dkey,!answers[dkey])}
                        style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",userSelect:"none"}}>
                        <div style={{width:"16px",height:"16px",borderRadius:"4px",border:`2px solid ${answers[dkey]?BRAND:"#cbd5e1"}`,backgroundColor:answers[dkey]?BRAND:"white",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                          {answers[dkey] && <svg width="10" height="10" fill="none" viewBox="0 0 12 12" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/></svg>}
                        </div>
                        <span style={{fontSize:"13px",fontWeight:600,color:answers[dkey]?BRAND:"#374151",fontFamily:"'Source Sans 3', sans-serif"}}>{d}</span>
                      </div>
                    </td>
                    <td><input value={answers[rkey]||""} onChange={e=>onChange(rkey,e.target.value)} placeholder="e.g. Father, Mother…" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Step 8: Additional & Signature ────────────────────────────────────────────
function SignaturePad({ value, onChange, error }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);
  const fileRef   = useRef(null);
  const [mode,    setMode]    = useState("draw");
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(()=>{
    if (value && canvasRef.current) {
      const img=new window.Image(); img.onload=()=>{const ctx=canvasRef.current.getContext("2d");ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);ctx.drawImage(img,0,0);setIsEmpty(false);}; img.src=value;
    }
  },[]);

  const getPos=(e,c)=>{const r=c.getBoundingClientRect();const s=e.touches?e.touches[0]:e;return{x:(s.clientX-r.left)*(c.width/r.width),y:(s.clientY-r.top)*(c.height/r.height)};};
  const startDraw=e=>{e.preventDefault();drawing.current=true;lastPos.current=getPos(e,canvasRef.current);};
  const draw=e=>{e.preventDefault();if(!drawing.current)return;const c=canvasRef.current,ctx=c.getContext("2d"),pos=getPos(e,c);ctx.beginPath();ctx.moveTo(lastPos.current.x,lastPos.current.y);ctx.lineTo(pos.x,pos.y);ctx.strokeStyle="#1e293b";ctx.lineWidth=2;ctx.lineCap="round";ctx.stroke();lastPos.current=pos;setIsEmpty(false);};
  const endDraw=()=>{if(!drawing.current)return;drawing.current=false;onChange(canvasRef.current.toDataURL());};
  const clearSig=()=>{canvasRef.current.getContext("2d").clearRect(0,0,canvasRef.current.width,canvasRef.current.height);setIsEmpty(true);onChange(null);};

  const btnS=active=>({padding:"6px 16px",borderRadius:"8px",fontSize:"12px",fontWeight:600,cursor:"pointer",border:`2px solid ${active?BRAND:"#e2e8f0"}`,backgroundColor:active?BRAND:"white",color:active?"white":"#64748b",fontFamily:"'Source Sans 3', sans-serif"});

  return (
    <div>
      <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
        <button type="button" onClick={()=>setMode("draw")}   style={btnS(mode==="draw")}>✍️ Draw</button>
        <button type="button" onClick={()=>setMode("upload")} style={btnS(mode==="upload")}>📁 Upload</button>
      </div>
      <div style={{position:"relative",borderRadius:"12px",border:`2px solid ${error?"#dc2626":"#e2e8f0"}`,overflow:"hidden",backgroundColor:"white",touchAction:"none"}}>
        <canvas ref={canvasRef} width={560} height={120}
          style={{display:mode==="draw"?"block":"none",width:"100%",cursor:"crosshair"}}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        {mode==="upload" && (
          <div onClick={()=>fileRef.current?.click()}
            style={{height:"120px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",cursor:"pointer"}}>
            <p style={{fontSize:"14px",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>Click to upload signature image</p>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
              const file=e.target.files?.[0];if(!file)return;
              const reader=new FileReader();
              reader.onload=ev=>{const img=new window.Image();img.onload=()=>{const c=canvasRef.current,ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);const r=Math.min(c.width/img.width,c.height/img.height),w=img.width*r,h=img.height*r;ctx.drawImage(img,(c.width-w)/2,(c.height-h)/2,w,h);setIsEmpty(false);onChange(c.toDataURL());};img.src=ev.target.result;};
              reader.readAsDataURL(file);
            }} />
          </div>
        )}
        {isEmpty&&mode==="draw"&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
            <p style={{color:"#e2e8f0",fontSize:"18px",fontFamily:"'Lora', serif"}}>Sign here</p>
          </div>
        )}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"8px"}}>
        {error?<p style={{fontSize:"12px",color:"#ef4444",fontFamily:"'Source Sans 3', sans-serif"}}>⚠ {error}</p>
              :<p style={{fontSize:"12px",color:"#94a3b8",fontFamily:"'Source Sans 3', sans-serif"}}>{mode==="draw"?"Draw your signature above":"Upload a signature image"}</p>}
        {!isEmpty&&<button type="button" onClick={clearSig} style={{fontSize:"12px",color:"#f87171",fontWeight:600,cursor:"pointer",background:"none",border:"none",fontFamily:"'Source Sans 3', sans-serif"}}>Clear</button>}
      </div>
    </div>
  );
}

function StepAdditional({ answers, onChange, errors }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
      <div>
        <label style={labelStyle(false)}>Additional Information <span style={{textTransform:"none",letterSpacing:"normal",fontWeight:400,color:"#cbd5e1"}}>(optional)</span></label>
        <textarea value={answers.additionalInfo||""} onChange={e=>onChange("additionalInfo",e.target.value)}
          placeholder="What else do you think your doctor should know about your health?" rows={5}
          style={{...inputStyle(false,false),resize:"vertical"}} />
      </div>
      <div>
        <p style={{fontSize:"15px",fontWeight:700,color:"#1e293b",marginBottom:"6px",fontFamily:"'Lora', serif"}}>
          Patient Signature <span style={{color:BRAND}}>*</span>
        </p>
        <p style={{fontSize:"13px",color:"#94a3b8",marginBottom:"12px",fontFamily:"'Source Sans 3', sans-serif"}}>
          I certify that the information on this form is correct to the best of my knowledge.
        </p>
        <SignaturePad value={answers.hhSignature} onChange={v=>onChange("hhSignature",v)} error={errors?.hhSignature} />
      </div>
      <div style={{maxWidth:"260px"}}>
        <FieldInput f={{key:"hhSigDate",label:"Date",type:"date",required:true}} answers={answers} onChange={onChange} error={errors?.hhSigDate} />
      </div>
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateHHStep(step, answers) {
  const errors = {};
  if (step.type==="fields") step.fields?.forEach(f=>{if(f.required&&!(answers[f.key]||"").toString().trim())errors[f.key]="Required";});
  if (step.type==="additional") {
    if (!answers.hhSignature) errors.hhSignature="Please provide your signature";
    if (!answers.hhSigDate)   errors.hhSigDate="Required";
  }
  return errors;
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ step, answers, onChange, onNext, onBack, isFirst, isLast }) {
  const [errors, setErrors] = useState({});
  const errorsRef = useRef(errors);
  errorsRef.current = errors;
  const handleChange = useCallback((key,value) => { onChange(key,value); if(errorsRef.current[key])setErrors(p=>({...p,[key]:null})); },[onChange]);
  const handleNext = () => { const errs=validateHHStep(step,answers); if(Object.keys(errs).length>0){setErrors(errs);return;} setErrors({}); onNext(); };

  const renderContent = () => {
    switch(step.type) {
      case "fields":          return <StepFields          step={step} answers={answers} onChange={handleChange} errors={errors} />;
      case "healthMaint":     return <StepHealthMaint     answers={answers} onChange={handleChange} />;
      case "conditions":      return <StepConditions      answers={answers} onChange={handleChange} />;
      case "allergies":       return <StepAllergiesMeds   answers={answers} onChange={handleChange} />;
      case "healthHabits":    return <StepHealthHabits    answers={answers} onChange={handleChange} />;
      case "surgicalHistory": return <StepSurgicalHistory answers={answers} onChange={handleChange} />;
      case "pregnancyOther":  return <StepPregnancyOther  answers={answers} onChange={handleChange} />;
      case "familyHistory":   return <StepFamilyHistory   answers={answers} onChange={handleChange} />;
      case "additional":      return <StepAdditional      answers={answers} onChange={handleChange} errors={errors} />;
      default: return null;
    }
  };

  return (
    <div style={{backgroundColor:"white",borderRadius:"24px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)",border:"1px solid #f1f5f9",overflow:"hidden"}}>
      <div style={{padding:"28px 32px 20px",borderBottom:"1px solid #f1f5f9"}}>
        <h2 style={{fontSize:"22px",fontWeight:700,color:"#0f172a",marginBottom:"4px",fontFamily:"'Lora', Georgia, serif"}}>{step.title}</h2>
        <p  style={{fontSize:"14px",color:"#64748b",lineHeight:1.5,fontFamily:"'Source Sans 3', sans-serif"}}>{step.subtitle}</p>
      </div>
      <div style={{padding:"28px 32px"}}>{renderContent()}</div>
      <div style={{padding:"20px 32px",backgroundColor:"#f8fafc",borderTop:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px"}}>
        <button type="button" onClick={onBack}
          style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 20px",borderRadius:"12px",fontSize:"14px",fontWeight:600,border:"2px solid #e2e8f0",color:"#475569",backgroundColor:"white",cursor:"pointer",fontFamily:"'Source Sans 3', sans-serif",visibility:isFirst?"hidden":"visible"}}
          onMouseEnter={e=>e.currentTarget.style.backgroundColor="#f1f5f9"}
          onMouseLeave={e=>e.currentTarget.style.backgroundColor="white"}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <button type="button" onClick={handleNext}
          style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 28px",borderRadius:"12px",fontSize:"14px",fontWeight:600,border:"none",color:"white",backgroundColor:BRAND,cursor:"pointer",boxShadow:BRAND_SHADOW,fontFamily:"'Source Sans 3', sans-serif"}}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          {isLast?"Submit":"Next"}
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

function AnimatedCard({ direction, children }) {
  const [phase, setPhase] = useState("enter");
  const cls = direction==="back" ? "hh-enter-left" : "hh-enter-right";
  return (
    <div className={phase==="enter"?cls:""} onAnimationEnd={()=>setPhase("idle")} style={{willChange:"transform, opacity"}}>
      {children}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HealthHistoryForm({ currentStep, answers, onChange, onNext, onBack }) {
  const [displayStep, setDisplayStep] = useState(currentStep);
  const [direction,   setDirection]   = useState("forward");
  const [isExiting,   setIsExiting]   = useState(false);
  const pendingStep = useRef(null);

  const animateTo = useCallback((target,dir)=>{ if(isExiting)return; setDirection(dir); setIsExiting(true); pendingStep.current=target; },[isExiting]);

  useEffect(()=>{ if(!isExiting)return; const t=setTimeout(()=>{setDisplayStep(pendingStep.current);setIsExiting(false);},EXIT_DURATION); return()=>clearTimeout(t); },[isExiting]);

  useEffect(()=>{ if(!isExiting&&currentStep!==displayStep) animateTo(currentStep,currentStep>displayStep?"forward":"back"); },[currentStep]);

  const handleNext=useCallback(()=>{animateTo(currentStep+1,"forward");setTimeout(()=>onNext(),EXIT_DURATION);},[animateTo,onNext,currentStep]);
  const handleBack=useCallback(()=>{animateTo(currentStep-1,"back");setTimeout(()=>onBack(),EXIT_DURATION);},[animateTo,onBack,currentStep]);

  const exitClass = direction==="back" ? "hh-exit-right" : "hh-exit-left";
  const step      = HH_STEPS[displayStep] || HH_STEPS[currentStep];
  const isFirst   = displayStep===0;
  const isLast    = displayStep===HH_STEPS.length-2;

  return (
    <div style={{position:"relative",overflow:"hidden",minHeight:"420px"}}>
      {isExiting && (
        <div className={exitClass} style={{position:"absolute",inset:0,willChange:"transform, opacity"}}>
          <Card step={step} answers={answers} onChange={onChange} onNext={()=>{}} onBack={()=>{}} isFirst={isFirst} isLast={isLast} />
        </div>
      )}
      {!isExiting && (
        <AnimatedCard key={displayStep} direction={direction}>
          <Card step={step} answers={answers} onChange={onChange} onNext={handleNext} onBack={handleBack} isFirst={isFirst} isLast={isLast} />
        </AnimatedCard>
      )}
    </div>
  );
}