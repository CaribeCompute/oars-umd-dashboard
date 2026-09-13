# OARS Mid-Atlantic: features, operation, and release guide

This is the feature inventory for the Next.js dashboard in `dashboard/`, reviewed on September 13, 2026. It describes the implementation on `codex/oars-source-catalog-photos` / PR #13. A feature on this branch is not necessarily present on the Netlify production site until the branch is merged and deployed.

OARS helps coastal landowners organize property records, describe saltwater intrusion observations, explore spatial datasets, and find adaptation programs. It supports an operational pilot and classroom testing. The assessment score is still a demonstration, and the draft scientific scoring methodology needs OARS approval before the tool is presented as a validated decision system.

See [the detailed release review](release-review-2026-09-13.md) for fixes, test evidence, configuration gaps, and checks that remain unverified.

## 1. Where to find features

| Page or workspace | Available features |
| --- | --- |
| `/` public landing | OARS overview, satellite example, account access, links to programs, GIS, FAQs and guidance |
| `/programs` | Public searchable/filterable program and practice catalog |
| `/programs/[id]` | Individual workbook or published contributor program details and source links |
| `/gis` | Public GIS exploration; signed-in owners can select their own saved property maps |
| `/map` | Additional map entry route |
| `/swi-guide` | OARS field photos and supplied draft farm/forest stage scorecards |
| `/faqs` | Account, saving, spatial layer, and survey reporting guidance |
| Landowner workspace | Property profiles, four-step assessment, results, catalog, personalized GIS |
| Agency workspace | Create, edit, draft, publish and withdraw contributor program listings |
| Extension Officer workspace | Assigned portfolio, assisted landowner creation, application tracking, Programs tab |
| Administrator workspace | Approvals, accounts, assignments, administrator invitations, audit log, Programs tab |

The dashboard's internal tabs are state-based views on `/`; not every tab has a separate URL.

## 2. Accounts and sign-in

- Email/password registration and sign-in use Supabase Auth.
- Public roles are Landowner, Agency, and Extension Officer. Landowners activate without manual approval after registration/email verification. New Agency and Extension Officer accounts remain pending until an Administrator approves them. Existing accounts retain their status.
- Administrator access requires an existing administrator's authorization/invitation. Public registration cannot select the administrator role.
- Landowner registration collects identity/contact information, Farmer ID, ownership confirmation and the first property.
- Agency and Officer registration collect organization, job title and service area.
- Google sign-in and Google registration buttons are implemented. They require enabling/configuring the Google provider and redirect URLs in Supabase and Google; OARS Google registration also requires the server-only Supabase secret.
- Password recovery sends a reset link. The app includes a new-password screen with confirmation.
- Assisted landowner accounts receive a generated temporary password and a password-change prompt. Completing their profile flag update requires server-side account administration.
- Inactive and declined accounts are rejected when loading the workspace. Server endpoints and database policies apply their own authorization checks.
- Sign-out ends the Supabase session and returns to the public view.

Email delivery, Google provider setup, and a real administrator invitation were not exercised in this review. No invitations, recovery emails, or external survey submissions were sent.

## 3. Property profiles and addresses

Landowners can create and edit multiple properties and select a property for assessment or GIS work. The profile records name, county, address, farm/forest/mixed land use, optional acreage, and optional registry/cadastral number. Property deletion is available in the dashboard; export information and remove attached photos before deleting their parent property.

Address entry uses street, optional unit, city/town, state/territory dropdown and ZIP/ZIP+4. Existing combined addresses are preserved and shown intact until **Change address** is selected. The app does not guess how to split legacy geocoder strings.

**Find** in assessment Step 1 validates and locates the address, reports loading/errors, and displays the matched location. Editing it requires another successful lookup before continuing. Property saves use the verified address and returned coordinates; users no longer need to enter coordinates that would be overwritten by lookup. Map search remains a general place search.

Address lookup uses Nominatim/OpenStreetMap and is map matching, not postal delivery verification. Provider coverage and availability can prevent a match. The app does not currently provide address suggestions while typing. See [address workflow](property-address-workflow.md).

