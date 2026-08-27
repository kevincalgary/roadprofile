import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader } from '../../components/nav/ScreenHeader';
import { CircularIconButton } from '../../components/ui/CircularIconButton';
import { Button } from '../../components/ui/Button';
import { Badge, CommunitySubmittedBadge, VerifiedDataBadge, DemoDataBadge } from '../../components/ui/Badge';
import { OverflowMenu } from '../../components/ui/OverflowMenu';
import { ReportDialog } from '../../components/ui/ReportDialog';
import { SuggestCorrectionDialog } from '../../components/vehicle/SuggestCorrectionDialog';
import { AddToListDialog } from '../../components/lists/AddToListDialog';
import { TimelineFilterBar, type TimelineFilter } from '../../components/vehicle/TimelineFilterBar';
import { MileageGraph } from '../../components/vehicle/MileageGraph';
import { FeedPostCard } from '../../components/feed/FeedPostCard';
import { FeedPostSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FollowButton } from '../../components/user/FollowButton';
import { NAV_CLEARANCE } from '../../components/nav/AppShell';
import { formatVinForDisplay, formatMileage } from '../../lib/format';
import { getVehicleByVin, getMileageHistory, recordVehicleView, type VehicleWithDetails, type MileagePoint } from '../../lib/api/vehicles';
import { getVehicleTimeline } from '../../lib/api/records';
import { hydrateRecords, type HydratedFeed } from '../../lib/api/hydrate';
import type { VehicleRecord } from '../../lib/types/database';

