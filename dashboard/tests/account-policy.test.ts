import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canDeactivateAccount,
  canOfficerAccessLandowner,
  canSubmitApplication,
  registrationFields,
} from '../lib/account-policy.ts';

void test('registration fields change by public account type', () => {
  assert.ok(registrationFields('landowner').includes('propertyName'));
  assert.ok(registrationFields('landowner').includes('farmerId'));
  assert.ok(registrationFields('agency').includes('organization'));
  assert.ok(registrationFields('extension_officer').includes('serviceArea'));
});

void test('admins cannot deactivate themselves or the final active admin', () => {
  const admin = { user_id: 'admin-1', role: 'admin' as const, status: 'active' as const };
  assert.equal(canDeactivateAccount('admin-1', admin, 2), false);
  assert.equal(canDeactivateAccount('admin-2', admin, 1), false);
  assert.equal(canDeactivateAccount('admin-2', admin, 2), true);
});

void test('extension officers only access active assignments', () => {
  const assignments = [{ extension_officer_id: 'officer-1', landowner_id: 'owner-1', active: true }];
  assert.equal(canOfficerAccessLandowner('officer-1', 'owner-1', assignments), true);
  assert.equal(canOfficerAccessLandowner('officer-2', 'owner-1', assignments), false);
});

void test('program submission requires consent and cannot be repeated', () => {
  assert.equal(canSubmitApplication({ consented_at: null, status: 'draft' }), false);
  assert.equal(canSubmitApplication({ consented_at: '2026-09-10T00:00:00Z', status: 'consented' }), true);
  assert.equal(canSubmitApplication({ consented_at: '2026-09-10T00:00:00Z', status: 'submitted' }), false);
});

void test('only public landowners and agencies activate automatically', async () => {
  const { registrationStatus } = await import('../lib/account-policy.ts');
  assert.equal(registrationStatus('landowner'), 'active');
  assert.equal(registrationStatus('agency'), 'active');
  assert.equal(registrationStatus('extension_officer'), 'pending');
  assert.equal(registrationStatus('admin'), 'pending');
  assert.equal(registrationStatus('unknown'), 'pending');
});
