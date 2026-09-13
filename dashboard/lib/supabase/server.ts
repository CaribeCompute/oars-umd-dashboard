import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function projectUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) throw new Error('Supabase project URL is not configured.');
  return url;
}

export async function createServerSupabaseClient() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error('Supabase publishable key is not configured.');
  const cookieStore = await cookies();
  return createServerClient(projectUrl(), key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        // Called from route handlers, where response cookies can be updated.
        values.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });
}

export function createAdminSupabaseClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret)
    throw new Error('Server-side account administration is not configured.');
  return createClient(projectUrl(), secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
