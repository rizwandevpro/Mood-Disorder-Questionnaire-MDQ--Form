# New Patient Intake Form — Setup

## Files
Place all 4 files inside `app/intake/` in your Next.js project:

```
app/intake/
├── page.js               ← route: /intake
├── IntakeForm.js         ← multi-step form UI + signature pad
├── IntakeImageMapper.js  ← canvas renderer + PDF generator
└── intakeSteps.js        ← pure data (steps, fields)
```

## Background Image
Copy the intake form image to your public folder:

```
public/intake-bg.png     ← 595 × 842 px PNG of the blank form
```

The image you uploaded is already the right size (595×842). Just rename it to `intake-bg.png` and put it in `/public`.

## Dependencies
Same as MDQ — no new packages needed:
- jsPDF loaded from CDN automatically
- No nodemailer needed for this form (download only, no email)
  - Add email later the same way as MDQ if needed

## Coordinate Calibration
After placing the background image, open `/intake` and fill the form.
On the Thank You screen, click **Download PDF** and check where text lands.

To adjust positions, edit the `POS` object in `IntakeImageMapper.js`:
- All values are in pixels (595×842 canvas)
- `x` = left edge of text, `y` = baseline of text
- Font size is 9px — matches the printed form lines

## Signature
- Users can **draw** their signature with mouse or touch
- Or **upload** an image of their signature
- The signature is captured as a base64 PNG and drawn onto the canvas at `POS.signature`

## Validation
- All fields marked `required: true` in `intakeSteps.js` are validated on Next
- Email: optional, validated if filled
- Phone fields: digits only, 7–15 digits
- Zip: digits only, 4–10 characters
- Errors appear in real-time as the user types corrections
