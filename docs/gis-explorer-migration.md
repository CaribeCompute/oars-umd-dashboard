# GIS explorer migration

## Source and integration

Ported the GIS functionality from `old-implementation/src/app.js` (the standalone legacy app, not its nested copy of the newer dashboard). The legacy custom SVG tile renderer is replaced with the dashboard's existing Leaflet engine. No legacy localStorage authentication or account records are copied.

Open `/gis` from the public navigation or portal header. The landowner's existing “Open property map” action opens the same explorer with the selected property's location. The route displays public datasets; signed-in owners can also select their private saved property maps.

## Features

- Satellite, OpenStreetMap, and OpenTopoMap basemaps.
- Six independent overlays with opacity, attribution, source links, and available provider legends.
- Search, pan/zoom, boundary drawing, undo, finish, approximate acreage, and flooding/salt-patch observations.
- Layer and basemap changes update existing map layers without destroying drawings or resetting the viewport.
- Mobile layout puts the map first and links to the controls below it.
- Loading and failed-tile feedback. An empty tile can mean no coverage, not no risk.

## Dataset registry

Definitions are in `dashboard/lib/gis-layers.ts`; UI and Leaflet lifecycle are in `dashboard/components/gis-explorer.tsx`. Layer order is explicit. WMS requests use Leaflet's EPSG:3857 bounds (including the NRCS soils WMS). Tiled NOAA layers use Leaflet's native-zoom scaling rather than stretching a parent tile into each child tile as the legacy renderer did.

| Dataset | Interpretation and migration check |
| --- | --- |
| MRLC NLCD 2021 | Land-cover classification, 30 m. WMS capabilities confirmed the layer name; tiles displayed in browser. Use provider legend rather than the legacy hand-coded colors. |
| Esri World Hillshade | Elevation-derived visual relief, not numeric elevation. Displayed during browser testing. |
| NOAA 4.5 ft sea-level rise | Fixed scenario, not current inundation or a dated forecast. Service metadata reachable; tiles displayed in browser. |
| USFWS NWI | Wetlands context, not a jurisdictional determination. WMS capabilities reachable; browser reported loaded. Coverage and dates vary. |
| NOAA moderate high-tide flooding | Screening extent, not a live flood warning. Service metadata reachable; browser reported loaded. |
| USDA NRCS SSURGO | Replaced the unreachable legacy rSVI endpoint with Soil Data Access WMS `mapunitpoly`. Verified capabilities and a nonempty EPSG:3857 PNG on September 13, 2026. Orange boundaries and labels identify soil map units, not hydric-soil ratings. Off by default; available from zoom 12 with a zoom-to-detail button. |

Public source requests go directly from the browser to the respective providers, including location searches to Nominatim. No new API keys or Netlify environment variables are required. Provider availability and browser connectivity remain external dependencies.

## Boundaries and limits

Public drawings remain temporary. Signed-in property owners now load their Supabase properties and autosave a boundary, flooding/salt-patch markers, dates, and notes per property after applying the GIS storage migration. See [persistence and Salt Patch Mapper](property-gis-persistence.md). Survey-grade measurements, self-intersection validation, and automated risk modeling are not implemented. Each property currently has one boundary, with multiple observations; the area estimate assumes a simple polygon.

The old “GeoAI ready” card implied analysis capability that was not implemented. The new UI states that field summaries and automated models are pending. Existing scientific scoring is unchanged.

## Validation

- Unit tests cover Web Mercator tile edges and wrapping, export URLs, approximate area and vertex direction, and the six-layer registry.
- Browser check: default imagery, land cover, and scenario tiles display; hillshade loads; a three-point boundary remains after layer/basemap/opacity changes, and undo reduces it to two points.
- Existing account-policy tests remain in the test suite.
- Run the production Netlify build before deployment and verify `/gis` directly after merging.

## Student walkthrough

1. Open GIS explorer; compare satellite imagery with land cover.
2. Lower land-cover opacity and explain why the two products differ.
3. Enable the NOAA scenario and distinguish a scenario from a prediction.
4. Draw a small, simple field boundary; finish and record the estimated area.
5. Change basemap and toggle an overlay. Confirm the boundary remains.
6. Undo a point, mark an observation, then compare public temporary drawings with a signed-in property’s saved map.
7. Enable SSURGO soils and select “Zoom to soil detail” if shown. Find an orange soil map-unit label. Explain why a map-unit boundary alone does not establish hydric status or flood risk.

The complete local Netlify build passed, including the static `/gis` route and server-handler bundling. Targeted lint and all seven unit tests passed.

## Working public SSURGO API

The browser requests `https://sdmdataaccess.nrcs.usda.gov/Spatial/SDM.wms` directly using WMS 1.1.1, `LAYERS=mapunitpoly`, `SRS=EPSG:3857`, PNG output, and transparent backgrounds. Leaflet supplies each tile’s bounds and dimensions. No API key, paid service, Supabase change, or hosting environment variable is needed.

[USDA service documentation](https://sdmdataaccess.nrcs.usda.gov/WebServiceHelp.aspx) documents map-unit rendering at scales finer than 1:250,000. The dashboard conservatively enables these requests from zoom 12 and shows a zoom prompt at wider views, avoiding a misleading “Loaded” status for out-of-scale tiles. Missing coverage is still possible. For named soil properties or hydric percentages, a separate map-unit attribute query would be required; those values are not computed by this overlay.

## Public navigation and older previews

The public header includes Programs and GIS explorer. `/programs` reuses the signed-in `ExploreCatalog` component and shared `dashboard/lib/programs.ts` data, including search, land filters, comparison, and expandable resource details. This remains a demonstration catalog; it does not claim to load live agency publications.

`/map` redirects to `/gis`. Public GIS and the property workspace both render `dashboard/components/gis-explorer.tsx`, so SSURGO, WMS layers, opacity, basemaps, source links, and zoom guidance stay consistent. The older preview titled “Spatial context” in the original checkout is obsolete; use the current Next.js preview on port 3003 or the deployment after merging.
