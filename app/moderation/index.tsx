import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CircularIconButton } from '../../components/ui/CircularIconButton';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ModTabs, type ModTab } from '../../components/moderation/ModTabs';
import { relativeTime } from '../../lib/format';
import { useDebouncedValue } from '../../lib/hooks/usePaginatedQuery';
import {
  getReportQueue,
  resolveReport,
  getPendingVinCorrections,
  approveVinCorrection,
  rejectVinCorrection,
  getPendingDuplicateRequests,
  mergeVehicles,
  rejectDuplicateRequest,
  moderateUser,
  moderateContent,
  getAllModerationActions,
  getAuditLogs,
} from '../../lib/api/moderation';
import { searchProfiles } from '../../lib/api/profiles';
import { getProfilesMap } from '../../lib/api/profiles';
import type { Report, VinCorrectionRequest, DuplicateVehicleRequest, ModerationAction, Profile } from '../../lib/types/database';

export default function ModerationDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<ModTab>('reports');

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-2">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text accessibilityRole="header" className="text-2xl font-extrabold text-charcoal dark:text-dark-text">Moderation</Text>
      </View>
      <ModTabs value={tab} onChange={setTab} />
      {tab === 'reports' ? <ReportsTab /> : null}
      {tab === 'vin' ? <VinCorrectionsTab /> : null}
      {tab === 'duplicates' ? <DuplicatesTab /> : null}
      {tab === 'users' ? <UsersTab /> : null}
      {tab === 'removals' ? <RemovalsTab /> : null}
      {tab === 'audit' ? <AuditTab /> : null}
    </View>
  );
}

