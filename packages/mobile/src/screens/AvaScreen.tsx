import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAvaChatStore, useAuthStore, useProfileStore } from '@nestly/shared/stores';
import type { ChatMessage } from '@nestly/shared';
import { getAvaResponse } from '../services/avaService';

function getStorageKey(email: string | null) {
  const prefix = email || 'anon';
  return `${prefix}_ava_chat_messages`;
}

export function AvaScreen() {
  const { authEmail } = useAuthStore();
  const { profile } = useProfileStore();
  const storageKey = getStorageKey(authEmail);
  const {
    messages,
    isLoading,
    isSpeaking,
    addMessage,
    setLoading,
    setSpeaking,
    clearMessages,
    setMessages,
  } = useAvaChatStore();

  const [input, setInput] = useState('');
  const hydrated = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // FlatList is `inverted` so the item at index 0 renders at the bottom.
  // The store keeps messages chronological (oldest first) because the LLM
  // context and persist slice(-100) depend on that order. Reverse a shallow
  // copy here so the newest message lands at index 0 and appears at the bottom.
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // Cleanup on unmount: cancel in-flight request + stop speech
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      Speech.stop();
    };
  }, []);

  // Hydrate messages from AsyncStorage on mount
  useEffect(() => {
    hydrated.current = false;
    AsyncStorage.getItem(storageKey)
      .then((data) => {
        if (data) {
          try {
            setMessages(JSON.parse(data));
          } catch {
            // Corrupted data, ignore
          }
        }
        hydrated.current = true;
      })
      .catch(() => {
        hydrated.current = true;
      });
  }, [storageKey, setMessages]);

  // Persist messages on change (skip the initial hydration write-back)
  useEffect(() => {
    if (!hydrated.current) return;
    if (messages.length > 0) {
      const toStore = messages.slice(-100);
      AsyncStorage.setItem(storageKey, JSON.stringify(toStore)).catch(() => {});
    }
  }, [messages, storageKey]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || useAvaChatStore.getState().isLoading) return;

    setInput('');
    addMessage({ role: 'user', text });
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const recent = useAvaChatStore.getState().messages;
      const reply = await getAvaResponse(text, recent, controller.signal);
      if (controller.signal.aborted) return;

      addMessage({ role: 'model', text: reply });

      if (useAvaChatStore.getState().isSpeaking) {
        Speech.speak(reply, { language: 'en-US', rate: 1.0, pitch: 1.1 });
      }
    } catch {
      if (!controller.signal.aborted) {
        addMessage({ role: 'model', text: 'Ava is taking a quiet moment. Try again soon.' });
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [input, addMessage, setLoading]);

  const handleClear = useCallback(() => {
    if (useAvaChatStore.getState().messages.length === 0) return;
    Alert.alert('Clear Conversation?', 'This will delete your chat history with Ava.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearMessages();
          AsyncStorage.removeItem(storageKey).catch(() => {});
          Speech.stop();
        },
      },
    ]);
  }, [clearMessages, storageKey]);

  const toggleSpeaking = useCallback(() => {
    if (isSpeaking) {
      Speech.stop();
    }
    setSpeaking(!isSpeaking);
  }, [isSpeaking, setSpeaking]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      return (
        <View className={`flex-row mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && (
            <View className="w-8 h-8 rounded-xl bg-rose-900 items-center justify-center mr-2 mt-1">
              <Ionicons name="sparkles" size={14} color="#fecdd3" />
            </View>
          )}
          <View
            className={`max-w-[75%] px-4 py-3 ${
              isUser
                ? 'bg-rose-900 rounded-2xl rounded-br-none'
                : 'bg-white border border-gray-100 rounded-2xl rounded-bl-none'
            }`}
          >
            <Text className={`text-[15px] leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
              {item.text}
            </Text>
          </View>
        </View>
      );
    },
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-rose-100">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-rose-900 items-center justify-center mr-3">
            <Ionicons name="sparkles" size={20} color="#fecdd3" />
          </View>
          <View>
            <Text className="text-lg font-bold text-gray-900">Ava</Text>
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
              <Text className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Pregnancy Companion
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row" style={{ gap: 8 }}>
          <TouchableOpacity
            onPress={toggleSpeaking}
            className={`w-10 h-10 rounded-xl items-center justify-center ${isSpeaking ? 'bg-rose-100' : 'bg-gray-100'}`}
          >
            <Ionicons
              name={isSpeaking ? 'volume-high' : 'volume-mute'}
              size={20}
              color={isSpeaking ? '#f43f5e' : '#94a3b8'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClear}
            className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center"
          >
            <Ionicons name="trash-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        <FlatList
          data={reversedMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={{ padding: 16 }}
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View style={{ transform: [{ scaleY: -1 }] }}>
              <EmptyState userName={profile?.userName} />
            </View>
          }
          ListHeaderComponent={isLoading ? <TypingIndicator /> : null}
        />

        {/* Input bar */}
        <View className="px-4 py-3 border-t border-rose-100 bg-white/80">
          <View className="flex-row items-end" style={{ gap: 8 }}>
            <View className="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Talk to Ava..."
                placeholderTextColor="#94a3b8"
                className="text-[15px] text-gray-800 max-h-24"
                multiline
                onSubmitEditing={handleSend}
                returnKeyType="send"
                blurOnSubmit
                editable={!isLoading}
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
              className={`w-11 h-11 rounded-xl items-center justify-center ${
                input.trim() && !isLoading ? 'bg-rose-900' : 'bg-gray-200'
              }`}
            >
              <Ionicons name="send" size={18} color={input.trim() && !isLoading ? '#fff' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EmptyState({ userName }: { userName?: string }) {
  return (
    <View className="py-20 items-center">
      <View className="w-20 h-20 rounded-3xl bg-rose-100 items-center justify-center mb-6">
        <Ionicons name="heart" size={40} color="#fda4af" />
      </View>
      <Text className="text-sm text-gray-500 italic text-center px-8">
        Bonjour{userName ? ` ${userName}` : ''}! I'm Ava. How can I support you today?
      </Text>
    </View>
  );
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);
    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row mb-3">
      <View className="w-8 h-8 rounded-xl bg-rose-900 items-center justify-center mr-2">
        <Ionicons name="sparkles" size={14} color="#fecdd3" />
      </View>
      <View className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-5 py-3 flex-row" style={{ gap: 4 }}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            className="w-2 h-2 rounded-full bg-rose-400"
            style={{ transform: [{ translateY: dot }] }}
          />
        ))}
      </View>
    </View>
  );
}
