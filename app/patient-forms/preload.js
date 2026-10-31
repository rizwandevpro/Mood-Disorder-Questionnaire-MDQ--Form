// ─────────────────────────────────────────────────────────────────────────────
// app/patient-forms/preload.js
//
// Each form's PDF is drawn in the browser on top of a blank form image, using
// the jsPDF / pdf-lib libraries. Those used to be downloaded mid-flow, when a
// form finished — so a network blip at that moment meant that form's PDF was
// never built and the whole submission stalled.
//
// Now everything is fetched while the patient fills in "Before We Begin":
//   - every background image, kept alive in memory (+ 1-day cache header in
//     next.config.ts, so later loads of the same URL don't need the network)
//   - both PDF libraries (once imported, the module stays in memory)
// Each item retries with backoff. Failures here are not fatal: the PDF
// watchdog in page.js still rebuilds anything that fails later.
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_IMAGES = [
  "/HIPAA_Compliance_Patient_Consent_Form.jpg",
  "/intake-bg.jpg",
  "/patient-health-history-page-1.jpg",
  "/Patient-health-history-page-2.jpg",
  "/gad-7-anxiety.jpg",
  "/Adult-ADHD-Self-Report-Scale-Page-1.jpg",
  "/Adult-ADHD-Self-Report-Scale-Page-2.jpg",
  "/Patient-Health-Questionnaire-PHQ-9.jpg",
  "/brown-executive-scale-1.jpg",
  "/brown-executive-scale-2.jpg",
  "/mdq-bg.jpg",
  "/mdq-bg-2.jpg",
  "/cancellation-no-show-policy.jpg",
];

const kept = [];          // strong references → browser keeps decoded images
let started = null;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function loadImageOnce(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload  = () => { kept.push(img); resolve(src); };
    img.onerror = () => reject(new Error(`image ${src}`));
    img.src = src;
  });
}

async function withRetry(fn, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) { last = e; await wait(1000 * (i + 1)); }
  }
  throw last;
}

// Safe to call many times; work happens once per page load.
// Resolves to { ok: number, failed: string[] }.
export function preloadFormAssets() {
  if (typeof window === "undefined") return Promise.resolve({ ok: 0, failed: [] });
  if (started) return started;
  const jobs = [
    ...FORM_IMAGES.map((src) => withRetry(() => loadImageOnce(src)).then(() => null, () => src)),
    withRetry(() => import("jspdf")).then(() => null, () => "jspdf"),
    withRetry(() => import("pdf-lib")).then(() => null, () => "pdf-lib"),
  ];
  started = Promise.all(jobs).then((r) => {
    const failed = r.filter(Boolean);
    if (failed.length) console.warn("[preload] not cached:", failed);
    else console.log("[preload] all form assets ready");
    return { ok: r.length - failed.length, failed };
  });
  return started;
}
