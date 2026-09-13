import test from 'node:test';
import assert from 'node:assert/strict';
import { saltPatchSurveyUrl, surveyNotes } from '../lib/salt-patch-survey.ts';
import type { MapObservation } from '../lib/property-map.ts';
const observation: MapObservation = { id:'test', category:'salt_patch', coordinates:[38.1,-75.7], observedAt:'2026-09-01', notes:'Water & salt? + reeds' };
void test('handoff preserves exact pin and encoded text using actual Survey123 field identifiers', () => {
 const url=new URL(saltPatchSurveyUrl(observation,'Test reporter','Somerset, MD',surveyNotes(observation)));
 assert.equal(url.hostname,'survey123.arcgis.com');
 assert.equal(url.searchParams.get('field:gps_location_of_the_salt_patch'),'38.1 -75.7');
 assert.equal(url.searchParams.get('field:county_state'),'Somerset, MD');
 assert.equal(url.searchParams.get('field:tell_us_more_about_it'),surveyNotes(observation));
 assert.ok(!url.searchParams.has('field:todays_date'));
 assert.ok(!url.searchParams.has('token'));
});
void test('handoff refuses flooding, invalid pins, blank required fields and oversized notes', () => {
 assert.throws(() => saltPatchSurveyUrl({...observation,category:'flooding'},'Name','County','Notes'));
 assert.throws(() => saltPatchSurveyUrl({...observation,coordinates:[91,0]},'Name','County','Notes'));
 assert.throws(() => saltPatchSurveyUrl(observation,' ','County','Notes'));
 assert.throws(() => saltPatchSurveyUrl(observation,'Name','County','x'.repeat(1001)));
});