export default function VehicleProfile() {
  const { vin } = useLocalSearchParams<{ vin: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<VehicleWithDetails | null | undefined>(undefined);
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [hydrated, setHydrated] = useState<HydratedFeed | null>(null);
  const [mileage, setMileage] = useState<MileagePoint[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'incorrect_vin' | 'duplicate_vehicle' | 'sensitive_information' | 'inappropriate_content'>('inappropriate_content');
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionMode, setCorrectionMode] = useState<'field' | 'vin'>('field');
  const [addToListOpen, setAddToListOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const vehicleData = await getVehicleByVin(vin);
      setData(vehicleData);
      if (vehicleData) {
        recordVehicleView(vehicleData.vehicle.id);
        const [timeline, mileageHistory] = await Promise.all([
          getVehicleTimeline({ vehicleId: vehicleData.vehicle.id, category: filter }),
          getMileageHistory(vehicleData.vehicle.id),
        ]);
        setRecords(timeline);
        setHydrated(await hydrateRecords(timeline));
        setMileage(mileageHistory);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Could not load this vehicle.');
    } finally {
      setLoadingTimeline(false);
    }
  }, [vin, filter]);

  useEffect(() => {
    setLoadingTimeline(true);
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleCopyLink() {
    await Clipboard.setStringAsync(`https://roadprofile.app/vehicle/${vin}`);
  }

  if (data === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#62C58F" size="large" />
      </View>
    );
  }

  if (data === null) {
    return (
      <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
        <View className="px-5"><CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} /></View>
        <EmptyState
          icon="alert-circle"
          title="Vehicle not found"
          description={`No RoadProfile record exists for ${vin} yet.`}
          actionLabel="Create vehicle profile"
          onAction={() => router.push({ pathname: '/vehicle/new', params: { vin } })}
        />
      </View>
    );
  }

  const { vehicle, details, stats } = data;
  const title = details ? `${details.year} ${details.make} ${details.model}${details.trim ? ` ${details.trim}` : ''}` : 'Vehicle';
  const description = `Crowdsourced vehicle history for VIN ${vehicle.vin} on RoadProfile.`;

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg">
      <Head>
        <title>{`${title} · RoadProfile`}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} · RoadProfile`} />
        <meta property="og:description" content={description} />
        {vehicle.cover_photo_url ? <meta property="og:image" content={vehicle.cover_photo_url} /> : null}
      </Head>

      <ScrollView
        contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#62C58F" />}
      >
        <View style={{ height: 260 }} className="bg-cardgray dark:bg-dark-card">
          {vehicle.cover_photo_url ? (
            <Image source={{ uri: vehicle.cover_photo_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Feather name="image" size={32} color="#8A919B" />
            </View>
          )}
          <View className="absolute top-0 left-0 right-0 flex-row justify-between px-4" style={{ paddingTop: insets.top + 8 }}>
            <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} backgroundClassName="bg-black/40" color="#fff" />
            <View className="flex-row gap-2">
              <CircularIconButton icon="share" accessibilityLabel="Share vehicle" onPress={handleCopyLink} backgroundClassName="bg-black/40" color="#fff" />
              <OverflowMenu
                accessibilityLabel="Vehicle options"
                items={[
                  { label: 'Add to list', icon: 'list', onPress: () => setAddToListOpen(true) },
                  { label: 'Suggest vehicle correction', icon: 'edit-3', onPress: () => { setCorrectionMode('field'); setCorrectionOpen(true); } },
                  { label: 'Report incorrect VIN', icon: 'alert-triangle', onPress: () => { setCorrectionMode('vin'); setCorrectionOpen(true); } },
                  { label: 'Report duplicate vehicle', icon: 'copy', onPress: () => { setReportReason('duplicate_vehicle'); setReportOpen(true); } },
                  { label: 'Report sensitive information', icon: 'shield', onPress: () => { setReportReason('sensitive_information'); setReportOpen(true); } },
                  { label: 'Report inappropriate content', icon: 'flag', onPress: () => { setReportReason('inappropriate_content'); setReportOpen(true); }, destructive: true },
                  { label: 'Copy public link', icon: 'link', onPress: handleCopyLink },
                ]}
              />
            </View>
          </View>
        </View>

        <View className="px-5 pt-4 gap-3">
          {vehicle.is_demo ? <DemoDataBadge /> : null}
          <Text accessibilityRole="header" className="text-2xl font-extrabold text-charcoal dark:text-dark-text">{title}</Text>
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-sm text-asphalt dark:text-dark-textSecondary tracking-wide">{formatVinForDisplay(vehicle.vin)}</Text>
            {details?.data_status === 'verified' ? <VerifiedDataBadge /> : <CommunitySubmittedBadge />}
          </View>

          <View className="flex-row gap-6 mt-1">
            <Stat label="Posts" value={stats?.post_count ?? 0} />
            <Stat label="Contributors" value={stats?.contributor_count ?? 0} />
            <Stat label="Followers" value={stats?.follower_count ?? 0} />
          </View>

          {stats?.latest_mileage != null && stats.latest_mileage_unit ? (
            <Text className="text-sm text-charcoal dark:text-dark-text">
              Most recently reported: <Text className="font-semibold">{formatMileage(stats.latest_mileage, stats.latest_mileage_unit)}</Text>
            </Text>
          ) : null}

          <View className="flex-row gap-3 mt-2">
            <FollowButton followeeType="vehicle" followeeId={vehicle.id} />
            <Button
              label="New Record"
              variant="secondary"
              icon={<Feather name="plus" size={16} color="#fff" />}
              onPress={() => router.push({ pathname: '/record/new', params: { vehicleId: vehicle.id, vin: vehicle.vin } })}
            />
          </View>

          <Pressable onPress={() => router.push(`/vehicle/${vehicle.vin}/summary`)} className="mt-1">
            <Text className="text-sm text-mint-600 font-semibold">View buyer-ready history summary →</Text>
          </Pressable>
        </View>

        <View className="mt-6">
          <Text className="px-5 text-lg font-bold text-charcoal dark:text-dark-text mb-3">Mileage history</Text>
          <View className="px-5">
            <MileageGraph points={mileage} />
          </View>
        </View>

        <View className="mt-6">
          <Text className="px-5 text-lg font-bold text-charcoal dark:text-dark-text mb-3">History</Text>
          <TimelineFilterBar value={filter} onChange={setFilter} />
          <View className="mt-3">
            {loadingTimeline ? (
              <FeedPostSkeleton />
            ) : error ? (
              <ErrorState message={error} onRetry={load} />
            ) : records.length === 0 ? (
              <EmptyState icon="clock" title="No records in this category yet" description="Be the first to add to this vehicle's history." />
            ) : (
              records.map((r) => (
                <FeedPostCard
                  key={r.id}
                  record={r}
                  author={hydrated?.authors.get(r.author_id)}
                  vehicle={{ vehicle, details }}
                  photos={hydrated?.photosByRecord.get(r.id) ?? []}
                  commentCount={hydrated?.commentCounts.get(r.id) ?? 0}
                  bookmarked={hydrated?.bookmarked.has(r.id) ?? false}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <ReportDialog visible={reportOpen} targetType="vehicle" targetId={vehicle.id} presetReason={reportReason} onClose={() => setReportOpen(false)} />
      <SuggestCorrectionDialog visible={correctionOpen} onClose={() => setCorrectionOpen(false)} vehicleId={vehicle.id} vin={vehicle.vin} details={details} mode={correctionMode} />
      <AddToListDialog visible={addToListOpen} vehicleId={vehicle.id} onClose={() => setAddToListOpen(false)} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View>
      <Text className="text-base font-bold text-charcoal dark:text-dark-text">{value}</Text>
      <Text className="text-xs text-asphalt dark:text-dark-textSecondary">{label}</Text>
    </View>
  );
}
