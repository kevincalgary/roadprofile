import { supabase } from '../supabase';
import type { Profile, ProfileStats } from '../types/database';

// Author/actor ids across the schema (records.author_id, comments.author_id,
// messages.sender_id, follows.follower_id, ...) reference auth.users, not
// public.profiles directly — there's no FK PostgREST can use to auto-embed
// a profile onto those rows. This batched lookup + client-side merge is the
// consistent pattern used across the API layer instead.
export async function getProfilesMap(userIds: string[]): Promise<Map<string, Profile>> {
  const unique = Array.from(new Set(userIds)).filter(Boolean);
  if (unique.length === 0) return new Map();
  const { data, error } = await supabase.from('profiles').select('*').in('user_id', unique);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.user_id, p as Profile]));
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileStats(userId: string): Promise<ProfileStats | null> {
  const { data, error } = await supabase.from('profile_stats').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function searchProfiles(query: string, limit = 20): Promise<Profile[]> {
  const { data, error } = await supabase.rpc('search_profiles', { q: query, max_results: limit });
  if (error) throw error;
  return data ?? [];
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.from('profiles').select('user_id').eq('username', username).maybeSingle();
  if (error) throw error;
  return !data;
}

export interface CreateProfileInput {
  username: string;
  displayName: string;
  avatarUrl?: string;
  locationText?: string;
  bio?: string;
}

export async function createProfile(input: CreateProfileInput): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      username: input.username,
      display_name: input.displayName,
      avatar_url: input.avatarUrl ?? null,
      location_text: input.locationText ?? null,
      bio: input.bio ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(input: Partial<CreateProfileInput>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');
  const { error } = await supabase
    .from('profiles')
    .update({
      ...(input.displayName !== undefined && { display_name: input.displayName }),
      ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl }),
      ...(input.locationText !== undefined && { location_text: input.locationText }),
      ...(input.bio !== undefined && { bio: input.bio }),
    })
    .eq('user_id', user.id);
  if (error) throw error;
}

export async function getUserRecords(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('author_id', userId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('event_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getUserLists(userId: string) {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
