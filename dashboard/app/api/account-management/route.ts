import { NextRequest, NextResponse } from 'next/server';

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import type { AccountProfile, AccountRole } from '@/lib/account-types';
import { canSubmitApplication } from '@/lib/account-policy';
import { validateUsAddress } from '@/lib/address-validation';

export const dynamic = 'force-dynamic';

type ActionBody = Record<string, unknown> & { action?: string };

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function strongTemporaryPassword() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(36).padStart(2, '0')).join('');
  return `Oa!9-${token.slice(0, 18)}`;
}

async function actorContext() {
  const sessionClient = await createServerSupabaseClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) throw new Error('UNAUTHENTICATED');

  const admin = createAdminSupabaseClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('user_id', data.user.id)
    .single<AccountProfile>();
  if (profileError || !profile || profile.status !== 'active') {
    throw new Error('ACCOUNT_NOT_ACTIVE');
  }
  return { actor: profile, admin };
}

function responseFor(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = message === 'UNAUTHENTICATED' ? 401 : message === 'FORBIDDEN' ? 403 : message === 'Server-side account administration is not configured.' ? 503 : 400;
  return NextResponse.json({ error: message }, { status });
}

async function audit(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  actorId: string,
  targetUserId: string,
  action: string,
  reason?: string,
  context: Record<string, unknown> = {},
) {
  const { error } = await admin.from('account_audit_events').insert({
    actor_id: actorId,
    target_user_id: targetUserId,
    action,
    reason: reason || null,
    context,
  });
  if (error) throw error;
}

