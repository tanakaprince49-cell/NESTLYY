import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHealthConnectStore } from '@nestly/shared/stores';
import type { HealthConnectPermissionType } from '@nestly/shared';

const PERMISSION_MAP: Record<string, HealthConnectPermissionType> = {
  weight: 'Weight',
  bloodPressure: 'BloodPressure',
  sleep: 'SleepSession',
};

interface Props {
  dataType: 'weight' | 'bloodPressure' | 'sleep';
}

export function HealthConnectSyncBadge({ dataType }: Props) {
  const { isConnected, permissions, isSyncing, syncError } = useHealthConnectStore();

  const permKey = PERMISSION_MAP[dataType];
  if (!isConnected || !permissions[permKey]) return null;

  if (isSyncing) {
    return (
      <View className="flex-row items-center mb-3 px-1" style={{ gap: 6 }}>
        <ActivityIndicator size="small" color="#f43f5e" />
        <Text className="text-xs text-gray-400">Syncing...</Text>
      </View>
    );
  }

  if (syncError) {
    return (
      <View className="flex-row items-center mb-3 px-1" style={{ gap: 6 }}>
        <View className="w-2 h-2 rounded-full bg-orange-400" />
        <Text className="text-xs text-orange-500">Sync error</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center mb-3 px-1" style={{ gap: 6 }}>
      <Ionicons name="heart" size={12} color="#10b981" />
      <Text className="text-xs text-gray-400">Synced with Health Connect</Text>
      <View className="w-2 h-2 rounded-full bg-green-400" />
    </View>
  );
}
