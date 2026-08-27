// RoadProfile edge function: permanently deletes the calling user's account.
//
// A regular (anon-key) session cannot delete its own auth.users row — that
// requires the Supabase service role. This function verifies the caller's
// JWT itself, then uses the service role only to perform the deletion,
// which cascades (via `on delete cascade` foreign keys) through
// public.users, profiles, records, comments, follows, etc.
//
// Deploy: supabase functions deploy delete-account
// Invoke from the client with supabase.functions.invoke('delete-account').

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Verify the caller's identity using their own JWT against the anon client.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Anonymize the durable public profile row *before* removing the auth
  // user — public.profiles.user_id deliberately has no FK/cascade to
  // auth.users (see 0002_users_and_profiles.sql) so that the contributor
  // attribution on this person's vehicle records, comments, and revision
  // history survives, per "Contributions retain author attribution." The
  // scrub below removes what makes the row personally identifiable.
  const anonymizedHandle = `deleted_user_${user.id.slice(0, 8)}`;
  const { error: scrubError } = await adminClient
    .from('profiles')
    .update({
      username: anonymizedHandle,
      display_name: 'Deleted user',
      avatar_url: null,
      location_text: null,
      bio: null,
    })
    .eq('user_id', user.id);
  if (scrubError) {
    return new Response(JSON.stringify({ error: scrubError.message }), { status: 500 });
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
  }

  await adminClient.from('audit_logs').insert({
    actor_id: null,
    action: 'account_deleted',
    target_type: 'user',
    target_id: user.id,
    metadata: { self_service: true },
  });

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