export async function GET() {
  try {
    const { actor, admin } = await actorContext();
    if (actor.role === 'admin') {
      const [profiles, assignments, auditEvents, applications] = await Promise.all([
        admin.from('profiles').select('*').order('created_at', { ascending: false }),
        admin.from('extension_officer_assignments').select('*').eq('active', true),
        admin.from('account_audit_events').select('*').order('created_at', { ascending: false }).limit(50),
        admin.from('program_applications').select('*').order('updated_at', { ascending: false }),
      ]);
      for (const result of [profiles, assignments, auditEvents, applications]) {
        if (result.error) throw result.error;
      }
      return NextResponse.json({
        actor,
        profiles: profiles.data,
        assignments: assignments.data,
        auditEvents: auditEvents.data,
        applications: applications.data,
      });
    }

    if (actor.role === 'extension_officer') {
      const { data: assignments, error } = await admin
        .from('extension_officer_assignments')
        .select('landowner_id')
        .eq('extension_officer_id', actor.user_id)
        .eq('active', true);
      if (error) throw error;
      const landownerIds = (assignments ?? []).map((item) => item.landowner_id);
      if (!landownerIds.length) return NextResponse.json({ actor, landowners: [], properties: [], applications: [] });

      const [landowners, properties, applications, agencies] = await Promise.all([
        admin.from('profiles').select('*').in('user_id', landownerIds),
        admin.from('properties').select('*').in('owner_id', landownerIds),
        admin.from('program_applications').select('*').in('landowner_id', landownerIds).order('updated_at', { ascending: false }),
        admin.from('profiles').select('*').eq('role', 'agency').eq('status', 'active'),
      ]);
      for (const result of [landowners, properties, applications, agencies]) if (result.error) throw result.error;
      return NextResponse.json({ actor, landowners: landowners.data, properties: properties.data, applications: applications.data, agencies: agencies.data });
    }

    return NextResponse.json({ actor });
  } catch (error) {
    return responseFor(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ActionBody;
    const { actor, admin } = await actorContext();

    if (body.action === 'create_landowner') {
      if (actor.role !== 'extension_officer') throw new Error('FORBIDDEN');
      const email = text(body.email).toLowerCase();
      const displayName = text(body.displayName);
      if (!email || !displayName || !text(body.farmerId) || !text(body.propertyName) || !text(body.county) || !text(body.address)) {
        throw new Error('Landowner and first-property fields are required.');
      }
      const verifiedAddress = await validateUsAddress(text(body.address));
      if (!verifiedAddress) throw new Error('Enter a complete, existing U.S. street address.');
      const temporaryPassword = strongTemporaryPassword();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { display_name: displayName, requested_role: 'landowner' },
      });
      if (createError || !created.user) throw createError ?? new Error('Account creation failed.');

      const userId = created.user.id;
      const { error: profileError } = await admin.from('profiles').upsert({
        user_id: userId,
        email,
        display_name: displayName,
        phone: text(body.phone) || null,
        farmer_id: text(body.farmerId),
        role: 'landowner' satisfies AccountRole,
        status: 'active',
        must_change_password: true,
        created_by: actor.user_id,
        approved_by: actor.user_id,
        approved_at: new Date().toISOString(),
      });
      if (profileError) throw profileError;
      const { error: propertyError } = await admin.from('properties').insert({
        owner_id: userId,
        name: text(body.propertyName),
        county: text(body.county),
        address: verifiedAddress.address,
        latitude: verifiedAddress.latitude,
        longitude: verifiedAddress.longitude,
        address_verified_at: new Date().toISOString(),
        address_provider: 'nominatim',
        land_type: text(body.landType) || 'farm',
        approximate_acres: text(body.acres) || null,
        created_by: actor.user_id,
      });
      if (propertyError) throw propertyError;
      const { error: assignmentError } = await admin.from('extension_officer_assignments').insert({
        landowner_id: userId,
        extension_officer_id: actor.user_id,
        assigned_by: actor.user_id,
      });
      if (assignmentError) throw assignmentError;
      await audit(admin, actor.user_id, userId, 'created_by_officer', undefined, { auto_approved: true });
      return NextResponse.json({ temporaryPassword, userId });
    }

    if (body.action === 'password_changed') {
      // Clear the forced-change flag only after this request actually changes
      // the signed-in user's password; a browser assertion is not sufficient.
      const password = typeof body.password === 'string' ? body.password : '';
      if (password.length < 10 || password.length > 1024) throw new Error('Use a password between 10 and 1,024 characters.');
      const sessionClient = await createServerSupabaseClient();
      const { error: passwordError } = await sessionClient.auth.updateUser({ password });
      if (passwordError) throw passwordError;
      const { error } = await admin.from('profiles').update({ must_change_password: false }).eq('user_id', actor.user_id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'create_application') {
      if (actor.role !== 'extension_officer') throw new Error('FORBIDDEN');
      const landownerId = text(body.landownerId);
      const { data: assignment } = await admin.from('extension_officer_assignments').select('id').eq('landowner_id', landownerId).eq('extension_officer_id', actor.user_id).eq('active', true).maybeSingle();
      if (!assignment) throw new Error('FORBIDDEN');
      const agencyId = text(body.agencyId);
      const { data: agency } = await admin.from('profiles').select('user_id').eq('user_id', agencyId).eq('role','agency').eq('status','active').maybeSingle();
      if (!agency || !text(body.programName)) throw new Error('Select an active agency and enter a program name.');
      const { data, error } = await admin.from('program_applications').insert({
        agency_profile_id: agencyId,
        landowner_id: landownerId,
        extension_officer_id: actor.user_id,
        program_name: text(body.programName),
        assessment_reference: text(body.assessmentReference) || null,
        notes: text(body.notes),
      }).select('*').single();
      if (error) throw error;
      await admin.from('application_events').insert({ application_id: data.id, actor_id: actor.user_id, event_type: 'created', notes: text(body.notes) || null });
      return NextResponse.json({ application: data });
    }

    if (body.action === 'record_consent' || body.action === 'submit_application') {
      const applicationId = text(body.applicationId);
      const { data: application, error: appError } = await admin.from('program_applications').select('*').eq('id', applicationId).single();
      if (appError || !application) throw appError ?? new Error('Application not found.');
      const { data: currentAssignment } = actor.role === 'extension_officer'
        ? await admin.from('extension_officer_assignments').select('id').eq('landowner_id',application.landowner_id).eq('extension_officer_id',actor.user_id).eq('active',true).maybeSingle()
        : { data: null };
      const assigned = actor.role === 'extension_officer' && application.extension_officer_id === actor.user_id && Boolean(currentAssignment);
      const owner = actor.role === 'landowner' && application.landowner_id === actor.user_id;
      if (!assigned && !owner && actor.role !== 'admin') throw new Error('FORBIDDEN');

      if (body.action === 'record_consent') {
        if (application.status !== 'draft') throw new Error('Consent can only be recorded on a draft application.');
        if (!text(body.consentNote)) throw new Error('A consent note is required.');
        const now = new Date().toISOString();
        const { data: updated, error } = await admin.from('program_applications').update({ status: 'consented', consented_by: actor.user_id, consented_at: now, notes: text(body.consentNote) }).eq('id', applicationId).eq('status','draft').select('id').maybeSingle();
        if (error) throw error;
        if (!updated) throw new Error('The application changed. Refresh before continuing.');
        await admin.from('application_events').insert({ application_id: applicationId, actor_id: actor.user_id, event_type: 'consented', notes: text(body.consentNote) });
      } else {
        if (!canSubmitApplication(application)) throw new Error('Only a consented application can be marked submitted once.');
        const now = new Date().toISOString();
        const { data: updated, error } = await admin.from('program_applications').update({ status: 'submitted', submitted_at: now }).eq('id', applicationId).eq('status','consented').select('id').maybeSingle();
        if (error) throw error;
        if (!updated) throw new Error('The application changed. Refresh before continuing.');
        await admin.from('application_events').insert({ application_id: applicationId, actor_id: actor.user_id, event_type: 'submitted' });
      }
      return NextResponse.json({ ok: true });
    }

    if (actor.role !== 'admin') throw new Error('FORBIDDEN');
    const targetUserId = text(body.targetUserId);

    if (body.action === 'approve' || body.action === 'decline') {
      const status = body.action === 'approve' ? 'active' : 'declined';
      const { error } = await admin.from('profiles').update({
        status,
        approved_by: body.action === 'approve' ? actor.user_id : null,
        approved_at: body.action === 'approve' ? new Date().toISOString() : null,
      }).eq('user_id', targetUserId).eq('status', 'pending');
      if (error) throw error;
      await audit(admin, actor.user_id, targetUserId, body.action === 'approve' ? 'approved' : 'declined', text(body.reason));
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'deactivate') {
      const reason = text(body.reason);
      if (!reason) throw new Error('A deactivation reason is required.');
      if (targetUserId === actor.user_id) throw new Error('Administrators cannot deactivate their own account.');
      const { data: target } = await admin.from('profiles').select('role,status').eq('user_id', targetUserId).single();
      if (target?.role === 'admin' && target.status === 'active') {
        const { count } = await admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin').eq('status', 'active');
        if ((count ?? 0) <= 1) throw new Error('The last active administrator cannot be deactivated.');
      }
      const { error } = await admin.from('profiles').update({ status: 'inactive', deactivated_by: actor.user_id, deactivated_at: new Date().toISOString(), deactivation_reason: reason }).eq('user_id', targetUserId);
      if (error) throw error;
      await audit(admin, actor.user_id, targetUserId, 'deactivated', reason);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'reactivate') {
      const reason = text(body.reason);
      if (!reason) throw new Error('A reactivation reason is required.');
      const { error } = await admin.from('profiles').update({ status: 'active', deactivated_by: null, deactivated_at: null, deactivation_reason: null }).eq('user_id', targetUserId).eq('status', 'inactive');
      if (error) throw error;
      await audit(admin, actor.user_id, targetUserId, 'reactivated', reason);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'assign') {
      const officerId = text(body.officerId);
      const { data: landowner } = await admin.from('profiles').select('role,status').eq('user_id',targetUserId).single();
      if (landowner?.role !== 'landowner' || landowner.status !== 'active') throw new Error('Select an active landowner.');
      const { data: officer } = await admin.from('profiles').select('role,status').eq('user_id', officerId).single();
      if (officer?.role !== 'extension_officer' || officer.status !== 'active') throw new Error('Select an active Extension Officer.');
      const now = new Date().toISOString();
      const { data: previous } = await admin.from('extension_officer_assignments').select('extension_officer_id').eq('landowner_id', targetUserId).eq('active', true).maybeSingle();
      const {error: endError} = await admin.from('extension_officer_assignments').update({ active: false, ended_at: now }).eq('landowner_id', targetUserId).eq('active', true);
      if (endError) throw endError;
      const { error } = await admin.from('extension_officer_assignments').insert({ landowner_id: targetUserId, extension_officer_id: officerId, assigned_by: actor.user_id });
      if (error) throw error;
      await audit(admin, actor.user_id, targetUserId, previous ? 'reassigned' : 'assigned', undefined, { officer_id: officerId, previous_officer_id: previous?.extension_officer_id ?? null });
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'invite_admin') {
      const email = text(body.email).toLowerCase();
      const displayName = text(body.displayName);
      if (!email || !displayName) throw new Error('Name and email are required.');
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { display_name: displayName, requested_role: 'admin' },
        redirectTo: new URL('/auth/callback?next=/?update-password=1', request.nextUrl.origin).toString(),
      });
      if (error || !data.user) throw error ?? new Error('Invitation failed.');
      const { error: profileError } = await admin.from('profiles').upsert({
        user_id: data.user.id,
        email,
        display_name: displayName,
        role: 'admin',
        status: 'active',
        created_by: actor.user_id,
        approved_by: actor.user_id,
        approved_at: new Date().toISOString(),
      });
      if (profileError) throw profileError;
      await audit(admin, actor.user_id, data.user.id, 'admin_invited');
      return NextResponse.json({ ok: true });
    }

    throw new Error('Unknown action.');
  } catch (error) {
    return responseFor(error);
  }
}
