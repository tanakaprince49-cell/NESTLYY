import './global.css';
import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, registerHealthConnectModule } from '@nestly/shared';
import { rehydrateUserStores } from './stores/bootstrap';

// Register native Health Connect module early so write-through in trackers works.
try {
  registerHealthConnectModule(require('react-native-health-connect'));
} catch {
  // Not available (Expo Go or missing native module)
}
import { useAuthStore, useProfileStore, useTrackingStore } from '@nestly/shared/stores';
import { AuthScreen } from './screens/AuthScreen';
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
  const { authEmail, loading, hasAcceptedPrivacy, setAuth, clearAuth, setLoading } = useAuthStore();
  const { profile, isEditingProfile } = useProfileStore();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [storesHydrated, setStoresHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const identifier = user.email || `anon-${user.uid}`;
        setAuth(identifier, user.uid);
        // Now that authEmail is set, rehydrate user-scoped stores so the
        // persist middleware reads from the correct bucket (not the guest
        // fallback). This is why every persisted store uses skipHydration.
        await rehydrateUserStores();
        setStoresHydrated(true);
      } else {
        clearAuth();
        setStoresHydrated(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [setAuth, clearAuth, setLoading]);

  // Initialize notifications after auth
  useEffect(() => {
    if (!authEmail || !profile) return;
    if (!profile.notificationsEnabled) return;

    requestNotificationPermissions().then((granted) => {
      if (granted) registerPushToken();
    });
  }, [authEmail, profile?.notificationsEnabled]);

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

  // Show a spinner while (a) Firebase auth is resolving, or (b) a signed-in
  // user has been detected but their persisted stores have not been
  // rehydrated yet. Without the second condition, SetupScreen would briefly
  // flash on every cold launch because `profile` starts as null.
  if (loading || (authEmail && !storesHydrated)) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-50">
        <ActivityIndicator size="large" color="#f43f5e" />
      </View>
    );
  }

  if (!authEmail) return <AuthScreen />;
  if (!hasAcceptedPrivacy) return <PrivacyScreen />;
  if (!profile || isEditingProfile) return <SetupScreen />;

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" />
      <MainTabs />
    </NavigationContainer>
  );
}
