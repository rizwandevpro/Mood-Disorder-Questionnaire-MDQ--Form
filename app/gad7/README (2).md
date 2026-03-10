# GAD-7 Anxiety Screener

**Route:** `app/gad7/`

## Files
| File | Purpose |
|------|---------|
| `page.js` | Page orchestrator, sticky header, progress bar, thank you screen |
| `GAD7Form.js` | Multi-step UI with auto-advance on question selection |
| `GAD7ImageMapper.js` | Canvas renderer — draws answers onto background PNG, exports PDF |
| `gad7Steps.js` | Step definitions, question text, option labels + scores |

## Setup
1. Copy folder to `app/gad7/`
2. Place `gad-7-anxiety.png` in `/public/`
3. Route is live at `/gad7`

## Flow
```
info → Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → difficulty → thankyou
```
Questions **auto-advance** 350ms after selection.

## Scoring
| Score | Severity |
|-------|----------|
| 0–4   | Minimal  |
| 5–9   | Mild     |
| 10–14 | Moderate |
| 15–21 | Severe   |

## Canvas Coordinates
Background: `gad-7-anxiety.png` (assumed 1581×2244)

| Element | X values | Y |
|---------|----------|---|
| Q1–Q7 options | 794, 932, 1070, 1233 | 582–1012 |
| Column totals | 817, 967, 1120, 1272 | 1088 |
| Total score | 1260 | 1150 |
| Difficulty checks | 201, 579, 884, 1172 | 1380 |