## 4. Four-step assessment

| Step | What users do | What it means |
| --- | --- | --- |
| 1. Property | Confirm/find location, select land use and relationship to the land | Establishes assessment context |
| 2. SWI score | Select plant, soil and water condition descriptions; consult the photo guide | Produces a clearly labeled demonstration score and stage |
| 3. Goals | Choose and order planning priorities | Records landowner goals for discussion |
| 4. Results | Review assessment summary and example programs; save or export | Planning information, not an eligibility or scientific determination |

**Save assessment** stores inputs and located assessment coordinates in Supabase for a selected property. Loading an existing assessment must succeed before it can be overwritten; a failed load offers a retry. Saving is explicit, unlike GIS autosave. Public assessment inputs are temporary.

Current recommendations use land type and the imported OARS shortlist, taking up to three examples. SWI stage, goals, county, deadlines and contributor listings do not currently drive automated recommendation ranking. The supplied draft scorecards have five stages (0–4), whereas the assessment's demonstration scoring has not been replaced by that methodology. No automatic salinity measurement, model inference, or eligibility determination is implemented.

An assessment location lookup does not rewrite the saved property profile or its GIS observations. Edit the property itself to change that record.

## 5. Programs and practices

### Shared catalog

- 317 imported workbook records, preserving source-sheet and county-specific duplicates. These are records, not 317 guaranteed unique programs.
- Search across names, providers, descriptions and selected descriptive fields.
- Filters for farm/forest, scope, Program/Practice, and the OARS workbook shortlist.
- Card and comparison views, incremental display, and individual detail pages.
- Provider links, contact/eligibility information, source sheet/row, and unknown-value explanations.
- Published contributor entries appear alongside workbook records. Workbook records remain read-only.

### Program creation

Agency users use **New program**. Officers and Administrators use **Programs → New program**. All three use the same editor and public detail structure.

| Section | Fields |
| --- | --- |
| Basics | Program name, provider organization, description, entry type, land use, geographic scope category, draft/published visibility |
| Overview | Parent program/category, detailed land use, geographic scope details, county/local coverage, SWI stage |
| Eligibility and practices | Eligibility, requirements, supported practices, practice code, strategies/species, SWI strategies, landowner goals |
| Funding and timing | Cost share, economic benefit, application-to-implementation timing, duration, application deadline |
| Contacts and next steps | Next step, personnel, contact information, strategy specialists |
| Evaluation and notes | Limitations, quantitative evaluation, qualitative evaluation, notes |
| Resources | Program website, practice website, practice overview PDF |

SWI stage offers 0–4, All stages, or a custom range. Unknown fields remain blank. Faded placeholders illustrate entries using the supplied Delaware Forest Resiliency Fund record where possible; other examples are explicitly illustrative. Placeholders are not saved values.

Drafts are private to their creator and active Administrators. Agency and Officer users edit their own entries; Administrators edit any contributor entry. Publishing makes a listing public immediately; changing it back to Draft withdraws it. Concurrent stale edits return a conflict. Creator identity cannot be reassigned. URLs must use HTTP or HTTPS. Provider links do not create application forms or submit applications.

See [program publishing and database setup](program-publishing.md) and [workbook/photo provenance](oars-source-import.md).

## 6. GIS explorer

### Maps and layers

The Leaflet map supports pan/zoom, location search, a satellite/street/topographic basemap selector, overlay visibility, opacity, source attribution, provider links and available legends. Loading/tile failures are reported.

| Overlay | Interpretation |
| --- | --- |
| SSURGO soils | USDA map-unit boundaries/labels; available at field-detail zoom; not hydric-soil ratings |
| DEM hillshade | Visual elevation relief, not a numeric elevation survey |
| Wetlands | USFWS inventory context, not a regulatory delineation |
| High-tide flooding | NOAA moderate flooding screening extent, not a live alert |
| NLCD 2021 | Land-cover classification |
| Sea-level rise, 4.5 ft | Fixed NOAA scenario, not a current measurement or dated forecast |

