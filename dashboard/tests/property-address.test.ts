import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPropertyAddress, validatePropertyAddress } from '../lib/property-address.ts';
const valid = { street: '123 Main Street', unit: '', city: 'Princess Anne', state: 'MD', zip: '21853' };
void test('address format preserves ZIP leading zeros and optional unit', () => {
  assert.equal(validatePropertyAddress({ ...valid, zip: '01234-5678' }), null);
  assert.match(formatPropertyAddress({ ...valid, unit: 'Suite 2', zip: '01234' }), /Suite 2, Princess Anne, MD 01234, USA/);
});
void test('address rejects incomplete street, state, and invalid ZIP formats', () => {
  for (const change of [{ street: 'Main Street' }, { city: ' ' }, { state: 'XX' }, { zip: '2185' }, { zip: '21853x' }, { zip: '21853-123' }]) {
    assert.ok(validatePropertyAddress({ ...valid, ...change }));
  }
  assert.equal(validatePropertyAddress(valid), null);
});
