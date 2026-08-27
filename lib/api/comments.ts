import { supabase } from '../supabase';
import type { Comment, Reply } from '../types/database';

export async function getComments(recordId: string, cursor?: string, limit = 20): Promise<Comment[]> {
  let query = supabase
    .from('comments')
    .select('*')
    .eq('record_id', recordId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (cursor) query = query.gt('created_at', cursor);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getReplies(commentId: string): Promise<Reply[]> {
  const { data, error } = await supabase
    .from('replies')
    .select('*')
    .eq('comment_id', commentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function postComment(recordId: string, body: string): Promise<Comment> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in to comment.');
  const { data, error } = await supabase.from('comments').insert({ record_id: recordId, author_id: user.id, body }).select().single();
  if (error) throw error;
  return data;
}

export async function postReply(commentId: string, body: string): Promise<Reply> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in to reply.');
  const { data, error } = await supabase.from('replies').insert({ comment_id: commentId, author_id: user.id, body }).select().single();
  if (error) throw error;
  return data;
}

export async function editComment(commentId: string, body: string) {
  const { error } = await supabase.from('comments').update({ body }).eq('id', commentId);
  if (error) throw error;
}

export async function editReply(replyId: string, body: string) {
  const { error } = await supabase.from('replies').update({ body }).eq('id', replyId);
  if (error) throw error;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from('comments').update({ deleted_at: new Date().toISOString() }).eq('id', commentId);
  if (error) throw error;
}

export async function deleteReply(replyId: string) {
  const { error } = await supabase.from('replies').update({ deleted_at: new Date().toISOString() }).eq('id', replyId);
  if (error) throw error;
}

export async function getCommentCount(recordId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('record_id', recordId)
    .is('deleted_at', null);
  if (error) throw error;
  return count ?? 0;
}
