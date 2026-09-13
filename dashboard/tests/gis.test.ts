import assert from 'node:assert/strict';
import test from 'node:test';
import {
  tileBounds3857,
  exportTileUrl,
  boundaryAcres,
  gisLayers,
} from '../lib/gis-layers.ts';
void test('Mercator export tiles share edges and wrap at the dateline', () => {
  const west = tileBounds3857(0, 0, 1);
  const east = tileBounds3857(1, 0, 1);
  assert.equal(west[2], east[0]);
  assert.deepEqual(tileBounds3857(-1, 0, 1), east);
  const url = new URL(exportTileUrl('https://example.test/export', 1, 1, 2));
  assert.equal(url.searchParams.get('bbox'), tileBounds3857(1, 1, 2).join(','));
  assert.equal(url.searchParams.get('bboxSR'), '3857');
});
void test('field area is zero before a polygon and independent of drawing direction', () => {
  assert.equal(
    boundaryAcres([
      [0, 0],
      [0, 0.01],
    ]),
    0,
  );
  const square: [number, number][] = [
    [0, 0],
    [0, 0.0008983153],
    [0.0008983153, 0.0008983153],
    [0.0008983153, 0],
  ];
  assert.ok(Math.abs(boundaryAcres(square) - 2.47105) < 0.001);
  assert.ok(
    Math.abs(boundaryAcres(square) - boundaryAcres([...square].reverse())) <
      0.00001,
  );
});
void test('legacy datasets retain sources and the fixed sea-level scenario', () => {
  assert.equal(new Set(gisLayers.map((layer) => layer.id)).size, 6);
  assert.ok(
    gisLayers.every(
      (layer) =>
        layer.url.startsWith('https://') &&
        layer.documentation.startsWith('https://'),
    ),
  );
  assert.match(
    gisLayers.find((layer) => layer.id === 'water')!.url,
    /slr_4_5ft/,
  );
  assert.equal(
    gisLayers.find((layer) => layer.id === 'soils')!.kind,
    'wms',
  );
});
