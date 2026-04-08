import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
}

export function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 flex-1 items-center shadow-sm">
      <Text className="text-2xl font-bold text-rose-700">
        {value}
        {unit ? <Text className="text-base font-normal text-gray-500"> {unit}</Text> : null}
      </Text>
      <Text className="text-xs text-gray-500 mt-1">{label}</Text>
    </View>
  );
}
