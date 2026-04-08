import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore, useTrackingStore } from '@nestly/shared/stores';
import { BabySelector } from '../../components/tracking/BabySelector';
import { TypeGrid } from '../../components/tracking/TypeGrid';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';

const FEEDING_TYPES = [
  { value: 'breast' as const, label: 'Breast', icon: 'heart-outline' as const },
  { value: 'bottle' as const, label: 'Bottle', icon: 'cafe-outline' as const },
  { value: 'solid' as const, label: 'Solid', icon: 'restaurant-outline' as const },
];

const SIDE_OPTIONS = [
  { value: 'left' as const, label: 'Left', icon: 'arrow-back-outline' as const },
  { value: 'right' as const, label: 'Right', icon: 'arrow-forward-outline' as const },
  { value: 'both' as const, label: 'Both', icon: 'swap-horizontal-outline' as const },
];

const SUBTYPE_OPTIONS = [
  { value: 'milk' as const, label: 'Milk', icon: 'water-outline' as const },
  { value: 'formula' as const, label: 'Formula', icon: 'flask-outline' as const },
];

export function FeedingTrackerScreen() {
  const { profile } = useProfileStore();
  const { feedingLogs, addFeedingLog } = useTrackingStore();
  const babies = profile?.babies ?? [];
  const [selectedBabyId, setSelectedBabyId] = useState(babies[0]?.id ?? '');
  const [feedingType, setFeedingType] = useState<'breast' | 'bottle' | 'solid'>('breast');
  const [side, setSide] = useState<'left' | 'right' | 'both'>('both');
  const [subType, setSubType] = useState<'milk' | 'formula'>('milk');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState('');

  const currentBabyId = selectedBabyId || babies[0]?.id || '';

  const handleLog = () => {
    const amountNum = parseFloat(amount) || 0;
    const durationNum = parseFloat(duration) || 0;

    if (amountNum <= 0 && durationNum <= 0) {
      setError('Enter an amount or duration');
      return;
    }

    addFeedingLog({
      babyId: currentBabyId,
      type: feedingType,
      subType: feedingType === 'bottle' ? subType : undefined,
      side: feedingType === 'breast' ? side : undefined,
      amount: amountNum,
      duration: durationNum || undefined,
    });
    setAmount('');
    setDuration('');
    setError('');
  };

  const historyItems: TrackerHistoryItem[] = feedingLogs
    .filter((l) => l.babyId === currentBabyId)
    .map((l) => ({
      id: l.id,
      title: `${l.type.charAt(0).toUpperCase() + l.type.slice(1)}${l.side ? ` (${l.side})` : ''}`,
      subtitle: `${l.amount} ml${l.duration ? ` / ${l.duration} min` : ''}`,
      timestamp: l.timestamp,
      icon: l.type === 'breast' ? 'heart-outline' : l.type === 'bottle' ? 'cafe-outline' : 'restaurant-outline',
      iconColor: '#0ea5e9',
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
          <TypeGrid options={FEEDING_TYPES} selected={feedingType} onSelect={setFeedingType} />

          {feedingType === 'breast' && (
            <>
              <Text className="text-sm font-semibold text-gray-600 mb-2">Side</Text>
              <TypeGrid options={SIDE_OPTIONS} selected={side} onSelect={setSide} />
            </>
          )}

          {feedingType === 'bottle' && (
            <>
              <Text className="text-sm font-semibold text-gray-600 mb-2">Contents</Text>
              <TypeGrid options={SUBTYPE_OPTIONS} selected={subType} onSelect={setSubType} columns={2} />
            </>
          )}

          <View className="flex-row mb-4" style={{ gap: 12 }}>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Amount (ml)</Text>
              <TextInput
                className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Duration (min)</Text>
              <TextInput
                className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>
          </View>

          {error ? (
            <Text className="text-red-500 text-xs mb-3 text-center">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleLog}
            className="bg-rose-400 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-semibold">Log Feeding</Text>
          </TouchableOpacity>
        </Card>

        <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
        <TrackerHistory items={historyItems} />
      </ScrollView>
    </SafeAreaView>
  );
}
