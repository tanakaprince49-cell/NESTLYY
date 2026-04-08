import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrackingStore } from '@nestly/shared/stores';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';

export function BloodPressureTrackerScreen() {
  const { bloodPressureLogs, addBloodPressureLog } = useTrackingStore();
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleLog = () => {
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    if (!sys || !dia || sys <= 0 || dia <= 0) {
      setError('Enter valid systolic and diastolic values');
      return;
    }
    const p = parseInt(pulse, 10);
    addBloodPressureLog({
      systolic: sys,
      diastolic: dia,
      pulse: p > 0 ? p : undefined,
      notes: notes.trim() || undefined,
    });
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNotes('');
    setError('');
  };

  const historyItems: TrackerHistoryItem[] = bloodPressureLogs.map((b) => ({
    id: b.id,
    title: `${b.systolic}/${b.diastolic}`,
    subtitle: b.pulse ? `Pulse: ${b.pulse} bpm` : undefined,
    timestamp: b.timestamp,
    icon: 'heart-circle-outline',
    iconColor: '#f43f5e',
  }));

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-3">Log Blood Pressure</Text>
          <View className="flex-row mb-3" style={{ gap: 12 }}>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Systolic</Text>
              <TextInput
                className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
                placeholder="120"
                placeholderTextColor="#94a3b8"
                value={systolic}
                onChangeText={setSystolic}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Diastolic</Text>
              <TextInput
                className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
                placeholder="80"
                placeholderTextColor="#94a3b8"
                value={diastolic}
                onChangeText={setDiastolic}
                keyboardType="numeric"
              />
            </View>
          </View>
          <TextInput
            className="bg-gray-50 rounded-xl py-3 px-4 mb-3 text-sm text-gray-700"
            placeholder="Pulse (optional)"
            placeholderTextColor="#94a3b8"
            value={pulse}
            onChangeText={setPulse}
            keyboardType="numeric"
          />
          <TextInput
            className="bg-gray-50 rounded-xl py-3 px-4 mb-4 text-sm text-gray-700"
            placeholder="Notes (optional)"
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
          />

          {error ? <Text className="text-red-500 text-xs mb-3 text-center">{error}</Text> : null}

          <TouchableOpacity onPress={handleLog} className="bg-rose-400 rounded-2xl py-4 items-center">
            <Text className="text-white font-semibold">Log Blood Pressure</Text>
          </TouchableOpacity>
        </Card>

        <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
        <TrackerHistory items={historyItems} />
      </ScrollView>
    </SafeAreaView>
  );
}
