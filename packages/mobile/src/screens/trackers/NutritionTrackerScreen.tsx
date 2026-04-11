import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrackingStore } from '@nestly/shared/stores';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';

export function NutritionTrackerScreen() {
  const { entries, addEntry } = useTrackingStore();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [folate, setFolate] = useState('');
  const [iron, setIron] = useState('');
  const [calcium, setCalcium] = useState('');
  const [error, setError] = useState('');

  const handleLog = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Food name is required');
      return;
    }
    const c = parseFloat(calories) || 0;
    const p = parseFloat(protein) || 0;
    const f = parseFloat(folate) || 0;
    const i = parseFloat(iron) || 0;
    const ca = parseFloat(calcium) || 0;

    // Ranges mirrored from packages/web/src/components/tools/NutritionTracker.tsx
    // so web and mobile accept identical data.
    if (
      c < 0 || c >= 10000 ||
      p < 0 || p >= 1000 ||
      f < 0 || f >= 10000 ||
      i < 0 || i >= 1000 ||
      ca < 0 || ca >= 10000
    ) {
      setError('Please enter valid nutrition values.');
      return;
    }

    addEntry({ name: trimmed, calories: c, protein: p, folate: f, iron: i, calcium: ca });
    setName('');
    setCalories('');
    setProtein('');
    setFolate('');
    setIron('');
    setCalcium('');
    setError('');
  };

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
        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-3">Log Food</Text>
          <TextInput
            className="bg-gray-50 rounded-xl py-3 px-4 mb-3 text-sm text-gray-700"
            placeholder="Food name (e.g. Oatmeal with berries)"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />

          <View className="flex-row mb-3" style={{ gap: 12 }}>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Calories (kcal)</Text>
              <TextInput
                className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Protein (g)</Text>
              <TextInput
                className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View className="flex-row mb-3" style={{ gap: 12 }}>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Folate (mcg)</Text>
              <TextInput
                className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                value={folate}
                onChangeText={setFolate}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Iron (mg)</Text>
              <TextInput
                className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                value={iron}
                onChangeText={setIron}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Calcium (mg)</Text>
            <TextInput
              className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
              placeholder="0"
              placeholderTextColor="#94a3b8"
              value={calcium}
              onChangeText={setCalcium}
              keyboardType="numeric"
            />
          </View>

          {error ? (
            <Text className="text-red-500 text-xs mb-3 text-center">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleLog}
            className="bg-rose-400 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-semibold">Log Food</Text>
          </TouchableOpacity>
        </Card>

        <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
        <TrackerHistory items={historyItems} />
      </ScrollView>
    </SafeAreaView>
  );
}
