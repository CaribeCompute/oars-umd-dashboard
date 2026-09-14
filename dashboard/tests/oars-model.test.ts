import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateScore,
  rankRecommendations,
  resources,
  SCORECARD_METHODOLOGY_VERSION,
  type Resource,
} from '../lib/oars-model.ts';

void test('scorecard uses the average and records the methodology version', () => {
  const result = calculateScore({ plants: 0, soil: 2, water: 1 });
  assert.equal(result.average, 1);
  assert.equal(result.total, 3);
  assert.equal(result.complete, true);
  assert.equal(result.methodologyVersion, SCORECARD_METHODOLOGY_VERSION);
  assert.equal(result.stage.id, 'early');
});

void test('not sure and missing values produce an incomplete stage', () => {
  const result = calculateScore({ plants: null, soil: 2 });
  assert.equal(result.average, 2);
  assert.equal(result.complete, false);
  assert.equal(result.stage.id, 'incomplete');
});

void test('recommendations only use published explicit rule fields and explain matches', () => {
  const records: Resource[] = [
    {
      id: 'a', name: 'A', agency: 'Agency', type: 'Program',
      landTypes: ['farm'], stageIds: ['early'], goalIds: ['habitat'],
      description: 'A', eligibility: null, costShare: null, timeline: null,
      deadline: null, limitations: null, sourceUrl: null, source: 'test', status: 'published',
    },
    {
      id: 'b', name: 'B', agency: 'Agency', type: 'Program',
      landTypes: ['forest'], stageIds: ['early'], goalIds: ['habitat'],
      description: 'B', eligibility: null, costShare: null, timeline: null,
      deadline: null, limitations: null, sourceUrl: null, source: 'test', status: 'draft',
    },
  ];
  const result = rankRecommendations({ landType: 'farm', stageId: 'early', goalIds: ['habitat'] }, records);
  assert.deepEqual(result.map((item) => item.name), ['A']);
  assert.match(result[0].explanation.join(' '), /habitat/);
});

void test('the local catalog is sourced from the Mid-Atlantic workbook', () => {
  assert.equal(resources.length, 74);
  assert.equal(resources.filter((resource) => resource.type === 'Practice').length, 73);
  assert.equal(resources.filter((resource) => resource.type === 'Program').length, 1);
  assert.ok(resources.every((resource) => resource.source.includes('Mid-Atlantic Tool Database')));
  assert.ok(resources.every((resource) => resource.name !== 'Program + Practice Category'));
  assert.ok(resources.filter((resource) => resource.type === 'Practice').every((resource) => resource.programId === 'program-eqip'));
  assert.ok(resources.every((resource) => resource.mappingStatus !== 'oars-approved'));
});
