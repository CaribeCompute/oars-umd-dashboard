import type { AccountProfile, AccountRole } from './account-types.ts';

export function registrationFields(role: AccountRole) {
  const common = ['displayName', 'email', 'phone'];
  return role === 'landowner'
    ? [...common, 'farmerId', 'propertyName', 'county', 'address']
    : [...common, 'organization', 'jobTitle', 'serviceArea'];
}
export function canDeactivateAccount(
  actorId: string,
  target: Pick<AccountProfile, 'user_id' | 'role' | 'status'>,
  activeAdminCount: number,
) {
  return (
    actorId !== target.user_id &&
    !(
      target.role === 'admin' &&
      target.status === 'active' &&
      activeAdminCount <= 1
    )
  );
}
export function canOfficerAccessLandowner(
  officerId: string,
  landownerId: string,
  assignments: {
    extension_officer_id: string;
    landowner_id: string;
    active: boolean;
  }[],
) {
  return assignments.some(
    (item) =>
      item.extension_officer_id === officerId &&
      item.landowner_id === landownerId &&
      item.active,
  );
}
export function canSubmitApplication(application: {
  consented_at: string | null;
  status: string;
}) {
  return (
    Boolean(application.consented_at) && application.status === 'consented'
  );
}
