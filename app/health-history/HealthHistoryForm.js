"use client";

// ─────────────────────────────────────────────────────────────────────────────
// HealthHistoryForm.js — Patient Health History Form UI
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { HH_STEPS, CONDITIONS, FAMILY_DISEASES } from "./healthHistorySteps";

const BRAND        = "#7d4f50";
const BRAND_SHADOW = "0 8px 24px rgba(125,79,80,0.18)";
const EXIT_DURATION = 220;

// ── Animations ────────────────────────────────────────────────────────────────
const ANIM_CSS = `
  @keyframes hhSlideInRight  { from{opacity:0;transform:translateX(60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes hhSlideInLeft   { from{opacity:0;transform:translateX(-60px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes hhSlideOutLeft  { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(-60px) scale(0.97)} }
  @keyframes hhSlideOutRight { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(60px) scale(0.97)} }
  .hh-enter-right { animation: hhSlideInRight  0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .hh-enter-left  { animation: hhSlideInLeft   0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .hh-exit-left   { animation: hhSlideOutLeft  0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
  .hh-exit-right  { animation: hhSlideOutRight 0.22s cubic-bezier(0.4,0,1,1) forwards; pointer-events:none; }
`;
if (typeof document !== "undefined" && !document.getElementById("hh-anim-styles")) {
  const t = document.createElement("style");
  t.id = "hh-anim-styles";
  t.textContent = ANIM_CSS;
  document.head.appendChild(t);
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls = "w-full border-2 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-medium transition placeholder-slate-300";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest mb-2 text-slate-500";

function FieldInput({ f, answers, onChange, error }) {
  const val = answers[f.key] || "";
  const borderStyle = { borderColor: error ? "#dc2626" : "#e2e8f0" };
  return (
    <div>
      <label className={labelCls} style={{ color: error ? "#dc2626" : undefined, fontFamily: "'Source Sans 3', sans-serif" }}>
        {f.label}{f.required && <span style={{ color: BRAND }}> *</span>}
        {f.required === false && <span className="normal-case tracking-normal font-normal text-slate-400"> (optional)</span>}
      </label>
      {f.type === "select" ? (
        <select value={val} onChange={e => onChange(f.key, e.target.value)}
          className={inputCls} style={{ ...borderStyle, fontFamily: "'Source Sans 3', sans-serif" }}>
          <option value="">Select…</option>
          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : f.type === "textarea" ? (
        <textarea value={val} onChange={e => onChange(f.key, e.target.value)}
          placeholder={f.placeholder} rows={f.rows || 4}
          className={inputCls} style={{ ...borderStyle, fontFamily: "'Source Sans 3', sans-serif", resize: "vertical" }} />
      ) : (
        <input type={f.type} value={val} onChange={e => onChange(f.key, e.target.value)}
          placeholder={f.placeholder}
          className={inputCls} style={{ ...borderStyle, fontFamily: "'Source Sans 3', sans-serif" }}
          onFocus={e => e.target.style.borderColor = error ? "#dc2626" : "#3b82f6"}
          onBlur={e  => e.target.style.borderColor = error ? "#dc2626" : "#e2e8f0"} />
      )}
      {error && <p className="mt-1 text-xs text-red-500" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>⚠ {error}</p>}
    </div>
  );
}

function Checkbox({ label, checked, onChange, small }) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${small ? "text-xs" : "text-sm"} font-medium text-slate-700 py-1.5 px-1 rounded-lg hover:bg-slate-50 transition-colors`}
      style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-[#7d4f50] cursor-pointer flex-shrink-0" />
      <span>{label}</span>
    </label>
  );
}

// ── Step-specific screens ─────────────────────────────────────────────────────

function StepFields({ step, answers, onChange, errors }) {
  const spanMap = { full:"col-span-4", half:"col-span-2", quarter:"col-span-1", third:"col-span-4 sm:col-span-1", threequarter:"col-span-3" };
  return (
    <div className="grid grid-cols-4 gap-4">
      {step.fields.map(f => (
        <div key={f.key} className={spanMap[f.span] || "col-span-2"}>
          <FieldInput f={f} answers={answers} onChange={onChange} error={errors?.[f.key]} />
        </div>
      ))}
    </div>
  );
}

function StepHealthMaint({ answers, onChange }) {
  const col = (title, fields) => (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4 pb-2 border-b-2 border-slate-100"
        style={{ fontFamily: "'Source Sans 3', sans-serif" }}>{title}</p>
      <div className="space-y-3">
        {fields.map(([key, label]) => (
          <div key={key}>
            <label className={labelCls} style={{ fontFamily: "'Source Sans 3', sans-serif" }}>{label}</label>
            <input type="date" value={answers[key] || ""}
              onChange={e => onChange(key, e.target.value)}
              className={inputCls} style={{ borderColor: "#e2e8f0", fontFamily: "'Source Sans 3', sans-serif" }} />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {col("Women Only", [["hmMenstrual","Menstrual Period"],["hmMammogram","Mammogram"],["hmPapSmear","Pap Smear"]])}
      {col("Both Men & Women", [["hmCholesterol","Cholesterol Testing"],["hmColonoscopy","Colonoscopy"],["hmTetanus","Tetanus Booster"],["hmPneumonia","Pneumonia Vaccine"],["hmBoneDensity","Bone Density (DEXA)"]])}
      {col("Men Only", [["hmDigitalRectal","Digital Rectal Exam"],["hmPSA","PSA (Prostate Blood Test)"]])}
    </div>
  );
}

function StepConditions({ answers, onChange }) {
  // All conditions flat — rendered as a responsive pill-checkbox grid
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
  const key = c => "cond_" + c.replace(/[^a-zA-Z0-9]/g,"_");

  return (
    <div className="space-y-5">
      {/* Pill-style checkbox grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {ALL_CONDITIONS.map(c => {
          const isChecked = !!answers[key(c)];
          return (
            <div key={c}>
              <div
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onClick={() => onChange(key(c), !isChecked)}
                onKeyDown={e => (e.key === " " || e.key === "Enter") && onChange(key(c), !isChecked)}
                className="flex items-center gap-2.5 cursor-pointer rounded-xl border-2 px-3 py-2.5 transition-all select-none w-full"
                style={{
                  borderColor: isChecked ? "#7d4f50" : "#e2e8f0",
                  backgroundColor: isChecked ? "rgba(125,79,80,0.07)" : "#f8fafc",
                  fontFamily: "'Source Sans 3', sans-serif",
                }}>
                <div
                  className="flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: isChecked ? "#7d4f50" : "#cbd5e1",
                    backgroundColor: isChecked ? "#7d4f50" : "white",
                  }}>
                  {isChecked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
                <span className="text-xs font-semibold leading-tight" style={{ color: isChecked ? "#7d4f50" : "#475569" }}>{c}</span>
              </div>
              {c === "Cancer" && isChecked && (
                <input
                  type="text"
                  value={answers.cancerType || ""}
                  onChange={e => onChange("cancerType", e.target.value)}
                  placeholder="Cancer type…"
                  className="mt-1.5 w-full border-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:border-blue-400"
                  style={{ borderColor: "#e2e8f0", fontFamily: "'Source Sans 3', sans-serif" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Other */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t-2 border-slate-100">
        <div
          role="checkbox"
          aria-checked={!!answers.cond_Other}
          tabIndex={0}
          onClick={() => onChange("cond_Other", !answers.cond_Other)}
          onKeyDown={e => (e.key === " " || e.key === "Enter") && onChange("cond_Other", !answers.cond_Other)}
          className="flex items-center gap-2.5 cursor-pointer rounded-xl border-2 px-3 py-2.5 transition-all select-none"
          style={{
            borderColor: answers.cond_Other ? "#7d4f50" : "#e2e8f0",
            backgroundColor: answers.cond_Other ? "rgba(125,79,80,0.07)" : "#f8fafc",
            fontFamily: "'Source Sans 3', sans-serif",
          }}>
          <div
            className="flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
            style={{ borderColor: answers.cond_Other ? "#7d4f50" : "#cbd5e1", backgroundColor: answers.cond_Other ? "#7d4f50" : "white" }}>
            {answers.cond_Other && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
              </svg>
            )}
          </div>
          <span className="text-xs font-semibold" style={{ color: answers.cond_Other ? "#7d4f50" : "#475569" }}>Other</span>
        </div>
        {answers.cond_Other && (
          <input type="text" value={answers.condOtherText || ""} onChange={e => onChange("condOtherText", e.target.value)}
            placeholder="Describe other conditions…"
            className="flex-1 min-w-[200px] border-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
            style={{ borderColor: "#e2e8f0", fontFamily: "'Source Sans 3', sans-serif" }} />
        )}
      </div>
    </div>
  );
}

function StepAllergiesMeds({ answers, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3" style={{ fontFamily:"'Lora', serif" }}>Allergies</p>
        <div className="flex flex-col gap-3">
          <Checkbox label="No known allergies" checked={answers.allergyNone}
            onChange={v => { onChange("allergyNone", v); if (v) onChange("allergyYes", false); }} />
          <Checkbox label="Yes, I have the following allergies:" checked={answers.allergyYes}
            onChange={v => { onChange("allergyYes", v); if (v) onChange("allergyNone", false); }} />
          {answers.allergyYes && (
            <textarea value={answers.allergyList || ""} onChange={e => onChange("allergyList", e.target.value)}
              placeholder="List all known allergies to medications or substances…" rows={3}
              className={inputCls} style={{ borderColor:"#e2e8f0", fontFamily:"'Source Sans 3', sans-serif", resize:"vertical" }} />
          )}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3" style={{ fontFamily:"'Lora', serif" }}>Medications</p>
        <p className="text-xs text-slate-400 mb-2" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
          List all medications you are currently taking, including dose and frequency.
        </p>
        <textarea value={answers.medications || ""} onChange={e => onChange("medications", e.target.value)}
          placeholder="Medication name — dose — frequency…" rows={5}
          className={inputCls} style={{ borderColor:"#e2e8f0", fontFamily:"'Source Sans 3', sans-serif", resize:"vertical" }} />
      </div>
    </div>
  );
}

function StepHealthHabits({ answers, onChange }) {
  const row = (label, cbKey, noneKey, fields) => (
    <div className="grid grid-cols-12 items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="col-span-2 pt-2">
        <span className="text-sm font-bold text-slate-700" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>{label}</span>
      </div>
      <div className="col-span-10 flex flex-wrap items-center gap-3">
        {cbKey && <Checkbox label="Uses" checked={answers[cbKey]} onChange={v => onChange(cbKey, v)} />}
        <Checkbox label="None" checked={answers[noneKey]} onChange={v => { onChange(noneKey, v); if (v && cbKey) onChange(cbKey, false); }} />
        {fields}
      </div>
    </div>
  );

  const tf = (key, placeholder, width = "w-24") => (
    <input type="text" value={answers[key] || ""} onChange={e => onChange(key, e.target.value)}
      placeholder={placeholder} className={`${width} border-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 focus:outline-none`}
      style={{ borderColor:"#e2e8f0", fontFamily:"'Source Sans 3', sans-serif" }} />
  );

  return (
    <div className="bg-white rounded-xl border border-slate-100">
      {row("Caffeine",  "habCaffeineUse",  "habCaffeineNone",  [tf("habCaffeineDrinks","Drinks"), <span key="l1" className="text-xs text-slate-400">drinks per</span>, tf("habCaffeinePer","Period")])}
      {row("Tobacco",   "habTobaccoUse",   "habTobaccoNone",   [tf("habTobaccoCigs","Cigarettes"), <span key="l2" className="text-xs text-slate-400">cigs/day</span>, <Checkbox key="q" label="Quit" checked={answers.habTobaccoQuit} onChange={v => onChange("habTobaccoQuit", v)} />, answers.habTobaccoQuit && tf("habTobaccoQuitDate","Around when?","w-32")])}
      {row("Alcohol",   "habAlcoholUse",   "habAlcoholNone",   [tf("habAlcoholDrinks","Drinks"), <span key="l3" className="text-xs text-slate-400">drinks per</span>, tf("habAlcoholPer","Period")])}
      {row("Drugs",     "habDrugsUse",     "habDrugsNone",     [<span key="l4" className="text-xs text-slate-400">Describe:</span>, tf("habDrugsDesc","Description","w-64")])}
      <div className="grid grid-cols-12 items-start gap-3 py-3 border-b border-slate-100">
        <div className="col-span-2 pt-2"><span className="text-sm font-semibold text-slate-700" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>Diet</span></div>
        <div className="col-span-10">
          <input type="text" value={answers.habDietDesc || ""} onChange={e => onChange("habDietDesc", e.target.value)}
            placeholder="Describe your diet…" className={inputCls} style={{ borderColor:"#e2e8f0" }} />
        </div>
      </div>
      <div className="grid grid-cols-12 items-start gap-3 py-3 border-b border-slate-100">
        <div className="col-span-2 pt-2"><span className="text-sm font-semibold text-slate-700" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>Exercise</span></div>
        <div className="col-span-10">
          <input type="text" value={answers.habExerciseDesc || ""} onChange={e => onChange("habExerciseDesc", e.target.value)}
            placeholder="Describe your exercise routine…" className={inputCls} style={{ borderColor:"#e2e8f0" }} />
        </div>
      </div>
      <div className="grid grid-cols-12 items-start gap-3 py-3">
        <div className="col-span-2 pt-2"><span className="text-sm font-semibold text-slate-700" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>Seatbelts</span></div>
        <div className="col-span-10 flex gap-6">
          {["Always","Never","Sometimes"].map(v => (
            <label key={v} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
              <input type="radio" name="seatbelt" value={v} checked={answers.habSeatbelt === v}
                onChange={() => onChange("habSeatbelt", v)} className="accent-[#7d4f50]" />
              {v}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function DynamicTable({ title, columns, rows, setRows, maxRows, rowTemplate }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-base font-bold text-slate-800" style={{ fontFamily:"'Lora', serif" }}>{title}</p>
        {rows.length < maxRows && (
          <button type="button" onClick={() => setRows([...rows, { ...rowTemplate }])}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-all"
            style={{ borderColor: BRAND, color: BRAND, fontFamily:"'Source Sans 3', sans-serif" }}>
            + Add Row
          </button>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map(c => (
                <th key={c.key} className="text-left px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-xs"
                  style={{ width: c.width, fontFamily:"'Source Sans 3', sans-serif" }}>{c.label}</th>
              ))}
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                {columns.map(c => (
                  <td key={c.key} className="px-2 py-2.5">
                    <input type={c.type || "text"} value={row[c.key] || ""}
                      onChange={e => { const nr = [...rows]; nr[i] = { ...nr[i], [c.key]: e.target.value }; setRows(nr); }}
                      placeholder={c.placeholder || ""}
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:border-blue-400 transition-colors"
                      style={{ fontFamily:"'Source Sans 3', sans-serif" }} />
                  </td>
                ))}
                <td className="px-1 py-2.5 text-center">
                  {rows.length > 1 && (
                    <button type="button" onClick={() => setRows(rows.filter((_, ri) => ri !== i))}
                      className="text-slate-300 hover:text-red-400 transition text-base leading-none">×</button>
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

function StepSurgicalHistory({ answers, onChange }) {
  const [rows, setRows] = useState(answers.surgicalRows || [{ year:"", hospital:"", surgery:"" }]);
  useEffect(() => onChange("surgicalRows", rows), [rows]);
  return (
    <DynamicTable title="Surgical History" maxRows={8} rows={rows} setRows={setRows}
      rowTemplate={{ year:"", hospital:"", surgery:"" }}
      columns={[
        { key:"year",     label:"Year",                    width:"80px",  placeholder:"Year" },
        { key:"hospital", label:"Hospital / City / State", width:"35%",   placeholder:"Hospital, city, state" },
        { key:"surgery",  label:"Type of Surgery / Complications", placeholder:"Type and any complications" },
      ]} />
  );
}

function StepPregnancyOther({ answers, onChange }) {
  const [childRows, setChildRows] = useState(answers.pregnancyChildRows || [{ birthYear:"", mf:"", complications:"" }]);
  const [hospRows,  setHospRows]  = useState(answers.otherHospRows      || [{ year:"", hospital:"", reason:"" }]);
  useEffect(() => onChange("pregnancyChildRows", childRows), [childRows]);
  useEffect(() => onChange("otherHospRows",      hospRows),  [hospRows]);

  return (
    <div className="space-y-6">
      {/* Pregnancy stats */}
      <div>
        <p className="text-base font-bold text-slate-800 mb-4" style={{ fontFamily:"'Lora', serif" }}>Pregnancy History</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[["pregNum","# Pregnancies"],["pregLiving","# Living Children"],["pregDeliveries","# Deliveries / C-sections"],["pregVaginal","# Vaginal"]].map(([k,l]) => (
            <div key={k}>
              <label className={labelCls} style={{ fontFamily:"'Source Sans 3', sans-serif" }}>{l}</label>
              <input type="text" value={answers[k] || ""} onChange={e => onChange(k, e.target.value)}
                placeholder="0" className={inputCls} style={{ borderColor:"#e2e8f0", fontFamily:"'Source Sans 3', sans-serif" }} />
            </div>
          ))}
        </div>
        <DynamicTable title="Children" maxRows={6} rows={childRows} setRows={setChildRows}
          rowTemplate={{ birthYear:"", mf:"", complications:"" }}
          columns={[
            { key:"birthYear",    label:"Birth Year",         width:"100px", placeholder:"Year" },
            { key:"mf",           label:"M / F",              width:"60px",  placeholder:"M/F" },
            { key:"complications",label:"Complications, if any",             placeholder:"None" },
          ]} />
      </div>

      {/* Other hospitalizations */}
      <div className="pt-6 border-t-2 border-slate-100">
        <DynamicTable title="Other Hospitalizations, Serious Illnesses, Injuries" maxRows={5}
          rows={hospRows} setRows={setHospRows}
          rowTemplate={{ year:"", hospital:"", reason:"" }}
          columns={[
            { key:"year",     label:"Year",                    width:"80px",  placeholder:"Year" },
            { key:"hospital", label:"Hospital / City / State", width:"35%",   placeholder:"Hospital, city, state" },
            { key:"reason",   label:"Reason / Nature of Illness",             placeholder:"Reason for hospitalization" },
          ]} />
      </div>

      {/* Blood transfusion */}
      <div className="flex flex-wrap items-center gap-4 pt-6 border-t-2 border-slate-100">
        <span className="text-sm text-slate-700" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>Have you ever had a blood transfusion?</span>
        {["No","Yes"].map(v => (
          <label key={v} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
            <input type="radio" name="bloodTrans" value={v} checked={answers.bloodTransfusion === v}
              onChange={() => onChange("bloodTransfusion", v)} className="accent-[#7d4f50]" />
            {v}
          </label>
        ))}
        {answers.bloodTransfusion === "Yes" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>Date(s):</span>
            <input type="text" value={answers.bloodTransDates || ""} onChange={e => onChange("bloodTransDates", e.target.value)}
              placeholder="Date(s)" className="border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium w-44"
              style={{ fontFamily:"'Source Sans 3', sans-serif" }} />
          </div>
        )}
      </div>
    </div>
  );
}

function StepFamilyHistory({ answers, onChange }) {
  const members = [
    { key:"father",   label:"Father" },
    { key:"mother",   label:"Mother" },
    { key:"brother1", label:"Brother" },
    { key:"brother2", label:"Brother" },
    { key:"brother3", label:"Brother" },
    { key:"brother4", label:"Brother" },
    { key:"sister1",  label:"Sister" },
    { key:"sister2",  label:"Sister" },
    { key:"sister3",  label:"Sister" },
    { key:"sister4",  label:"Sister" },
  ];

  return (
    <div className="space-y-6">
      {/* Family member rows */}
      <div>
        <p className="text-base font-bold text-slate-800 mb-3" style={{ fontFamily:"'Lora', serif" }}>Family Members</p>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Relation","Age if Living","Age at Death","Medical Conditions / Cause of Death"].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-bold text-slate-500 uppercase tracking-wider"
                    style={{ fontFamily:"'Source Sans 3', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.key} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap"
                    style={{ fontFamily:"'Source Sans 3', sans-serif" }}>{m.label}</td>
                  {["AgeLiving","AgeDeath","Conditions"].map(f => (
                    <td key={f} className="px-2 py-2.5">
                      <input type="text" value={answers[`fam_${m.key}_${f}`] || ""}
                        onChange={e => onChange(`fam_${m.key}_${f}`, e.target.value)}
                        placeholder={f === "AgeLiving" ? "Age" : f === "AgeDeath" ? "Age" : "Conditions…"}
                        className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-400 bg-white transition-colors"
                        style={{ fontFamily:"'Source Sans 3', sans-serif" }} />
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
        <p className="text-sm font-bold text-slate-700 mb-3" style={{ fontFamily:"'Lora', serif" }}>
          Blood Relative Diseases <span className="text-xs font-normal text-slate-400">(check if a blood relative has any of the below)</span>
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>Disease</th>
                <th className="text-left px-3 py-2 font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>Relationship to You</th>
              </tr>
            </thead>
            <tbody>
              {["Arthritis","Asthma","Cancer","Diabetes","Gout","Heart Disease","High blood pressure","Kidney Disease","Stroke","Other"].map(d => (
                <tr key={d} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5">
                    <Checkbox label={d} small checked={answers[`famDis_${d.replace(/\s/g,"_")}`]}
                      onChange={v => onChange(`famDis_${d.replace(/\s/g,"_")}`, v)} />
                  </td>
                  <td className="px-2 py-2.5">
                    <input type="text" value={answers[`famDisRel_${d.replace(/\s/g,"_")}`] || ""}
                      onChange={e => onChange(`famDisRel_${d.replace(/\s/g,"_")}`, e.target.value)}
                      placeholder="e.g. Father, Mother…"
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-400 bg-white transition-colors"
                      style={{ fontFamily:"'Source Sans 3', sans-serif" }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StepAdditional({ answers, onChange, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <label className={labelCls} style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
          Additional Information <span className="normal-case tracking-normal font-normal text-slate-400">(optional)</span>
        </label>
        <textarea value={answers.additionalInfo || ""} onChange={e => onChange("additionalInfo", e.target.value)}
          placeholder="What else do you think your doctor should know about your health?" rows={5}
          className={inputCls} style={{ borderColor:"#e2e8f0", fontFamily:"'Source Sans 3', sans-serif", resize:"vertical" }} />
      </div>

      {/* Signature pad */}
      <div>
        <p className="text-sm font-bold text-slate-700 mb-1" style={{ fontFamily:"'Lora', serif" }}>Patient Signature <span style={{ color: BRAND }}>*</span></p>
        <p className="text-xs text-slate-400 mb-3" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
          I certify that the information on this form is correct to the best of my knowledge.
        </p>
        <SignaturePad value={answers.hhSignature} onChange={v => onChange("hhSignature", v)} error={errors?.hhSignature} />
      </div>

      <div className="max-w-xs">
        <label className={labelCls} style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
          Date <span style={{ color: BRAND }}>*</span>
        </label>
        <input type="date" value={answers.hhSigDate || ""} onChange={e => onChange("hhSigDate", e.target.value)}
          className={inputCls} style={{ borderColor: errors?.hhSigDate ? "#dc2626" : "#e2e8f0" }} />
        {errors?.hhSigDate && <p className="mt-1 text-xs text-red-500">⚠ Required</p>}
      </div>
    </div>
  );
}

// ── Signature Pad (same as IntakeForm) ───────────────────────────────────────
function SignaturePad({ value, onChange, error }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);
  const fileRef   = useRef(null);
  const [mode, setMode]     = useState("draw");
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new window.Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      img.src = value;
    }
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * (canvas.width / rect.width), y: (src.clientY - rect.top) * (canvas.height / rect.height) };
  };
  const startDraw = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext("2d"); const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke();
    lastPos.current = pos; setIsEmpty(false);
  };
  const endDraw = () => { if (!drawing.current) return; drawing.current = false; onChange(canvasRef.current.toDataURL()); };
  const clearSig = () => { canvasRef.current.getContext("2d").clearRect(0,0,canvasRef.current.width,canvasRef.current.height); setIsEmpty(true); onChange(null); };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {["draw","upload"].map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all"
            style={{ borderColor: mode===m ? BRAND:"#e2e8f0", backgroundColor: mode===m ? BRAND:"white", color: mode===m ? "white":"#64748b", fontFamily:"'Source Sans 3', sans-serif" }}>
            {m==="draw" ? "✍️ Draw" : "📁 Upload"}
          </button>
        ))}
      </div>
      <div className={`relative rounded-xl border-2 overflow-hidden bg-white ${error ? "border-red-500":"border-slate-200"}`} style={{ touchAction:"none" }}>
        <canvas ref={canvasRef} width={560} height={120} className="w-full cursor-crosshair"
          style={{ display: mode==="draw" ? "block":"none" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        {mode==="upload" && (
          <div className="h-[120px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50"
            onClick={() => fileRef.current?.click()}>
            <p className="text-sm text-slate-400" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>Click to upload signature image</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => {
                const img = new window.Image();
                img.onload = () => {
                  const canvas = canvasRef.current; const ctx = canvas.getContext("2d");
                  ctx.clearRect(0,0,canvas.width,canvas.height);
                  const ratio = Math.min(canvas.width/img.width, canvas.height/img.height);
                  const w=img.width*ratio, h=img.height*ratio;
                  ctx.drawImage(img,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
                  setIsEmpty(false); onChange(canvas.toDataURL());
                };
                img.src = ev.target.result;
              };
              reader.readAsDataURL(file);
            }} />
          </div>
        )}
        {isEmpty && mode==="draw" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-200 text-lg select-none" style={{ fontFamily:"'Lora', serif" }}>Sign here</p>
          </div>
        )}
      </div>
      <div className="flex justify-between mt-2">
        {error ? <p className="text-xs text-red-500" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>⚠ {error}</p>
               : <p className="text-xs text-slate-400" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>{mode==="draw" ? "Draw your signature above":"Upload a signature image"}</p>}
        {!isEmpty && <button type="button" onClick={clearSig} className="text-xs text-red-400 hover:text-red-600 font-semibold" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>Clear</button>}
      </div>
    </div>
  );
}

// ── Validate step ─────────────────────────────────────────────────────────────
function validateHHStep(step, answers) {
  const errors = {};
  if (step.type === "fields") {
    step.fields?.forEach(f => {
      if (f.required && !(answers[f.key] || "").toString().trim()) errors[f.key] = "Required";
    });
  }
  if (step.type === "additional") {
    if (!answers.hhSignature) errors.hhSignature = "Please provide your signature";
    if (!answers.hhSigDate)   errors.hhSigDate   = "Required";
  }
  return errors;
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ step, answers, onChange, onNext, onBack, isFirst, isLast }) {
  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    onChange(key, value);
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const handleNext = () => {
    const errs = validateHHStep(step, answers);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onNext();
  };

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
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-1" style={{ fontFamily:"'Lora', Georgia, serif" }}>{step.title}</h2>
        <p className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily:"'Source Sans 3', sans-serif" }}>{step.subtitle}</p>
      </div>
      <div className="px-6 sm:px-8 py-8">{renderContent()}</div>
      <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
        <button type="button" onClick={onBack}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border-2 border-slate-200 text-slate-600 hover:bg-slate-100 transition-all focus:outline-none ${isFirst ? "opacity-0 pointer-events-none" : ""}`}
          style={{ fontFamily:"'Source Sans 3', sans-serif" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <button type="button" onClick={handleNext}
          className="flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm text-white transition-all focus:outline-none"
          style={{ backgroundColor: BRAND, boxShadow: BRAND_SHADOW, fontFamily:"'Source Sans 3', sans-serif" }}>
          {isLast ? "Submit" : "Next"}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

function AnimatedCard({ direction, children }) {
  const [phase, setPhase] = useState("enter");
  return (
    <div className={phase === "enter" ? (direction === "back" ? "hh-enter-left" : "hh-enter-right") : ""}
      onAnimationEnd={() => setPhase("idle")} style={{ willChange:"transform, opacity" }}>
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

  const animateTo = useCallback((target, dir) => {
    if (isExiting) return;
    setDirection(dir); setIsExiting(true); pendingStep.current = target;
  }, [isExiting]);

  useEffect(() => {
    if (!isExiting) return;
    const t = setTimeout(() => { setDisplayStep(pendingStep.current); setIsExiting(false); }, EXIT_DURATION);
    return () => clearTimeout(t);
  }, [isExiting]);

  useEffect(() => {
    if (!isExiting && currentStep !== displayStep)
      animateTo(currentStep, currentStep > displayStep ? "forward" : "back");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleNext = useCallback(() => { animateTo(currentStep+1,"forward"); setTimeout(() => onNext(), EXIT_DURATION); }, [animateTo, onNext, currentStep]);
  const handleBack = useCallback(() => { animateTo(currentStep-1,"back");    setTimeout(() => onBack(), EXIT_DURATION); }, [animateTo, onBack, currentStep]);

  const exitClass = direction === "back" ? "hh-exit-right" : "hh-exit-left";
  const step      = HH_STEPS[displayStep] || HH_STEPS[currentStep];
  const isFirst   = displayStep === 0;
  const isLast    = displayStep === HH_STEPS.length - 2;

  return (
    <div className="relative overflow-hidden" style={{ minHeight:"420px" }}>
      {isExiting && (
        <div className={`${exitClass} absolute inset-0`} style={{ willChange:"transform, opacity" }}>
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