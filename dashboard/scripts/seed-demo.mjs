import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY before seeding.');

const password = 'Test1234!';
const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const fixtures = [
  { email: 'landowner@oars.demo', displayName: 'Jordan Lee', role: 'landowner', farmerId: 'FARM-DEMO-001', organization: null, jobTitle: null, serviceArea: null },
  { email: 'agency@oars.demo', displayName: 'Morgan Diaz', role: 'agency', farmerId: null, organization: 'Coastal Conservation Office', jobTitle: 'Program Specialist', serviceArea: 'Maryland Eastern Shore' },
  { email: 'officer@oars.demo', displayName: 'Sam Rivera', role: 'extension_officer', farmerId: null, organization: 'Maryland Extension', jobTitle: 'Extension Officer', serviceArea: 'Somerset and Worcester Counties' },
];

const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;
const users = new Map();

for (const fixture of fixtures) {
  let user = existingUsers.users.find((item) => item.email?.toLowerCase() === fixture.email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: fixture.email,
      password,
      email_confirm: true,
      user_metadata: { display_name: fixture.displayName, requested_role: fixture.role },
    });
    if (error || !data.user) throw error ?? new Error(`Could not create ${fixture.email}`);
    user = data.user;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (error) throw error;
  }
  users.set(fixture.role, user.id);
  const { error: profileError } = await supabase.from('profiles').upsert({
    user_id: user.id,
    email: fixture.email,
    display_name: fixture.displayName,
    role: fixture.role,
    farmer_id: fixture.farmerId,
    organization: fixture.organization,
    job_title: fixture.jobTitle,
    service_area: fixture.serviceArea,
    status: 'active',
    must_change_password: false,
    approved_at: new Date().toISOString(),
  });
  if (profileError) throw profileError;
}

const { data: adminProfile, error: adminError } = await supabase.from('profiles').select('user_id').eq('role', 'admin').eq('status', 'active').limit(1).single();
if (adminError || !adminProfile) throw adminError ?? new Error('An active administrator is required to seed assignments.');

await supabase.from('properties').delete().eq('owner_id', users.get('landowner'));
const { error: propertyError } = await supabase.from('properties').insert({
  owner_id: users.get('landowner'), name: 'Bay View Farm', county: 'Somerset County',
  address: '4012 Crisfield Highway, Crisfield, Maryland 21817, United States', land_type: 'farm', approximate_acres: 84,
  latitude: 38.01045, longitude: -75.84744, address_verified_at: new Date().toISOString(), address_provider: 'seed_fixture',
  created_by: users.get('landowner'),
});
if (propertyError) throw propertyError;
await supabase.from('extension_officer_assignments').update({ active: false, ended_at: new Date().toISOString() }).eq('landowner_id', users.get('landowner')).eq('active', true);
const { error: assignmentError } = await supabase.from('extension_officer_assignments').insert({ landowner_id: users.get('landowner'), extension_officer_id: users.get('extension_officer'), assigned_by: adminProfile.user_id });
if (assignmentError) throw assignmentError;

console.log(JSON.stringify({ accounts: fixtures.map(({ email, role }) => ({ role, email, password })) }, null, 2));
