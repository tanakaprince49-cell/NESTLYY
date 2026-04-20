import './global.css';
import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { registerHealthConnectModule, LifecycleStage, getLocalIdentityAsync } from '@nestly/shared';
import { rehydrateUserStores, rehydratePrivacyStore } from './stores/bootstrap';
import { asyncStorageBackend } from './stores/storageBackend';

// Register native Health Connect module early so write-through in trackers works.
try {
  registerHealthConnectModule(require('react-native-health-connect'));
} catch {
  // Not available (Expo Go or missing native module)
}
import {
  useLocalIdentityStore,
  setLocalUuid,
  useProfileStore,
  useTrackingStore,
  useHealthConnectStore,
  usePrivacyStore,
} from '@nestly/shared/stores';
import { PrivacyScreen } from './screens/PrivacyScreen';
import { SetupScreen } from './screens/SetupScreen';
import { MainTabs } from './navigation/MainTabs';
import {
  requestNotificationPermissions,
  registerPushToken,
  addNotificationResponseListener,
} from './services/notificationService';
import { rescheduleAllReminders } from './services/reminderScheduler';

export default function App() {
  const localUuid = useLocalIdentityStore((s) => s.localUuid);
  const hasAcceptedPrivacy = usePrivacyStore((s) => s.hasAcceptedPrivacy);
  const { profile, isEditingProfile } = useProfileStore();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [storesHydrated, setStoresHydrated] = useState(false);
  const [privacyHydrated, setPrivacyHydrated] = useState(false);
  const [identityReady, setIdentityReady] = useState(false);

  useEffect(() => {
    // Rehydrate the device-level privacy flag once at boot before identity resolves.
    rehydratePrivacyStore().finally(() => setPrivacyHydrated(true));
  }, []);

  useEffect(() => {
    // Resolve or create the local UUID identity, then rehydrate user stores.
    (async () => {
      const uuid = await getLocalIdentityAsync(
        asyncStorageBackend.getItem.bind(asyncStorageBackend),
        asyncStorageBackend.setItem.bind(asyncStorageBackend),
      );
      setLocalUuid(uuid);
      await rehydrateUserStores();
      setStoresHydrated(true);
      setIdentityReady(true);
    })();
  }, []);

  // Initialize notifications after identity and profile are ready
  useEffect(() => {
    if (!localUuid || !profile) return;
    if (!profile.notificationsEnabled) return;

    requestNotificationPermissions().then((granted) => {
      if (granted) registerPushToken();
    });
  }, [localUuid, profile?.notificationsEnabled]);

  // Reschedule reminders when app comes to foreground or relevant profile fields change
  const notificationsEnabled = profile?.notificationsEnabled;
  const lifecycleStage = profile?.lifecycleStage;
  const lmpDate = profile?.lmpDate;

  useEffect(() => {
    if (!profile || !notificationsEnabled) return;

    const scheduleNow = () => {
      const currentProfile = useProfileStore.getState().profile;
      if (!currentProfile) return;
      const tracking = useTrackingStore.getState();
      rescheduleAllReminders(currentProfile, {
        vitamins: tracking.vitamins,
        feedingLogs: tracking.feedingLogs,
        medicationLogs: tracking.medicationLogs,
        calendarEvents: tracking.calendarEvents,
      });
    };

    scheduleNow();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') scheduleNow();
    });
    return () => sub.remove();
  }, [notificationsEnabled, lifecycleStage, lmpDate]);

  // Handle notification taps (navigate to relevant screen)
  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen && navigationRef.current) {
        navigationRef.current.navigate(data.screen as string);
      }
    });
    return () => sub.remove();
  }, []);

  // Health Connect auto-sync lifecycle.
  useEffect(() => {
    if (!localUuid) return;

    const FIVE_MIN = 5 * 60 * 1000;
    const maybeSync = (): void => {
      const hc = useHealthConnectStore.getState();
      if (!hc.isConnected || hc.isSyncing) return;
      if (hc.lastSyncTimestamp && Date.now() - hc.lastSyncTimestamp < FIVE_MIN) return;
      const currentProfile = useProfileStore.getState().profile;
      const mode: 'pregnancy' | 'newborn' =
        currentProfile?.lifecycleStage === LifecycleStage.PREGNANCY ? 'pregnancy' : 'newborn';
      hc.syncAll(localUuid, mode);
    };

    useHealthConnectStore
      .getState()
      .initialize()
      .then(maybeSync)
      .catch(() => {});

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') maybeSync();
    });
    return () => sub.remove();
  }, [localUuid]);

  if (!privacyHydrated || !identityReady || !storesHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-50">
        <ActivityIndicator size="large" color="#f43f5e" />
      </View>
    );
  }

  if (!hasAcceptedPrivacy) return <PrivacyScreen />;
  if (!profile || isEditingProfile) return <SetupScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark" />
        <MainTabs />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
