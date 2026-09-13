# OARS workbook and field photo import — September 13, 2026

## What students can trace

The public and signed-in Explore catalog now use the supplied `OARS Mid-Atlantic Tool Database.xlsx`, replacing five demonstration records. The workbook is retained unchanged under `docs`. `scripts/import-oars-programs.py` reads each worksheet with an explicit column mapping and writes `dashboard/data/oars-programs.json`. Every record retains its worksheet and row; the snapshot records the workbook SHA-256. Website fields use Excel hyperlink targets when available, because displayed link text can be truncated. Only HTTP(S) links are made clickable.

There are **317 source records, not 317 unique programs**: 17 federal programs, 73 federal practices, 17 Maryland records, 9 Delaware, 41 New Jersey, 25 Virginia, 62 private, and 73 shortlist records. County-specific entries and records repeated in the shortlist remain traceable. The “Programs- Not Applicable” sheet supplies one exclusion. Blank cells remain unknown; only actual merged cells inherit their anchor.

Search, land-use, location, program/practice, and shortlist filters work on this snapshot. Cards and comparison tables load 24 records at a time. Each detail page exposes the supplied eligibility, requirements, assistance, contacts, limitations and source reference when available. The JSON ships with the app: no Supabase migration, paid API, or browser spreadsheet parsing is required. Editing the source requires re-importing and redeploying; this is not yet an agency publishing workflow.

## Important source limits

All 317 SWI-stage fields are blank. The catalog must not imply stage-based eligibility. Assessment examples use the OARS shortlist and land use, then take the first three records; goals and SWI score do not rank them. Provider availability and financial terms have not been independently reverified. The existing demonstration score is unchanged.

The photo archive also supplies draft farm and forest scorecards. Copies are preserved in `docs/swi`, and their tables are reproduced in `/swi-guide`. They describe stages 0–4 and an average of three indicators, but do not define fractional-average classification. These drafts require review before replacing the existing assessment, including migration of saved answers and separate handling of farm/forest indicators. Displaying the drafts does not complete the scientific model or trajectory calculation.

## Photo provenance

Five readable images with supplied stage labels and photographer initials are published unchanged in `dashboard/public/swi-photos`. Their original filenames, dimensions, labels and credits are recorded in `dashboard/data/swi-photos.json`. Next Image creates responsive delivery variants. The gallery appears in the assessment and at `/swi-guide`; FAQs link to the guide. The satellite landing illustration stays in place.

- `moderate_severe_flooding_NS.JPG` → `farm-flooding.jpg`
- `severe_algae_standingwater_NS.jpg` → `farm-algae.jpg`
- `moderate-severe_cracking_standingwater_NS.JPG` → `farm-cracking.jpg`
- `for_moderate_severe_PL.JPG` → `forest-decline.jpg`
- `for_severe_marsh_PL.JPG` → `forest-marsh.jpg`

NS and PL are the supplied initials; full photographer names are not inferred. Stage ranges reproduce filenames, not new diagnoses. Eight Argyle Farm JPEG entries are zero bytes and need replacement originals. Remaining HEIC/extensionless and unlabeled photographs are not published in this change; stage labels and credit information should be supplied before expanding the reference set. The original ZIP remains in the user's source folder and is not duplicated in Git.

## Reproduce and check

From the repository root, with Python and openpyxl installed:

```sh
python3 scripts/import-oars-programs.py
node --experimental-strip-types --test dashboard/tests/*.test.ts
```

From `dashboard`, run the local TypeScript checker and the production build. The tests check source hash/record coverage, explicit exclusions, blank stages, the actual hyperlink target, county coverage, photo references, and both five-stage draft tables. Browser checks should include catalog filtering, detail links, pagination, and the field guide images.
