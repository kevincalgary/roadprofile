import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { TextField } from '../../components/ui/TextField';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { VinScanner } from '../../components/vehicle/VinScanner';
import { VehicleResultRow } from '../../components/vehicle/VehicleResultRow';
import { UserRow } from '../../components/user/UserRow';
import { ListRow } from '../../components/lists/ListRow';
import { NAV_CLEARANCE } from '../../components/nav/AppShell';
import { useDebouncedValue } from '../../lib/hooks/usePaginatedQuery';
import { searchVehicles } from '../../lib/api/vehicles';
import { searchProfiles } from '../../lib/api/profiles';
import { searchLists } from '../../lib/api/lists';
import { searchKeyword } from '../../lib/api/feed';
import { validateVin } from '../../lib/vin';
import type { Vehicle, Profile, ListRow as ListRowType, VehicleRecord } from '../../lib/types/database';

type Category = 'all' | 'vehicles' | 'users' | 'lists' | 'posts';

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const debounced = useDebouncedValue(query, 350);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [lists, setLists] = useState<ListRowType[]>([]);
  const [posts, setPosts] = useState<VehicleRecord[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!debounced) {
      setVehicles([]);
      setUsers([]);
      setLists([]);
      setPosts([]);
      return;
    }
    setSearching(true);
    Promise.all([searchVehicles(debounced), searchProfiles(debounced), searchLists(debounced), searchKeyword(debounced)])
      .then(([v, u, l, p]) => {
        setVehicles(v);
        setUsers(u);
        setLists(l);
        setPosts(p);
      })
      .finally(() => setSearching(false));
  }, [debounced]);

  const vinValidation = validateVin(query);
  const looksLikeVin = query.replace(/[\s-]/g, '').length >= 5;
  const noVehicleMatch = looksLikeVin && !searching && vehicles.length === 0 && vinValidation.errors.length === 0;

  const showVehicles = category === 'all' || category === 'vehicles';
  const showUsers = category === 'all' || category === 'users';
  const showLists = category === 'all' || category === 'lists';
  const showPosts = category === 'all' || category === 'posts';

  const hasAnyResults = vehicles.length + users.length + lists.length + posts.length > 0;

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="px-5 pt-4 pb-2">
        <Text accessibilityRole="header" className="text-3xl font-extrabold text-charcoal dark:text-dark-text mb-3">
          Search
        </Text>
        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <TextField
              placeholder="VIN, year, make, model, user, list, keyword…"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              accessibilityLabel="Search RoadProfile"
            />
          </View>
          <Pressable onPress={() => setScannerOpen(true)} accessibilityRole="button" accessibilityLabel="Scan VIN barcode" className="w-12 h-12 rounded-xl bg-mint items-center justify-center">
            <Feather name="camera" size={20} color="#0F2518" />
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-2" contentContainerStyle={{ gap: 8 }}>
        {(['all', 'vehicles', 'users', 'lists', 'posts'] as Category[]).map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            accessibilityRole="tab"
            accessibilityState={{ selected: category === c }}
            className={['h-9 px-4 rounded-pill items-center justify-center border', category === c ? 'bg-mint border-mint' : 'border-asphalt/30 dark:border-dark-border'].join(' ')}
          >
            <Text className={['text-sm font-medium capitalize', category === c ? 'text-mint-900' : 'text-asphalt dark:text-dark-textSecondary'].join(' ')}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingBottom: NAV_CLEARANCE, paddingHorizontal: 20 }}>
        {!query ? (
          <EmptyState icon="search" title="Search RoadProfile" description="Look up a VIN, browse by year/make/model, or find a user, list, or post." />
        ) : (
          <>
            {noVehicleMatch ? (
              <View className="bg-cardgray dark:bg-dark-card rounded-2xl p-5 mb-4 gap-2">
                <Text className="font-bold text-charcoal dark:text-dark-text">No vehicle found for "{query}"</Text>
                <Text className="text-sm text-asphalt dark:text-dark-textSecondary">
                  RoadProfile doesn't have a record for this VIN yet. You can create a public profile for it.
                </Text>
                <View className="mt-1">
                  <Button label="Create vehicle profile" onPress={() => router.push({ pathname: '/vehicle/new', params: { vin: query } })} />
                </View>
              </View>
            ) : null}

            {showVehicles && vehicles.length > 0 ? (
              <View className="mb-4">
                <Text className="text-sm font-bold text-asphalt dark:text-dark-textSecondary uppercase mb-2">Vehicles</Text>
                {vehicles.map((v) => (
                  <VehicleResultRow key={v.id} vehicle={v} />
                ))}
              </View>
            ) : null}

            {showUsers && users.length > 0 ? (
              <View className="mb-4">
                <Text className="text-sm font-bold text-asphalt dark:text-dark-textSecondary uppercase mb-2">Users</Text>
                {users.map((u) => (
                  <UserRow key={u.user_id} profile={u} />
                ))}
              </View>
            ) : null}

            {showLists && lists.length > 0 ? (
              <View className="mb-4">
                <Text className="text-sm font-bold text-asphalt dark:text-dark-textSecondary uppercase mb-2">Lists</Text>
                {lists.map((l) => (
                  <ListRow key={l.id} list={l} />
                ))}
              </View>
            ) : null}

            {showPosts && posts.length > 0 ? (
              <View className="mb-4">
                <Text className="text-sm font-bold text-asphalt dark:text-dark-textSecondary uppercase mb-2">Posts</Text>
                {posts.map((p) => (
                  <Pressable key={p.id} onPress={() => router.push(`/record/${p.id}`)} className="py-3 border-b border-black/5 dark:border-dark-border">
                    <Text className="font-semibold text-charcoal dark:text-dark-text">{p.title}</Text>
                    {p.description ? (
                      <Text numberOfLines={2} className="text-sm text-asphalt dark:text-dark-textSecondary mt-1">
                        {p.description}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ) : null}

            {!searching && !hasAnyResults && !noVehicleMatch ? (
              <EmptyState icon="frown" title="No results" description="Try a different VIN, name, or keyword." />
            ) : null}
          </>
        )}
      </ScrollView>

      <VinScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={(vin) => {
          setScannerOpen(false);
          setQuery(vin);
        }}
      />
    </View>
  );
}
