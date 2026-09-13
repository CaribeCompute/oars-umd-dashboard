# GIS explorer migration

## Source and integration

Ported the GIS functionality from `old-implementation/src/app.js` (the standalone legacy app, not its nested copy of the newer dashboard). The legacy custom SVG tile renderer is replaced with the dashboard's existing Leaflet engine. No legacy localStorage authentication or account records are copied.

Open `/gis` from the public navigation or portal header. The landowner's existing “Open property map” action opens the same explorer with the selected property's location. The standalone route displays public datasets and does not load private account data.

## Features

- Satellite, OpenStreetMap, and OpenTopoMap basemaps.
- Six independent overlays with opacity, attribution, source links, and available provider legends.
- Search, pan/zoom, boundary drawing, undo, finish, approximate acreage, and flooding/salt-patch observations.
- Layer and basemap changes update existing map layers without destroying drawings or resetting the viewport.
- Mobile layout puts the map first and links to the controls below it.
- Loading and failed-tile feedback. An empty tile can mean no coverage, not no risk.

## Dataset registry

Definitions are in `dashboard/lib/gis-layers.ts`; UI and Leaflet lifecycle are in `dashboard/components/gis-explorer.tsx`. Layer order is explicit. WMS requests use Leaflet's EPSG:3857 bounds; the experimental ArcGIS export adapter builds matching tile bounds. Tiled NOAA layers use Leaflet's native-zoom scaling rather than stretching a parent tile into each child tile as the legacy renderer did.

| Dataset | Interpretation and migration check |
| --- | --- |
| MRLC NLCD 2021 | Land-cover classification, 30 m. WMS capabilities confirmed the layer name; tiles displayed in browser. Use provider legend rather than the legacy hand-coded colors. |
| Esri World Hillshade | Elevation-derived visual relief, not numeric elevation. Displayed during browser testing. |
| NOAA 4.5 ft sea-level rise | Fixed scenario, not current inundation or a dated forecast. Service metadata reachable; tiles displayed in browser. |
| USFWS NWI | Wetlands context, not a jurisdictional determination. WMS capabilities reachable; browser reported loaded. Coverage and dates vary. |
| NOAA moderate high-tide flooding | Screening extent, not a live flood warning. Service metadata reachable; browser reported loaded. |
| NRCS SSURGO rSVI | Legacy experimental source was unreachable on September 13, 2026. Off by default, labeled experimental, and linked to Web Soil Survey. It is not represented as a verified hydric-soils layer. |

Public source requests go directly from the browser to the respective providers, including location searches to Nominatim. No new API keys or Netlify environment variables are required. Provider availability and browser connectivity remain external dependencies.

## Boundaries and limits

Drawings and observations remain in the current view's memory. They are not written to Supabase and disappear when leaving the view or refreshing. Layer toggles preserve them within the mounted view. Survey-grade measurements, self-intersection validation, field summaries, database geometry storage, and risk modeling are not implemented. The area estimate assumes a simple polygon and is for orientation only.

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
6. Undo a point, mark an observation, then discuss which changes are only in memory.
7. Inspect the experimental soils warning and explain why unavailable data cannot be interpreted as absence of risk.

The complete local Netlify build passed, including the static `/gis` route and server-handler bundling. Targeted lint and all seven unit tests passed.
