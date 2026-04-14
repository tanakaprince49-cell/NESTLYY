import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function VillageHomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400">Loading Village...</Text>
      </View>
    </SafeAreaView>
  );
}
