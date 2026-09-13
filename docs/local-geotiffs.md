# Adding local GeoTIFF datasets

## Where to put the files

Put the original `.tif` or `.tiff` files in **`data/geotiffs/` at the repository root**. This directory is intentionally ignored by Git except for its README. Originals are not automatically uploaded, committed, or served to website visitors. Keep a backup outside an ephemeral development worktree.

For each file, include a note with the dataset name, source/credit, acquisition date, coordinate reference system, units, band meanings or class legend, NoData value, and whether it may be public. The CRS must be known before display; guessing it can put the map in the wrong place. We also need to know whether this is elevation, modeled salinity, a classified map, or RGB imagery before choosing colors.

## How it appears in the dashboard

The current Leaflet explorer displays map tiles and WMS services. Dropping a raw GeoTIFF into a folder does not add a visible layer. A small study-area raster can be prepared as **public XYZ image tiles** and registered in the new `dashboard/lib/local-raster-layers.ts` list. Entries automatically receive layer on/off, opacity, source text and status controls in the existing GIS explorer. They are off initially.

1. Inspect the GeoTIFF's projection, bands, extent and NoData values in QGIS or GDAL.
2. Choose a scientifically appropriate display style. For floating-point data, preserve the original values and create a separately styled RGB/RGBA display copy. Do not blindly turn elevation or salinity into 8-bit values. For categorical data, preserve class colors and use nearest-neighbor resampling.
3. Generate Web Mercator XYZ tiles from the styled copy for a limited area and useful zoom range. Put the result in `dashboard/public/rasters/<layer-name>/`.
4. Add a layer entry to `dashboard/lib/local-raster-layers.ts` and verify alignment, legend and NoData transparency against the basemap.
5. Intentionally include the generated public tiles in the deployment, or host the tiles separately and use their HTTPS URL. Large rasters can create too many tiles for a practical Git/Netlify deployment.

For a **pre-styled Byte RGB/RGBA GeoTIFF with valid georeferencing**, a GDAL installation providing `gdal2tiles` can generate tiles with:

```sh
gdal2tiles --xyz -p mercator -r near -z 10-16 -w none \
  data/geotiffs/styled-example.tif \
  dashboard/public/rasters/example
```

This is a template, not a command already run against your data. Choose zooms/resampling for the actual dataset. Current GDAL documentation points to `gdal raster tile` as the newer command; the available command depends on your installation. See [GDAL tile generation](https://gdal.org/en/stable/programs/gdal2tiles.html), including its warning about non-Byte data being clamped.

Example registration (replace all example metadata with the dataset's actual metadata):

```ts
import type { GisLayer } from './gis-layers';
export const localRasterLayers: GisLayer[] = [{
  id: 'local-example',
  label: 'Example dataset · collection year',
  source: 'Dataset owner / attribution',
  kind: 'tile',
  url: '/rasters/example/{z}/{x}/{y}.png',
  opacity: 0.65,
  minZoom: 10,
  maxNativeZoom: 16,
  // bounds: [[southLatitude, westLongitude], [northLatitude, eastLongitude]],
  description: 'Describe the measured or modeled quantity, units and limits.',
  documentation: 'https://example.org/actual-dataset-documentation',
  // legend: '/rasters/example/legend.png',
}];
```

Use the `local-` ID prefix. Set actual latitude/longitude bounds to avoid requesting tiles outside coverage. `maxNativeZoom` must match the highest generated zoom. `--xyz` matters: the alternative TMS convention reverses the y direction and misplaces tiles if configured as XYZ.

## Public vs private datasets

Everything under `dashboard/public/` is publicly accessible, even when the app's UI requires sign-in elsewhere. Put only datasets approved for public release there. Do not store a private farm raster under `public` and rely on hiding its layer toggle.

Private or very large rasters need a separate integration: private object storage, server-side authorization, and an appropriate tile/Cloud Optimized GeoTIFF rendering path. Supabase Storage could hold originals, but storage alone does not render them. Direct GeoTIFF upload, private raster sharing, automatic styling, pixel-value inspection, and GeoTIFF export are **not implemented**. Static display tiles also do not become inputs to the assessment score or appear automatically in exported assessment PDFs.

## Current status

The input folder, display-tile folder and registry are ready. No local GeoTIFF was supplied in this turn, so no real raster was converted or added to the map. Add your originals to `data/geotiffs/`, along with metadata, to prepare the first layer accurately.
