# Adding programs from staff accounts

Agency, Extension Officer, and Administrator accounts now have a persistent program editor. This replaces the Agency view’s temporary in-memory sample entries.

## One-time Supabase setup

For manual setup in the Supabase SQL editor, paste and run the entire file [`dashboard/supabase/setup/program-catalog.sql`](../dashboard/supabase/setup/program-catalog.sql). This combines the table creation and full catalog fields in one transaction, preserves existing programs, and can be rerun if either individual migration was already applied. It requires the existing OARS account migrations. Refresh the dashboard after it succeeds.

If you see `relation "public.catalog_programs" does not exist`, the field migration was attempted before table creation. Run the combined setup file above. Its final query lists the installed columns as a verification step.

For migration-based deployments, the ordered files remain `20260914030000_catalog_programs.sql` followed by `20260914040000_catalog_program_field_parity.sql`. The combined file is a manual setup alternative, outside the migrations directory. Deploy the updated application for the same workflow on Netlify. The editor uses the existing public Supabase configuration and authenticated session; it does not require a service secret.

## Classroom walkthrough

1. Sign in as an Agency user, or open the **Programs** tab as an Extension Officer or Administrator.
2. Choose **New program**. Enter its name, provider, description, geographic scope and land use. Fill in the same fields used by the landowner catalog, grouped into Overview, Eligibility and practices, Funding and timing, Contacts and next steps, Evaluation and notes, and Websites and resources. Unknown details can remain blank.
3. Leave Visibility as **Draft** and select **Save draft**. Reload to demonstrate persistence.
4. Edit the draft, choose **Published**, then **Save and publish**.
5. Open **View published program**, or find the entry in the public Programs and practices catalog. Contributor entries appear alongside the 317 imported workbook records.
6. To withdraw an entry, edit it and save its visibility as **Draft**.

An external application link only opens the provider's site. Publishing a catalog listing does not create a new OARS application form or submit applications.

## Permissions and implementation

Active Agency and Extension Officer users can create programs and edit their own entries. Active Administrators can create and edit all contributor entries. Drafts are readable only by their creator and active Administrators. Published programs are public. Landowners and anonymous visitors cannot write programs. Database row-level security enforces these rules even for direct API requests. Creator and identity fields cannot be changed. Stale edits return a conflict rather than overwriting newer changes.

Workbook entries remain unchanged and read-only. Contributor programs are not automatically placed on the workbook shortlist or treated as stage-specific assessment recommendations.

The `catalog_programs` table stores drafts and published entries. `/api/programs` validates writes using the signed-in Supabase session. `ProgramManager` is shared across all three staff views. The shared catalog fetches published entries and detail pages resolve their UUIDs. If the migration is missing, the editor displays a setup error and preserves the unsaved form.

## Validation and limits

Type checking, automated validation/catalog tests, and the production Netlify build pass. Browser checks confirmed both Agency and Extension Officer demo accounts can open the shared editor with Draft as the default. Both correctly report missing storage (HTTP 503) until migration. Administrator behavior has not been tested with a live account. Live database persistence and RLS checks require applying the new migration; they have not yet been verified against this project's database. The previous walkthrough video's Agency section describes the old prototype and should be re-recorded after migration verification.

## Shared catalog fields

`dashboard/lib/program-fields.ts` now defines the labels and field mappings for both workbook records and contributor records. The staff editor and public detail view use these definitions, preventing a separate, reduced agency schema.

Alongside name, provider, description, type, land use and geographic scope, contributors can supply: parent program/category, source land-use description, geographic scope details, county, SWI stage, eligibility, requirements, supported practices, practice code, strategies/species, SWI strategies, landowner goals, cost share, economic benefit, implementation timeline, duration, application deadline, next step, personnel, contacts, specialists, limitations, quantitative and qualitative evaluations, notes, program website, practice website and practice overview PDF. The stage and deadline also appear in the catalog comparison table. Source provenance and workbook shortlisting remain system metadata.

The additive field parity migration preserves existing programs, ownership and visibility. New fields default to blank. Every detail and all three links are covered by validation-to-display round-trip tests. All resource links require HTTP or HTTPS. Applying the new migration remains necessary before database saves can be tested.

## Entry examples and dropdowns

Empty text fields show placeholders that disappear when typing; examples are never prefilled or submitted. Workbook examples use the supplied Delaware Forest Resiliency Fund record (DE, row 7), linked from the form. Fields absent from that record use text explicitly marked “Example.” These illustrate formatting rather than current program eligibility or funding.

SWI stage is a dropdown using the draft OARS scorecard stages 0–4, plus All stages and Multiple stages / other. Custom text and older saved stage values remain editable. Unknown stages remain blank. Type, land use, scope category, and visibility also use dropdowns. Coverage details, practices, codes, eligibility, funding, timing, and contacts remain free text because the workbook includes multiple values, conditional requirements, and ranges rather than a single controlled vocabulary. No database migration is needed for these form changes.
