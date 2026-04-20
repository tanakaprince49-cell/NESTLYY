import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, AppState, Alert, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LifecycleStage } from '@nestly/shared';
import { useHealthConnectStore, useLocalIdentityStore, useProfileStore } from '@nestly/shared/stores';

const HC_PLAY_STORE_URL = 'market://details?id=com.google.android.apps.healthdata';

function formatLastSync(ts: number | null): string {
  if (!ts) return 'Never';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function HealthConnectSection() {
  const {
    isAvailable,
    isConnected,
    isInitialized,
    permissions,
    isSyncing,
    lastSyncTimestamp,
    syncError,
    initialize,
    connect,
    disconnect,
    refreshPermissions,
    syncAll,
  } = useHealthConnectStore();
  const localUuid = useLocalIdentityStore((s) => s.localUuid);
  const { profile } = useProfileStore();
  const sleepMode = profile?.lifecycleStage === LifecycleStage.PREGNANCY ? 'pregnancy' : 'newborn';

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Re-check permissions when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isConnected) {
        refreshPermissions();
      }
    });
    return () => sub.remove();
  }, [isConnected, refreshPermissions]);

  const handleConnect = useCallback(async () => {
    const success = await connect();
    if (!success) {
      Alert.alert('Permissions Required', 'Please grant Health Connect permissions to sync your health data.');
      return;
    }
    // Fire an immediate sync so the Dashboard reflects the user's existing
    // Health Connect data without them having to hunt down the "Sync Now"
    // button. The global foreground-resume sync in App.tsx covers every
    // subsequent resume, but the very first connect happens in-session and
    // needs its own explicit call. See issue #219.
    syncAll(localUuid, sleepMode);
  }, [connect, syncAll, localUuid, sleepMode]);

  const handleDisconnect = useCallback(() => {
    Alert.alert('Disconnect Health Connect', 'Your data will remain but will no longer sync.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => disconnect() },
    ]);
  }, [disconnect]);

  const handleSync = useCallback(() => {
    syncAll(localUuid, sleepMode);
  }, [syncAll, localUuid, sleepMode]);

  const handleInstall = useCallback(() => {
    Linking.openURL(HC_PLAY_STORE_URL).catch(() => {
      Alert.alert('Could not open Play Store', 'Search for "Health Connect" in the Google Play Store.');
    });
  }, []);

  if (!isInitialized) return null;

  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
      <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
        <Ionicons name="fitness-outline" size={20} color="#f43f5e" />
        <Text className="text-base font-semibold text-gray-800">Health Connect</Text>
      </View>

      {!isAvailable ? (
        <>
          <Text className="text-sm text-gray-500 mb-3">
            Health Connect is not installed on this device. Install it to sync weight, blood pressure, and sleep data with other health apps.
          </Text>
          <TouchableOpacity
            className="bg-rose-50 rounded-xl py-3 items-center"
            onPress={handleInstall}
          >
            <Text className="text-sm font-semibold text-rose-600">Install Health Connect</Text>
          </TouchableOpacity>
        </>
      ) : !isConnected ? (
        <>
          <Text className="text-sm text-gray-500 mb-3">
            Connect to sync weight, blood pressure, and sleep with Health Connect.
          </Text>
          <TouchableOpacity
            className="bg-rose-400 rounded-xl py-3 items-center"
            onPress={handleConnect}
          >
            <Text className="text-sm font-semibold text-white">Connect</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Permission indicators */}
          <View className="mb-3" style={{ gap: 4 }}>
            {([
              { label: 'Weight', enabled: permissions.Weight },
              { label: 'Blood Pressure', enabled: permissions.BloodPressure },
              { label: 'Sleep', enabled: permissions.SleepSession },
            ] as const).map((item) => (
              <View key={item.label} className="flex-row items-center" style={{ gap: 6 }}>
                <View
                  className={`w-2 h-2 rounded-full ${item.enabled ? 'bg-green-400' : 'bg-gray-300'}`}
                />
                <Text className={`text-xs ${item.enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Last sync + error */}
          <View className="flex-row items-center mb-3" style={{ gap: 4 }}>
            <Ionicons name="time-outline" size={12} color="#94a3b8" />
            <Text className="text-xs text-gray-400">
              Last synced: {formatLastSync(lastSyncTimestamp)}
            </Text>
          </View>

          {syncError && (
            <Text className="text-xs text-orange-500 mb-3">{syncError}</Text>
          )}

          {/* Actions */}
          <View className="flex-row" style={{ gap: 8 }}>
            <TouchableOpacity
              className="flex-1 bg-rose-50 rounded-xl py-3 items-center flex-row justify-center"
              style={{ gap: 6 }}
              onPress={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#f43f5e" />
              ) : (
                <Ionicons name="sync-outline" size={16} color="#f43f5e" />
              )}
              <Text className="text-sm font-semibold text-rose-600">
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 rounded-xl py-3 items-center justify-center border border-gray-200"
              onPress={handleDisconnect}
            >
              <Text className="text-xs text-red-400">Disconnect</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
