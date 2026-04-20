import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LifecycleStage, writeSleepSession } from '@nestly/shared';
import type { SleepMode } from '@nestly/shared';
import { useProfileStore, useTrackingStore, useLocalIdentityStore, useHealthConnectStore } from '@nestly/shared/stores';
import { BabySelector } from '../../components/tracking/BabySelector';
import { SegmentedControl } from '../../components/tracking/SegmentedControl';
import { TypeGrid } from '../../components/tracking/TypeGrid';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';
import { HealthConnectSyncBadge } from '../../components/tracking/HealthConnectSyncBadge';

const SLEEP_TYPES = [
  { value: 'night' as const, label: 'Night', icon: 'moon-outline' as const },
  { value: 'nap' as const, label: 'Nap', icon: 'sunny-outline' as const },
];

const QUALITY_OPTIONS = [
  { value: 'poor' as const, label: 'Poor' },
  { value: 'okay' as const, label: 'Okay' },
  { value: 'good' as const, label: 'Good' },
];

function durationMinutes(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SleepTrackerScreen() {
  const { profile } = useProfileStore();
  const { sleepLogs, addSleepLog } = useTrackingStore();
  const localUuid = useLocalIdentityStore((s) => s.localUuid);
  const babies = profile?.babies ?? [];

  const isPostpartum =
    profile?.lifecycleStage !== LifecycleStage.PREGNANCY &&
    profile?.lifecycleStage !== LifecycleStage.PRE_PREGNANCY;

  const [mode, setMode] = useState<SleepMode>(isPostpartum ? 'newborn' : 'pregnancy');
  const [selectedBabyId, setSelectedBabyId] = useState(babies[0]?.id ?? '');
  const [sleepType, setSleepType] = useState<'night' | 'nap'>('night');
  const [quality, setQuality] = useState<'poor' | 'okay' | 'good'>('okay');
  const [startTime, setStartTime] = useState(new Date(Date.now() - 3600000)); // 1h ago
  const [endTime, setEndTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const currentBabyId = selectedBabyId || babies[0]?.id || '';

  const handleLog = () => {
    addSleepLog({
      userId: localUuid,
      babyId: mode === 'newborn' ? currentBabyId : undefined,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      mode,
      quality: mode === 'pregnancy' ? quality : undefined,
      type: sleepType,
      notes: notes || undefined,
    });
    // Write-through to Health Connect (fire-and-forget)
    if (useHealthConnectStore.getState().permissions.SleepSession) {
      writeSleepSession({
        id: '', userId: localUuid, mode,
        startTime: startTime.toISOString(), endTime: endTime.toISOString(),
        type: sleepType, timestamp: Date.now(),
      }).catch(() => {});
    }
    setNotes('');
    setStartTime(new Date(Date.now() - 3600000));
    setEndTime(new Date());
  };

  const filteredLogs = sleepLogs.filter((l) => {
    if (l.mode && l.mode !== mode) return false;
    if (mode === 'newborn') return (l.babyId || '') === currentBabyId;
    return true;
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayLogs = filteredLogs.filter((l) => l.timestamp >= todayStart.getTime());
  const totalMinsToday = todayLogs.reduce((acc, l) => {
    const s = new Date(l.startTime).getTime();
    const e = new Date(l.endTime).getTime();
    return acc + Math.max(0, (e - s) / 60000);
  }, 0);

  const historyItems: TrackerHistoryItem[] = filteredLogs.map((l) => {
    const mins = durationMinutes(new Date(l.startTime), new Date(l.endTime));
    return {
      id: l.id,
      title: `${l.type === 'night' ? 'Night' : 'Nap'} - ${formatDuration(mins)}`,
      subtitle: l.quality ? `Quality: ${l.quality}` : undefined,
      timestamp: l.timestamp,
      icon: l.type === 'night' ? 'moon-outline' : 'sunny-outline',
      iconColor: '#6366f1',
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <SegmentedControl
          options={[
            { value: 'pregnancy' as SleepMode, label: 'Pregnancy' },
            { value: 'newborn' as SleepMode, label: 'Newborn' },
          ]}
          selected={mode}
          onSelect={setMode}
        />

        {mode === 'newborn' && (
          <BabySelector babies={babies} selectedBabyId={currentBabyId} onSelect={setSelectedBabyId} />
        )}

        {mode === 'newborn' && babies.length === 0 ? (
          <View className="py-8 items-center">
            <Text className="text-gray-500">Add a baby first in Settings</Text>
          </View>
        ) : (
          <>
            <Card>
              <View className="bg-indigo-50 rounded-2xl p-4 mb-4 items-center">
                <Text className="text-xs font-medium text-indigo-400">Today's sleep</Text>
                <Text className="text-2xl font-bold text-indigo-600 mt-1">
                  {formatDuration(Math.round(totalMinsToday))}
                </Text>
                <Text className="text-xs text-indigo-300 mt-1">
                  {todayLogs.filter((l) => l.type === 'night').length} night / {todayLogs.filter((l) => l.type === 'nap').length} nap
                </Text>
              </View>

              <Text className="text-base font-semibold text-gray-800 mb-3">Log Sleep</Text>
              <HealthConnectSyncBadge dataType="sleep" />
              <TypeGrid options={SLEEP_TYPES} selected={sleepType} onSelect={setSleepType} columns={2} />

              {mode === 'pregnancy' && (
                <View className="flex-row mb-4" style={{ gap: 8 }}>
                  {QUALITY_OPTIONS.map((q) => (
                    <TouchableOpacity
                      key={q.value}
                      onPress={() => setQuality(q.value)}
                      className={`flex-1 py-2 rounded-xl items-center border ${
                        quality === q.value
                          ? 'bg-rose-50 border-rose-400'
                          : 'bg-white border-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          quality === q.value ? 'text-rose-600' : 'text-gray-400'
                        }`}
                      >
                        {q.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View className="flex-row mb-4" style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  className="flex-1 bg-gray-50 rounded-xl py-3 px-4"
                >
                  <Text className="text-xs font-medium text-gray-400 mb-1">Start</Text>
                  <Text className="text-sm font-semibold text-gray-700">
                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowEndPicker(true)}
                  className="flex-1 bg-gray-50 rounded-xl py-3 px-4"
                >
                  <Text className="text-xs font-medium text-gray-400 mb-1">End</Text>
                  <Text className="text-sm font-semibold text-gray-700">
                    {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>

              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  is24Hour
                  onChange={(_, date) => {
                    setShowStartPicker(Platform.OS === 'ios');
                    if (date) setStartTime(date);
                  }}
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  is24Hour
                  onChange={(_, date) => {
                    setShowEndPicker(Platform.OS === 'ios');
                    if (date) setEndTime(date);
                  }}
                />
              )}

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
                <Text className="text-white font-semibold">Log Sleep</Text>
              </TouchableOpacity>
            </Card>

            <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
            <TrackerHistory items={historyItems} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
