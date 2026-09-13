import test from 'node:test';
import assert from 'node:assert/strict';
import { safeAuthNext } from '../lib/auth-redirect.ts';
void test('auth redirects stay local after browser URL normalization',()=>{
 for(const value of ['https://other.example','//other.example','/\\other.example','/\n/other.example',null]) assert.equal(safeAuthNext(value),'/');
 assert.equal(safeAuthNext('/?update-password=1'),'/?update-password=1');
 assert.equal(safeAuthNext('/programs?scope=MD#results'),'/programs?scope=MD#results');
});
