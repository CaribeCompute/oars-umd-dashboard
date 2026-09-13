# Adding programs from staff accounts

Agency, Extension Officer, and Administrator accounts now have a persistent program editor. This replaces the Agency view’s temporary in-memory sample entries.

## One-time Supabase setup

Run `dashboard/supabase/migrations/20260914030000_catalog_programs.sql` in the project's Supabase SQL editor, after the existing account migrations. Then refresh the dashboard. Deploy the updated application for the same workflow on Netlify. The editor uses the existing public Supabase configuration and the authenticated session; it does not require a service secret.

## Classroom walkthrough

1. Sign in as an Agency user, or open the **Programs** tab as an Extension Officer or Administrator.
2. Choose **New program**. Enter its name, provider, description, geographic scope and land use. Add eligibility, funding, timeline and provider/application link when available.
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
