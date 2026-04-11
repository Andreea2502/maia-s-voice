import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'DELETE method required' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { supabase, userId } = await getAuthenticatedUser(req);

    // Use the SECURITY DEFINER function from migration
    const { error } = await supabase.rpc('delete_user_data', { target_user_id: userId });
    if (error) throw error;

    // Delete auth user via Admin API (requires service role)
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (serviceRoleKey) {
      await fetch(
        `${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'All user data deleted per GDPR Art. 17' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
