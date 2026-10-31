// ─────────────────────────────────────────────────────────────────────────────
// app/utils/compressImage.js — shrink a phone photo on the device before upload
//
// Phone photos are 3–8 MB. The whole submission must stay under Vercel's
// 4.5 MB request limit, so each ID / insurance photo is re-encoded here to a
// JPEG of at most MAX_EDGE px on its long side and at most MAX_BYTES bytes.
// 1600 px keeps the small print on a license / insurance card readable.
//
// Re-encoding through a canvas also:
//   - converts iPhone HEIC (where the browser can decode it) to JPEG
//   - applies EXIF rotation (browsers draw <img> upright by default)
//   - strips EXIF metadata such as GPS location
// ─────────────────────────────────────────────────────────────────────────────

export const MAX_EDGE  = 1600;
export const MAX_BYTES = 300 * 1024;          // per photo, after compression
export const MAX_INPUT = 25 * 1024 * 1024;    // reject absurd originals early

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
    img.src = url;
  });
}

function dataUrlBytes(dataUrl) {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.floor((b64.length * 3) / 4) - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0);
}

// Returns { dataUrl, bytes, width, height } or throws Error with a
// patient-facing message.
export async function compressImage(file) {
  if (!file) throw new Error("No file selected.");
  if (file.type && !file.type.startsWith("image/"))
    throw new Error("Please choose a photo (JPG or PNG).");
  if (file.size > MAX_INPUT)
    throw new Error("That photo is too large. Please take a new photo.");

  let img;
  try { img = await loadImage(file); }
  catch { throw new Error("This phone's photo format couldn't be read. Please use “Take photo” instead."); }

  let w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) throw new Error("That photo appears to be empty. Please try again.");
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  w = Math.round(w * scale); h = Math.round(h * scale);

  const canvas = document.createElement("canvas");
  const ctx    = canvas.getContext("2d");

  // Lower quality first, then resolution, until it fits the byte budget.
  for (let attempt = 0; attempt < 6; attempt++) {
    canvas.width = w; canvas.height = h;
    ctx.fillStyle = "#ffffff";               // PNGs with transparency → white, not black
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    for (const q of [0.82, 0.72, 0.62]) {
      const dataUrl = canvas.toDataURL("image/jpeg", q);
      const bytes   = dataUrlBytes(dataUrl);
      if (bytes <= MAX_BYTES) return { dataUrl, bytes, width: w, height: h };
    }
    w = Math.round(w * 0.85); h = Math.round(h * 0.85);
  }
  throw new Error("Couldn't shrink that photo enough. Please take a new photo.");
}

// data:image/jpeg;base64,... → Blob (for FormData uploads)
export function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(",");
  const mime = (head.match(/data:([^;]+)/) || [])[1] || "image/jpeg";
  const bin  = atob(b64);
  const arr  = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
