import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore, useTrackingStore } from '@nestly/shared/stores';
import { BabySelector } from '../../components/tracking/BabySelector';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';

export function KickCounterScreen() {
  const { profile } = useProfileStore();
  const { kickLogs, addKickLog } = useTrackingStore();
  const babies = profile?.babies ?? [];
  const [selectedBabyId, setSelectedBabyId] = useState(babies[0]?.id ?? '');
  const [count, setCount] = useState(0);

  const currentBabyId = selectedBabyId || babies[0]?.id || '';

  const handleTap = () => {
    setCount((c) => c + 1);
    if (currentBabyId) {
      addKickLog({ babyId: currentBabyId, count: 1 });
    }
  };

  const historyItems: TrackerHistoryItem[] = kickLogs
    .filter((k) => k.babyId === currentBabyId)
    .map((k) => ({
      id: k.id,
      title: `${k.count} kick${k.count !== 1 ? 's' : ''}`,
      timestamp: k.timestamp,
      icon: 'footsteps-outline',
      iconColor: '#ec4899',
    }));

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <BabySelector babies={babies} selectedBabyId={currentBabyId} onSelect={setSelectedBabyId} />

        {!currentBabyId ? (
          <View className="py-8 items-center">
            <Text className="text-gray-500">Add a baby first in Settings</Text>
          </View>
        ) : (
          <>
            <Card>
              <Text className="text-base font-semibold text-gray-800 mb-4 text-center">
                Kick Counter
              </Text>
              <View className="items-center mb-4">
                <TouchableOpacity
                  onPress={handleTap}
                  className="w-36 h-36 rounded-full bg-rose-100 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="footsteps-outline" size={48} color="#ec4899" />
                </TouchableOpacity>
              </View>
              <Text className="text-3xl font-bold text-gray-800 text-center">{count}</Text>
              <Text className="text-sm text-gray-400 text-center mt-1">Tap for each kick</Text>
            </Card>

            <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
            <TrackerHistory items={historyItems} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
