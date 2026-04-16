/**
 * admin-users — Admin-only endpoint for user management
 * Actions: list_users | update_tier | add_credits | get_stats
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getOptionalUser } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: any, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    // ── Verify caller is admin ────────────────────────────────
    const { supabase, userId } = await getOptionalUser(req);
    if (!userId) return json({ error: 'Not authenticated' }, 401);

    const { data: caller } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (!caller?.is_admin) return json({ error: 'Forbidden — admins only' }, 403);

    // ── Admin client (bypasses RLS) ───────────────────────────
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { action } = body;

    // ── list_users ────────────────────────────────────────────
    if (action === 'list_users') {
      // Get user profiles
      const { data: profiles, error: profErr } = await admin
        .from('user_profiles')
        .select(`
          id, display_name, subscription_tier, is_admin,
          credits_balance, credits_purchased,
          readings_this_month, created_at, preferred_language
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (profErr) throw profErr;

      // Get readings counts per user
      const { data: readingCounts } = await admin
        .from('readings')
        .select('user_id')
        .not('user_id', 'is', null);

      const countMap: Record<string, number> = {};
      for (const r of readingCounts ?? []) {
        countMap[r.user_id] = (countMap[r.user_id] ?? 0) + 1;
      }

      // Get auth emails
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 200 });
      const emailMap: Record<string, string> = {};
      for (const u of authData?.users ?? []) {
        emailMap[u.id] = u.email ?? '';
      }

      const users = (profiles ?? []).map((p) => ({
        ...p,
        email: emailMap[p.id] ?? '',
        total_readings: countMap[p.id] ?? 0,
      }));

      // Stats summary
      const stats = {
        total_users: users.length,
        total_readings: Object.values(countMap).reduce((a, b) => a + b, 0),
        by_tier: {
          free:      users.filter((u) => u.subscription_tier === 'free').length,
          basic:     users.filter((u) => u.subscription_tier === 'basic').length,
          premium:   users.filter((u) => u.subscription_tier === 'premium').length,
          unlimited: users.filter((u) => u.subscription_tier === 'unlimited').length,
        },
        admins: users.filter((u) => u.is_admin).length,
      };

      return json({ users, stats });
    }

    // ── update_tier ───────────────────────────────────────────
    if (action === 'update_tier') {
      const { target_id, tier } = body;
      const VALID_TIERS = ['free', 'basic', 'premium', 'unlimited'];
      if (!target_id || !VALID_TIERS.includes(tier)) {
        return json({ error: 'Invalid target_id or tier' }, 400);
      }
      await admin
        .from('user_profiles')
        .update({ subscription_tier: tier })
        .eq('id', target_id);
      return json({ ok: true });
    }

    // ── add_credits ───────────────────────────────────────────
    if (action === 'add_credits') {
      const { target_id, amount } = body;
      if (!target_id || typeof amount !== 'number' || amount <= 0) {
        return json({ error: 'Invalid target_id or amount' }, 400);
      }
      await admin.rpc('increment_credits', { user_id: target_id, delta: amount });
      return json({ ok: true });
    }

    // ── set_admin ─────────────────────────────────────────────
    if (action === 'set_admin') {
      const { target_id, is_admin } = body;
      if (!target_id || typeof is_admin !== 'boolean') {
        return json({ error: 'Invalid params' }, 400);
      }
      await admin.from('user_profiles').update({ is_admin }).eq('id', target_id);
      return json({ ok: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Admin error';
    console.error('[admin-users]', msg);
    return json({ error: msg }, 500);
  }
});