Missing coverage or failed tiles do not mean no risk. Third-party services can change or fail. Their complete coverage and availability were not certified by this release review.

### Property records

- One boundary per property, drawn with vertices, undo/finish controls and approximate acreage.
- Multiple flooding and salt-patch observations, each with coordinates, date and notes.
- Property-wide map notes, marker removal and clear controls.
- Owner-specific Supabase persistence with autosave, version checks, retry feedback and a browser recovery draft when local storage is available.
- GeoJSON export of boundary and observations. It includes coordinates and notes.
- Public drawings are temporary; choose an owned property for saving.
- A conflicting server map is not silently replaced. Export a recovered draft before choosing to discard/reload it.

GIS editing is owner-only in this implementation. Officer portfolio access does not grant access to an owner's private map or photos. Boundary area assumes a simple polygon; survey-grade measurements, self-intersection validation, multiple parcel polygons and GeoJSON import are not implemented.

### Observation photos

Save original JPG/PNG photos, up to 10 MB each, to a saved observation. The private bucket restricts access by owner/property/marker. Users can download and delete their photos and include them in a PDF. Photos are not automatically sent to Survey123. Remove photos before deleting their marker or property: automatic orphan-file cleanup is not implemented.

See [GIS persistence](property-gis-persistence.md), [layer migration](gis-explorer-migration.md), and [photo/survey setup](salt-patch-survey-handoff.md).

## 7. Salt Patch Mapper handoff

Each salt-patch observation offers **Report this salt patch to Salt Patch Mapper**. The review dialog collects the user's name, county/state and reviewed notes, shows the exact observation coordinates, and requires explicit consent before opening Survey123.

The link prefills supported survey fields and includes the observation date in the notes. The user must finish the survey, attach their own photo, complete CAPTCHA, and submit on the external site. Opening it does not submit a report. OARS does not receive a submission receipt, synchronize the survey database, or automatically transfer private photos. Shared details appear in the external URL and can remain in browser history.

Flooding markers do not receive the salt-patch-specific handoff. This review did not submit test reports to the external survey.

## 8. Results, printing and reference photos

**Print / download results** opens a dialog with PDF download and browser-print options. The PDF includes the assessment, goals, example program details, saved boundary/pin reference map, observation notes and optionally saved private photos. It loads saved GIS data, not unsaved edits. Public risk overlays and satellite tiles are not embedded in the PDF's coordinate reference map. Browser printing depends on browser support; the downloadable PDF is the reliable printing route.

The public SWI photo guide provides enlarged-image viewing and original-image links. Nine supplied images are published: five with supplied stage/credit information and four unclassified reference images. Unconverted or unusable supplied files are documented separately. The draft farm/forest scorecards are displayed with their draft status. They are educational references, not automatic image diagnoses.

## 9. Officer and Administrator workflows

These workflows require `SUPABASE_SECRET_KEY` on the server, in addition to the public Supabase configuration.

**Extension Officer**

- View the assigned landowner portfolio and recorded properties/applications.
- Create an assisted landowner and first property, record a Farmer ID, issue a temporary password, and establish an assignment.
- Prepare application drafts for assigned landowners and an active Agency.
- Record a consent note and mark a consented application submitted once.
- Manage the officer's own program catalog entries independently of the account-administration API.

Application status is internal tracking. **Mark submitted does not send an application, email an agency, or call a provider API.** The Agency workspace currently manages program listings; it does not provide an application inbox. The landowner workspace does not currently expose an application-consent inbox.

**Administrator**

- View pending registrations, approve/decline, inspect accounts and statuses.
- Deactivate/reactivate with reasons; self-deactivation and deactivating the last active administrator are guarded.
- Assign/reassign active landowners to active officers.
- Invite administrators and inspect the latest 50 audit events.
- Manage all contributor program entries.

