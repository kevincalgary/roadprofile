-- RoadProfile: start (or resume) a one-to-one conversation. SECURITY
-- DEFINER because conversations/conversation_members have no client insert
-- policy (see 0008_messaging.sql) — this function is the only supported
-- way to create one, so blocking, message-privacy, and the "message
-- request" rule can all be enforced in one atomic place.

create or replace function public.rpc_start_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_self uuid := auth.uid();
  v_conversation_id uuid;
  v_other_privacy text;
  v_self_follows_other boolean;
  v_other_follows_self boolean;
begin
  if v_self is null then
    raise exception 'Must be signed in.';
  end if;
  if v_self = p_other_user_id then
    raise exception 'Cannot start a conversation with yourself.';
  end if;
  if public.is_blocked_pair(v_self, p_other_user_id) then
    raise exception 'Cannot message a user you are blocked by or have blocked.';
  end if;
  if not public.is_active_standing(v_self) then
    raise exception 'Your account cannot send messages right now.';
  end if;

  -- Resume an existing conversation if one already exists between the two.
  select cm1.conversation_id into v_conversation_id
  from public.conversation_members cm1
  join public.conversation_members cm2 on cm2.conversation_id = cm1.conversation_id and cm2.user_id = p_other_user_id
  where cm1.user_id = v_self
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  select message_privacy into v_other_privacy from public.users where id = p_other_user_id;
  if v_other_privacy = 'no_one' then
    raise exception 'This user is not accepting messages.';
  end if;

  select exists(select 1 from public.follows where follower_id = v_self and followee_type = 'user' and followee_id = p_other_user_id) into v_self_follows_other;
  select exists(select 1 from public.follows where follower_id = p_other_user_id and followee_type = 'user' and followee_id = v_self) into v_other_follows_self;

  if v_other_privacy = 'followed_only' and not v_other_follows_self then
    raise exception 'This user only accepts messages from people they follow.';
  end if;

  insert into public.conversations default values returning id into v_conversation_id;

  insert into public.conversation_members (conversation_id, user_id, is_request_pending)
  values (v_conversation_id, v_self, false);

  insert into public.conversation_members (conversation_id, user_id, is_request_pending)
  values (v_conversation_id, p_other_user_id, not v_other_follows_self);

  if not v_other_follows_self then
    perform public.notify(p_other_user_id, v_self, 'message_request', 'conversation', v_conversation_id);
  end if;

  return v_conversation_id;
end;
$$;
