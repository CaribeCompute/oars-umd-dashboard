# Salt Patch Mapper handoff and private observation photos

## Local setup

Apply `dashboard/supabase/migrations/20260914010000_observation_photos.sql` in the hosted project's SQL Editor after the account and property GIS migrations. It creates a private `observation-photos` bucket and owner policies. No service secret or new environment variable is needed; the browser uses its authenticated Supabase session. This migration has not been applied by Codex.

## User workflow

1. Sign in, select a property, add a salt-patch marker and wait for the map to save.
2. Under **Your observation photos**, select the marker and upload an original JPG/PNG (maximum 10 MB each). Photos persist separately from map JSON. Download or delete a photo from the same panel.
3. Use **Report this salt patch to Salt Patch Mapper** beneath the marker notes. Enter the reporter name and county/state, review the exact pin and editable notes, and explicitly choose to share them.
4. Continue to Survey123. Confirm the prefilled pin, attach the downloaded photo, complete CAPTCHA and submit. OARS does not submit automatically or claim submission success.

The handoff also works for temporary public markers; photo persistence requires a saved property and signed-in owner. Flooding markers do not show the salt-patch action. The existing educational images are not substitutes for observation evidence.

## Field mapping and privacy

Verified against the live survey DOM and a synthetic prefill test on September 13, 2026:

| OARS review field | Survey123 question identifier |
| --- | --- |
| Reporter name | `your_name` |
| County/state | `county_state` |
| Marker latitude/longitude | `gps_location_of_the_salt_patch` |
| Reviewed notes | `tell_us_more_about_it` |

`center` additionally centers the map. `todays_date` remains the survey's current date; the observed date is explicitly placed in notes. The survey's 1,000-character notes limit is enforced without truncating text silently. No account token, property boundary, private photo URL, or hidden account identifier is included. The user sees that the shared values travel in a URL and can remain in browser history. Opening the form is not submission, and a saved Survey123 browser draft is not submission confirmation.

Photo paths are `owner UUID/property UUID/observation ID/random filename`. Storage upload policies require an active owner and an existing saved observation. Reads require an active property owner. Owners can delete their own files even after the parent record is removed. The bucket accepts JPEG/PNG and limits object size. Do not make it public. Original file metadata is retained; users choose what to attach externally. Remove photos before deleting a marker/property: automatic orphan-file cleanup and a deleted-record photo manager are not implemented.

## Verification and remaining acceptance tests

17 unit tests pass, including exact coordinate order, special-character encoding, correct field names, invalid/flooding rejection and the notes limit. TypeScript, targeted lint and Netlify production packaging pass. Local browser checks verified the consent gate and generated URL. The real survey accepted the synthetic name, county, notes and exact coordinates without any submission.

After applying the storage migration, verify upload → refresh → download → delete with a test owner. Verify a second owner and an unauthenticated client cannot list/download/upload the first owner's photos. Verify upload is rejected for a marker not saved to that property, oversized files, and disallowed MIME types. These live storage/access tests remain outstanding because no database administration connection is available in this session.

References: [Survey](https://survey123.arcgis.com/share/b7fd49519fa040eca0b040d3be9fa9a5), [Esri URL parameters](https://doc.arcgis.com/en/survey123/get-started/integrate-launchwebapp.htm).

## Live demo test and policy repair

The authorized demo landowner successfully signed in and loaded Bay View Farm. Authenticated map insert/read succeeded. Photo upload failed with a row-level-security rejection. Review identified SQL name shadowing: inside the property subquery, unqualified `name` resolved to `properties.name` instead of the outer storage object's path. The policies now explicitly use `storage.objects.name`.

Existing installations must apply `20260914020000_fix_observation_photo_policy_paths.sql`. The original photo migration is also corrected for fresh installations. The temporary test marker was removed; the rejected photo was never stored. Photo upload/download and isolation checks must be rerun after the repair migration. This failure supersedes any assumption that applying the first migration alone establishes working storage.
