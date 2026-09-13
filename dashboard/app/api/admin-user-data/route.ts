import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validMapData } from '@/lib/property-map';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request: NextRequest) {
  try {
    const db = await createServerSupabaseClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return reply({ error: 'Sign in to continue.' }, 401);
    const { data: actor, error: actorError } = await db.from('profiles').select('role,status').eq('user_id', user.id).maybeSingle();
    if (actorError || actor?.role !== 'admin' || actor.status !== 'active') return reply({ error: 'Active administrator access is required.' }, 403);
    const { data: ready, error: migrationError } = await db.rpc('admin_user_data_ready');
    if (migrationError || ready !== true) return reply({ error: 'Apply migration 20260914070000_admin_user_data_read.sql to enable administrator data review.' }, 503);
    const userId = request.nextUrl.searchParams.get('userId');
    const propertyId = request.nextUrl.searchParams.get('propertyId');
    if ((userId && !uuid.test(userId)) || (propertyId && (!uuid.test(propertyId) || !userId))) return reply({ error: 'Invalid account or property ID.' }, 400);
    // Page all collections so Supabase's default row cap cannot hide accounts or properties.
    async function all(query: (start: number) => PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown }>) {
      const rows: Record<string, unknown>[] = [];
      for (let start = 0; ; start += 500) {
        const { data, error } = await query(start);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < 500) return rows;
      }
    }
    if (!userId) return reply({ profiles: await all(start => db.from('profiles').select('user_id,display_name,email,role,status').order('user_id').range(start, start + 499)) });
    const { data: profile, error } = await db.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (!profile) return reply({ error: 'Account not found.' }, 404);
    if (propertyId) {
      const { data: property, error: propertyError } = await db.from('properties').select('*').eq('id', propertyId).eq('owner_id', userId).maybeSingle();
      if (propertyError) throw propertyError;
      if (!property) return reply({ error: 'Property not found for this account.' }, 404);
      const [map, assessment] = await Promise.all([
        db.from('property_maps').select('*').eq('property_id', propertyId).maybeSingle(),
        db.from('property_assessments').select('*').eq('property_id', propertyId).maybeSingle(),
      ]);
      if (map.error || assessment.error) throw map.error || assessment.error;
      if (map.data && !validMapData(map.data.data)) return reply({ error: 'Saved map data is invalid and cannot be displayed.' }, 422);
      return reply({ property, map: map.data, assessment: assessment.data });
    }
    const [properties, applications, assignments] = await Promise.all([
      all(start => db.from('properties').select('*').eq('owner_id', userId).order('id').range(start, start + 499)),
      all(start => db.from('program_applications').select('*').or(`landowner_id.eq.${userId},extension_officer_id.eq.${userId},agency_profile_id.eq.${userId}`).order('id').range(start, start + 499)),
      all(start => db.from('extension_officer_assignments').select('*').or(`landowner_id.eq.${userId},extension_officer_id.eq.${userId}`).order('id').range(start, start + 499)),
    ]);
    return reply({ profile, properties, applications, assignments });
  } catch {
    return reply({ error: 'Could not load administrator data. Check the connection and required migrations, then retry.' }, 500);
  }
}
