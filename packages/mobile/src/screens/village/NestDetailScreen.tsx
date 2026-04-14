import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import {
  subscribeToNest,
  subscribeToNestPosts,
  getUserMembership,
  joinNest,
  leaveNest,
  deleteNest,
  deletePost,
  toggleLike,
  type Unsubscribe,
} from '@nestly/shared';
import { useAuthStore } from '@nestly/shared/stores';
import { useProfileStore } from '@nestly/shared/stores';
import type { Nest, NestPost, NestMedia } from '@nestly/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VillageStackParamList } from '../../navigation/types';

import { ErrorBanner } from '../../components/village/ErrorBanner';
import { PostComposer } from '../../components/village/PostComposer';
import { PostCard } from '../../components/village/PostCard';
import { CommentsSheet } from '../../components/village/CommentsSheet';
import { MediaViewerModal } from '../../components/village/MediaViewerModal';

type Props = NativeStackScreenProps<VillageStackParamList, 'NestDetail'>;

export function NestDetailScreen({ route, navigation }: Props) {
  const { nestId } = route.params;
  const { userUid } = useAuthStore();
  const { profile } = useProfileStore();

  const [nest, setNest] = useState<Nest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [pending, setPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [posts, setPosts] = useState<NestPost[]>([]);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [viewerState, setViewerState] = useState<{ media: NestMedia[]; index: number } | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    setNest(null);
    setNotFound(false);
    setLoading(true);
    setIsJoined(false);
    let firstEmission = true;
    const unsub: Unsubscribe = subscribeToNest(nestId, (loaded) => {
      if (firstEmission) {
        firstEmission = false;
        setLoading(false);
      }
      if (!loaded) {
        setNotFound(true);
        return;
      }
      setNest(loaded);
    });
    return () => unsub();
  }, [nestId]);

  useEffect(() => {
    if (!userUid) return;
    getUserMembership(userUid, nestId)
      .then((joined) => setIsJoined(joined))
      .catch(() => {});
  }, [userUid, nestId]);

  useEffect(() => {
    if (notFound) return;
    const unsub: Unsubscribe = subscribeToNestPosts(nestId, (data) => {
      setPosts(data);
    });
    return () => unsub();
  }, [nestId, notFound]);

  const setPendingBoth = (value: boolean) => {
    pendingRef.current = value;
    setPending(value);
  };

  const handleJoin = useCallback(async () => {
    if (!userUid || pendingRef.current) return;
    setPendingBoth(true);
    setMutationError(null);
    try {
      await joinNest(nestId, userUid);
      setIsJoined(true);
      setNest((prev) => prev ? { ...prev, memberCount: prev.memberCount + 1 } : prev);
    } catch {
      setMutationError("Couldn't join nest. Check your connection and try again.");
    } finally {
      setPendingBoth(false);
    }
  }, [nestId, userUid]);

  const handleLeave = useCallback(async () => {
    if (!userUid || pendingRef.current) return;
    setPendingBoth(true);
    setMutationError(null);
    try {
      await leaveNest(nestId, userUid);
      setIsJoined(false);
      setNest((prev) => prev ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) } : prev);
    } catch {
      setMutationError("Couldn't leave nest. Check your connection and try again.");
    } finally {
      setPendingBoth(false);
    }
  }, [nestId, userUid]);

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
            setPendingBoth(true);
            setMutationError(null);
            try {
              await deleteNest(nestId);
              navigation.goBack();
            } catch {
              setMutationError("Couldn't delete nest. Check your connection and try again.");
              setPendingBoth(false);
            }
          },
        },
      ],
    );
  }, [nestId, navigation]);

  const handleLike = useCallback(async (postId: string) => {
    if (!userUid) return;
    await toggleLike(nestId, postId, userUid);
  }, [nestId, userUid]);

  const handleDeletePost = useCallback((postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(nestId, postId);
            } catch {
              setMutationError("Couldn't delete post. Check your connection and try again.");
            }
          },
        },
      ],
    );
  }, [nestId]);

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
  const authorName = profile?.userName || 'Anonymous';

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

        {isJoined && userUid ? (
          <PostComposer
            nestId={nestId}
            authorUid={userUid}
            authorName={authorName}
            authorProfilePicture={profile?.profileImage ?? undefined}
            onError={(msg) => setMutationError(msg)}
          />
        ) : (
          <View className="bg-rose-50 mx-4 mt-3 rounded-2xl p-4 items-center">
            <Text className="text-sm font-semibold text-rose-700 mb-1">
              Join to post and comment.
            </Text>
            <Text className="text-sm text-rose-600 text-center leading-5 mb-3">
              Posts and comments are for members only.
            </Text>
            {userUid ? (
              <TouchableOpacity
                className="px-6 py-2.5 bg-rose-400 rounded-full"
                onPress={handleJoin}
                disabled={pending}
                activeOpacity={0.8}
              >
                {pending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-sm font-semibold">Join Nest</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {posts.length === 0 ? (
          <View className="items-center py-12 px-8">
            <Ionicons name="chatbubble-outline" size={40} color="#fda4af" />
            <Text className="text-sm text-gray-400 mt-3 text-center">
              No posts yet. Be the first to share!
            </Text>
          </View>
        ) : (
          <View className="mt-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserUid={userUid ?? ''}
                onLike={handleLike}
                onToggleComments={(postId) => setOpenCommentsPostId(postId)}
                onDelete={handleDeletePost}
                onOpenMedia={(media, index) => setViewerState({ media, index })}
              />
            ))}
          </View>
        )}

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
          <View className="mx-4 mt-4">
            <ErrorBanner message={mutationError} onDismiss={() => setMutationError(null)} inline />
          </View>
        )}
      </ScrollView>

      {openCommentsPostId && userUid && (
        <CommentsSheet
          nestId={nestId}
          postId={openCommentsPostId}
          authorUid={userUid}
          authorName={authorName}
          authorProfilePicture={profile?.profileImage ?? undefined}
          onClose={() => setOpenCommentsPostId(null)}
        />
      )}

      {viewerState && (
        <MediaViewerModal
          media={viewerState.media}
          index={viewerState.index}
          onClose={() => setViewerState(null)}
        />
      )}
    </SafeAreaView>
  );
}
