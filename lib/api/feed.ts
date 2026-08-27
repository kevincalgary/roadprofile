import { supabase } from '../supabase';
import type { VehicleRecord } from '../types/database';

export interface FeedPage {
  items: VehicleRecord[];
  nextCursor: string | null;
}

/** Discover: newest published records platform-wide. */
export async function getDiscoverFeed(cursor?: string, limit = 15): Promise<FeedPage> {
  let query = supabase
    .from('records')
    .select('*')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (cursor) query = query.lt('published_at', cursor);
  const { data, error } = await query;
  if (error) throw error;
  const records = data ?? [];
  return {
    items: records,
    nextCursor: records.length === limit ? records[records.length - 1].published_at : null,
  };
}

/** Following: records from users and vehicles the current user follows. */
export async function getFollowingFeed(cursor?: string, limit = 15): Promise<FeedPage> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], nextCursor: null };

  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('followee_type, followee_id')
    .eq('follower_id', user.id)
    .in('followee_type', ['user', 'vehicle']);
  if (followsError) throw followsError;

  const followedUserIds = (follows ?? []).filter((f) => f.followee_type === 'user').map((f) => f.followee_id);
  const followedVehicleIds = (follows ?? []).filter((f) => f.followee_type === 'vehicle').map((f) => f.followee_id);

  if (followedUserIds.length === 0 && followedVehicleIds.length === 0) {
    return { items: [], nextCursor: null };
  }

  const orFilters: string[] = [];
  if (followedUserIds.length) orFilters.push(`author_id.in.(${followedUserIds.join(',')})`);
  if (followedVehicleIds.length) orFilters.push(`vehicle_id.in.(${followedVehicleIds.join(',')})`);

  let query = supabase
    .from('records')
    .select('*')
    .eq('status', 'published')
    .is('deleted_at', null)
    .or(orFilters.join(','))
    .order('published_at', { ascending: false })
    .limit(limit);
  if (cursor) query = query.lt('published_at', cursor);

  const { data, error } = await query;
  if (error) throw error;
  const records = data ?? [];
  return {
    items: records,
    nextCursor: records.length === limit ? records[records.length - 1].published_at : null,
  };
}

export async function searchKeyword(query: string, limit = 20) {
  const { data, error } = await supabase.rpc('search_records', { q: query, max_results: limit });
  if (error) throw error;
  return data ?? [];
}
