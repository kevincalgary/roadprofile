import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CircularIconButton } from '../../components/ui/CircularIconButton';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { FollowButton } from '../../components/user/FollowButton';
import { OverflowMenu } from '../../components/ui/OverflowMenu';
import { ReportDialog } from '../../components/ui/ReportDialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ListCard } from '../../components/lists/ListCard';
import { FeedPostCard } from '../../components/feed/FeedPostCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { NAV_CLEARANCE } from '../../components/nav/AppShell';
import { useAuth } from '../../lib/auth-context';
import { getProfileByUsername, getProfileStats, getUserRecords, getUserLists } from '../../lib/api/profiles';
import { hydrateRecords, type HydratedFeed } from '../../lib/api/hydrate';
import { blockUser } from '../../lib/api/social';
import { startConversation } from '../../lib/api/messages';
import type { Profile, ProfileStats, VehicleRecord, ListRow } from '../../lib/types/database';

export default function UserProfile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [hydrated, setHydrated] = useState<HydratedFeed | null>(null);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    const p = await getProfileByUsername(username);
    setProfile(p);
    if (p) {
      const [s, r, l] = await Promise.all([getProfileStats(p.user_id), getUserRecords(p.user_id), getUserLists(p.user_id)]);
      setStats(s);
      setRecords(r);
      setHydrated(await hydrateRecords(r));
      setLists(l);
    }
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMessage() {
    if (!profile) return;
    try {
      const conversationId = await startConversation(profile.user_id);
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      console.warn(err);
    }
  }

  if (profile === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#62C58F" size="large" />
      </View>
    );
  }
  if (profile === null) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
        <Text className="text-charcoal dark:text-dark-text">User not found.</Text>
      </View>
    );
  }

  const isSelf = user?.id === profile.user_id;

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg">
      <Head>
        <title>{`${profile.display_name} (@${profile.username}) · RoadProfile`}</title>
        <meta name="description" content={profile.bio ?? `${profile.display_name}'s RoadProfile profile.`} />
      </Head>

      <ScrollView contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}>
        <View className="flex-row items-center justify-between px-5" style={{ paddingTop: insets.top + 8 }}>
          <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
          {!isSelf ? (
            <OverflowMenu
              accessibilityLabel="Profile options"
              items={[
                { label: 'Report user', icon: 'flag', onPress: () => setReportOpen(true), destructive: true },
                { label: 'Block user', icon: 'slash', onPress: () => setBlockConfirmOpen(true), destructive: true },
              ]}
            />
          ) : null}
        </View>

        <View className="px-5 pt-3 items-center gap-2">
          <Avatar url={profile.avatar_url} name={profile.display_name} size={96} />
          <Text accessibilityRole="header" className="text-2xl font-extrabold text-charcoal dark:text-dark-text mt-2">{profile.display_name}</Text>
          <Text className="text-sm text-asphalt dark:text-dark-textSecondary">@{profile.username}</Text>
          {profile.location_text ? (
            <View className="flex-row items-center gap-1">
              <Feather name="map-pin" size={12} color="#8A919B" />
              <Text className="text-xs text-asphalt dark:text-dark-textSecondary">{profile.location_text}</Text>
            </View>
          ) : null}
          {profile.bio ? <Text className="text-sm text-charcoal dark:text-dark-text text-center mt-1 max-w-sm">{profile.bio}</Text> : null}
          <Text className="text-xs text-asphalt dark:text-dark-textSecondary">Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>

          <View className="flex-row gap-6 mt-2">
            <Stat label="Posts" value={stats?.post_count ?? 0} />
            <Stat label="Followers" value={stats?.follower_count ?? 0} />
            <Stat label="Following" value={stats?.following_count ?? 0} />
          </View>

          <View className="flex-row gap-3 mt-3">
            {isSelf ? (
              <Button label="Edit Profile" variant="outline" onPress={() => router.push('/account/edit')} />
            ) : (
              <>
                <FollowButton followeeType="user" followeeId={profile.user_id} />
                <Button label="Message" variant="outline" onPress={handleMessage} icon={<Feather name="message-circle" size={16} color="#1A1D1F" />} />
              </>
            )}
          </View>
        </View>

        {lists.length > 0 ? (
          <View className="mt-6 px-5">
            <Text className="text-lg font-bold text-charcoal dark:text-dark-text mb-2">Lists</Text>
            <View className="gap-3">
              {lists.map((l) => (
                <ListCard key={l.id} list={l} />
              ))}
            </View>
          </View>
        ) : null}

        <View className="mt-6">
          <Text className="px-5 text-lg font-bold text-charcoal dark:text-dark-text mb-2">Contributions</Text>
          {records.length === 0 ? (
            <EmptyState icon="edit-3" title="No public contributions yet" />
          ) : (
            records.map((r) => (
              <FeedPostCard
                key={r.id}
                record={r}
                author={profile}
                vehicle={hydrated?.vehicles.get(r.vehicle_id)}
                photos={hydrated?.photosByRecord.get(r.id) ?? []}
                commentCount={hydrated?.commentCounts.get(r.id) ?? 0}
                bookmarked={hydrated?.bookmarked.has(r.id) ?? false}
              />
            ))
          )}
        </View>
      </ScrollView>

      <ReportDialog visible={reportOpen} targetType="user" targetId={profile.user_id} onClose={() => setReportOpen(false)} />
      <ConfirmDialog
        visible={blockConfirmOpen}
        title={`Block @${profile.username}?`}
        description="They won't be able to message, follow, or mention you anymore."
        confirmLabel="Block"
        destructive
        onConfirm={() => blockUser(profile.user_id).then(() => setBlockConfirmOpen(false))}
        onCancel={() => setBlockConfirmOpen(false)}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text className="text-base font-bold text-charcoal dark:text-dark-text">{value}</Text>
      <Text className="text-xs text-asphalt dark:text-dark-textSecondary">{label}</Text>
    </View>
  );
}
