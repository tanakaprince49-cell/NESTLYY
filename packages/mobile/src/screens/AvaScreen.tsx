import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useAvaChatStore, useProfileStore } from '@nestly/shared/stores';
import type { ChatMessage } from '@nestly/shared';
import { getAvaResponse } from '../services/avaService';

const STORAGE_KEY = 'ava_chat_messages';

export function AvaScreen() {
  const { profile } = useProfileStore();
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
  const flatListRef = useRef<FlatList>(null);

  // Hydrate messages from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setMessages(JSON.parse(data));
        } catch {
          // Corrupted data, ignore
        }
      }
    });
  }, [setMessages]);

  // Persist messages on change
  useEffect(() => {
    if (messages.length > 0) {
      // Cap at 100 messages for storage
      const toStore = messages.slice(-100);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    addMessage({ role: 'user', text });
    setLoading(true);

    try {
      const reply = await getAvaResponse(text, messages);
      addMessage({ role: 'model', text: reply });

      if (isSpeaking) {
        Speech.speak(reply, { language: 'en-US', rate: 1.0, pitch: 1.1 });
      }
    } catch {
      addMessage({ role: 'model', text: 'Ava is taking a quiet moment. Try again soon.' });
    } finally {
      setLoading(false);
    }
  }, [input, isLoading, messages, isSpeaking, addMessage, setLoading]);

  const handleClear = useCallback(() => {
    Alert.alert('Clear Conversation?', 'This will delete your chat history with Ava.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearMessages();
          AsyncStorage.removeItem(STORAGE_KEY);
          Speech.stop();
        },
      },
    ]);
  }, [clearMessages]);

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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={{ flexDirection: 'column-reverse', padding: 16 }}
          keyboardDismissMode="on-drag"
          ListEmptyComponent={<EmptyState userName={profile?.userName} />}
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
