import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
}

export function CommentItem({
  comment,
  nestId,
  postId,
  currentUserUid,
  onReply,
  onDelete,
  depth = 0,
}: CommentItemProps) {
  const isLikedFromProp = comment.likedBy.includes(currentUserUid);
  const [optimisticLiked, setOptimisticLiked] = useState(isLikedFromProp);
  const [optimisticCount, setOptimisticCount] = useState(comment.likeCount);

  useEffect(() => {
    setOptimisticLiked(isLikedFromProp);
    setOptimisticCount(comment.likeCount);
  }, [isLikedFromProp, comment.likeCount]);

  const handleLike = async () => {
    const wasLiked = optimisticLiked;
    setOptimisticLiked(!wasLiked);
    setOptimisticCount((c) => c + (wasLiked ? -1 : 1));
    try {
      await toggleCommentLike(nestId, postId, comment.id, currentUserUid);
    } catch {
      setOptimisticLiked(wasLiked);
      setOptimisticCount((c) => c + (wasLiked ? 1 : -1));
    }
  };

  const initial = comment.authorName.charAt(0).toUpperCase();
  const isOwner = comment.authorUid === currentUserUid;

  return (
    <View style={{ marginLeft: depth > 0 ? 24 : 0 }}>
      <View className="bg-rose-50 rounded-xl p-3 mb-2">
        <View className="flex-row items-center justify-between mb-1.5">
          <View className="flex-row items-center flex-1">
            <View className="w-7 h-7 rounded-full bg-rose-400 items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">{initial}</Text>
            </View>
            <Text className="text-xs font-semibold text-gray-800 mr-2">{comment.authorName}</Text>
            <Text className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</Text>
          </View>
          {isOwner && (
            <TouchableOpacity
              onPress={() => onDelete(comment.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
          <TouchableOpacity
            onPress={() => onReply(comment.id, comment.authorName)}
            accessibilityLabel={`Reply to ${comment.authorName}`}
            activeOpacity={0.7}
          >
            <Text className="text-xs font-semibold text-gray-400">Reply</Text>
          </TouchableOpacity>
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
        />
      ))}
    </View>
  );
}
