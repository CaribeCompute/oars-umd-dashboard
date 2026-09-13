import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { emptyMapData, validMapData } from '@/lib/property-map';
export const dynamic = 'force-dynamic';
async function context(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('propertyId');
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid property');
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Sign in required');
  const { data: property } = await db.from('properties').select('id,owner_id').eq('id', id).eq('owner_id', user.id).maybeSingle();
  if (!property) throw new Error('Property unavailable');
  return { db, id };
}
export async function GET(request: NextRequest) {
  try {
    const { db, id } = await context(request);
    const { data, error } = await db.from('property_maps').select('data,version').eq('property_id', id).maybeSingle();
    if (error) throw new Error('Map storage unavailable. Apply the property GIS migration.');
    if (data && !validMapData(data.data)) throw new Error('Saved map data is invalid.');
    return NextResponse.json(data ?? { data: emptyMapData, version: 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Map unavailable' }, { status: 400 }); }
}
export async function PUT(request: NextRequest) {
  try {
    const { db, id } = await context(request);
    const body = await request.text();
    if (body.length > 1000000) return NextResponse.json({ error: 'Map is too large' }, { status: 413 });
    const { data, version } = JSON.parse(body);
    if (!validMapData(data) || !Number.isSafeInteger(version) || version < 0) return NextResponse.json({ error: 'Invalid map data' }, { status: 422 });
    const result = version === 0
      ? await db.from('property_maps').insert({ property_id: id, data, version: 1 }).select('version').single()
      : await db.from('property_maps').update({ data, version: version + 1, updated_at: new Date().toISOString() }).eq('property_id', id).eq('version', version).select('version').maybeSingle();
    if (result.error || !result.data) return NextResponse.json({ error: 'Could not save. Another session may have changed this map. Export your draft before reloading.' }, { status: 409 });
    return NextResponse.json(result.data);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Save failed' }, { status: 400 }); }
}
