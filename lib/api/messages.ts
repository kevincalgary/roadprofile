import { supabase } from '../supabase';
import type { Conversation, ConversationMember, Message, SharedObjectType } from '../types/database';
import { getProfilesMap } from './profiles';

export interface ConversationSummary {
  conversation: Conversation;
  member: ConversationMember;
  otherUserId: string;
  lastMessage: Message | null;
  unreadCount: number;
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: myMemberships, error } = await supabase
    .from('conversation_members')
    .select('*, conversations(*)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('joined_at', { ascending: false });
  if (error) throw error;
  if (!myMemberships?.length) return [];

  const conversationIds = myMemberships.map((m: any) => m.conversation_id);

  const { data: allMembers, error: membersError } = await supabase
    .from('conversation_members')
    .select('*')
    .in('conversation_id', conversationIds);
  if (membersError) throw membersError;

  const { data: lastMessages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (messagesError) throw messagesError;

  const lastMessageByConversation = new Map<string, Message>();
  for (const m of lastMessages ?? []) {
    if (!lastMessageByConversation.has(m.conversation_id)) {
      lastMessageByConversation.set(m.conversation_id, m);
    }
  }

  const unreadCounts = new Map<string, number>();
  for (const m of lastMessages ?? []) {
    const myMembership = myMemberships.find((mm: any) => mm.conversation_id === m.conversation_id);
    if (!myMembership) continue;
    if (m.sender_id === user.id) continue;
    const readAfter = myMembership.last_read_at ? new Date(myMembership.last_read_at) : new Date(0);
    if (new Date(m.created_at) > readAfter) {
      unreadCounts.set(m.conversation_id, (unreadCounts.get(m.conversation_id) ?? 0) + 1);
    }
  }

  return myMemberships.map((mm: any) => {
    const otherMember = (allMembers ?? []).find((am) => am.conversation_id === mm.conversation_id && am.user_id !== user.id);
    return {
      conversation: mm.conversations,
      member: mm,
      otherUserId: otherMember?.user_id ?? '',
      lastMessage: lastMessageByConversation.get(mm.conversation_id) ?? null,
      unreadCount: unreadCounts.get(mm.conversation_id) ?? 0,
    };
  });
}

export async function getConversationOtherProfiles(summaries: ConversationSummary[]) {
  return getProfilesMap(summaries.map((s) => s.otherUserId));
}

export async function startConversation(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc('rpc_start_conversation', { p_other_user_id: otherUserId });
  if (error) throw error;
  return data as string;
}

export async function getMessages(conversationId: string, cursor?: string, limit = 30): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (cursor) query = query.lt('created_at', cursor);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).reverse();
}

export async function sendMessage(conversationId: string, body?: string, sharedObjectType?: SharedObjectType, sharedObjectId?: string): Promise<Message> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: body ?? null,
      shared_object_type: sharedObjectType ?? null,
      shared_object_id: sharedObjectId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markMessageRead(messageId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('message_reads').upsert({ message_id: messageId, user_id: user.id }, { onConflict: 'message_id,user_id' });
}

export async function markConversationRead(conversationId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString(), is_request_pending: false })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);
}

export async function muteConversation(conversationId: string, muted: boolean) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('conversation_members').update({ muted }).eq('conversation_id', conversationId).eq('user_id', user.id);
}

export async function deleteConversationForMe(conversationId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('conversation_members')
    .update({ deleted_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);
}

export function subscribeToConversationMessages(conversationId: string, onInsert: (message: Message) => void) {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
      onInsert(payload.new as Message);
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
