import type { MapObservation } from './property-map';
export const saltPatchSurvey = 'https://survey123.arcgis.com/share/b7fd49519fa040eca0b040d3be9fa9a5';
export function surveyNotes(observation: MapObservation) {
  return `OARS observation date: ${observation.observedAt}. Unverified field observation.\n${observation.notes}`;
}
export function saltPatchSurveyUrl(observation: MapObservation, name: string, countyState: string, notes: string) {
  if (observation.category !== 'salt_patch') throw new Error('Only salt-patch observations can be reported here.');
  const [lat, lon] = observation.coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error('Invalid coordinates.');
  if (!name.trim() || !countyState.trim() || notes.length > 1000) throw new Error('Review required survey fields.');
  const url = new URL(saltPatchSurvey);
  url.searchParams.set('field:your_name', name.trim());
  url.searchParams.set('field:county_state', countyState.trim());
  url.searchParams.set('field:gps_location_of_the_salt_patch', `${lat} ${lon}`);
  url.searchParams.set('center', `${lat},${lon}`);
  url.searchParams.set('field:tell_us_more_about_it', notes);
  // Leave today's date to Survey123. Observation date is a separate fact in notes.
  return url.href;
}