The API checks active roles, current assignments and application transitions. A permission-hardening migration explicitly restricts account/application database writes to the server, preventing default database grants from bypassing the API. Administrative multi-step operations are not universally transactional; a partial provider/database failure may require administrator reconciliation. Concurrent account-administration operations should be supervised during the pilot.

## 10. Help and teaching materials

- FAQs explain accounts, saving, spatial limitations, programs and survey reporting.
- **Take a tour** opens a restartable walkthrough with Back/Next/End/Finish. It adapts to dashboard, assessment and GIS contexts and does not perform submissions.
- Source workbook, OARS requirements document and draft scorecards are preserved under `docs/`.
- [Video narration](video-walkthrough-narration.md) and [video production notes](video-walkthrough.md) describe the existing five-minute English walkthrough. Its Agency prototype chapter predates persistent publishing and should be updated before public release.

## 11. Local run and deployment

Run from the repository containing `dashboard/` and `netlify.toml` (the active working copy for this review was `/private/tmp/oars-netlify-current`).

```sh
cd dashboard
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Populate `.env.local` locally; do not commit it:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser/server session client |
| `SUPABASE_SECRET_KEY` | Server-only account administration and Google registration completion |

Never prefix the secret with `NEXT_PUBLIC_` or `VITE_`. Use a current secret from Supabase, not a credential copied into a shared discussion. The app does not require a separate JWKS environment variable. Restart the local server after changing environment values.

```sh
pnpm exec next dev --hostname 127.0.0.1 --port 3003
```

Open `http://127.0.0.1:3003`. Using `pnpm dev` instead uses the package's default port 3000.

For Netlify, merge the reviewed changes to the configured production branch (`main`), then wait for a successful deploy. `netlify.toml` specifies base `dashboard`, command `pnpm build`, publish `.next`, Node 22.16 and the Netlify Next.js adapter. Do not add a blanket `/index.html` SPA redirect. Configure the same environment variable names in Netlify. A successful local build or SQL migration does not update the deployed front end.

Set Supabase Site URL/redirect allowlists for the exact production and local origins, including `/auth/callback`. Configure Google OAuth separately if used. Test password recovery and invitations only with consenting test recipients. Free hosting/service quotas and provider availability are external constraints; check the actual account dashboards before launch.

## 12. Database setup

Apply existing migrations in filename order using the established project workflow. Do not rerun non-idempotent migrations against tables already created manually.

| Migration group | Purpose |
| --- | --- |
| `20260910202847` | Accounts, properties, assignments, application/audit records and access helpers |
| `20260910235000` | Farmer ID and verified property locations |
| `20260913180000`, `20260913190000` | Public account activation rules |
| `20260913200000` | Saved property maps and assessments |
| `20260914010000`, `20260914020000` | Private observation photos and corrected storage policy paths |
| `20260914030000`, `20260914040000` | Contributor programs and full spreadsheet field set |
| **`20260914050000`** | **Explicit server-only account/application writes; added in this review** |
| **`20260914060000`** | **New Agency and Extension Officer registrations require approval** |

For manual program-only setup, [the combined SQL file](../dashboard/supabase/setup/program-catalog.sql) safely creates the program table and full fields. It is not a replacement for account/GIS/photo migrations or the new [account-write permission migration](../dashboard/supabase/migrations/20260914050000_server_only_account_writes.sql).

## 13. Before publishing

1. Apply the account-write permission migration and the professional-account approval migration in Supabase.
2. Configure the server-only secret for officer/admin workflows. It was absent from the local server during this review.
3. Exercise a real Administrator account and supervised assisted registration, assignment, consent/status tracking, Google login, recovery and invitation workflows in the configured staging environment.
4. Confirm the remaining demonstration/scientific limitations are acceptable for the intended pilot audience.
5. Merge/deploy, then check the production home page, direct program/GIS routes, authentication redirect, save/reload, and PDF download.
6. Update the walkthrough video to reflect the current editor.

For this review's exact evidence and limits, use [release-review-2026-09-13.md](release-review-2026-09-13.md). Earlier implementation notes may describe superseded behavior; this README is the current inventory.
