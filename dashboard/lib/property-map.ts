export type MapObservation = { id: string; category: 'flooding' | 'salt_patch'; coordinates: [number, number]; notes: string; observedAt: string };
export type PropertyMapData = { boundary: [number, number][]; observations: MapObservation[]; notes: string };
export const emptyMapData: PropertyMapData = { boundary: [], observations: [], notes: '' };
function point(p: unknown): p is [number, number] {
  return Array.isArray(p) && p.length === 2 && p.every(n => typeof n === 'number' && Number.isFinite(n)) && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180;
}
export function validMapData(value: unknown): value is PropertyMapData {
  if (!value || typeof value !== 'object') return false;
  const d = value as PropertyMapData;
  return typeof d.notes === 'string' && d.notes.length <= 10000 && Array.isArray(d.boundary) && d.boundary.length <= 5000 && d.boundary.every(point) && Array.isArray(d.observations) && d.observations.length <= 1000 && new Set(d.observations.map(o => o?.id)).size === d.observations.length && d.observations.every(o => o && typeof o.id === 'string' && o.id.length <= 80 && ['flooding', 'salt_patch'].includes(o.category) && point(o.coordinates) && typeof o.notes === 'string' && o.notes.length <= 2000 && typeof o.observedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.observedAt) && Number.isFinite(Date.parse(o.observedAt)));
}
export function mapGeoJSON(data: PropertyMapData) {
  const features: object[] = data.observations.map(o => ({ type: 'Feature', id: o.id, properties: { category: o.category, notes: o.notes, observed_at: o.observedAt, source: 'OARS user observation', verification: 'unverified' }, geometry: { type: 'Point', coordinates: [o.coordinates[1], o.coordinates[0]] } }));
  if (data.boundary.length >= 3) {
    const ring = data.boundary.map(([lat, lon]) => [lon, lat]);
    features.unshift({ type: 'Feature', properties: { category: 'property_boundary', notes: data.notes, source: 'OARS user drawing' }, geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] } });
  }
  return { type: 'FeatureCollection', features };
}
