import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createPost } from '@nestly/shared';
import { validatePost } from '../../utils/postValidation';
import {
  pickMedia,
  uploadMediaToStorage,
  type PickedMedia,
} from '../../services/villageMediaService';
import type { NestMedia } from '@nestly/shared';

const MAX_MEDIA = 4;

interface PostComposerProps {
  nestId: string;
  authorUid: string;
  authorName: string;
  authorProfilePicture?: string;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function PostComposer({
  nestId,
  authorUid,
  authorName,
  authorProfilePicture,
  onError,
  disabled,
}: PostComposerProps) {
  const [text, setText] = useState('');
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const pendingRef = useRef(false);
  const [sending, setSending] = useState(false);

  const handleAttach = async () => {
    if (disabled || media.length >= MAX_MEDIA) return;
    const picked = await pickMedia({ maxCount: MAX_MEDIA - media.length });
    if (picked.length === 0) return;
    setMedia((prev) => [...prev, ...picked].slice(0, MAX_MEDIA));
  };

  const handleRemoveMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const { ok, trimmed } = validatePost(text, media.length);
    if (!ok || pendingRef.current || disabled) return;
    pendingRef.current = true;
    setSending(true);
    setUploading(media.length > 0);

    const tempKey = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const initialProgress = media.map(() => 0);
    setUploadProgress(initialProgress);

    let uploadedMedia: NestMedia[] = [];
    try {
      uploadedMedia = await Promise.all(
        media.map((asset, idx) => {
          if (asset.uploadedUrl) {
            return Promise.resolve<NestMedia>({
              id: `${idx}`,
              type: asset.type,
              url: asset.uploadedUrl,
              thumbnail: asset.thumbnailUrl,
              filename: asset.filename,
              size: asset.size,
            });
          }
          return uploadMediaToStorage({
            nestId,
            authorUid,
            tempKey,
            asset,
            onProgress: (p) => {
              setUploadProgress((prev) => {
                const next = [...prev];
                next[idx] = p;
                return next;
              });
            },
          });
        }),
      );
    } catch {
      onError("Couldn't upload. Check your connection.");
      pendingRef.current = false;
      setSending(false);
      setUploading(false);
      return;
    }

    setUploading(false);

    try {
      await createPost(nestId, {
        content: trimmed,
        authorUid,
        authorName,
        ...(authorProfilePicture ? { authorProfilePicture } : {}),
        media: uploadedMedia,
      });
      setText('');
      setMedia([]);
      setUploadProgress([]);
    } catch {
      onError("Couldn't post. Try again.");
    } finally {
      pendingRef.current = false;
      setSending(false);
    }
  };

  const isEmpty = !validatePost(text, media.length).ok;
  const atMediaLimit = media.length >= MAX_MEDIA;

  return (
    <View className="bg-white rounded-2xl px-4 py-3 mx-4 mt-3">
      <View className="flex-row items-end">
        <TouchableOpacity
          onPress={handleAttach}
          disabled={atMediaLimit || disabled || sending}
          accessibilityLabel="Attach photo or video"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ opacity: atMediaLimit || disabled || sending ? 0.3 : 1, marginRight: 10 }}
        >
          <Ionicons name="image-outline" size={24} color="#fb7185" />
        </TouchableOpacity>
        <TextInput
          className="flex-1 text-sm text-gray-800 mr-3"
          placeholder="Share with the nest..."
          placeholderTextColor="#9ca3af"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          editable={!disabled && !sending}
          accessibilityLabel="Post composer"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={isEmpty || sending || disabled}
          activeOpacity={0.7}
          accessibilityLabel="Send post"
          style={{ opacity: isEmpty || sending || disabled ? 0.3 : 1 }}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fb7185" />
          ) : (
            <Ionicons name="send" size={22} color="#fb7185" />
          )}
        </TouchableOpacity>
      </View>

      {media.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, gap: 8 }}
        >
          {media.map((item, idx) => (
            <View key={idx} style={{ width: 72, height: 72 }}>
              <Image
                source={{ uri: item.uri }}
                style={{ width: 72, height: 72, borderRadius: 8 }}
                resizeMode="cover"
              />
              {item.type === 'video' && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    left: 4,
                    right: 4,
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="play-circle" size={24} color="rgba(255,255,255,0.9)" />
                </View>
              )}
              {uploading && uploadProgress[idx] != null && uploadProgress[idx] < 1 && (
                <View
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                    {Math.round((uploadProgress[idx] ?? 0) * 100)}%
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => handleRemoveMedia(idx)}
                disabled={sending}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                accessibilityLabel="Remove media"
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  backgroundColor: '#f43f5e',
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
