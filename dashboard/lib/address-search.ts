import type { PropertyAddress } from './property-address';
// Units do not identify a different property location. Retain them in the saved
// address, but do not ask the map provider to find an apartment/suite.
export function addressSearchQueries(address: string, fields?: PropertyAddress) {
  if (!fields) return [new URLSearchParams({q:address.trim()})];
  const common = {street:fields.street.trim(),state:fields.state,postalcode:fields.zip.trim().slice(0,5)};
  return [new URLSearchParams({...common,city:fields.city.trim()}), new URLSearchParams(common)];
}
export type AddressMatch = { display_name: string; lat: string; lon: string; address?: { country_code?: string; house_number?: string; road?: string; postcode?: string } };
export function matchedAddress(matches: AddressMatch[], fields?: PropertyAddress) {
  return matches.find(match=>{
    if (!match.address?.house_number || !match.address.road || match.address.country_code !== 'us') return false;
    if (fields) {
      const number = fields.street.trim().split(/\s+/)[0].toLowerCase();
      if (match.address.house_number.toLowerCase() !== number) return false;
      if (match.address.postcode && match.address.postcode.slice(0,5) !== fields.zip.slice(0,5)) return false;
    }
    return Number.isFinite(Number(match.lat)) && Number.isFinite(Number(match.lon)) && Math.abs(Number(match.lat))<=90 && Math.abs(Number(match.lon))<=180;
  });
}
