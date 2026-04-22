import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  shouldShowAvaRetirementNoticeAsync,
  markAvaRetirementNoticeSeenAsync,
} from '@nestly/shared';

const asyncBackend = {
  getItem: (k: string): Promise<string | null> => AsyncStorage.getItem(k),
  setItem: (k: string, v: string): Promise<void> => AsyncStorage.setItem(k, v),
};

export const RetirementNoticeBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setVisible(await shouldShowAvaRetirementNoticeAsync(asyncBackend));
      } catch {}
    })();
  }, []);

  if (!visible) return null;

  const dismiss = async (): Promise<void> => {
    try {
      await markAvaRetirementNoticeSeenAsync(asyncBackend);
    } catch {}
    setVisible(false);
  };

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="mb-3 flex-row items-start rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3"
      style={{ gap: 10 }}
    >
      <View className="flex-1">
        <Text className="text-sm font-semibold text-rose-900">
          We've simplified the app
        </Text>
        <Text className="mt-1 text-xs leading-snug text-rose-800">
          Ava, Symptom Decoder, and the AI Meal Plan are retired while we review privacy controls. Core tracking (nutrition, sleep, kicks, growth) continues as usual.
        </Text>
      </View>
      <TouchableOpacity
        onPress={dismiss}
        accessibilityLabel="Dismiss notice"
        accessibilityRole="button"
        className="rounded-full p-1"
      >
        <Ionicons name="close" size={16} color="#9f1239" />
      </TouchableOpacity>
    </View>
  );
};
