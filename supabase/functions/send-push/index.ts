// RoadProfile edge function: sends an Expo push notification when a new
// row lands in public.notifications.
//
// Wire-up (one-time, in the Supabase dashboard): Database > Webhooks >
// create a webhook on public.notifications, event = INSERT, target this
// function. Supabase signs the request; verify with the webhook secret if
// you enable one. See docs/SETUP.md.
//
// Deploy: supabase functions deploy send-push

import { createClient } from 'jsr:@supabase/supabase-js@2';

const NOTIFICATION_COPY: Record<string, string> = {
  new_follower: 'started following you',
  new_comment: 'commented on your record',
  comment_reply: 'replied to your comment',
  mention: 'mentioned you',
  list_invitation: 'invited you to collaborate on a list',
  new_contribution: 'added a new record to a vehicle you follow',
  record_correction: 'A correction was decided on a record you contributed to',
  moderation_update: 'There is an update on your account or content',
  message_request: 'sent you a message request',
};

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    recipient_id: string;
    actor_id: string | null;
    type: string;
  };
}

Deno.serve(async (req) => {
  const payload = (await req.json()) as WebhookPayload;
  const notification = payload.record;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: recipient } = await admin.from('users').select('push_token').eq('id', notification.recipient_id).maybeSingle();
  if (!recipient?.push_token) {
    return new Response(JSON.stringify({ skipped: 'no push token' }), { status: 200 });
  }

  let actorName = 'Someone';
  if (notification.actor_id) {
    const { data: actorProfile } = await admin.from('profiles').select('display_name').eq('user_id', notification.actor_id).maybeSingle();
    if (actorProfile?.display_name) actorName = actorProfile.display_name;
  }

  const body = NOTIFICATION_COPY[notification.type]
    ? `${actorName} ${NOTIFICATION_COPY[notification.type]}`
    : 'You have a new notification on RoadProfile';

  const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      to: recipient.push_token,
      title: 'RoadProfile',
      body,
      data: { notificationId: notification.id, type: notification.type },
    }),
  });

  const result = await pushResponse.json();
  return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
