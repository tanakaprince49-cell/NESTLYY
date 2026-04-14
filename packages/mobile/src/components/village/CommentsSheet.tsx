import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import {
  subscribeToPostComments,
  createComment,
  deleteComment,
  type Unsubscribe,
} from '@nestly/shared';
import type { NestComment } from '@nestly/shared';
import { organizeComments } from '../../utils/commentTree';
import { CommentItem } from './CommentItem';
import { ErrorBanner } from './ErrorBanner';

interface CommentsSheetProps {
  nestId: string;
  postId: string | null;
  authorUid: string;
  authorName: string;
  onClose: () => void;
}

export function CommentsSheet({ nestId, postId, authorUid, authorName, onClose }: CommentsSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%'], []);

  const [comments, setComments] = useState<NestComment[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (postId) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [postId]);

  useEffect(() => {
    if (!postId) {
      setComments([]);
      setText('');
      setReplyTo(null);
      return;
    }
    const unsub: Unsubscribe = subscribeToPostComments(nestId, postId, (data) => {
      setComments(data);
    });
    return () => unsub();
  }, [nestId, postId]);

  const organized = useMemo(() => organizeComments(comments), [comments]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !postId || pendingRef.current) return;
    pendingRef.current = true;
    try {
      await createComment(nestId, postId, {
        content: trimmed,
        authorUid,
        authorName,
        replyTo: replyTo?.id,
      });
      setText('');
      setReplyTo(null);
    } catch {
      setError("Couldn't post comment. Check your connection and try again.");
    } finally {
      pendingRef.current = false;
    }
  }, [nestId, postId, authorUid, authorName, text, replyTo]);

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (!postId) return;
      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteComment(nestId, postId, commentId);
              } catch {
                setError("Couldn't delete comment. Check your connection and try again.");
              }
            },
          },
        ],
      );
    },
    [nestId, postId],
  );

  const handleReply = useCallback((commentId: string, replyName: string) => {
    setReplyTo({ id: commentId, name: replyName });
  }, []);

  if (!postId) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      index={0}
    >
      <BottomSheetView style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between px-4 pb-3 border-b border-rose-50">
          <Text className="text-base font-semibold text-gray-800">Comments</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close comments"
          >
            <Ionicons name="close" size={22} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {error && (
          <View className="mx-4 mt-2">
            <ErrorBanner message={error} onDismiss={() => setError(null)} inline />
          </View>
        )}

        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {organized.length === 0 ? (
            <Text className="text-sm text-gray-400 text-center py-8">
              No replies yet. Be the first.
            </Text>
          ) : (
            organized.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                nestId={nestId}
                postId={postId}
                currentUserUid={authorUid}
                onReply={handleReply}
                onDelete={handleDeleteComment}
              />
            ))
          )}
        </ScrollView>

        <View className="px-4 pb-4 pt-2 border-t border-rose-50">
          {replyTo && (
            <View className="flex-row items-center bg-rose-50 rounded-lg px-3 py-2 mb-2">
              <Text className="flex-1 text-xs text-rose-700">
                Replying to {replyTo.name}
              </Text>
              <TouchableOpacity
                onPress={() => setReplyTo(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Clear reply"
              >
                <Ionicons name="close" size={14} color="#fb7185" />
              </TouchableOpacity>
            </View>
          )}
          <View className="flex-row items-center bg-rose-50 rounded-xl px-3 py-2">
            <BottomSheetTextInput
              style={{ flex: 1, fontSize: 14, color: '#1f2937', maxHeight: 80 }}
              placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
              placeholderTextColor="#9ca3af"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
              accessibilityLabel="Comment input"
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim()}
              style={{ opacity: text.trim() ? 1 : 0.3 }}
              activeOpacity={0.7}
              accessibilityLabel="Send comment"
            >
              <Ionicons name="send" size={20} color="#fb7185" />
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
