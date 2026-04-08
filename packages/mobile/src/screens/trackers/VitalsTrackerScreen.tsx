import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { LifecycleStage } from '@nestly/shared';
import { useProfileStore, useTrackingStore } from '@nestly/shared/stores';
import { BabySelector } from '../../components/tracking/BabySelector';
import { SegmentedControl } from '../../components/tracking/SegmentedControl';
import { TrackerHistory, type TrackerHistoryItem } from '../../components/tracking/TrackerHistory';
import { Card } from '../../components/Card';

export function VitalsTrackerScreen() {
  const { profile } = useProfileStore();
  const { weightLogs, babyGrowthLogs, addWeightLog, addBabyGrowthLog } = useTrackingStore();
  const babies = profile?.babies ?? [];

  const isPregnancy = profile?.lifecycleStage === LifecycleStage.PREGNANCY;
  const [view, setView] = useState<'parent' | 'baby'>(isPregnancy ? 'parent' : 'parent');
  const [selectedBabyId, setSelectedBabyId] = useState(babies[0]?.id ?? '');
  const [weight, setWeight] = useState('');
  const [babyWeight, setBabyWeight] = useState('');
  const [babyHeight, setBabyHeight] = useState('');
  const [error, setError] = useState('');

  const currentBabyId = selectedBabyId || babies[0]?.id || '';

  const handleLogWeight = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0 || w > 300) {
      setError('Enter a valid weight');
      return;
    }
    addWeightLog({ weight: w });
    setWeight('');
    setError('');
  };

  const handleLogGrowth = () => {
    const w = parseFloat(babyWeight);
    const h = parseFloat(babyHeight);
    if ((!w || w <= 0) && (!h || h <= 0)) {
      setError('Enter weight or height');
      return;
    }
    addBabyGrowthLog({
      babyId: currentBabyId,
      weight: w || 0,
      height: h || 0,
    });
    setBabyWeight('');
    setBabyHeight('');
    setError('');
  };

  const weightHistory: TrackerHistoryItem[] = weightLogs.map((l) => ({
    id: l.id,
    title: `${l.weight} kg`,
    timestamp: l.timestamp,
    icon: 'scale-outline',
    iconColor: '#ef4444',
  }));

  const growthHistory: TrackerHistoryItem[] = babyGrowthLogs
    .filter((l) => l.babyId === currentBabyId)
    .map((l) => ({
      id: l.id,
      title: `${l.weight} kg / ${l.height} cm`,
      subtitle: l.headCircumference ? `Head: ${l.headCircumference} cm` : undefined,
      timestamp: l.timestamp,
      icon: 'trending-up-outline',
      iconColor: '#ef4444',
    }));

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {!isPregnancy && (
          <SegmentedControl
            options={[
              { value: 'parent', label: 'My Weight' },
              { value: 'baby', label: 'Baby Growth' },
            ]}
            selected={view}
            onSelect={setView}
          />
        )}

        {view === 'parent' ? (
          <>
            <Card>
              <Text className="text-base font-semibold text-gray-800 mb-3">Log Weight</Text>
              <View className="flex-row items-end mb-4" style={{ gap: 12 }}>
                <View className="flex-1">
                  <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Weight (kg)</Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
                    placeholder="0.0"
                    placeholderTextColor="#94a3b8"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {error && view === 'parent' ? (
                <Text className="text-red-500 text-xs mb-3 text-center">{error}</Text>
              ) : null}

              <TouchableOpacity
                onPress={handleLogWeight}
                className="bg-rose-400 rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-semibold">Log Weight</Text>
              </TouchableOpacity>
            </Card>

            {weightLogs.length >= 2 && (
              <Card>
                <Text className="text-sm font-semibold text-gray-600 mb-3">Weight Trend</Text>
                <LineChart
                  data={{
                    labels: weightLogs
                      .slice(-7)
                      .map((l) => {
                        const d = new Date(l.timestamp);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }),
                    datasets: [{ data: weightLogs.slice(-7).map((l) => l.weight) }],
                  }}
                  width={Dimensions.get('window').width - 64}
                  height={180}
                  yAxisSuffix=" kg"
                  chartConfig={{
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    color: () => '#f43f5e',
                    labelColor: () => '#6b7280',
                    decimalPlaces: 1,
                    propsForDots: { r: '4', fill: '#f43f5e' },
                  }}
                  bezier
                  style={{ borderRadius: 12 }}
                />
              </Card>
            )}

            <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
            <TrackerHistory items={weightHistory} />
          </>
        ) : (
          <>
            <BabySelector babies={babies} selectedBabyId={currentBabyId} onSelect={setSelectedBabyId} />

            {babies.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-gray-500">Add a baby first in Settings</Text>
              </View>
            ) : (
              <>
                <Card>
                  <Text className="text-base font-semibold text-gray-800 mb-3">Log Growth</Text>
                  <View className="flex-row mb-4" style={{ gap: 12 }}>
                    <View className="flex-1">
                      <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Weight (kg)</Text>
                      <TextInput
                        className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
                        placeholder="0.0"
                        placeholderTextColor="#94a3b8"
                        value={babyWeight}
                        onChangeText={setBabyWeight}
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-medium text-gray-400 mb-1 ml-1">Height (cm)</Text>
                      <TextInput
                        className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700"
                        placeholder="0.0"
                        placeholderTextColor="#94a3b8"
                        value={babyHeight}
                        onChangeText={setBabyHeight}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {error && view === 'baby' ? (
                    <Text className="text-red-500 text-xs mb-3 text-center">{error}</Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={handleLogGrowth}
                    className="bg-rose-400 rounded-2xl py-4 items-center"
                  >
                    <Text className="text-white font-semibold">Log Growth</Text>
                  </TouchableOpacity>
                </Card>

                <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">Recent</Text>
                <TrackerHistory items={growthHistory} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
