import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '@nestly/shared/stores';
import { formatBabyAge } from '../utils/pregnancyCalc';

const GENDER_EMOJI: Record<string, string> = {
  boy: '👦',
  girl: '👧',
  surprise: '🎁',
  neutral: '👶',
};

export function BabyScreen() {
  const { profile } = useProfileStore();

  if (!profile || !profile.babies || profile.babies.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-50">
        <Text className="text-2xl font-bold text-rose-700">Growth</Text>
        <Text className="text-gray-500 mt-2">No babies added yet</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-rose-700 mb-4">Growth</Text>
        {profile.babies.map((baby) => (
          <View key={baby.id} className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Text className="text-3xl mr-3">{GENDER_EMOJI[baby.gender] ?? '👶'}</Text>
              <View>
                <Text className="text-lg font-bold text-gray-800">
                  {baby.name || 'Unnamed baby'}
                </Text>
                {baby.birthDate ? (
                  <Text className="text-sm text-gray-500 mt-0.5">
                    Age: {formatBabyAge(baby.birthDate)}
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="flex-row gap-2 mt-2">
              <View className="flex-1 bg-rose-50 rounded-xl p-3 items-center">
                <Text className="text-xs text-gray-500">Gender</Text>
                <Text className="text-sm font-semibold text-gray-700 mt-1 capitalize">
                  {baby.gender}
                </Text>
              </View>
              {baby.birthWeight ? (
                <View className="flex-1 bg-rose-50 rounded-xl p-3 items-center">
                  <Text className="text-xs text-gray-500">Birth Weight</Text>
                  <Text className="text-sm font-semibold text-gray-700 mt-1">
                    {baby.birthWeight} g
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
