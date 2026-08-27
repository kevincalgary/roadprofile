import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { CircularIconButton } from '../../components/ui/CircularIconButton';
import { Badge, UnverifiedBadge } from '../../components/ui/Badge';
import { OverflowMenu } from '../../components/ui/OverflowMenu';
import { ReportDialog } from '../../components/ui/ReportDialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CommentThread } from '../../components/comments/CommentThread';
import { CATEGORY_LABELS, RELATIONSHIP_LABELS, relativeTime, formatMileage } from '../../lib/format';
import { useAuth } from '../../lib/auth-context';
import { getRecordById, getRecordPhotos, getRecordDocuments, getRecordRevisions, deleteRecord } from '../../lib/api/records';
import { getProfilesMap } from '../../lib/api/profiles';
import type { VehicleRecord, RecordPhoto, RecordDocument, RecordRevision, Profile } from '../../lib/types/database';

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [record, setRecord] = useState<VehicleRecord | null | undefined>(undefined);
  const [author, setAuthor] = useState<Profile | undefined>();
  const [photos, setPhotos] = useState<RecordPhoto[]>([]);
  const [documents, setDocuments] = useState<RecordDocument[]>([]);
  const [revisions, setRevisions] = useState<RecordRevision[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);

  useEffect(() => {
    getRecordById(id).then(async (r) => {
      setRecord(r);
      if (r) {
        const [profiles, ph, docs, revs] = await Promise.all([
          getProfilesMap([r.author_id]),
          getRecordPhotos(r.id),
          getRecordDocuments(r.id),
          getRecordRevisions(r.id),
        ]);
        setAuthor(profiles.get(r.author_id));
        setPhotos(ph);
        setDocuments(docs);
        setRevisions(revs);
      }
    });
  }, [id]);

  async function handleCopyLink() {
    await Clipboard.setStringAsync(`https://roadprofile.app/record/${id}`);
  }

  async function handleDelete() {
    await deleteRecord(id);
    router.back();
  }

  if (record === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#62C58F" size="large" />
      </View>
    );
  }

  if (record === null) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
        <Text className="text-charcoal dark:text-dark-text">Record not found.</Text>
      </View>
    );
  }

  const isOwn = user?.id === record.author_id;

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg">
      <Head>
        <title>{`${record.title} · RoadProfile`}</title>
        <meta name="description" content={record.description ?? record.title} />
      </Head>

      <View className="flex-row items-center justify-between px-5" style={{ paddingTop: insets.top + 8 }}>
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <View className="flex-row gap-2">
          <CircularIconButton icon="share" accessibilityLabel="Share record" onPress={handleCopyLink} />
          <OverflowMenu
            accessibilityLabel="Record options"
            items={[
              { label: 'Copy public link', icon: 'link', onPress: handleCopyLink },
              ...(isOwn
                ? [
                    { label: 'Edit record', icon: 'edit-3' as const, onPress: () => router.push({ pathname: '/record/new', params: { recordId: record.id, vehicleId: record.vehicle_id, vin: '' } }) },
                    { label: 'Delete record', icon: 'trash-2' as const, onPress: () => setDeleteOpen(true), destructive: true },
                  ]
                : [{ label: 'Report record', icon: 'flag' as const, onPress: () => setReportOpen(true), destructive: true }]),
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text className="text-sm text-mint-600 font-semibold">{author?.display_name ?? 'RoadProfile contributor'}</Text>
        <View className="mt-1"><UnverifiedBadge /></View>
        <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-1">
          {RELATIONSHIP_LABELS[record.relationship]} · Published {relativeTime(record.published_at ?? record.created_at)}
          {record.is_edited ? ' · Edited' : ''}
        </Text>

        <Text accessibilityRole="header" className="text-2xl font-extrabold text-charcoal dark:text-dark-text mt-4">{record.title}</Text>
        <View className="flex-row items-center gap-2 mt-2">
          <Badge label={CATEGORY_LABELS[record.category]} />
          {record.mileage_inconsistency_flag ? <Badge label="Mileage inconsistency" tone="amber" /> : null}
        </View>

        {photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 -mx-1" contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}>
            {photos.map((p) => (
              <Image key={p.id} source={{ uri: p.url }} style={{ width: 260, height: 190, borderRadius: 16 }} contentFit="cover" />
            ))}
          </ScrollView>
        ) : null}

        {record.description ? <Text className="text-base text-charcoal dark:text-dark-text mt-4">{record.description}</Text> : null}

        <View className="mt-5 gap-1">
          <DetailRow label="Event date" value={record.event_date} />
          {record.mileage != null && record.mileage_unit ? <DetailRow label="Mileage" value={formatMileage(record.mileage, record.mileage_unit)} /> : null}
          {record.location_text ? <DetailRow label="Location" value={record.location_text} /> : null}
          {record.symptoms ? <DetailRow label="Symptoms" value={record.symptoms} /> : null}
          {record.diagnosis ? <DetailRow label="Diagnosis" value={record.diagnosis} /> : null}
          {record.work_performed ? <DetailRow label="Work performed" value={record.work_performed} /> : null}
          {record.parts_replaced ? <DetailRow label="Parts replaced" value={record.parts_replaced} /> : null}
          {record.part_brand_and_numbers ? <DetailRow label="Part brands / numbers" value={record.part_brand_and_numbers} /> : null}
          {record.facility_or_technician ? <DetailRow label="Facility / technician" value={record.facility_or_technician} /> : null}
          {record.warranty_info ? <DetailRow label="Warranty" value={record.warranty_info} /> : null}
          {record.next_service_date ? <DetailRow label="Next service due" value={record.next_service_date} /> : null}
          {!record.cost_is_private && record.cost_amount != null ? <DetailRow label="Cost" value={`$${record.cost_amount.toFixed(2)} ${record.cost_currency ?? ''}`} /> : null}
        </View>

        {documents.length > 0 ? (
          <View className="mt-5">
            <Text className="text-sm font-bold text-charcoal dark:text-dark-text mb-2">Evidence attachments</Text>
            {documents.map((d) => (
              <View key={d.id} className="flex-row items-center gap-2 py-1.5">
                <Feather name="file-text" size={14} color="#5C6470" />
                <Text className="text-sm text-charcoal dark:text-dark-text">{d.filename}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {revisions.length > 0 ? (
          <View className="mt-5">
            <Pressable onPress={() => setShowRevisions((v) => !v)} accessibilityRole="button" className="flex-row items-center gap-2">
              <Feather name={showRevisions ? 'chevron-up' : 'chevron-down'} size={16} color="#5C6470" />
              <Text className="text-sm font-semibold text-charcoal dark:text-dark-text">Revision history ({revisions.length})</Text>
            </Pressable>
            {showRevisions
              ? revisions.map((rev) => (
                  <Text key={rev.id} className="text-xs text-asphalt dark:text-dark-textSecondary mt-2">
                    Edited {relativeTime(rev.changed_at)}
                  </Text>
                ))
              : null}
          </View>
        ) : null}

        <View className="mt-8">
          <CommentThread recordId={record.id} />
        </View>
      </ScrollView>

      <ReportDialog visible={reportOpen} targetType="record" targetId={record.id} onClose={() => setReportOpen(false)} />
      <ConfirmDialog
        visible={deleteOpen}
        title="Delete this record?"
        description="This removes it from the public timeline. A moderator can still see it was removed."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row py-1.5 border-b border-black/5 dark:border-dark-border">
      <Text className="w-36 text-sm text-asphalt dark:text-dark-textSecondary">{label}</Text>
      <Text className="flex-1 text-sm text-charcoal dark:text-dark-text">{value}</Text>
    </View>
  );
}
