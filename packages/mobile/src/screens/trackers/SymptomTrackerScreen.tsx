import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrackingStore } from '@nestly/shared/stores';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';

const PRESETS = ['Nausea', 'Headache', 'Fatigue', 'Heartburn', 'Cramps', 'Back Pain'];

export function SymptomTrackerScreen() {
  const { symptoms, addSymptom } = useTrackingStore();
  const [custom, setCustom] = useState('');

  const logSymptom = (type: string) => {
    addSymptom({ type, severity: 3 });
  };

  const handleCustom = () => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    logSymptom(trimmed);
    setCustom('');
  };

  const historyItems: TrackerHistoryItem[] = symptoms.map((s) => ({
    id: s.id,
    title: s.type,
    timestamp: s.timestamp,
    icon: 'alert-circle-outline',
    iconColor: '#f59e0b',
  }));

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-3">Quick Log</Text>
          <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => logSymptom(p)}
                className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
                style={{ width: '31%' }}
              >
                <Text className="text-xs font-semibold text-amber-700 text-center">{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-semibold text-gray-600 mb-2">Custom</Text>
          <View className="flex-row" style={{ gap: 8 }}>
            <TextInput
              className="flex-1 bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
              placeholder="Other symptom..."
              placeholderTextColor="#94a3b8"
              value={custom}
              onChangeText={setCustom}
              onSubmitEditing={handleCustom}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={handleCustom} className="bg-rose-400 rounded-xl px-5 justify-center">
              <Text className="text-white font-semibold text-sm">Log</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
        <TrackerHistory items={historyItems} />
      </ScrollView>
    </SafeAreaView>
  );
}
