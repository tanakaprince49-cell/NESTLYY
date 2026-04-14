import React, { useEffect, useRef, useState } from 'react';
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
import type { UploadTask } from 'firebase/storage';
import { createPost } from '@nestly/shared';
import { validatePost } from '../../utils/postValidation';
import { validateMedia } from '../../utils/mediaValidation';
import { mergeUploadResults } from '../../utils/uploadRetry';
import {
  pickMedia,
  uploadMediaToStorage,
  type PickedMedia,
} from '../../services/villageMediaService';
import type { NestMedia } from '@nestly/shared';

const MAX_MEDIA = 4;
const SLOW_UPLOAD_THRESHOLD_MS = 20_000;

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
  const [slowUpload, setSlowUpload] = useState(false);
  const pendingRef = useRef(false);
  const [sending, setSending] = useState(false);
  const tasksRef = useRef<UploadTask[]>([]);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const clearSlowTimer = () => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
  };

  const cancelUpload = () => {
    cancelledRef.current = true;
    for (const task of tasksRef.current) {
      try {
        task.cancel();
      } catch {
        // Task may already be in a terminal state; ignore.
      }
    }
    tasksRef.current = [];
    clearSlowTimer();
    setSlowUpload(false);
    setUploadProgress([]);
    setUploading(false);
    setSending(false);
    pendingRef.current = false;
  };

  // Unmount cleanup: if the composer unmounts while an upload is in flight
  // (e.g. user navigates away), cancel pending storage tasks and kill the
  // slow-upload timer so no setState fires on an unmounted component.
  useEffect(() => {
    return () => {
      clearSlowTimer();
      for (const task of tasksRef.current) {
        try {
          task.cancel();
        } catch {
          // Task may already be in a terminal state; ignore.
        }
      }
      tasksRef.current = [];
    };
  }, []);

  const handleAttach = async () => {
    if (disabled || media.length >= MAX_MEDIA) return;
    const picked = await pickMedia({ maxCount: MAX_MEDIA - media.length });
    if (picked.length === 0) return;
    const accepted: PickedMedia[] = [];
    let firstReason: string | null = null;
    for (const asset of picked) {
      const check = validateMedia({
        type: asset.type,
        fileSize: asset.size,
        durationMs: asset.duration,
      });
      if (check.ok) accepted.push(asset);
      else if (!firstReason && check.reason) firstReason = check.reason;
    }
    if (firstReason) onError(firstReason);
    if (accepted.length > 0) {
      setMedia((prev) => [...prev, ...accepted].slice(0, MAX_MEDIA));
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const { ok, trimmed } = validatePost(text, media.length);
    if (!ok || pendingRef.current || disabled) return;
    pendingRef.current = true;
    cancelledRef.current = false;
    tasksRef.current = [];
    setSending(true);
    setUploading(media.length > 0);
    setSlowUpload(false);

    const tempKey = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const initialProgress = media.map(() => 0);
    setUploadProgress(initialProgress);

    if (media.length > 0) {
      slowTimerRef.current = setTimeout(() => {
        setSlowUpload(true);
      }, SLOW_UPLOAD_THRESHOLD_MS);
    }

    const settled = await Promise.allSettled(
      media.map((asset, idx) => {
        if (asset.uploaded) {
          return Promise.resolve<NestMedia>(asset.uploaded);
        }
        return uploadMediaToStorage({
          nestId,
          authorUid,
          tempKey,
          asset,
          onTask: (task) => {
            // Cancel was pressed between this task's creation and its
            // registration: terminate immediately so we don't leave orphan
            // Storage objects in the multi-asset case.
            if (cancelledRef.current) {
              try {
                task.cancel();
              } catch {
                // Already terminal; ignore.
              }
              return;
            }
            tasksRef.current.push(task);
          },
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

    clearSlowTimer();

    if (cancelledRef.current) {
      // cancelUpload already reset state; the resolved/rejected promises
      // here are stale.
      return;
    }

    setSlowUpload(false);

    const anyFailed = settled.some((res) => res.status === 'rejected');
    if (anyFailed) {
      // Persist successful uploads back to picked-media state so a Send
      // retry only re-uploads what failed.
      setMedia((prev) => mergeUploadResults(prev, settled));
      onError("Couldn't upload all media. Tap Send again to retry.");
      pendingRef.current = false;
      setSending(false);
      setUploading(false);
      tasksRef.current = [];
      return;
    }

    setUploading(false);

    const uploadedMedia = settled.map((res) => {
      if (res.status === 'fulfilled') return res.value;
      throw new Error('unreachable');
    });

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
      tasksRef.current = [];
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

      {slowUpload && uploading && (
        <View
          className="flex-row items-center bg-rose-50 rounded-xl px-3 py-2 mt-3"
          accessibilityLiveRegion="polite"
        >
          <Text className="flex-1 text-xs text-rose-700">
            Still uploading, this can take a while on slow networks.
          </Text>
          <TouchableOpacity
            onPress={cancelUpload}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Cancel upload"
          >
            <Text className="text-xs font-semibold text-gray-500">Cancel upload</Text>
          </TouchableOpacity>
        </View>
      )}

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
