import React from 'react';
import { View, Text } from 'react-native';

interface ProgressBarProps {
  weeks: number;
}

export function ProgressBar({ weeks }: ProgressBarProps) {
  const t1Fill = Math.min(1, Math.max(0, weeks / 13));
  const t2Fill = weeks < 13 ? 0 : Math.min(1, (weeks - 13) / 14);
  const t3Fill = weeks < 27 ? 0 : Math.min(1, (weeks - 27) / 13);

  return (
    <View>
      <View className="flex-row gap-1 mb-1">
        <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-rose-300 rounded-full"
            style={{ width: `${t1Fill * 100}%` }}
          />
        </View>
        <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-rose-400 rounded-full"
            style={{ width: `${t2Fill * 100}%` }}
          />
        </View>
        <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-rose-600 rounded-full"
            style={{ width: `${t3Fill * 100}%` }}
          />
        </View>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-xs text-gray-400">T1</Text>
        <Text className="text-xs text-gray-400">T2</Text>
        <Text className="text-xs text-gray-400">T3</Text>
      </View>
    </View>
  );
}
