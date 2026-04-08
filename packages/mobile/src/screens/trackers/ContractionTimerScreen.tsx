import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTrackingStore } from '@nestly/shared/stores';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function ContractionTimerScreen() {
  const { contractions, addContraction } = useTrackingStore();
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = now;
    setActive(true);
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - now);
    }, 200);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const endTime = Date.now();
    const startTime = startTimeRef.current;
    const duration = Math.round((endTime - startTime) / 1000);

    // Calculate interval from previous contraction
    const sorted = [...contractions].sort((a, b) => (b.startTime ?? 0) - (a.startTime ?? 0));
    const prev = sorted[0];
    const interval = prev ? Math.round((startTime - (prev.startTime ?? 0)) / 1000) : undefined;

    addContraction({
      startTime,
      endTime,
      duration,
      interval: interval && interval > 0 ? interval : undefined,
    });

    setActive(false);
    setElapsed(0);
  }, [contractions, addContraction]);

  const lastContraction = [...contractions].sort(
    (a, b) => (b.startTime ?? 0) - (a.startTime ?? 0),
  )[0];

  const historyItems: TrackerHistoryItem[] = contractions
    .filter((c) => c.duration != null)
    .map((c) => ({
      id: c.id,
      title: `${c.duration}s`,
      subtitle: c.interval ? `Interval: ${Math.floor(c.interval / 60)}m ${c.interval % 60}s` : undefined,
      timestamp: c.startTime,
      icon: 'timer-outline',
      iconColor: '#a855f7',
    }));

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-4 text-center">
            Contraction Timer
          </Text>
          <View className="items-center mb-4">
            <TouchableOpacity
              onPress={active ? stop : start}
              className={`w-40 h-40 rounded-full items-center justify-center ${active ? 'bg-purple-200' : 'bg-purple-100'}`}
              activeOpacity={0.7}
            >
              {active ? (
                <Text className="text-2xl font-bold text-purple-700">
                  {formatDuration(elapsed)}
                </Text>
              ) : (
                <Ionicons name="timer-outline" size={48} color="#a855f7" />
              )}
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-400 text-center">
            {active ? 'Tap to stop' : 'Tap to start'}
          </Text>

          {lastContraction?.duration != null && (
            <View className="flex-row justify-center mt-4" style={{ gap: 24 }}>
              <View className="items-center">
                <Text className="text-xs text-gray-400">Last duration</Text>
                <Text className="text-lg font-semibold text-gray-700">{lastContraction.duration}s</Text>
              </View>
              {lastContraction.interval != null && lastContraction.interval > 0 && (
                <View className="items-center">
                  <Text className="text-xs text-gray-400">Last interval</Text>
                  <Text className="text-lg font-semibold text-gray-700">
                    {Math.floor(lastContraction.interval / 60)}m {lastContraction.interval % 60}s
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>

        <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
        <TrackerHistory items={historyItems} />
      </ScrollView>
    </SafeAreaView>
  );
}
