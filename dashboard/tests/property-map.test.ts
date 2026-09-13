import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyMapData, validMapData, mapGeoJSON } from '../lib/property-map.ts';
void test('map validation rejects invalid coordinates, categories, and oversized notes', () => {
  assert.equal(validMapData(emptyMapData), true);
  assert.equal(validMapData({ ...emptyMapData, boundary: [[91, 0]] }), false);
  assert.equal(validMapData({ ...emptyMapData, notes: 'a'.repeat(10001) }), false);
  assert.equal(validMapData({ ...emptyMapData, observations: [{ id: '1', category: 'other', coordinates: [38,-75], notes: '', observedAt: '2026-09-13' }] }), false);
});
void test('GeoJSON export closes polygons and converts lat/lon to longitude/latitude', () => {
  const data = { boundary: [[38,-75],[39,-75],[39,-76]] as [number,number][], observations: [{ id:'salt-1', category: 'salt_patch' as const, coordinates: [38,-75] as [number,number], notes:'Bare patch', observedAt:'2026-09-13' }], notes: 'Field' };
  assert.equal(validMapData(data), true);
  const output = JSON.parse(JSON.stringify(mapGeoJSON(data)));
  assert.deepEqual(output.features[0].geometry.coordinates[0], [[-75,38],[-75,39],[-76,39],[-75,38]]);
  assert.deepEqual(output.features[1].geometry.coordinates, [-75,38]);
  assert.equal(output.features[1].properties.verification, 'unverified');
});
