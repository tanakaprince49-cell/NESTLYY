import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrackingStore } from '@nestly/shared/stores';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { FoodPicker } from '../../components/FoodPicker';

export function NutritionTrackerScreen() {
  const { entries, addEntry } = useTrackingStore();

  // Cap recent history at 10 entries to match web (web uses slice(0, 5)).
  // Without a cap this list grows unbounded as users log more meals.
  const historyItems: TrackerHistoryItem[] = entries.slice(0, 10).map((e) => ({
    id: e.id,
    title: e.name,
    subtitle: `${e.calories} kcal · ${e.protein}g protein · ${e.folate}mcg folate · ${e.iron}mg iron · ${e.calcium}mg calcium`,
    timestamp: e.timestamp,
    icon: 'restaurant-outline',
    iconColor: '#f43f5e',
  }));

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <FoodPicker onAddEntry={addEntry} />

        <Text className="text-sm font-semibold text-gray-500 mb-2 mt-4">Recent</Text>
        <TrackerHistory items={historyItems} />
      </ScrollView>
    </SafeAreaView>
  );
}
