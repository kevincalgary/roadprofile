import { supabase } from '../supabase';
import type { FolloweeType } from '../types/database';

export async function isFollowing(followeeType: FolloweeType, followeeId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('followee_type', followeeType)
    .eq('followee_id', followeeId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function follow(followeeType: FolloweeType, followeeId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in to follow.');
  const { error } = await supabase.from('follows').insert({ follower_id: user.id, followee_type: followeeType, followee_id: followeeId });
  if (error) throw error;
}

export async function unfollow(followeeType: FolloweeType, followeeId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('followee_type', followeeType)
    .eq('followee_id', followeeId);
  if (error) throw error;
}

export async function blockUser(blockedId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');
  const { error } = await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockUser(blockedId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', blockedId);
  if (error) throw error;
}

export async function getBlockedUsers() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  // blocks.blocked_id and profiles.user_id both reference auth.users but
  // there's no direct FK between blocks and profiles, so PostgREST can't
  // auto-embed — fetch the block rows, then the matching profiles.
  const { data: blockRows, error } = await supabase
    .from('blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!blockRows?.length) return [];

  const ids = blockRows.map((b) => b.blocked_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, avatar_url')
    .in('user_id', ids);
  if (profilesError) throw profilesError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return blockRows.map((b) => ({ ...b, blocked: profileMap.get(b.blocked_id) ?? null }));
}

export interface ReportInput {
  targetType: 'record' | 'comment' | 'reply' | 'message' | 'user' | 'list' | 'vehicle';
  targetId: string;
  reason:
    | 'spam'
    | 'harassment'
    | 'sensitive_information'
    | 'incorrect_vin'
    | 'duplicate_vehicle'
    | 'inappropriate_content'
    | 'impersonation'
    | 'unsupported_accusation'
    | 'other';
  details?: string;
}

export async function submitReport(input: ReportInput) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in to report content.');
  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    details: input.details ?? null,
  });
  if (error) throw error;
}
