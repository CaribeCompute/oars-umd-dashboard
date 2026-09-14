export type PolicyRole = 'landowner' | 'agency' | 'extension_officer' | 'admin';
export type PolicyStatus = 'pending' | 'active' | 'declined' | 'inactive';

type Account = {
  user_id: string;
  role: PolicyRole;
  status: PolicyStatus;
};

type Assignment = {
  extension_officer_id: string;
  landowner_id: string;
  active: boolean;
};

type Application = {
  consented_at: string | null;
  status: 'draft' | 'ready_for_consent' | 'consented' | 'submitted' | 'withdrawn';
};

const fieldsByRole: Record<PolicyRole, string[]> = {
  landowner: ['displayName', 'email', 'phone', 'farmerId', 'propertyName', 'county', 'address', 'landType', 'acres'],
  agency: ['displayName', 'email', 'organization', 'jobTitle', 'serviceArea'],
  extension_officer: ['displayName', 'email', 'organization', 'jobTitle', 'serviceArea'],
  admin: ['displayName', 'email', 'organization', 'jobTitle'],
};

export function registrationFields(role: PolicyRole): string[] {
  return fieldsByRole[role];
}

export function canDeactivateAccount(
  targetUserId: string,
  target: Account,
  activeAdminCount: number,
): boolean {
  if (targetUserId === target.user_id) return false;
  if (target.role === 'admin' && target.status === 'active' && activeAdminCount <= 1) return false;
  return true;
}

export function canOfficerAccessLandowner(
  officerId: string,
  landownerId: string,
  assignments: Assignment[],
): boolean {
  return assignments.some(
    (assignment) =>
      assignment.extension_officer_id === officerId &&
      assignment.landowner_id === landownerId &&
      assignment.active,
  );
}

export function canSubmitApplication(application: Application): boolean {
  return application.status !== 'submitted' && application.consented_at !== null;
}
