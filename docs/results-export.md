# Results export and reporting navigation

The previous Print results button only called `window.print()`. Some embedded browsers do not show a print dialog, so the action could appear to do nothing. Results now opens a **Print / download results** dialog with a client-generated PDF download and a secondary browser-print action. Feedback explains how to print the downloaded file if no browser dialog appears. Print CSS hides modal overlays and removes the assessment sidebar's grid column.

The PDF snapshots current property location, land use, relationship, demonstration stage/score, selected indicator descriptions, ordered goals, and displayed shortlist records with source rows and provider links. Text wraps and paginates; every page has a footer. It is generated locally with jsPDF, loaded on demand. No report data is sent to an external PDF service. Downloading does not save assessment inputs to Supabase. Maps/photos and validated trajectory estimates are not included; the comprehensive report requirement remains partial.

The GIS intro now explains the reporting path: select **Salt Patch**, click **Add observation**, place the marker, then use **Report this salt patch to Salt Patch Mapper** beneath its notes. The review dialog precedes the external form; actual submission remains in Survey123.

Validation: TypeScript and targeted lint passed; 18 tests passed including long-report pagination and final-record preservation. A two-page sample PDF was rendered and visually inspected. The local demo assessment export displayed successful download feedback. Native print-dialog behavior still depends on the browser.
