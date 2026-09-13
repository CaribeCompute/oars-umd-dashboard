import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateProgram } from '@/lib/community-programs';
const storageError = () => Response.json({error:'Program storage unavailable. Apply the catalog programs and program field parity migrations in Supabase.'},{status:503});
async function context() {
  const client = await createServerSupabaseClient();
  const {data:{user}} = await client.auth.getUser();
  if (!user) return null;
  const {data:profile} = await client.from('profiles').select('role,status').eq('user_id',user.id).single();
  if (profile?.status !== 'active' || !['agency','extension_officer','admin'].includes(profile.role)) return null;
  return {client,user,profile};
}
export async function GET(request: Request) {
  try {
    const manage = new URL(request.url).searchParams.get('manage') === 'true';
    const actor = manage ? await context() : null;
    if (manage && !actor) return Response.json({error:'An active Agency, Extension Officer, or Administrator account is required.'},{status:403});
    const client = actor?.client ?? await createServerSupabaseClient();
    let query = client.from('catalog_programs').select('*').order('updated_at',{ascending:false});
    if (!manage) query = query.eq('status','published');
    else if (actor!.profile.role !== 'admin') query = query.eq('created_by',actor!.user.id);
    const {data,error} = await query;
    if (error) return storageError();
    return Response.json({programs:data},{headers:{'Cache-Control':'no-store'}});
  } catch { return storageError(); }
}
async function save(request: Request, editing: boolean) {
  try {
    const actor = await context();
    if (!actor) return Response.json({error:'An active Agency, Extension Officer, or Administrator account is required.'},{status:403});
    let payload; let draft;
    try { payload = await request.json(); draft = validateProgram(payload); } catch (error) { return Response.json({error:error instanceof Error?error.message:'Invalid program.'},{status:400}); }
    if (editing && (typeof payload.id !== 'string' || typeof payload.updated_at !== 'string')) return Response.json({error:'Select a saved program.'},{status:400});
    const query = editing ? actor.client.from('catalog_programs').update(draft).eq('id',payload.id).eq('updated_at',payload.updated_at) : actor.client.from('catalog_programs').insert({...draft,created_by:actor.user.id});
    const {data,error} = await query.select().maybeSingle();
    if (error) return storageError();
    if (!data) return Response.json({error:'This program changed or is not editable by your account. Refresh and try again.'},{status:409});
    return Response.json({program:data});
  } catch { return storageError(); }
}
export async function POST(request: Request) { return save(request,false); }
export async function PATCH(request: Request) { return save(request,true); }
