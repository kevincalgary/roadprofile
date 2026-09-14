import { supabase } from '../supabase';
import type { Report, ModerationAction, VinCorrectionRequest, DuplicateVehicleRequest, VehicleDetailRevision, Appeal, AppealableAction } from '../types/database';

export async function getReportQueue(status: 'open' | 'reviewing' | 'resolved' | 'dismissed' = 'open'): Promise<Report[]> {
  const { data, error } = await supabase.from('reports').select('*').eq('status', status).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function resolveReport(reportId: string, status: 'resolved' | 'dismissed' | 'reviewing', notes?: string) {
  const { error } = await supabase.rpc('rpc_resolve_report', { p_report_id: reportId, p_status: status, p_notes: notes ?? null });
  if (error) throw error;
}

export async function getPendingVinCorrections(): Promise<VinCorrectionRequest[]> {
  const { data, error } = await supabase.from('vin_correction_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function approveVinCorrection(requestId: string, notes?: string) {
  const { error } = await supabase.rpc('rpc_approve_vin_correction', { p_request_id: requestId, p_notes: notes ?? null });
  if (error) throw error;
}

export async function rejectVinCorrection(requestId: string, notes?: string) {
  const { error } = await supabase.rpc('rpc_reject_vin_correction', { p_request_id: requestId, p_notes: notes ?? null });
  if (error) throw error;
}

export async function getPendingDetailRevisions(): Promise<VehicleDetailRevision[]> {
  const { data, error } = await supabase.from('vehicle_detail_revisions').select('*').eq('status', 'pending').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function approveDetailRevision(revisionId: string, notes?: string) {
  const { error } = await supabase.rpc('rpc_approve_detail_revision', { p_revision_id: revisionId, p_notes: notes ?? null });
  if (error) throw error;
}

export async function rejectDetailRevision(revisionId: string, notes?: string) {
  const { error } = await supabase.rpc('rpc_reject_detail_revision', { p_revision_id: revisionId, p_notes: notes ?? null });
  if (error) throw error;
}

export async function getPendingDuplicateRequests(): Promise<DuplicateVehicleRequest[]> {
  const { data, error } = await supabase.from('duplicate_vehicle_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function mergeVehicles(loserId: string, winnerId: string, requestId?: string, notes?: string) {
  const { error } = await supabase.rpc('rpc_merge_vehicles', {
    p_loser_id: loserId,
    p_winner_id: winnerId,
    p_request_id: requestId ?? null,
    p_notes: notes ?? null,
  });
  if (error) throw error;
}

export async function rejectDuplicateRequest(requestId: string, notes?: string) {
  const { error } = await supabase.rpc('rpc_reject_duplicate_request', { p_request_id: requestId, p_notes: notes ?? null });
  if (error) throw error;
}

export async function moderateUser(
  targetUserId: string,
  action: 'warn' | 'suspend' | 'ban' | 'lift_suspension',
  reason: string,
  notes?: string,
  expiresAt?: string
) {
  const { error } = await supabase.rpc('rpc_moderate_user', {
    p_target_user_id: targetUserId,
    p_action: action,
    p_reason: reason,
    p_notes: notes ?? null,
    p_expires_at: expiresAt ?? null,
  });
  if (error) throw error;
}

export async function moderateContent(
  targetType: 'record' | 'comment' | 'reply',
  targetId: string,
  action: 'remove_content' | 'restore_content',
  reason: string,
  notes?: string
) {
  const { error } = await supabase.rpc('rpc_moderate_content', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_action: action,
    p_reason: reason,
    p_notes: notes ?? null,
  });
  if (error) throw error;
}

export async function getModerationHistory(targetType: string, targetId: string): Promise<ModerationAction[]> {
  const { data, error } = await supabase
    .from('moderation_actions')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAuditLogs(limit = 50) {
  const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getAllModerationActions(limit = 50): Promise<ModerationAction[]> {
  const { data, error } = await supabase.from('moderation_actions').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getModerationActionsByIds(ids: string[]): Promise<ModerationAction[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('moderation_actions').select('*').in('id', ids);
  if (error) throw error;
  return data ?? [];
}

export async function getPendingAppeals(): Promise<Appeal[]> {
  const { data, error } = await supabase.from('appeals').select('*').eq('status', 'pending').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function decideAppeal(appealId: string, status: 'upheld' | 'overturned', notes?: string) {
  const { error } = await supabase.rpc('rpc_decide_appeal', { p_appeal_id: appealId, p_status: status, p_notes: notes ?? null });
  if (error) throw error;
}

export async function submitAppeal(moderationActionId: string, statement: string) {
  const { error } = await supabase.rpc('rpc_submit_appeal', { p_moderation_action_id: moderationActionId, p_statement: statement });
  if (error) throw error;
}

export async function getMyAppealableActions(): Promise<AppealableAction[]> {
  const { data, error } = await supabase.rpc('rpc_get_my_appealable_actions');
  if (error) throw error;
  return data ?? [];
}
