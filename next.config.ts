import type { NextConfig } from "next";

// Blank form images used to draw the PDFs. Cached for a day so a patient whose
// connection drops mid-flow can still have every PDF built from the browser
// cache (see app/patient-forms/preload.js). If a form image is ever replaced,
// give the new file a new name (or wait a day) — browsers may keep the old one.
const FORM_IMAGE_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:file((?:HIPAA_Compliance_Patient_Consent_Form|intake-bg|patient-health-history-page-1|Patient-health-history-page-2|gad-7-anxiety|Adult-ADHD-Self-Report-Scale-Page-1|Adult-ADHD-Self-Report-Scale-Page-2|Patient-Health-Questionnaire-PHQ-9|brown-executive-scale-1|brown-executive-scale-2|mdq-bg|mdq-bg-2|cancellation-no-show-policy)\\.jpg)",
        headers: [{ key: "Cache-Control", value: FORM_IMAGE_CACHE }],
      },
    ];
  },
};

export default nextConfig;
