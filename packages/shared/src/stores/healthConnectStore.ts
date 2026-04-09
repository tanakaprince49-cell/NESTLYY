import { create } from 'zustand';
import type { HealthConnectPermissionType } from '../services/healthConnectService.ts';
import {
  initializeHealthConnect,
  isHealthConnectAvailable,
  requestHealthConnectPermissions,
  hasHealthConnectPermissions,
  revokeHealthConnectPermissions,
  readWeightRecords,
  readBloodPressureRecords,
  readSleepSessions,
  findDuplicateWeight,
  findDuplicateBP,
  findDuplicateSleep,
  writeWeightRecord,
  writeBloodPressureRecord,
  writeSleepSession,
} from '../services/healthConnectService.ts';

interface HealthConnectState {
  isAvailable: boolean;
  isConnected: boolean;
  isInitialized: boolean;
  permissions: Record<HealthConnectPermissionType, boolean>;
  isSyncing: boolean;
  lastSyncTimestamp: number | null;
  syncError: string | null;

  initialize: () => Promise<void>;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  syncAll: (userId: string) => Promise<void>;
  setSyncError: (error: string | null) => void;
}

export const useHealthConnectStore = create<HealthConnectState>()((set, get) => ({
  isAvailable: false,
  isConnected: false,
  isInitialized: false,
  permissions: { Weight: false, BloodPressure: false, HeartRate: false, SleepSession: false },
  isSyncing: false,
  lastSyncTimestamp: null,
  syncError: null,

  initialize: async () => {
    if (get().isInitialized) return;
    try {
      await initializeHealthConnect();
      const available = await isHealthConnectAvailable();
      set({ isAvailable: available, isInitialized: true });
      if (available) {
        const perms = await hasHealthConnectPermissions();
        const connected = Object.values(perms).some(Boolean);
        set({ permissions: perms, isConnected: connected });
      }
    } catch {
      set({ isAvailable: false, isInitialized: true });
    }
  },

  connect: async () => {
    try {
      await initializeHealthConnect();
      const granted = await requestHealthConnectPermissions();
      if (granted) {
        const perms = await hasHealthConnectPermissions();
        set({ permissions: perms, isConnected: true, syncError: null });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  disconnect: async () => {
    try {
      await revokeHealthConnectPermissions();
    } catch {
      // Best-effort
    }
    set({
      isConnected: false,
      permissions: { Weight: false, BloodPressure: false, HeartRate: false, SleepSession: false },
      lastSyncTimestamp: null,
      syncError: null,
    });
  },

  refreshPermissions: async () => {
    try {
      const perms = await hasHealthConnectPermissions();
      const connected = Object.values(perms).some(Boolean);
      set({ permissions: perms, isConnected: connected });
    } catch {
      // Silently fail
    }
  },

  syncAll: async (userId: string) => {
    const state = get();
    if (state.isSyncing || !state.isConnected) return;

    set({ isSyncing: true, syncError: null });
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Import tracking store dynamically to avoid circular deps
      const { useTrackingStore } = await import('./trackingStore.ts');
      const tracking = useTrackingStore.getState();

      // Sync weight
      if (state.permissions.Weight) {
        const hcWeights = await readWeightRecords(startDate, endDate);
        for (const hcW of hcWeights) {
          if (!findDuplicateWeight(hcW, tracking.weightLogs)) {
            tracking.addWeightLog({ weight: hcW.weight });
          }
        }
        // Write local records without HC counterpart
        for (const local of tracking.weightLogs) {
          if (!local.hcRecordId && local.source !== 'health_connect') {
            const hcId = await writeWeightRecord(local);
            if (hcId) {
              // Mark as synced by updating the log in-place
              const idx = tracking.weightLogs.findIndex((l) => l.id === local.id);
              if (idx >= 0) tracking.weightLogs[idx].hcRecordId = hcId;
            }
          }
        }
      }

      // Sync blood pressure
      if (state.permissions.BloodPressure) {
        const hcBPs = await readBloodPressureRecords(startDate, endDate);
        for (const hcBP of hcBPs) {
          if (!findDuplicateBP(hcBP, tracking.bloodPressureLogs)) {
            tracking.addBloodPressureLog({
              systolic: hcBP.systolic,
              diastolic: hcBP.diastolic,
              pulse: hcBP.pulse,
            });
          }
        }
        for (const local of tracking.bloodPressureLogs) {
          if (!local.hcRecordId && local.source !== 'health_connect') {
            const hcId = await writeBloodPressureRecord(local);
            if (hcId) {
              const idx = tracking.bloodPressureLogs.findIndex((l) => l.id === local.id);
              if (idx >= 0) tracking.bloodPressureLogs[idx].hcRecordId = hcId;
            }
          }
        }
      }

      // Sync sleep
      if (state.permissions.SleepSession) {
        const hcSleeps = await readSleepSessions(startDate, endDate);
        for (const hcS of hcSleeps) {
          if (!findDuplicateSleep(hcS, tracking.sleepLogs)) {
            tracking.addSleepLog({
              userId,
              startTime: hcS.startTime,
              endTime: hcS.endTime,
              mode: hcS.mode,
              type: hcS.type,
            });
          }
        }
        for (const local of tracking.sleepLogs) {
          if (!local.hcRecordId && local.source !== 'health_connect') {
            const hcId = await writeSleepSession(local);
            if (hcId) {
              const idx = tracking.sleepLogs.findIndex((l) => l.id === local.id);
              if (idx >= 0) tracking.sleepLogs[idx].hcRecordId = hcId;
            }
          }
        }
      }

      set({ lastSyncTimestamp: Date.now(), isSyncing: false });
    } catch (e) {
      set({
        syncError: e instanceof Error ? e.message : 'Sync failed',
        isSyncing: false,
      });
    }
  },

  setSyncError: (syncError) => set({ syncError }),
}));