function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [reporters, setReporters] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await getReportQueue('open');
    setReports(list);
    setReporters(await getProfilesMap(list.map((r) => r.reporter_id)));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleResolve(id: string, status: 'resolved' | 'dismissed') {
    setBusyId(id);
    try {
      await resolveReport(id, status);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveContent(report: Report) {
    if (report.target_type !== 'record' && report.target_type !== 'comment' && report.target_type !== 'reply') return;
    setBusyId(report.id);
    try {
      await moderateContent(report.target_type, report.target_id, 'remove_content', `Report: ${report.reason}`);
      await resolveReport(report.id, 'resolved');
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <ActivityIndicator className="mt-8" color="#62C58F" />;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
      {reports.length === 0 ? (
        <EmptyState icon="check-circle" title="Report queue is clear" />
      ) : (
        reports.map((r) => (
          <View key={r.id} className="bg-white dark:bg-dark-card rounded-2xl p-4 mb-3 border border-black/5 dark:border-dark-border">
            <View className="flex-row items-center gap-2">
              <Badge label={r.reason.replace(/_/g, ' ')} tone={r.reason === 'sensitive_information' ? 'danger' : 'amber'} />
              <Badge label={r.target_type} tone="neutral" />
            </View>
            <Text className="text-sm text-charcoal dark:text-dark-text mt-2">
              Reported by {reporters.get(r.reporter_id)?.display_name ?? 'a user'} · {relativeTime(r.created_at)}
            </Text>
            {r.details ? <Text className="text-sm text-asphalt dark:text-dark-textSecondary mt-1">{r.details}</Text> : null}
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-1">Target ID: {r.target_id}</Text>
            <View className="flex-row gap-2 mt-3 flex-wrap">
              {['record', 'comment', 'reply'].includes(r.target_type) ? (
                <Button label="Remove content" size="sm" variant="destructive" onPress={() => handleRemoveContent(r)} loading={busyId === r.id} />
              ) : null}
              <Button label="Dismiss" size="sm" variant="outline" onPress={() => handleResolve(r.id, 'dismissed')} loading={busyId === r.id} />
              <Button label="Mark resolved" size="sm" variant="outline" onPress={() => handleResolve(r.id, 'resolved')} loading={busyId === r.id} />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function VinCorrectionsTab() {
  const [requests, setRequests] = useState<VinCorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRequests(await getPendingVinCorrections());
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handle(id: string, approve: boolean) {
    setBusyId(id);
    try {
      if (approve) await approveVinCorrection(id);
      else await rejectVinCorrection(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <ActivityIndicator className="mt-8" color="#62C58F" />;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
      {requests.length === 0 ? (
        <EmptyState icon="check-circle" title="No pending VIN corrections" />
      ) : (
        requests.map((r) => (
          <View key={r.id} className="bg-white dark:bg-dark-card rounded-2xl p-4 mb-3 border border-black/5 dark:border-dark-border">
            <Text className="text-sm text-charcoal dark:text-dark-text">
              <Text className="line-through text-asphalt">{r.original_vin}</Text> → <Text className="font-bold">{r.suggested_vin}</Text>
            </Text>
            <Text className="text-sm text-asphalt dark:text-dark-textSecondary mt-1">{r.reason}</Text>
            <View className="flex-row gap-2 mt-3">
              <Button label="Approve" size="sm" onPress={() => handle(r.id, true)} loading={busyId === r.id} />
              <Button label="Reject" size="sm" variant="outline" onPress={() => handle(r.id, false)} loading={busyId === r.id} />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function DuplicatesTab() {
  const [requests, setRequests] = useState<DuplicateVehicleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRequests(await getPendingDuplicateRequests());
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleMerge(r: DuplicateVehicleRequest, winner: 'a' | 'b') {
    setBusyId(r.id);
    try {
      const winnerId = winner === 'a' ? r.vehicle_id_a : r.vehicle_id_b;
      const loserId = winner === 'a' ? r.vehicle_id_b : r.vehicle_id_a;
      await mergeVehicles(loserId, winnerId, r.id);
      setRequests((prev) => prev.filter((x) => x.id !== r.id));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    setBusyId(id);
    try {
      await rejectDuplicateRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <ActivityIndicator className="mt-8" color="#62C58F" />;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
      {requests.length === 0 ? (
        <EmptyState icon="check-circle" title="No pending duplicate reports" />
      ) : (
        requests.map((r) => (
          <View key={r.id} className="bg-white dark:bg-dark-card rounded-2xl p-4 mb-3 border border-black/5 dark:border-dark-border">
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary">Vehicle A: {r.vehicle_id_a}</Text>
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary">Vehicle B: {r.vehicle_id_b}</Text>
            <Text className="text-sm text-charcoal dark:text-dark-text mt-2">{r.reason}</Text>
            <View className="flex-row gap-2 mt-3 flex-wrap">
              <Button label="Keep A, merge B into it" size="sm" onPress={() => handleMerge(r, 'a')} loading={busyId === r.id} />
              <Button label="Keep B, merge A into it" size="sm" onPress={() => handleMerge(r, 'b')} loading={busyId === r.id} />
              <Button label="Reject" size="sm" variant="outline" onPress={() => handleReject(r.id)} loading={busyId === r.id} />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function UsersTab() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);
  const [results, setResults] = useState<Profile[]>([]);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      return;
    }
    searchProfiles(debounced).then(setResults);
  }, [debounced]);

  async function handleAction(userId: string, action: 'warn' | 'suspend' | 'ban' | 'lift_suspension') {
    if (!reason.trim()) return;
    setBusyId(userId);
    try {
      await moderateUser(userId, action, reason.trim());
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
      <TextField placeholder="Search users by username" value={query} onChangeText={setQuery} autoCapitalize="none" />
      <View className="mt-3">
        <TextField placeholder="Reason (required for any action below)" value={reason} onChangeText={setReason} />
      </View>
      {results.map((p) => (
        <View key={p.user_id} className="bg-white dark:bg-dark-card rounded-2xl p-4 mt-3 border border-black/5 dark:border-dark-border">
          <Text className="font-semibold text-charcoal dark:text-dark-text">{p.display_name} (@{p.username})</Text>
          <View className="flex-row gap-2 mt-3 flex-wrap">
            <Button label="Warn" size="sm" variant="outline" disabled={!reason.trim()} onPress={() => handleAction(p.user_id, 'warn')} loading={busyId === p.user_id} />
            <Button label="Suspend" size="sm" variant="outline" disabled={!reason.trim()} onPress={() => handleAction(p.user_id, 'suspend')} loading={busyId === p.user_id} />
            <Button label="Ban" size="sm" variant="destructive" disabled={!reason.trim()} onPress={() => handleAction(p.user_id, 'ban')} loading={busyId === p.user_id} />
            <Button label="Lift suspension/ban" size="sm" variant="outline" disabled={!reason.trim()} onPress={() => handleAction(p.user_id, 'lift_suspension')} loading={busyId === p.user_id} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function RemovalsTab() {
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllModerationActions().then((all) => setActions(all.filter((a) => a.action === 'remove_content' || a.action === 'restore_content'))).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator className="mt-8" color="#62C58F" />;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
      {actions.length === 0 ? (
        <EmptyState icon="archive" title="No content removals yet" />
      ) : (
        actions.map((a) => (
          <View key={a.id} className="py-3 border-b border-black/5 dark:border-dark-border">
            <View className="flex-row items-center gap-2">
              <Badge label={a.action.replace('_', ' ')} tone={a.action === 'remove_content' ? 'danger' : 'mint'} />
              <Badge label={a.target_type} tone="neutral" />
            </View>
            <Text className="text-sm text-charcoal dark:text-dark-text mt-1">{a.reason}</Text>
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-0.5">{relativeTime(a.created_at)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator className="mt-8" color="#62C58F" />;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
      {logs.length === 0 ? (
        <EmptyState icon="clipboard" title="No audit log entries yet" />
      ) : (
        logs.map((log) => (
          <View key={log.id} className="py-3 border-b border-black/5 dark:border-dark-border">
            <Text className="text-sm font-medium text-charcoal dark:text-dark-text">{log.action}</Text>
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-0.5">
              {log.target_type ? `${log.target_type} · ` : ''}{relativeTime(log.created_at)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
