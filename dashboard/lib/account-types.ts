export type AccountRole =
  | 'landowner'
  | 'agency'
  | 'extension_officer'
  | 'admin';
export type AccountStatus = 'pending' | 'active' | 'declined' | 'inactive';
export type AccountProfile = {
  user_id: string;
  email: string;
  display_name: string;
  role: AccountRole;
  status: AccountStatus;
  must_change_password: boolean;
  farmer_id: string | null;
  phone: string | null;
  organization: string | null;
  job_title: string | null;
  service_area: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  deactivated_by: string | null;
  deactivated_at: string | null;
  deactivation_reason: string | null;
};
