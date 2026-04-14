import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { timeAgo } from '@nestly/shared';
import type { NestPost, NestMedia } from '@nestly/shared';
import { buildMediaLayout } from '../../utils/postLayout';

interface PostCardProps {
  post: NestPost;
  currentUserUid: string;
  onLike: (postId: string) => Promise<void>;
  onToggleComments: (postId: string) => void;
  onDelete: (postId: string) => void;
  onShare?: (post: NestPost) => void;
  onOpenMedia?: (media: NestMedia[], index: number) => void;
}

function InitialsCircle({ name, size = 36 }: { name: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#fb7185',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: '700' }}>
        {initial}
      </Text>
    </View>
  );
}

function AuthorAvatar({ name, profilePicture }: { name: string; profilePicture?: string }) {
  const [fallback, setFallback] = useState(false);
  if (profilePicture && !fallback) {
    return (
      <Image
        source={{ uri: profilePicture }}
        style={{ width: 36, height: 36, borderRadius: 18 }}
        onError={() => setFallback(true)}
      />
    );
  }
  return <InitialsCircle name={name} size={36} />;
}

function MediaGrid({
  media,
  onOpenMedia,
}: {
  media: NestMedia[];
  onOpenMedia?: (media: NestMedia[], index: number) => void;
}) {
  const { width } = useWindowDimensions();
  const cardPadding = 16 + 16 + 16 * 2;
  const availableWidth = width - cardPadding;
  const items = buildMediaLayout(media);

  if (items.length === 0) return null;

  const gap = 4;

  if (items.length === 1) {
    const item = items[0];
    const originalIndex = 0;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onOpenMedia?.(media, originalIndex)}
        accessibilityLabel="View media"
        style={{ marginTop: 10 }}
      >
        <Image
          source={{ uri: item.uri }}
          style={{ width: availableWidth, height: availableWidth, borderRadius: 12 }}
          resizeMode="cover"
        />
        {item.isVideo && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (items.length === 2) {
    const tileSize = (availableWidth - gap) / 2;
    return (
      <View style={{ flexDirection: 'row', gap, marginTop: 10 }}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.9}
            onPress={() => onOpenMedia?.(media, i)}
            accessibilityLabel="View media"
          >
            <Image
              source={{ uri: item.uri }}
              style={{ width: tileSize, height: tileSize, borderRadius: 10 }}
              resizeMode="cover"
            />
            {item.isVideo && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (items.length === 3) {
    const leftWidth = (availableWidth - gap) * 0.55;
    const rightWidth = availableWidth - leftWidth - gap;
    const leftHeight = leftWidth * (3 / 2);
    const rightTileHeight = (leftHeight - gap) / 2;
    return (
      <View style={{ flexDirection: 'row', gap, marginTop: 10 }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onOpenMedia?.(media, 0)}
          accessibilityLabel="View media"
        >
          <Image
            source={{ uri: items[0].uri }}
            style={{ width: leftWidth, height: leftHeight, borderRadius: 10 }}
            resizeMode="cover"
          />
          {items[0].isVideo && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
            </View>
          )}
        </TouchableOpacity>
        <View style={{ flexDirection: 'column', gap }}>
          {[1, 2].map((idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.9}
              onPress={() => onOpenMedia?.(media, idx)}
              accessibilityLabel="View media"
            >
              <Image
                source={{ uri: items[idx].uri }}
                style={{ width: rightWidth, height: rightTileHeight, borderRadius: 10 }}
                resizeMode="cover"
              />
              {items[idx].isVideo && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  const tileSize = (availableWidth - gap) / 2;
  return (
    <View style={{ gap, marginTop: 10 }}>
      <View style={{ flexDirection: 'row', gap }}>
        {[0, 1].map((idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.9}
            onPress={() => onOpenMedia?.(media, idx)}
            accessibilityLabel="View media"
          >
            <Image
              source={{ uri: items[idx].uri }}
              style={{ width: tileSize, height: tileSize, borderRadius: 10 }}
              resizeMode="cover"
            />
            {items[idx].isVideo && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap }}>
        {[2, 3].map((idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.9}
            onPress={() => onOpenMedia?.(media, idx)}
            accessibilityLabel="View media"
          >
            <Image
              source={{ uri: items[idx].uri }}
              style={{ width: tileSize, height: tileSize, borderRadius: 10 }}
              resizeMode="cover"
            />
            {items[idx].isVideo && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function PostCard({
  post,
  currentUserUid,
  onLike,
  onToggleComments,
  onDelete,
  onShare,
  onOpenMedia,
}: PostCardProps) {
  const isLikedFromProp = post.likedBy.includes(currentUserUid);
  const [optimisticLiked, setOptimisticLiked] = useState(isLikedFromProp);
  const [optimisticCount, setOptimisticCount] = useState(post.likeCount);
  const pendingRef = useRef(false);

  useEffect(() => {
    setOptimisticLiked(isLikedFromProp);
    setOptimisticCount(post.likeCount);
  }, [isLikedFromProp, post.likeCount]);

  const handleLike = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    const wasLiked = optimisticLiked;
    setOptimisticLiked(!wasLiked);
    setOptimisticCount((c) => c + (wasLiked ? -1 : 1));
    try {
      await onLike(post.id);
    } catch {
      setOptimisticLiked(wasLiked);
      setOptimisticCount((c) => c + (wasLiked ? 1 : -1));
    } finally {
      pendingRef.current = false;
    }
  };

  const isOwner = post.authorUid === currentUserUid;

  return (
    <View className="bg-white rounded-2xl mx-4 mb-3 p-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View style={{ marginRight: 12 }}>
            <AuthorAvatar name={post.authorName} profilePicture={post.authorProfilePicture} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
              {post.authorName}
            </Text>
            <Text className="text-xs text-gray-400">{timeAgo(post.createdAt)}</Text>
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity
            onPress={() => onDelete(post.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Delete post"
          >
            <Ionicons name="trash-outline" size={18} color="#fda4af" />
          </TouchableOpacity>
        )}
      </View>

      {post.content ? (
        <Text className="text-sm text-gray-700 leading-6 mb-3">{post.content}</Text>
      ) : null}

      {post.media && post.media.length > 0 && (
        <MediaGrid media={post.media} onOpenMedia={onOpenMedia} />
      )}

      <View
        className="flex-row items-center pt-3 border-t border-rose-50"
        style={{ marginTop: post.media && post.media.length > 0 ? 10 : 0 }}
      >
        <TouchableOpacity
          className="flex-row items-center mr-5"
          onPress={handleLike}
          accessibilityLabel={optimisticLiked ? 'Unlike post' : 'Like post'}
          accessibilityState={{ selected: optimisticLiked }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={optimisticLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={optimisticLiked ? '#fb7185' : '#9ca3af'}
          />
          <Text className={`text-sm ml-1.5 font-semibold ${optimisticLiked ? 'text-rose-400' : 'text-gray-400'}`}>
            {optimisticCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center mr-5"
          onPress={() => onToggleComments(post.id)}
          accessibilityLabel="View comments"
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#9ca3af" />
          <Text className="text-sm ml-1.5 font-semibold text-gray-400">{post.commentCount}</Text>
        </TouchableOpacity>
        {onShare && (
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => onShare(post)}
            accessibilityLabel="Repost"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-redo-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
