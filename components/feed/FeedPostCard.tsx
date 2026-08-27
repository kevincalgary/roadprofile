import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Avatar } from '../ui/Avatar';
import { Badge, UnverifiedBadge, DemoDataBadge } from '../ui/Badge';
import { CircularIconButton } from '../ui/CircularIconButton';
import { OverflowMenu } from '../ui/OverflowMenu';
import { ReportDialog } from '../ui/ReportDialog';
import { relativeTime, formatMileage, CATEGORY_LABELS } from '../../lib/format';
import { categoryColors } from '../../lib/theme';
import { toggleBookmark } from '../../lib/api/records';
import type { VehicleRecord, Vehicle, VehicleDetails, RecordPhoto, Profile } from '../../lib/types/database';

interface FeedPostCardProps {
  record: VehicleRecord;
  author: Profile | undefined;
  vehicle: { vehicle: Vehicle; details: VehicleDetails | null } | undefined;
  photos: RecordPhoto[];
  commentCount: number;
  bookmarked: boolean;
}

export function FeedPostCard({ record, author, vehicle, photos, commentCount, bookmarked: initiallyBookmarked }: FeedPostCardProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [bookmarked, setBookmarked] = useState(initiallyBookmarked);
  const [reportOpen, setReportOpen] = useState(false);
  const cardWidth = Math.min(width, 640);

  async function handleBookmark() {
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await toggleBookmark(record.id, next);
    } catch {
      setBookmarked(!next);
    }
  }

  async function handleShare() {
    const url = `https://roadprofile.app/record/${record.id}`;
    await Clipboard.setStringAsync(url);
  }

  const vehicleLabel = vehicle?.details
    ? `${vehicle.details.year} ${vehicle.details.make} ${vehicle.details.model}${vehicle.details.trim ? ` ${vehicle.details.trim}` : ''}`
    : 'Vehicle';

  return (
    <View className="px-4 py-4 border-b border-black/5 dark:border-dark-border" style={{ maxWidth: cardWidth, width: '100%', alignSelf: 'center' }}>
      <View className="flex-row items-start gap-3">
        <Pressable onPress={() => author && router.push(`/u/${author.username}`)} accessibilityRole="link" accessibilityLabel={author ? `View ${author.display_name}'s profile` : 'Contributor'}>
          <Avatar url={author?.avatar_url} name={author?.display_name ?? 'RoadProfile contributor'} />
        </Pressable>
        <View className="flex-1">
          <View className="flex-row items-center flex-wrap gap-x-2">
            <Pressable onPress={() => author && router.push(`/u/${author.username}`)}>
              <Text className="font-semibold text-charcoal dark:text-dark-text">{author?.display_name ?? 'RoadProfile contributor'}</Text>
            </Pressable>
            <Text className="text-asphalt dark:text-dark-textSecondary text-sm">· {relativeTime(record.published_at ?? record.created_at)}</Text>
          </View>
          <UnverifiedBadge />
          {record.is_demo ? (
            <View className="mt-1">
              <DemoDataBadge />
            </View>
          ) : null}
        </View>
        <OverflowMenu
          accessibilityLabel="Post options"
          items={[
            { label: 'Copy public link', icon: 'link', onPress: handleShare },
            { label: 'Report post', icon: 'flag', onPress: () => setReportOpen(true), destructive: true },
          ]}
        />
      </View>

      <Pressable onPress={() => vehicle && router.push(`/vehicle/${vehicle.vehicle.vin}`)} className="mt-3">
        <Text className="text-mint-700 dark:text-mint-300 font-semibold">{vehicleLabel}</Text>
      </Pressable>

      <View className="flex-row items-center gap-2 mt-2">
        <Badge label={CATEGORY_LABELS[record.category]} tone="neutral" />
        {record.mileage_inconsistency_flag ? <Badge label="Mileage inconsistency" tone="amber" /> : null}
      </View>

      <Pressable onPress={() => router.push(`/record/${record.id}`)} className="mt-2">
        <Text className="text-base font-bold text-charcoal dark:text-dark-text">{record.title}</Text>
        {record.description ? (
          <Text numberOfLines={4} className="text-sm text-charcoal dark:text-dark-text mt-1">
            {record.description}
          </Text>
        ) : null}
      </Pressable>

      <View className="flex-row flex-wrap gap-3 mt-2">
        {record.location_text ? (
          <View className="flex-row items-center gap-1">
            <Feather name="map-pin" size={12} color="#8A919B" />
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary">{record.location_text}</Text>
          </View>
        ) : null}
        {record.mileage != null && record.mileage_unit ? (
          <View className="flex-row items-center gap-1">
            <Feather name="activity" size={12} color="#8A919B" />
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary">{formatMileage(record.mileage, record.mileage_unit)}</Text>
          </View>
        ) : null}
        <View className="flex-row items-center gap-1">
          <Feather name="calendar" size={12} color="#8A919B" />
          <Text className="text-xs text-asphalt dark:text-dark-textSecondary">{record.event_date}</Text>
        </View>
      </View>

      {photos.length > 0 ? (
        <Pressable onPress={() => router.push(`/record/${record.id}`)} className="mt-3">
          <View className="flex-row gap-1.5">
            {photos.slice(0, 5).map((photo, i) => (
              <Image
                key={photo.id}
                source={{ uri: photo.thumbnail_url ?? photo.url }}
                style={{ flex: 1, aspectRatio: 1, borderRadius: 12 }}
                contentFit="cover"
                accessibilityLabel={`Photo ${i + 1} for ${record.title}`}
              />
            ))}
          </View>
        </Pressable>
      ) : null}

      <View className="flex-row items-center gap-6 mt-3">
        <Pressable onPress={() => router.push(`/record/${record.id}`)} className="flex-row items-center gap-1.5 min-h-[44px]" accessibilityRole="button" accessibilityLabel={`${commentCount} comments`}>
          <Feather name="message-circle" size={18} color="#5C6470" />
          <Text className="text-sm text-asphalt dark:text-dark-textSecondary">{commentCount}</Text>
        </Pressable>
        <CircularIconButton
          icon="bookmark"
          color={bookmarked ? '#3B8C60' : '#5C6470'}
          backgroundClassName="bg-transparent"
          size={36}
          accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark this post'}
          onPress={handleBookmark}
        />
        <CircularIconButton icon="share" color="#5C6470" backgroundClassName="bg-transparent" size={36} accessibilityLabel="Share post" onPress={handleShare} />
      </View>

      <ReportDialog visible={reportOpen} targetType="record" targetId={record.id} onClose={() => setReportOpen(false)} />
    </View>
  );
}
