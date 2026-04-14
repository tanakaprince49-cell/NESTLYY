import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  subscribeToNests,
  subscribeToUserMemberships,
  joinNest,
  leaveNest,
  createNest,
  type Unsubscribe,
} from '@nestly/shared';
import { useAuthStore } from '@nestly/shared/stores';
import type { Nest, NestMembership, NestCategory } from '@nestly/shared';
import { NestCard } from '../../components/village/NestCard';
import { CreateNestModal } from '../../components/village/CreateNestModal';
import type { VillageStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<VillageStackParamList, 'VillageHome'>;

const CATEGORIES: { label: string; value: NestCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Trimester', value: 'trimester' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Diet', value: 'diet' },
  { label: 'Support', value: 'support' },
  { label: 'Postpartum', value: 'postpartum' },
];

type SortBy = 'popular' | 'newest';

export function VillageHomeScreen({ navigation }: Props) {
  const { userUid } = useAuthStore();

  const [view, setView] = useState<'discover' | 'my-nests'>('discover');
  const [nests, setNests] = useState<Nest[]>([]);
  const [memberships, setMemberships] = useState<NestMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<NestCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const readyRef = useRef({ nests: false, memberships: false });

  useEffect(() => {
    if (!userUid) {
      setLoading(false);
      return;
    }
    readyRef.current = { nests: false, memberships: false };
    const checkReady = () => {
      if (readyRef.current.nests && readyRef.current.memberships) {
        setLoading(false);
      }
    };
    const unsubNests: Unsubscribe = subscribeToNests((data) => {
      setNests(data);
      readyRef.current.nests = true;
      checkReady();
    });
    const unsubMemberships: Unsubscribe = subscribeToUserMemberships(userUid, (data) => {
      setMemberships(data);
      readyRef.current.memberships = true;
      checkReady();
    });
    return () => {
      unsubNests();
      unsubMemberships();
    };
  }, [userUid]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const joinedIds = useMemo(() => new Set(memberships.map((m) => m.nestId)), [memberships]);

  const filteredDiscover = useMemo(() => {
    let filtered = nests;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((n) => n.category === categoryFilter);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      filtered = filtered.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q),
      );
    }
    const sorted = [...filtered];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      sorted.sort((a, b) => b.memberCount - a.memberCount);
    }
    return sorted;
  }, [nests, categoryFilter, debouncedSearch, sortBy]);

  const joinedNests = useMemo(
    () => nests.filter((n) => joinedIds.has(n.id)),
    [nests, joinedIds],
  );

  const filteredJoinedNests = useMemo(() => {
    if (!debouncedSearch.trim()) return joinedNests;
    const q = debouncedSearch.toLowerCase().trim();
    return joinedNests.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q),
    );
  }, [joinedNests, debouncedSearch]);

  const handleJoin = useCallback(
    async (nestId: string) => {
      if (!userUid || pendingIds.has(nestId)) return;
      setPendingIds((prev) => new Set(prev).add(nestId));
      setMutationError(null);
      try {
        await joinNest(nestId, userUid);
      } catch {
        setMutationError("Couldn't join nest. Check your connection and try again.");
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(nestId);
          return next;
        });
      }
    },
    [userUid, pendingIds],
  );

  const handleLeave = useCallback(
    async (nestId: string) => {
      if (!userUid || pendingIds.has(nestId)) return;
      setPendingIds((prev) => new Set(prev).add(nestId));
      setMutationError(null);
      try {
        await leaveNest(nestId, userUid);
      } catch {
        setMutationError("Couldn't leave nest. Check your connection and try again.");
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(nestId);
          return next;
        });
      }
    },
    [userUid, pendingIds],
  );

  const handleCreate = useCallback(
    async (input: { name: string; description: string; category: NestCategory; emoji: string }) => {
      if (!userUid) return;
      const nestId = await createNest(input, userUid);
      setShowCreateModal(false);
      navigation.navigate('NestDetail', { nestId });
    },
    [userUid, navigation],
  );

  const handleCardPress = useCallback(
    (nestId: string) => {
      navigation.navigate('NestDetail', { nestId });
    },
    [navigation],
  );

  if (!userUid) {
    return (
      <SafeAreaView className="flex-1 bg-rose-50">
        <View className="flex-1 items-center justify-center px-8">
          <View className="bg-white rounded-3xl p-8 items-center max-w-sm w-full">
            <Ionicons name="people-outline" size={40} color="#f43f5e" />
            <Text className="text-lg font-semibold text-gray-800 mt-4 text-center">
              Sign in to join the Village
            </Text>
            <Text className="text-sm text-gray-500 mt-2 text-center">
              Create an account to discover nests and connect with other parents.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentList = view === 'discover' ? filteredDiscover : filteredJoinedNests;

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-rose-700 mb-3">Village</Text>

        <View className="flex-row bg-rose-100 rounded-full p-1 mb-3">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-full items-center ${view === 'discover' ? 'bg-white' : ''}`}
            onPress={() => setView('discover')}
          >
            <Text
              className={`text-sm font-semibold ${view === 'discover' ? 'text-rose-600' : 'text-rose-400'}`}
            >
              Discover
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 rounded-full items-center ${view === 'my-nests' ? 'bg-white' : ''}`}
            onPress={() => setView('my-nests')}
          >
            <Text
              className={`text-sm font-semibold ${view === 'my-nests' ? 'text-rose-600' : 'text-rose-400'}`}
            >
              My Nests
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-white rounded-xl px-3 mb-3">
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 py-2.5 px-2 text-sm text-gray-800"
            placeholder="Search nests..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {view === 'discover' && (
          <View className="flex-row items-center mb-1">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  className={`mr-2 px-3 py-1.5 rounded-full ${categoryFilter === cat.value ? 'bg-rose-400' : 'bg-white'}`}
                  onPress={() => setCategoryFilter(cat.value)}
                >
                  <Text
                    className={`text-xs font-semibold ${categoryFilter === cat.value ? 'text-white' : 'text-gray-600'}`}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              className="ml-2 flex-row items-center bg-white px-3 py-1.5 rounded-full"
              onPress={() => setSortBy((s) => (s === 'popular' ? 'newest' : 'popular'))}
            >
              <Ionicons name="swap-vertical-outline" size={13} color="#6b7280" />
              <Text className="text-xs text-gray-600 ml-1 font-medium">
                {sortBy === 'popular' ? 'Popular' : 'Newest'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f43f5e" />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NestCard
              nest={item}
              isJoined={joinedIds.has(item.id)}
              isPending={pendingIds.has(item.id)}
              onPress={() => handleCardPress(item.id)}
              onJoin={() => handleJoin(item.id)}
              onLeave={() => handleLeave(item.id)}
            />
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 pt-12">
              {view === 'my-nests' ? (
                <View className="items-center">
                  <Ionicons name="people-outline" size={48} color="#fda4af" />
                  <Text className="text-base font-semibold text-gray-700 mt-4 text-center">
                    You have not joined any nests yet.
                  </Text>
                  <Text className="text-sm text-gray-400 mt-1 text-center">
                    Discover nests that match your interests.
                  </Text>
                  <TouchableOpacity
                    className="mt-4 px-6 py-2.5 bg-rose-400 rounded-full"
                    onPress={() => setView('discover')}
                  >
                    <Text className="text-white text-sm font-semibold">Discover Nests</Text>
                  </TouchableOpacity>
                </View>
              ) : debouncedSearch.trim() ? (
                <View className="items-center">
                  <Ionicons name="search-outline" size={48} color="#fda4af" />
                  <Text className="text-base font-semibold text-gray-700 mt-4 text-center">
                    No nests match that search.
                  </Text>
                  <Text className="text-sm text-gray-400 mt-1 text-center">
                    Try a different word or clear your search.
                  </Text>
                  <TouchableOpacity
                    className="mt-4 px-6 py-2.5 bg-rose-100 rounded-full"
                    onPress={() => setSearchQuery('')}
                  >
                    <Text className="text-rose-600 text-sm font-semibold">Clear Search</Text>
                  </TouchableOpacity>
                </View>
              ) : categoryFilter !== 'all' ? (
                <View className="items-center">
                  <Ionicons name="folder-open-outline" size={48} color="#fda4af" />
                  <Text className="text-base font-semibold text-gray-700 mt-4 text-center">
                    No nests in this category yet.
                  </Text>
                  <Text className="text-sm text-gray-400 mt-1 text-center">
                    Be the first to create one.
                  </Text>
                </View>
              ) : (
                <View className="items-center">
                  <Ionicons name="people-outline" size={48} color="#fda4af" />
                  <Text className="text-base font-semibold text-gray-700 mt-4 text-center">
                    No nests yet.
                  </Text>
                  <Text className="text-sm text-gray-400 mt-1 text-center">
                    Create the first nest for your community.
                  </Text>
                </View>
              )}
            </View>
          }
        />
      )}

      {mutationError && (
        <View className="absolute bottom-24 left-4 right-4 bg-rose-500 rounded-xl px-4 py-3">
          <Text className="text-white text-sm text-center">{mutationError}</Text>
        </View>
      )}

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-rose-400 rounded-full items-center justify-center shadow-md"
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <CreateNestModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />
    </SafeAreaView>
  );
}
