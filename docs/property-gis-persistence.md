# Saved property GIS and Salt Patch Mapper integration

## Required deployment step

Apply `dashboard/supabase/migrations/20260913200000_property_gis_storage.sql` after the existing account migrations. Then deploy this version. No extra environment variables are needed: requests use the signed-in Supabase session and row-level security, not an administrator secret.

This migration has not been applied to the hosted project by Codex. Until it is applied, the UI reports that storage is unavailable instead of claiming a successful save. Live cross-account and save/reload acceptance tests remain required.

## What now persists

- Property records load from Supabase instead of the two sample farms. Add, edit, and delete operate on the signed-in owner's records. County, address, acreage, registry number, land use, and geocoded coordinates persist.
- `/gis` and the landowner workspace show a selector for the owner's properties. Selecting a property centers its map and loads its map record.
- One boundary per property, multiple flooding/salt-patch points, each point's stable ID, observation date and notes, plus property map notes are stored in `property_maps.data`.
- Map updates autosave after a short pause. The status distinguishes unsaved, saved, and failed states. Version checks reject stale writes. A per-user/per-property browser draft helps recover interrupted edits when local storage is available; it is removed after successful save. Export the draft before discarding/reloading a conflicting server version.
- Assessment answers, goals, address, land use and relationship to the property persist separately in `property_assessments` through **Save assessment**. Use that button before leaving. Assessment mapping links to the saved GIS rather than creating a separate unsaved drawing surface.
- Public map use is still temporary. Source-layer toggles and map viewport are display preferences and are not stored. Private observation photo upload/download is now implemented with the separate observation photo migration; see `salt-patch-survey-handoff.md`. Multiple parcel polygons and shared officer editing are not implemented.

## Access and data representation

`properties.owner_id` identifies the owner. New insert/delete policies require an active owner; existing update/read policies continue to apply. Map and assessment editing remains restricted to the active property owner. After migration 20260914070000_admin_user_data_read.sql, active administrators can also read saved maps, assessments and observation photos in User data. Officers retain their property metadata access but do not gain private GIS access. Property deletion cascades to map and assessment records.

`/api/property-map` uses the authenticated session, checks property ownership, validates coordinates/categories/size, and performs a conditional version update. A stale save returns 409. Latitude/longitude is used inside the editor; GeoJSON export converts to longitude/latitude and closes polygon rings. Partial boundaries can be saved as drafts but are omitted from polygon export until they contain three points.

The browser draft contains coordinates and notes in this browser profile. Use a private browser session on shared classroom computers. No background job sends these records to external researchers.

## Salt Patch Mapper: verified integration path

The supplied [University of Delaware Salt Patch Mapper](https://experience.arcgis.com/experience/cee77b081bee4a8dbb2e4b8519ff5cb8/page/About) publishes an ArcGIS Experience Builder configuration. Its public configuration links to:

- Web map item `b32d676aa1644dae9dc0db22f9f2c7bf`.
- [Report a salt patch through Survey123](https://survey123.arcgis.com/share/b7fd49519fa040eca0b040d3be9fa9a5).
- Six historical imagery services: Maryland 2011/2017, Delaware 2013/2017, and Virginia 2012/2016, hosted under ArcGIS organization `DCPX1PuggGH4Tici`. These are historical mapped classifications, not the OARS users' current point observations.

The OARS salt-patch record now opens a review dialog before generating a prefilled reporting link. The user explicitly reviews and shares their entered name, county/state, marker location and notes. These fields travel in the URL; the property boundary, photo URLs and account tokens do not. The user attaches a photo and submits the external form themselves. Opening the form does not mean it was submitted. See `salt-patch-survey-handoff.md` for field mappings and setup.

**Export GeoJSON** supplies boundaries and observations for an agreed manual data exchange. This does not mean Survey123 accepts GeoJSON uploads; the mapper maintainer would need to import or transform the export. Records include `category`, `observed_at`, `notes`, an OARS observation ID, and an unverified-observation label. Flooding observations should not be treated as confirmed salt patches.

For future automated integration, agree with the maintainers on the destination survey/feature-layer schema, publication consent, evidence requirements, dates, coordinate system, and duplicate handling. Implement a reviewed outbound queue with explicit user consent, a unique OARS observation ID, returned ArcGIS record ID, retry status, and any required server-side credentials. Keep historical raster comparison separate from the observation-submission pipeline. Publicly readable ArcGIS data is not evidence of permission to write into its database.

Sources checked September 13, 2026: [Experience configuration](https://www.arcgis.com/sharing/rest/content/items/cee77b081bee4a8dbb2e4b8519ff5cb8/data?f=json), [web map configuration](https://www.arcgis.com/sharing/rest/content/items/b32d676aa1644dae9dc0db22f9f2c7bf/data?f=json), [Survey123 integration documentation](https://doc.arcgis.com/en/survey123/get-started/integratewithotherapps.htm), [UMD SALT program](https://extension.umd.edu/programs/environment-natural-resources/program-areas/salinity-affected-lands-transition-salt-program/diagnose-your-land).

## Acceptance tests after migration

1. Sign in as owner A. Verify their registered property appears; add a second property and refresh.
2. Draw a boundary and add flooding and salt-patch markers. Add notes/date; wait for saved status. Refresh and switch properties to verify isolation.
3. Change basemaps/layers and verify the boundary and marker notes survive.
4. Open the same property in two sessions; the second stale write should fail rather than overwrite the first. Export the conflicting draft and reload.
5. Sign in as owner B and attempt to read/update owner A's map by ID; database policies and the API must reject it. Confirm unauthenticated requests cannot read maps.
6. Save an assessment and reopen it. Delete a test property and verify its child records are removed.
7. Open the external reporting form without submitting; verify no OARS record is sent automatically.

Local checks cover data validation, coordinate export, map editing, FAQ rendering, TypeScript, and Netlify packaging. No live database records or external surveys were created during implementation.
