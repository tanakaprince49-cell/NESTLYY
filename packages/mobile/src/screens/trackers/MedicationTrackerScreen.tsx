import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrackingStore } from '@nestly/shared/stores';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';

export function MedicationTrackerScreen() {
  const { medicationLogs, addMedicationLog } = useTrackingStore();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  const handleLog = () => {
    if (!name.trim() || !dosage.trim()) {
      setError('Name and dosage are required');
      return;
    }
    addMedicationLog({ name: name.trim(), dosage: dosage.trim(), time: time.trim() || undefined });
    setName('');
    setDosage('');
    setTime('');
    setError('');
  };

  const historyItems: TrackerHistoryItem[] = medicationLogs.map((m) => ({
    id: m.id,
    title: m.name,
    subtitle: `${m.dosage}${m.time ? ` at ${m.time}` : ''}`,
    timestamp: m.timestamp,
    icon: 'medkit-outline',
    iconColor: '#10b981',
  }));

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-3">Log Medication</Text>
          <TextInput
            className="bg-gray-50 rounded-xl py-3 px-4 mb-3 text-sm text-gray-700"
            placeholder="Medication name"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            className="bg-gray-50 rounded-xl py-3 px-4 mb-3 text-sm text-gray-700"
            placeholder="Dosage (e.g. 500mg)"
            placeholderTextColor="#94a3b8"
            value={dosage}
            onChangeText={setDosage}
          />
          <TextInput
            className="bg-gray-50 rounded-xl py-3 px-4 mb-4 text-sm text-gray-700"
            placeholder="Time (optional, e.g. 8:00 AM)"
            placeholderTextColor="#94a3b8"
            value={time}
            onChangeText={setTime}
          />

          {error ? <Text className="text-red-500 text-xs mb-3 text-center">{error}</Text> : null}

          <TouchableOpacity onPress={handleLog} className="bg-rose-400 rounded-2xl py-4 items-center">
            <Text className="text-white font-semibold">Log Medication</Text>
          </TouchableOpacity>
        </Card>

        <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
        <TrackerHistory items={historyItems} />
      </ScrollView>
    </SafeAreaView>
  );
}
