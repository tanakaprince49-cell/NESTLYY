import './global.css';
import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, registerHealthConnectModule, LifecycleStage } from '@nestly/shared';
import { rehydrateUserStores } from './stores/bootstrap';

// Register native Health Connect module early so write-through in trackers works.
try {
  registerHealthConnectModule(require('react-native-health-connect'));
} catch {
  // Not available (Expo Go or missing native module)
}
import {
  useAuthStore,
  useProfileStore,
  useTrackingStore,
  useHealthConnectStore,
} from '@nestly/shared/stores';
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
        // Reset the hydration gate before setAuth so a sign-in-after-sign-out
        // cannot briefly expose the previous user's in-memory state while the
        // new account rehydrates from its own persisted bucket.
        setStoresHydrated(false);
        const identifier = user.email || `anon-${user.uid}`;
        setAuth(identifier, user.uid);
        // Now that authEmail is set, rehydrate user-scoped stores so the
        // persist middleware reads from the correct bucket (not the guest
        // fallback). This is why every persisted store uses skipHydration.
        await rehydrateUserStores();
        setStoresHydrated(true);
      } else {
        // Wipe Health Connect sync metadata on every sign-out path, not only
        // the explicit Settings → Sign Out flow (which already covers it via
        // SettingsScreen.resetAllUserStateInMemory). Token revocation and
        // server-side session expiry land here directly, so without this
        // call the next user to sign in on the same device without a cold
        // restart would inherit the previous user's 5-minute throttle
        // window and any lingering syncError banner. See #251.
        useHealthConnectStore.getState().resetSyncState();
        clearAuth();
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

  // Health Connect auto-sync lifecycle.
  //
  // Problem we are fixing (issue #219): before this effect, syncAll was only
  // invoked by the "Sync Now" button in Settings. A user who granted
  // permissions via the system dialog and then opened the Dashboard would
  // see no Health Connect data until they hunted down the sync button. On
  // foreground resume nothing ran either, so data written to HC by other
  // apps (scales, BP cuffs) never flowed in.
  //
  // What this effect does:
  //   1. Initialises the Health Connect store once on app mount so that
  //      `isConnected` reflects previously-granted permissions even when the
  //      user never opens Settings. Previously, init was owned by
  //      HealthConnectSection which only mounts on the Settings tab.
  //   2. Runs a sync immediately on mount if already connected (cold start
  //      with permissions persisted from a prior session).
  //   3. Triggers a sync on every foreground resume, throttled to one sync
  //      per 5 minutes to avoid thrashing on quick background / foreground
  //      toggles (e.g. the user briefly checks another app).
  useEffect(() => {
    if (!authEmail) return;

    const FIVE_MIN = 5 * 60 * 1000;
    const maybeSync = (): void => {
      const hc = useHealthConnectStore.getState();
      if (!hc.isConnected || hc.isSyncing) return;
      if (hc.lastSyncTimestamp && Date.now() - hc.lastSyncTimestamp < FIVE_MIN) return;
      const currentProfile = useProfileStore.getState().profile;
      const mode: 'pregnancy' | 'newborn' =
        currentProfile?.lifecycleStage === LifecycleStage.PREGNANCY ? 'pregnancy' : 'newborn';
      hc.syncAll(authEmail, mode);
    };

    // Kick off initialization then an initial sync. Both are idempotent.
    // Sync failures are not actually swallowed: syncAll's internal try/catch
    // writes into useHealthConnectStore.syncError, and DashboardScreen
    // surfaces that via a tap-to-fix banner (see #253). The .catch below
    // only guards against an unexpected rejection from initialize() itself,
    // which has its own internal try/catch and should never reject in
    // practice. On devices without Health Connect, initialize() quietly sets
    // isAvailable=false and the banner stays hidden (gated on isConnected).
    useHealthConnectStore
      .getState()
      .initialize()
      .then(maybeSync)
      .catch(() => {
        // Defensive only, see comment above.
      });

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') maybeSync();
    });
    return () => sub.remove();
  }, [authEmail]);

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
