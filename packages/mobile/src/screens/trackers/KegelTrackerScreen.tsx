import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useTrackingStore } from '@nestly/shared/stores';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';

export function KegelTrackerScreen() {
  const { kegelLogs, addKegelLog } = useTrackingStore();
  const [holding, setHolding] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePressIn = useCallback(() => {
    setHolding(true);
    setSeconds(0);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const handlePressOut = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const dur = seconds;
    setHolding(false);
    setSeconds(0);
    if (dur > 0) {
      addKegelLog({ duration: dur });
    }
  }, [seconds, addKegelLog]);

  const historyItems: TrackerHistoryItem[] = kegelLogs.map((k) => ({
    id: k.id,
    title: `${k.duration}s`,
    timestamp: k.timestamp,
    icon: 'fitness-outline',
    iconColor: '#8b5cf6',
  }));

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-4 text-center">
            Kegel Timer
          </Text>
          <View className="items-center mb-4">
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              className={`w-36 h-36 rounded-full items-center justify-center ${holding ? 'bg-violet-200' : 'bg-violet-100'}`}
            >
              {holding ? (
                <Text className="text-3xl font-bold text-violet-700">{seconds}s</Text>
              ) : (
                <Ionicons name="fitness-outline" size={48} color="#8b5cf6" />
              )}
            </Pressable>
          </View>
          <Text className="text-sm text-gray-400 text-center">
            {holding ? 'Hold...' : 'Press and hold'}
          </Text>
        </Card>

        <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
        <TrackerHistory items={historyItems} />
      </ScrollView>
    </SafeAreaView>
  );
}
