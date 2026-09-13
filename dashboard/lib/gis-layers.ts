export type BasemapId = 'satellite' | 'street' | 'topo';
export type GisLayerId =
  | 'landcover'
  | 'dem'
  | 'water'
  | 'wetlands'
  | 'hightide'
  | 'soils';
export type GisLayer = {
  id: GisLayerId;
  label: string;
  source: string;
  url: string;
  kind: 'tile' | 'wms' | 'export';
  layer?: string;
  opacity: number;
  description: string;
  documentation: string;
  legend?: string;
  maxNativeZoom?: number;
  minZoom?: number;
};
export const basemaps = {
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri and imagery providers',
    maxNativeZoom: 19,
  },
  street: {
    label: 'Street',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxNativeZoom: 19,
  },
  topo: {
    label: 'Topographic',
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, SRTM | OpenTopoMap (CC-BY-SA)',
    maxNativeZoom: 17,
  },
} as const;
export const gisLayers: GisLayer[] = [
  {
    id: 'dem',
    label: 'DEM hillshade',
    source: 'Esri World Hillshade',
    kind: 'tile',
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
    opacity: 0.4,
    maxNativeZoom: 16,
    description:
      'Elevation-derived relief, not measured elevation or a flood prediction. Scale and source dates vary.',
    documentation:
      'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer',
  },
  {
    id: 'soils',
    label: 'SSURGO soils',
    source: 'USDA NRCS Soil Data Access',
    kind: 'wms',
    url: 'https://sdmdataaccess.nrcs.usda.gov/Spatial/SDM.wms',
    layer: 'mapunitpoly',
    opacity: 0.85,
    minZoom: 12,
    description:
      'Orange boundaries and labels identify soil map units. Zoom in for field detail. These are not hydric-soil ratings; consult Web Soil Survey for unit properties.',
    documentation: 'https://sdmdataaccess.nrcs.usda.gov/WebServiceHelp.aspx',
  },
  {
    id: 'wetlands',
    label: 'Wetlands',
    source: 'USFWS National Wetlands Inventory',
    kind: 'wms',
    url: 'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/services/Wetlands/MapServer/WMSServer',
    layer: '0',
    opacity: 0.7,
    description:
      'Wetlands and deepwater habitat context. Survey dates and mapping scales vary; not a regulatory delineation.',
    documentation:
      'https://www.fws.gov/program/national-wetlands-inventory/wetlands-mapper',
    legend:
      'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/services/Wetlands/MapServer/WMSServer?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=0',
  },
  {
    id: 'hightide',
    label: 'High-tide flooding',
    source: 'NOAA moderate high-tide flooding',
    kind: 'tile',
    url: 'https://imagery.coast.noaa.gov/arcgis/rest/services/NOS_Mapping/NOS_Moderate/MapServer/tile/{z}/{y}/{x}',
    opacity: 0.65,
    maxNativeZoom: 16,
    description:
      'Moderate high-tide flooding screening extent where available; not a real-time warning.',
    documentation:
      'https://imagery.coast.noaa.gov/arcgis/rest/services/NOS_Mapping/NOS_Moderate/MapServer',
  },
  {
    id: 'landcover',
    label: 'NLCD 2021 land cover',
    source: 'MRLC · NLCD 2021',
    kind: 'wms',
    url: 'https://www.mrlc.gov/geoserver/mrlc_display/wms',
    layer: 'mrlc_display:NLCD_2021_Land_Cover_L48',
    opacity: 0.75,
    description:
      '2021 land cover, 30 m classification. Full opacity can obscure the basemap; colors follow the provider legend.',
    documentation: 'https://www.mrlc.gov/',
    legend:
      'https://www.mrlc.gov/geoserver/mrlc_display/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=mrlc_display:NLCD_2021_Land_Cover_L48',
  },
  {
    id: 'water',
    label: 'Sea-level rise · 4.5 ft',
    source: 'NOAA Sea Level Rise Viewer',
    kind: 'tile',
    url: 'https://coast.noaa.gov/arcgis/rest/services/dc_slr/slr_4_5ft/MapServer/tile/{z}/{y}/{x}',
    opacity: 0.85,
    maxNativeZoom: 16,
    description:
      '4.5-foot sea-level-rise scenario. This is a scenario layer, not current water depth or a dated forecast.',
    documentation: 'https://coast.noaa.gov/slr/',
  },
];
// Web Mercator export tiles for the legacy ArcGIS soils service.
export function tileBounds3857(x: number, y: number, z: number) {
  const edge = 20037508.342789244;
  const count = 2 ** z;
  const wrappedX = ((x % count) + count) % count;
  const size = (edge * 2) / count;
  const minX = -edge + wrappedX * size;
  const maxY = edge - y * size;
  return [minX, maxY - size, minX + size, maxY];
}
export function exportTileUrl(url: string, x: number, y: number, z: number) {
  return `${url}?${new URLSearchParams({ bbox: tileBounds3857(x, y, z).join(','), bboxSR: '3857', imageSR: '3857', size: '256,256', format: 'png32', transparent: 'true', layers: 'show:0', f: 'image' })}`;
}
export function boundaryAcres(points: [number, number][]) {
  if (points.length < 3) return 0;
  const radians = Math.PI / 180;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    let delta = (b[1] - a[1]) * radians;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    area += delta * (2 + Math.sin(a[0] * radians) + Math.sin(b[0] * radians));
  }
  return Math.abs((area * 6378137 ** 2) / 2) / 4046.8564224;
}
