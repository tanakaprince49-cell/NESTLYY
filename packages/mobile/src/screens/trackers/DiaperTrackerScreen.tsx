import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore, useTrackingStore } from '@nestly/shared/stores';
import { BabySelector } from '../../components/tracking/BabySelector';
import { TypeGrid } from '../../components/tracking/TypeGrid';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';

const DIAPER_OPTIONS = [
  { value: 'wet' as const, label: 'Wet', icon: 'water-outline' as const },
  { value: 'dirty' as const, label: 'Dirty', icon: 'trash-outline' as const },
  { value: 'mixed' as const, label: 'Mixed', icon: 'water' as const },
];

export function DiaperTrackerScreen() {
  const { profile } = useProfileStore();
  const { diaperLogs, addDiaperLog } = useTrackingStore();
  const babies = profile?.babies ?? [];
  const [selectedBabyId, setSelectedBabyId] = useState(babies[0]?.id ?? '');
  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'mixed'>('wet');
  const [notes, setNotes] = useState('');

  const currentBabyId = selectedBabyId || babies[0]?.id || '';

  const handleLog = () => {
    if (!currentBabyId) return;
    addDiaperLog({ babyId: currentBabyId, type: diaperType, notes: notes || undefined });
    setNotes('');
  };

  const historyItems: TrackerHistoryItem[] = diaperLogs
    .filter((l) => l.babyId === currentBabyId)
    .map((l) => ({
      id: l.id,
      title: `${l.type.charAt(0).toUpperCase() + l.type.slice(1)} diaper`,
      subtitle: l.notes || undefined,
      timestamp: l.timestamp,
      icon: l.type === 'wet' ? 'water-outline' : l.type === 'dirty' ? 'trash-outline' : 'water',
      iconColor: '#06b6d4',
    }));

  if (babies.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-rose-50 items-center justify-center" edges={['bottom']}>
        <Text className="text-gray-500">Add a baby first in Settings</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <BabySelector babies={babies} selectedBabyId={currentBabyId} onSelect={setSelectedBabyId} />

        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-3">Type</Text>
          <TypeGrid options={DIAPER_OPTIONS} selected={diaperType} onSelect={setDiaperType} />

          <TextInput
            className="bg-gray-50 rounded-xl py-3 px-4 mb-4 text-sm text-gray-700"
            placeholder="Notes (optional)"
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity
            onPress={handleLog}
            className="bg-rose-400 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-semibold">Log Diaper</Text>
          </TouchableOpacity>
        </Card>

        <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
        <TrackerHistory items={historyItems} />
      </ScrollView>
    </SafeAreaView>
  );
}
