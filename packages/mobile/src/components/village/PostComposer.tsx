import React, { useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createPost } from '@nestly/shared';
import { validatePost } from '../../utils/postValidation';

interface PostComposerProps {
  nestId: string;
  authorUid: string;
  authorName: string;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function PostComposer({ nestId, authorUid, authorName, onError, disabled }: PostComposerProps) {
  const [text, setText] = useState('');
  const pendingRef = useRef(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const { ok, trimmed } = validatePost(text);
    if (!ok || pendingRef.current || disabled) return;
    pendingRef.current = true;
    setSending(true);
    try {
      await createPost(nestId, {
        content: trimmed,
        authorUid,
        authorName,
      });
      setText('');
    } catch {
      onError("Couldn't post. Check your connection and try again.");
    } finally {
      pendingRef.current = false;
      setSending(false);
    }
  };

  const isEmpty = validatePost(text).ok === false;

  return (
    <View className="flex-row items-end bg-white rounded-2xl px-4 py-3 mx-4 mt-3">
      <TextInput
        className="flex-1 text-sm text-gray-800 mr-3"
        placeholder="Share with the nest..."
        placeholderTextColor="#9ca3af"
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
        editable={!disabled}
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
  );
}
