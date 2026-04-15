import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function getAuthenticatedUser(req: Request): Promise<{
  supabase: SupabaseClient;
  userId: string;
}> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing Authorization header');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  return { supabase, userId: user.id };
}

// Optional auth — always succeeds, returns null userId for guests
export async function getOptionalUser(req: Request): Promise<{
  supabase: SupabaseClient;
  userId: string | null;
}> {
  const authHeader = req.headers.get('Authorization');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
  );

  if (!authHeader) return { supabase, userId: null };

  try {
    const { data } = await supabase.auth.getUser();
    return { supabase, userId: data?.user?.id ?? null };
  } catch {
    return { supabase, userId: null };
  }
}
