import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const data = JSON.parse(readFileSync(new URL('../data/oars-programs.json', import.meta.url), 'utf8'));
void test('catalog snapshot preserves source coverage, exclusions and unknown stages', () => {
  assert.equal(data.records.length, 317);
  assert.equal(new Set(data.records.map((r: {id: string}) => r.id)).size, 317);
  assert.equal(data.records.filter((r: {shortlisted: boolean}) => r.shortlisted).length, 73);
  assert.ok(data.records.every((r: {stage: string}) => !r.stage));
  for (const excluded of data.excluded) assert.ok(!data.records.some((r: {name: string}) => r.name.toLowerCase() === excluded.name.toLowerCase()));
  const workbook = readFileSync(new URL('../../docs/OARS Mid-Atlantic Tool Database.xlsx', import.meta.url));
  assert.equal(createHash('sha256').update(workbook).digest('hex'), data.sourceSha256);
});
void test('catalog uses hyperlink targets and preserves county-specific entries', () => {
  const row = data.records.find((r: {sourceSheet:string;sourceRow:number}) => r.sourceSheet === 'Federal Program Overview' && r.sourceRow === 9);
  assert.equal(row.website, 'https://www.nrcs.usda.gov/programs-initiatives/agricultural-conservation-easement-program');
  assert.equal(data.records.filter((r: {scope:string}) => r.scope === 'NJ').length, 41);
  assert.ok(data.records.some((r: {county:string}) => r.county));
});
void test('published photo references have files and supplied credits; drafts retain five stages', () => {
  const photos = JSON.parse(readFileSync(new URL('../data/swi-photos.json', import.meta.url), 'utf8'));
  assert.equal(photos.length, 9);
  assert.equal(photos.filter((p: {stageLabeled: boolean}) => p.stageLabeled).length, 5);
  for (const photo of photos) {
    assert.ok(existsSync(new URL('../public' + photo.src, import.meta.url)));
    assert.ok(photo.stageLabeled ? ['NS', 'PL'].includes(photo.credit) : photo.credit === '');
  }
  const cards = JSON.parse(readFileSync(new URL('../data/swi-scorecards.json', import.meta.url), 'utf8'));
  assert.deepEqual(cards.map((c: {rows: string[][]}) => c.rows.length), [7,7]);
});
