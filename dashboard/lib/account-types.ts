export const accountRoles = ['landowner', 'agency', 'extension_officer', 'admin'] as const;
export type AccountRole = (typeof accountRoles)[number];
export type AccountStatus = 'pending' | 'active' | 'declined' | 'inactive';

export type AccountProfile = {
  user_id: string;
  email: string;
  display_name: string;
  phone?: string | null;
  farmer_id?: string | null;
  organization?: string | null;
  job_title?: string | null;
  service_area?: string | null;
  role: AccountRole;
  status: AccountStatus;
  must_change_password?: boolean;
};

export function registrationFields(role: Exclude<AccountRole, 'admin'>): string[] {
  if (role === 'landowner') return ['displayName', 'email', 'phone', 'farmerId', 'propertyName', 'county', 'address', 'landType', 'acres'];
  if (role === 'agency') return ['displayName', 'email', 'phone', 'organization', 'jobTitle', 'serviceArea'];
  return ['displayName', 'email', 'phone', 'organization', 'jobTitle', 'serviceArea'];
}

export function canDeactivateAccount(
  actorId: string,
  target: Pick<AccountProfile, 'user_id' | 'role' | 'status'>,
  activeAdminCount: number,
) {
  return target.user_id !== actorId &&
    target.status === 'active' &&
    !(target.role === 'admin' && activeAdminCount <= 1);
}

export function canOfficerAccessLandowner(
  officerId: string,
  landownerId: string,
  assignments: Array<{ extension_officer_id: string; landowner_id: string; active: boolean }>,
) {
  return assignments.some((item) =>
    item.active && item.extension_officer_id === officerId && item.landowner_id === landownerId,
  );
}

export function canSubmitApplication(application: { consented_at: string | null; status: string }) {
  return application.consented_at !== null && !['submitted', 'withdrawn'].includes(application.status);
}
