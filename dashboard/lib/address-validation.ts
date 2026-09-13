import 'server-only';
import {addressSearchQueries, matchedAddress, type AddressMatch} from './address-search';
import type {PropertyAddress} from './property-address';
export async function validateUsAddress(address: string, fields?: PropertyAddress) {
  if (address.trim().length < 8 || address.length > 500) return null;
  const queries=addressSearchQueries(address,fields);
  for (const [index,params] of queries.entries()) {
    // The public provider allows at most one request per second.
    if(index) await new Promise(resolve=>setTimeout(resolve,1100));
    const url=new URL('https://nominatim.openstreetmap.org/search');
    for(const [key,value] of Object.entries({format:'jsonv2',countrycodes:'us',addressdetails:'1',limit:'5'})) params.set(key,value);
    url.search=params.toString();
    const response=await fetch(url,{headers:{'User-Agent':'OARS-UMD-Dashboard/0.1 (https://github.com/CaribeCompute/oars-umd-dashboard)',Accept:'application/json'},signal:AbortSignal.timeout(10000),next:{revalidate:86400}});
    if(!response.ok) throw new Error('Address provider unavailable.');
    const match=matchedAddress(await response.json() as AddressMatch[],fields);
    if(match) return {address:fields ? address : match.display_name,latitude:Number(match.lat),longitude:Number(match.lon)};
  }
  return null;
}
