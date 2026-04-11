import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Placeholder for the Village Hub tab. The web PWA has a full Firestore-backed
// community feature (see packages/web/src/components/VillageHub.tsx and
// packages/shared/src/services/villageService.ts), but that requires
// integrating a React Native Firestore SDK and porting the UI. Tracked in #170
// Phase 6C. This placeholder exists so the Android bottom tab bar matches the
// web layout (7 tabs) instead of silently hiding the feature -- users can see
// that Village exists and is intentionally coming, rather than wondering why
// the app is missing something the website has. See #216.
export function VillageScreen() {
  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <View className="flex-1 items-center justify-center px-8">
        <View className="bg-white rounded-3xl p-8 items-center max-w-sm w-full">
          <View className="w-20 h-20 rounded-full bg-rose-100 items-center justify-center mb-5">
            <Ionicons name="people-outline" size={40} color="#f43f5e" />
          </View>
          <Text className="text-2xl font-bold text-rose-700 mb-2 text-center">
            Village Hub
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-4">
            Coming soon
          </Text>
          <Text className="text-sm text-gray-600 text-center leading-5">
            Connect with other parents, join nests around your interests, and share your journey. The Village Hub is available on the web at nestlyhealth.com and is coming to Android in a future update.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
