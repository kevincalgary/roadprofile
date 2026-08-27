import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { CircularIconButton } from '../../components/ui/CircularIconButton';
import { OverflowMenu } from '../../components/ui/OverflowMenu';
import { ReportDialog } from '../../components/ui/ReportDialog';
import { FollowButton } from '../../components/user/FollowButton';
import { VehicleResultRow } from '../../components/vehicle/VehicleResultRow';
import { EmptyState } from '../../components/ui/EmptyState';
import { NAV_CLEARANCE } from '../../components/nav/AppShell';
import { useAuth } from '../../lib/auth-context';
import { getListById, getListStats, getListVehicles, getListCollaborators, removeVehicleFromList } from '../../lib/api/lists';
import { getProfilesMap } from '../../lib/api/profiles';
import { supabase } from '../../lib/supabase';
import type { ListRow, ListStats, ListVehicle, Vehicle, Profile } from '../../lib/types/database';

export default function ListDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [list, setList] = useState<ListRow | null | undefined>(undefined);
  const [stats, setStats] = useState<ListStats | null>(null);
  const [listVehicles, setListVehicles] = useState<ListVehicle[]>([]);
  const [vehicles, setVehicles] = useState<Map<string, Vehicle>>(new Map());
  const [owner, setOwner] = useState<Profile | undefined>();
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    const l = await getListById(id);
    setList(l);
    if (!l) return;
    const [s, lv, profiles] = await Promise.all([getListStats(id), getListVehicles(id), getProfilesMap([l.owner_id])]);
    setStats(s);
    setListVehicles(lv);
    setOwner(profiles.get(l.owner_id));
    if (lv.length) {
      const { data } = await supabase.from('vehicles').select('*').in('id', lv.map((v) => v.vehicle_id));
      setVehicles(new Map((data ?? []).map((v) => [v.id, v as Vehicle])));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleShare() {
    await Clipboard.setStringAsync(`https://roadprofile.app/list/${id}`);
  }

  if (list === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#62C58F" size="large" />
      </View>
    );
  }
  if (list === null) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
        <Text className="text-charcoal dark:text-dark-text">List not found.</Text>
      </View>
    );
  }

  const isOwner = user?.id === list.owner_id;

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg">
      <Head>
        <title>{`${list.name} · RoadProfile`}</title>
        <meta name="description" content={list.description ?? `A RoadProfile vehicle list.`} />
      </Head>
      <ScrollView contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}>
        <View style={{ height: 220 }} className="bg-cardgray dark:bg-dark-card">
          {list.cover_image_url ? (
            <Image source={{ uri: list.cover_image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Feather name="list" size={28} color="#8A919B" />
            </View>
          )}
          <View className="absolute top-0 left-0 right-0 flex-row justify-between px-4" style={{ paddingTop: insets.top + 8 }}>
            <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} backgroundClassName="bg-black/40" color="#fff" />
            <View className="flex-row gap-2">
              <CircularIconButton icon="share" accessibilityLabel="Share list" onPress={handleShare} backgroundClassName="bg-black/40" color="#fff" />
              <OverflowMenu
                accessibilityLabel="List options"
                items={[
                  { label: 'Copy public link', icon: 'link', onPress: handleShare },
                  { label: 'Report list', icon: 'flag', onPress: () => setReportOpen(true), destructive: true },
                ]}
              />
            </View>
          </View>
        </View>

        <View className="px-5 pt-4 gap-2">
          {!list.is_public ? <Feather name="lock" size={14} color="#8A919B" /> : null}
          <Text accessibilityRole="header" className="text-2xl font-extrabold text-charcoal dark:text-dark-text">{list.name}</Text>
          <Text className="text-sm text-asphalt dark:text-dark-textSecondary">Created by {owner?.display_name ?? '—'}</Text>
          {list.description ? <Text className="text-sm text-charcoal dark:text-dark-text mt-1">{list.description}</Text> : null}
          <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-1">{stats?.vehicle_count ?? 0} vehicles · {stats?.follower_count ?? 0} followers</Text>

          <View className="flex-row gap-3 mt-2">
            {!isOwner ? <FollowButton followeeType="list" followeeId={list.id} /> : null}
          </View>
        </View>

        <View className="mt-6 px-5">
          <Text className="text-lg font-bold text-charcoal dark:text-dark-text mb-2">Vehicles</Text>
          {listVehicles.length === 0 ? (
            <EmptyState icon="list" title="No vehicles yet" description={isOwner ? 'Add a vehicle to this list from its profile page.' : undefined} />
          ) : (
            listVehicles.map((lv) => {
              const vehicle = vehicles.get(lv.vehicle_id);
              if (!vehicle) return null;
              return (
                <View key={lv.id} className="flex-row items-center">
                  <View className="flex-1">
                    <VehicleResultRow vehicle={vehicle} />
                  </View>
                  {isOwner ? (
                    <Pressable
                      onPress={async () => {
                        await removeVehicleFromList(list.id, vehicle.id);
                        setListVehicles((prev) => prev.filter((x) => x.id !== lv.id));
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${vehicle.vin} from this list`}
                      className="w-11 h-11 items-center justify-center"
                    >
                      <Feather name="x" size={18} color="#8A919B" />
                    </Pressable>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      <ReportDialog visible={reportOpen} targetType="list" targetId={list.id} onClose={() => setReportOpen(false)} />
    </View>
  );
}
