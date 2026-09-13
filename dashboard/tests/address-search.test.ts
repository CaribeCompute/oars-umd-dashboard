import test from 'node:test';
import assert from 'node:assert/strict';
import {addressSearchQueries,matchedAddress} from '../lib/address-search.ts';
const fields={street:'123 Example Road',unit:'Suite 2',city:'Example Historic District',state:'MD',zip:'21821-1234'};
void test('structured search retains street and ZIP while allowing a different locality name',()=>{
 const queries=addressSearchQueries('formatted address',fields);
 assert.equal(queries[0].get('city'),fields.city);assert.equal(queries[1].has('city'),false);
 for(const query of queries){assert.equal(query.get('street'),fields.street);assert.equal(query.get('postalcode'),'21821');assert.equal(query.has('q'),false);assert.equal(query.toString().includes('Suite'),false);}
});
void test('a road-only or wrong house/ZIP result is not a property match',()=>{
 const match={display_name:'Example',lat:'38',lon:'-75',address:{country_code:'us',road:'Example Road',house_number:'123',postcode:'21821'}};
 assert.equal(matchedAddress([{...match,address:{...match.address,house_number:''}},match],fields),match);
 assert.equal(matchedAddress([{...match,address:{...match.address,house_number:'125'}}],fields),undefined);
 assert.equal(matchedAddress([{...match,address:{...match.address,postcode:'12345'}}],fields),undefined);
});
