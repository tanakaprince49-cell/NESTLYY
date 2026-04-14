import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { timeAgo } from '@nestly/shared';
import type { NestPost } from '@nestly/shared';

interface PostCardProps {
  post: NestPost;
  currentUserUid: string;
  onLike: (postId: string) => Promise<void>;
  onToggleComments: (postId: string) => void;
  onDelete: (postId: string) => void;
}

export function PostCard({ post, currentUserUid, onLike, onToggleComments, onDelete }: PostCardProps) {
  const isLikedFromProp = post.likedBy.includes(currentUserUid);
  const [optimisticLiked, setOptimisticLiked] = useState(isLikedFromProp);
  const [optimisticCount, setOptimisticCount] = useState(post.likeCount);

  useEffect(() => {
    setOptimisticLiked(isLikedFromProp);
    setOptimisticCount(post.likeCount);
  }, [isLikedFromProp, post.likeCount]);

  const handleLike = async () => {
    const wasLiked = optimisticLiked;
    setOptimisticLiked(!wasLiked);
    setOptimisticCount((c) => c + (wasLiked ? -1 : 1));
    try {
      await onLike(post.id);
    } catch {
      setOptimisticLiked(wasLiked);
      setOptimisticCount((c) => c + (wasLiked ? 1 : -1));
    }
  };

  const initial = post.authorName.charAt(0).toUpperCase();
  const isOwner = post.authorUid === currentUserUid;

  return (
    <View className="bg-white rounded-2xl mx-4 mb-3 p-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="w-9 h-9 rounded-full bg-rose-400 items-center justify-center mr-3">
            <Text className="text-white text-sm font-bold">{initial}</Text>
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

      <Text className="text-sm text-gray-700 leading-6 mb-3">{post.content}</Text>

      <View className="flex-row items-center pt-3 border-t border-rose-50">
        <TouchableOpacity
          className="flex-row items-center mr-5"
          onPress={handleLike}
          accessibilityLabel={optimisticLiked ? 'Unlike post' : 'Like post'}
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
          className="flex-row items-center"
          onPress={() => onToggleComments(post.id)}
          accessibilityLabel="View comments"
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#9ca3af" />
          <Text className="text-sm ml-1.5 font-semibold text-gray-400">{post.commentCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
