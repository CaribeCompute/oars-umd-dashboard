import type * as Leaflet from 'leaflet';
import { exportTileUrl } from './gis-layers';
export function createExportLayer(
  L: typeof Leaflet,
  url: string,
  options: Leaflet.TileLayerOptions,
) {
  class ExportTiles extends L.TileLayer {
    getTileUrl(coords: Leaflet.Coords) {
      return exportTileUrl(url, coords.x, coords.y, coords.z);
    }
  }
  return new ExportTiles(url, options);
}
