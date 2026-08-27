import { supabase } from '../supabase';
import type { ListRow, ListStats, ListVehicle, ListCollaborator } from '../types/database';

export async function getMyLists(): Promise<ListRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('lists').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getFollowedLists(): Promise<ListRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', user.id)
    .eq('followee_type', 'list');
  if (followsError) throw followsError;
  const ids = (follows ?? []).map((f) => f.followee_id);
  if (!ids.length) return [];
  const { data, error } = await supabase.from('lists').select('*').in('id', ids);
  if (error) throw error;
  return data ?? [];
}

export async function exploreLists(limit = 20): Promise<ListRow[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function searchLists(query: string, limit = 20): Promise<ListRow[]> {
  const { data, error } = await supabase.rpc('search_lists', { q: query, max_results: limit });
  if (error) throw error;
  return data ?? [];
}

export async function getListById(listId: string): Promise<ListRow | null> {
  const { data, error } = await supabase.from('lists').select('*').eq('id', listId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getListStats(listId: string): Promise<ListStats | null> {
  const { data, error } = await supabase.from('list_stats').select('*').eq('list_id', listId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getListVehicles(listId: string): Promise<ListVehicle[]> {
  const { data, error } = await supabase.from('list_vehicles').select('*').eq('list_id', listId).order('position');
  if (error) throw error;
  return data ?? [];
}

export async function getListCollaborators(listId: string): Promise<ListCollaborator[]> {
  const { data, error } = await supabase.from('list_collaborators').select('*').eq('list_id', listId);
  if (error) throw error;
  return data ?? [];
}

export interface CreateListInput {
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
}

export async function createList(input: CreateListInput): Promise<ListRow> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');
  const { data, error } = await supabase
    .from('lists')
    .insert({
      owner_id: user.id,
      name: input.name,
      description: input.description ?? null,
      cover_image_url: input.coverImageUrl ?? null,
      is_public: input.isPublic ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateList(listId: string, input: Partial<CreateListInput>) {
  const { error } = await supabase
    .from('lists')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.coverImageUrl !== undefined && { cover_image_url: input.coverImageUrl }),
      ...(input.isPublic !== undefined && { is_public: input.isPublic }),
    })
    .eq('id', listId);
  if (error) throw error;
}

export async function deleteList(listId: string) {
  const { error } = await supabase.from('lists').delete().eq('id', listId);
  if (error) throw error;
}

export async function addVehicleToList(listId: string, vehicleId: string, position: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');
  const { error } = await supabase.from('list_vehicles').insert({ list_id: listId, vehicle_id: vehicleId, position, added_by: user.id });
  if (error) throw error;
}

export async function removeVehicleFromList(listId: string, vehicleId: string) {
  const { error } = await supabase.from('list_vehicles').delete().eq('list_id', listId).eq('vehicle_id', vehicleId);
  if (error) throw error;
}

export async function reorderListVehicle(listVehicleRowId: string, position: number) {
  const { error } = await supabase.from('list_vehicles').update({ position }).eq('id', listVehicleRowId);
  if (error) throw error;
}

export async function inviteCollaborator(listId: string, userId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');
  const { error } = await supabase.from('list_collaborators').insert({ list_id: listId, user_id: userId, invited_by: user.id });
  if (error) throw error;
}

export async function acceptCollaboratorInvite(collaboratorRowId: string) {
  const { error } = await supabase.from('list_collaborators').update({ accepted: true }).eq('id', collaboratorRowId);
  if (error) throw error;
}

export async function removeCollaborator(collaboratorRowId: string) {
  const { error } = await supabase.from('list_collaborators').delete().eq('id', collaboratorRowId);
  if (error) throw error;
}
