import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { timeAgo, toggleCommentLike } from '@nestly/shared';
import type { NestComment } from '@nestly/shared';

interface CommentItemProps {
  comment: NestComment;
  nestId: string;
  postId: string;
  currentUserUid: string;
  onReply: (commentId: string, authorName: string) => void;
  onDelete: (commentId: string) => void;
  depth?: number;
  isReply?: boolean;
}

function CommentAvatar({ name, profilePicture, size = 28 }: { name: string; profilePicture?: string; size?: number }) {
  const [fallback, setFallback] = useState(false);
  const initial = name.charAt(0).toUpperCase();
  if (profilePicture && !fallback) {
    return (
      <Image
        source={{ uri: profilePicture }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setFallback(true)}
      />
    );
  }
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
      <Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: '700' }}>{initial}</Text>
    </View>
  );
}

export function CommentItem({
  comment,
  nestId,
  postId,
  currentUserUid,
  onReply,
  onDelete,
  depth = 0,
  isReply = false,
}: CommentItemProps) {
  const isLikedFromProp = comment.likedBy.includes(currentUserUid);
  const [optimisticLiked, setOptimisticLiked] = useState(isLikedFromProp);
  const [optimisticCount, setOptimisticCount] = useState(comment.likeCount);
  const pendingRef = useRef(false);

  useEffect(() => {
    setOptimisticLiked(isLikedFromProp);
    setOptimisticCount(comment.likeCount);
  }, [isLikedFromProp, comment.likeCount]);

  const handleLike = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    const wasLiked = optimisticLiked;
    setOptimisticLiked(!wasLiked);
    setOptimisticCount((c) => c + (wasLiked ? -1 : 1));
    try {
      await toggleCommentLike(nestId, postId, comment.id, currentUserUid);
    } catch {
      setOptimisticLiked(wasLiked);
      setOptimisticCount((c) => c + (wasLiked ? 1 : -1));
    } finally {
      pendingRef.current = false;
    }
  };

  const isOwner = comment.authorUid === currentUserUid;

  return (
    <View style={{ marginLeft: depth > 0 ? 24 : 0 }}>
      <View className="bg-rose-50 rounded-xl p-3 mb-2">
        <View className="flex-row items-center justify-between mb-1.5">
          <View className="flex-row items-center flex-1">
            <View style={{ marginRight: 8 }}>
              <CommentAvatar
                name={comment.authorName}
                profilePicture={comment.authorProfilePicture}
                size={28}
              />
            </View>
            <Text className="text-xs font-semibold text-gray-800 mr-2">{comment.authorName}</Text>
            <Text className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</Text>
          </View>
          {isOwner && (
            <TouchableOpacity
              onPress={() => onDelete(comment.id)}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              accessibilityLabel="Delete comment"
            >
              <Ionicons name="trash-outline" size={14} color="#fda4af" />
            </TouchableOpacity>
          )}
        </View>

        <Text className="text-sm text-gray-700 leading-5 mb-2">{comment.content}</Text>

        <View className="flex-row items-center">
          <TouchableOpacity
            className="flex-row items-center mr-4"
            onPress={handleLike}
            accessibilityLabel={optimisticLiked ? 'Unlike comment' : 'Like comment'}
            accessibilityState={{ selected: optimisticLiked }}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={optimisticLiked ? 'heart' : 'heart-outline'}
              size={14}
              color={optimisticLiked ? '#fb7185' : '#9ca3af'}
            />
            <Text className={`text-xs ml-1 font-semibold ${optimisticLiked ? 'text-rose-400' : 'text-gray-400'}`}>
              {optimisticCount}
            </Text>
          </TouchableOpacity>
          {!isReply && (
            <TouchableOpacity
              onPress={() => onReply(comment.id, comment.authorName)}
              accessibilityLabel={`Reply to ${comment.authorName}`}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-gray-400">Reply</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {comment.replies && comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          nestId={nestId}
          postId={postId}
          currentUserUid={currentUserUid}
          onReply={onReply}
          onDelete={onDelete}
          depth={depth + 1}
          isReply={true}
        />
      ))}
    </View>
  );
}
