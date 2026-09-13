# Results export and reporting navigation

The previous Print results button only called `window.print()`. Some embedded browsers do not show a print dialog, so the action could appear to do nothing. Results now opens a **Print / download results** dialog with a client-generated PDF download and a secondary browser-print action. Feedback explains how to print the downloaded file if no browser dialog appears. Print CSS hides modal overlays and removes the assessment sidebar's grid column.

The PDF snapshots current property location, land use, relationship, demonstration stage/score, selected indicator descriptions, ordered goals, and displayed shortlist records with source rows and provider links. Text wraps and paginates; every page has a footer. It is generated locally with jsPDF, loaded on demand. No report data is sent to an external PDF service. Downloading does not save assessment inputs to Supabase. Saved maps and observation photos are now included as described below. Validated trajectory estimates remain unimplemented.

The GIS intro now explains the reporting path: select **Salt Patch**, click **Add observation**, place the marker, then use **Report this salt patch to Salt Patch Mapper** beneath its notes. The review dialog precedes the external form; actual submission remains in Survey123.

Validation: TypeScript and targeted lint passed; 18 tests passed including long-report pagination and final-record preservation. A two-page sample PDF was rendered and visually inspected. The local demo assessment export displayed successful download feedback. Native print-dialog behavior still depends on the browser.


## Saved map and photos

Export from a saved property assessment fetches that property’s map through the authenticated owner API. The PDF adds a vector coordinate reference map with the saved boundary, numbered salt-patch/flooding pins, property-location cross, map notes, observation dates and notes. It preserves north-up orientation and labels the map as a reference diagram, not surveyed geometry. Satellite basemaps and risk layers are not captured.

“Include saved observation photos” is checked by default. Files are listed from the signed-in owner/property/observation folders in private Supabase Storage, downloaded with the owner session, and embedded as individually captioned pages. Listing is paginated. Failed map or photo requests stop export with an error rather than silently claiming complete evidence. Users can explicitly disable photos and retry. Only existing saved markers’ photos are included; removed-marker orphan files are excluded. No new migration is needed.

The report uses current assessment answers and the latest saved GIS data; it does not save unsaved edits. Share the resulting PDF deliberately because included private photos become part of the downloaded file.

## Optional guided tours

A fixed **Take a tour** button provides repeatable dashboard, assessment, or GIS guidance based on the visible screen. The tour has Back, Next, Finish, End tour and Escape dismissal. Relevant visible targets scroll into view and receive an outline that is removed on exit. It never creates, edits, uploads or submits records, and does not automatically interrupt first-time visitors. It is hidden from print output.

Validation update: 19 tests passed, including image embedding, map/observation text and long-report pagination. TypeScript, targeted lint and Netlify build passed. Sample map/photo PDF pages were rendered and visually reviewed. The live demo property export completed in the browser. Tour start, forward/backward navigation and exit were checked. The combined private-photo retrieval path uses the storage operations verified in the live storage retest; this turn did not create new private test photos.
