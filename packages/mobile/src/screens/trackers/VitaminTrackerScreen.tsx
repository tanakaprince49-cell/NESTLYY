import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTrackingStore } from '@nestly/shared/stores';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';

export function VitaminTrackerScreen() {
  const { vitamins, addVitamin } = useTrackingStore();
  const [name, setName] = useState('');

  const handleLog = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addVitamin({ name: trimmed });
    setName('');
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayVitamins = vitamins.filter((v) => v.timestamp >= todayStart.getTime());

  const historyItems: TrackerHistoryItem[] = vitamins.map((v) => ({
    id: v.id,
    title: v.name,
    timestamp: v.timestamp,
    icon: 'checkmark-circle-outline',
    iconColor: '#22c55e',
  }));

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-3">Log Vitamin</Text>
          <TextInput
            className="bg-gray-50 rounded-xl py-3 px-4 mb-4 text-sm text-gray-700"
            placeholder="Vitamin name (e.g. Prenatal, Iron, D3)"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleLog}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={handleLog} className="bg-rose-400 rounded-2xl py-4 items-center">
            <Text className="text-white font-semibold">Log Vitamin</Text>
          </TouchableOpacity>
        </Card>

        {todayVitamins.length > 0 && (
          <Card>
            <Text className="text-sm font-semibold text-gray-600 mb-3">Today's Vitamins</Text>
            {todayVitamins.map((v) => (
              <View key={v.id} className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                <Text className="text-sm text-gray-700 ml-2">{v.name}</Text>
              </View>
            ))}
          </Card>
        )}

        <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
        <TrackerHistory items={historyItems} />
      </ScrollView>
    </SafeAreaView>
  );
}
