import { NextRequest, NextResponse } from 'next/server';

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';

const publicRoles = new Set(['landowner', 'agency', 'extension_officer']);

function value(payload: Record<string, unknown>, key: string) {
  return typeof payload[key] === 'string' ? payload[key].trim() : '';
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next') || '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const registrationCookie = request.cookies.get('oars_oauth_registration')?.value;
  let registrationComplete = false;
  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && registrationCookie) {
      try {
        const payload = JSON.parse(decodeURIComponent(registrationCookie)) as Record<string, unknown>;
        const requestedRole = value(payload, 'requestedRole');
        const displayName = value(payload, 'displayName');
        const validRole = publicRoles.has(requestedRole);
        const validLandowner = requestedRole !== 'landowner' || (
          payload.ownershipConfirmed === true && value(payload, 'farmerId') && value(payload, 'propertyName') && value(payload, 'county') && value(payload, 'address')
          && typeof payload.latitude === 'number' && typeof payload.longitude === 'number'
        );
        const validOrganization = requestedRole === 'landowner' || (
          value(payload, 'organization') && value(payload, 'jobTitle') && value(payload, 'serviceArea')
        );
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        const providers = Array.isArray(user?.app_metadata.providers) ? user.app_metadata.providers : [];
        const isGoogleUser = user?.app_metadata.provider === 'google' || providers.includes('google');
        if (user && isGoogleUser && validRole && displayName && validLandowner && validOrganization) {
          const admin = createAdminSupabaseClient();
          const { data: profile } = await admin.from('profiles').select('status').eq('user_id', user.id).single();
          if (profile?.status === 'pending') {
            const { error: profileError } = await admin.from('profiles').update({
              display_name: displayName,
              phone: value(payload, 'phone') || null,
              farmer_id: value(payload, 'farmerId') || null,
              organization: value(payload, 'organization') || null,
              job_title: value(payload, 'jobTitle') || null,
              service_area: value(payload, 'serviceArea') || null,
              role: requestedRole,
              status: 'pending',
            }).eq('user_id', user.id);
            if (profileError) throw profileError;
            if (requestedRole === 'landowner') {
              const { data: property } = await admin.from('properties').select('id').eq('owner_id', user.id).limit(1).maybeSingle();
              if (!property) {
                const acresValue = value(payload, 'acres');
                const acres = acresValue ? Number(acresValue) : Number.NaN;
                const { error: propertyError } = await admin.from('properties').insert({
                  owner_id: user.id,
                  name: value(payload, 'propertyName'),
                  county: value(payload, 'county'),
                  address: value(payload, 'address'),
                  latitude: payload.latitude,
                  longitude: payload.longitude,
                  address_verified_at: new Date().toISOString(),
                  address_provider: 'nominatim',
                  land_type: ['farm', 'forest', 'both'].includes(value(payload, 'landType')) ? value(payload, 'landType') : 'farm',
                  approximate_acres: Number.isFinite(acres) ? acres : null,
                  created_by: user.id,
                });
                if (propertyError) throw propertyError;
              }
            }
            await admin.from('account_audit_events').insert({
              actor_id: user.id,
              target_user_id: user.id,
              action: 'registered',
              context: { provider: 'google', requested_role: requestedRole },
            });
            registrationComplete = true;
          }
        }
      } catch {
        registrationComplete = false;
      }
    }
  }
  const destination = registrationCookie
    ? (registrationComplete ? '/?google-registration=pending' : '/?google-registration=error')
    : safeNext;
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set('oars_oauth_registration', '', { path: '/', maxAge: 0, sameSite: 'lax' });
  return response;
}
