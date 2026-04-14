import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDoc, doc } from 'firebase/firestore';
import { db, joinNest, leaveNest, deleteNest } from '@nestly/shared';
import { useAuthStore } from '@nestly/shared/stores';
import type { Nest } from '@nestly/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VillageStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<VillageStackParamList, 'NestDetail'>;

export function NestDetailScreen({ route, navigation }: Props) {
  const { nestId } = route.params;
  const { userUid } = useAuthStore();

  const [nest, setNest] = useState<Nest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [pending, setPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'nests', nestId));
        if (cancelled) return;
        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const d = snap.data();
        const loaded: Nest = {
          id: snap.id,
          name: d.name ?? '',
          description: d.description ?? '',
          category: d.category ?? 'general',
          emoji: d.emoji ?? '🌸',
          memberCount: d.memberCount ?? 0,
          isTemplate: d.isTemplate ?? false,
          createdAt: typeof d.createdAt?.toMillis === 'function' ? d.createdAt.toMillis() : (d.createdAt ?? 0),
          creatorUid: d.creatorUid ?? null,
        };
        setNest(loaded);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (userUid) {
      const membershipId = `${userUid}_${nestId}`;
      getDoc(doc(db, 'memberships', membershipId))
        .then((snap) => { if (!cancelled) setIsJoined(snap.exists()); })
        .catch(() => {});
    }

    load();
    return () => { cancelled = true; };
  }, [nestId, userUid]);

  const handleJoin = useCallback(async () => {
    if (!userUid || pending) return;
    setPending(true);
    setMutationError(null);
    try {
      await joinNest(nestId, userUid);
      setIsJoined(true);
      setNest((prev) => prev ? { ...prev, memberCount: prev.memberCount + 1 } : prev);
    } catch {
      setMutationError("Couldn't join nest. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }, [nestId, userUid, pending]);

  const handleLeave = useCallback(async () => {
    if (!userUid || pending) return;
    setPending(true);
    setMutationError(null);
    try {
      await leaveNest(nestId, userUid);
      setIsJoined(false);
      setNest((prev) => prev ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) } : prev);
    } catch {
      setMutationError("Couldn't leave nest. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }, [nestId, userUid, pending]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Nest',
      'This will permanently delete this nest, all its posts, and all memberships. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setPending(true);
            setMutationError(null);
            try {
              await deleteNest(nestId);
              navigation.goBack();
            } catch {
              setMutationError("Couldn't delete nest. Check your connection and try again.");
              setPending(false);
            }
          },
        },
      ],
    );
  }, [nestId, navigation]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-rose-50 items-center justify-center">
        <ActivityIndicator size="large" color="#f43f5e" />
      </SafeAreaView>
    );
  }

  if (notFound || !nest) {
    return (
      <SafeAreaView className="flex-1 bg-rose-50 items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#fda4af" />
        <Text className="text-base font-semibold text-gray-700 mt-4 text-center">
          This nest could not be found.
        </Text>
        <Text className="text-sm text-gray-400 mt-1 text-center">
          It may have been deleted.
        </Text>
        <TouchableOpacity
          className="mt-4 px-6 py-2.5 bg-rose-100 rounded-full"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-rose-600 text-sm font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCreator = userUid !== null && nest.creatorUid === userUid;

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="bg-white mx-4 mt-4 rounded-3xl p-6">
          <View className="items-center mb-4">
            <Text className="text-6xl mb-3">{nest.emoji}</Text>
            <Text className="text-xl font-bold text-gray-800 text-center">{nest.name}</Text>
            <Text className="text-xs text-rose-500 capitalize mt-1">{nest.category}</Text>
          </View>

          <Text className="text-sm text-gray-600 leading-6 text-center mb-4">
            {nest.description}
          </Text>

          <View className="flex-row items-center justify-center mb-5">
            <Ionicons name="people-outline" size={16} color="#9ca3af" />
            <Text className="text-sm text-gray-400 ml-1">
              {nest.memberCount} {nest.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>

          {userUid ? (
            <TouchableOpacity
              className={`py-3 rounded-full items-center ${isJoined ? 'bg-rose-100' : 'bg-rose-400'}`}
              onPress={isJoined ? handleLeave : handleJoin}
              disabled={pending}
              activeOpacity={0.8}
            >
              {pending ? (
                <ActivityIndicator size="small" color={isJoined ? '#f43f5e' : '#fff'} />
              ) : (
                <Text className={`font-semibold ${isJoined ? 'text-rose-600' : 'text-white'}`}>
                  {isJoined ? 'Leave Nest' : 'Join Nest'}
                </Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        <View className="bg-rose-100 mx-4 mt-4 rounded-2xl p-4 flex-row items-start">
          <Ionicons name="information-circle-outline" size={20} color="#f43f5e" />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-rose-700 mb-1">Posts coming soon</Text>
            <Text className="text-sm text-rose-600 leading-5">
              The posts feed for this nest is on its way in a future update. For now you can join, explore the community, and check back soon.
            </Text>
          </View>
        </View>

        {isCreator && (
          <TouchableOpacity
            className="mx-4 mt-4 py-3 bg-white rounded-2xl items-center flex-row justify-center"
            onPress={handleDelete}
            disabled={pending}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="#f43f5e" />
            <Text className="text-rose-500 font-semibold ml-2">Delete Nest</Text>
          </TouchableOpacity>
        )}

        {mutationError && (
          <View className="mx-4 mt-4 bg-rose-500 rounded-xl px-4 py-3">
            <Text className="text-white text-sm text-center">{mutationError}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
