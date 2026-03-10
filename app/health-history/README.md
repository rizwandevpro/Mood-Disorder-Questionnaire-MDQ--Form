# Patient Health History Form — Setup

## Files
Place all 4 files in `app/health-history/`:

```
app/health-history/
├── page.js                    ← route: /health-history
├── HealthHistoryForm.js       ← 9-step form UI
├── HealthHistoryImageMapper.js← 2-page canvas renderer + PDF
└── healthHistorySteps.js      ← step definitions + constants
```

## Background Images
```
public/patient-health-history-page-1.png   (1584 × 2244)
public/patient-health-history-page-2.png   (1585 × 2244)
```

## Steps
| # | ID              | Content                                      |
|---|-----------------|----------------------------------------------|
| 0 | personal        | Name, DOB, Age, Marital, Gender, Occupation  |
| 1 | healthMaint     | Screening dates (Women/Both/Men)             |
| 2 | conditions      | 45 condition checkboxes                      |
| 3 | allergies       | Allergy checkboxes + Medications textarea    |
| 4 | healthHabits    | Caffeine, Tobacco, Alcohol, Drugs, Diet, etc |
| 5 | surgicalHistory | Up to 8 surgery rows (dynamic add/remove)    |
| 6 | pregnancyOther  | Pregnancy stats + child rows + hospitalizations |
| 7 | familyHistory   | Father/Mother/Brothers/Sisters + diseases    |
| 8 | additional      | Additional info + signature + date           |
| 9 | thankyou        | Submit confirmation + PDF download           |

## PDF Output
- 2-page PDF (one page per form image)
- Generated silently on Thank You screen
- Download button appears when ready
- Filename: `HealthHistory_[PatientName]_[Date].pdf`

## Checkboxes
Checkboxes are drawn as ✓ tick marks using canvas strokes.
The coordinates provided are the top-left corner of each checkbox on the form.

## Dynamic Rows
- Surgical History: 1–8 rows, user can + Add / × remove
- Child rows: 1–6 rows
- Other Hospitalizations: 1–5 rows
- Family rows: fixed (Father, Mother, 4× Brother, 4× Sister)

## Coordinate Calibration
After adding background images, test and adjust POS values in
`HealthHistoryImageMapper.js` — look for `condMap`, `famCoords`,
and the individual `drawText` / `drawCheck` calls.
