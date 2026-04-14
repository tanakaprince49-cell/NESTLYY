import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sharePost, timeAgo } from '@nestly/shared';
import type { NestPost } from '@nestly/shared';
import { ErrorBanner } from './ErrorBanner';

interface ShareModalProps {
  nestId: string;
  post: NestPost | null;
  sharerUid: string;
  sharerName: string;
  onClose: () => void;
}

export function ShareModal({ nestId, post, sharerUid, sharerName, onClose }: ShareModalProps) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const pendingRef = useRef(false);

  const handleShare = async () => {
    if (!post || pendingRef.current) return;
    pendingRef.current = true;
    setSharing(true);
    setError(null);
    try {
      await sharePost(nestId, post.id, sharerUid, sharerName, message.trim() || undefined);
      onClose();
    } catch {
      setError("Couldn't repost. Check your connection and try again.");
    } finally {
      pendingRef.current = false;
      setSharing(false);
    }
  };

  if (!post) return null;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 16,
            paddingTop: 20,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-semibold text-gray-800">Repost</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {error && (
            <View className="mb-3">
              <ErrorBanner message={error} onDismiss={() => setError(null)} inline />
            </View>
          )}

          <TextInput
            className="bg-rose-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-3"
            placeholder="Add a thought..."
            placeholderTextColor="#9ca3af"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            editable={!sharing}
            accessibilityLabel="Repost message"
          />

          <View
            style={{
              borderWidth: 1,
              borderColor: '#fda4af',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              opacity: 0.8,
            }}
          >
            <Text className="text-xs text-rose-500 font-semibold mb-1">
              Originally shared by {post.authorName}
            </Text>
            <ScrollView style={{ maxHeight: 80 }} showsVerticalScrollIndicator={false}>
              <Text className="text-sm text-gray-600 leading-5" numberOfLines={4}>
                {post.content}
              </Text>
            </ScrollView>
            <Text className="text-xs text-gray-400 mt-1">{timeAgo(post.createdAt)}</Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-3 border border-rose-200 rounded-full items-center"
              onPress={onClose}
              disabled={sharing}
              activeOpacity={0.7}
              accessibilityLabel="Cancel repost"
            >
              <Text className="text-rose-500 font-semibold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 bg-rose-400 rounded-full items-center"
              onPress={handleShare}
              disabled={sharing}
              activeOpacity={0.7}
              accessibilityLabel="Confirm repost"
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-sm">Repost</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
