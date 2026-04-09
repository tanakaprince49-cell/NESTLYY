import { create } from 'zustand';
import type { WeightLog, BloodPressureLog, SleepLog } from '../types.ts';
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

const genId = (): string =>
  (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
  (Date.now().toString(36) + Math.random().toString(36).slice(2));

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
  syncAll: (userId: string, sleepMode: 'pregnancy' | 'newborn') => Promise<void>;
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

  syncAll: async (userId: string, sleepMode: 'pregnancy' | 'newborn') => {
    const state = get();
    if (state.isSyncing || !state.isConnected) return;

    set({ isSyncing: true, syncError: null });
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { useTrackingStore } = await import('./trackingStore.ts');

      // ── Sync weight ──
      if (state.permissions.Weight) {
        // Snapshot local logs for iteration
        const localWeights = [...useTrackingStore.getState().weightLogs];
        const hcWeights = await readWeightRecords(startDate, endDate);

        // Import HC records that don't exist locally
        const newWeights: WeightLog[] = [];
        for (const hcW of hcWeights) {
          if (!findDuplicateWeight(hcW, localWeights)) {
            newWeights.push({
              ...hcW,
              id: genId(),
              source: 'health_connect',
            });
          }
        }
        if (newWeights.length > 0) {
          useTrackingStore.setState((s) => ({
            weightLogs: [...s.weightLogs, ...newWeights],
          }));
        }

        // Push local records to HC
        const tagsToApply: Array<{ id: string; hcRecordId: string }> = [];
        for (const local of localWeights) {
          if (!local.hcRecordId && local.source !== 'health_connect') {
            const hcId = await writeWeightRecord(local);
            if (hcId) tagsToApply.push({ id: local.id, hcRecordId: hcId });
          }
        }
        if (tagsToApply.length > 0) {
          useTrackingStore.setState((s) => ({
            weightLogs: s.weightLogs.map((l) => {
              const tag = tagsToApply.find((t) => t.id === l.id);
              return tag ? { ...l, hcRecordId: tag.hcRecordId } : l;
            }),
          }));
        }
      }

      // ── Sync blood pressure ──
      if (state.permissions.BloodPressure) {
        const localBPs = [...useTrackingStore.getState().bloodPressureLogs];
        const hcBPs = await readBloodPressureRecords(startDate, endDate);

        const newBPs: BloodPressureLog[] = [];
        for (const hcBP of hcBPs) {
          if (!findDuplicateBP(hcBP, localBPs)) {
            newBPs.push({
              ...hcBP,
              id: genId(),
              source: 'health_connect',
            });
          }
        }
        if (newBPs.length > 0) {
          useTrackingStore.setState((s) => ({
            bloodPressureLogs: [...s.bloodPressureLogs, ...newBPs],
          }));
        }

        const tagsToApply: Array<{ id: string; hcRecordId: string }> = [];
        for (const local of localBPs) {
          if (!local.hcRecordId && local.source !== 'health_connect') {
            const hcId = await writeBloodPressureRecord(local);
            if (hcId) tagsToApply.push({ id: local.id, hcRecordId: hcId });
          }
        }
        if (tagsToApply.length > 0) {
          useTrackingStore.setState((s) => ({
            bloodPressureLogs: s.bloodPressureLogs.map((l) => {
              const tag = tagsToApply.find((t) => t.id === l.id);
              return tag ? { ...l, hcRecordId: tag.hcRecordId } : l;
            }),
          }));
        }
      }

      // ── Sync sleep ──
      if (state.permissions.SleepSession) {
        const localSleeps = [...useTrackingStore.getState().sleepLogs];
        const hcSleeps = await readSleepSessions(startDate, endDate);

        const newSleeps: SleepLog[] = [];
        for (const hcS of hcSleeps) {
          if (!findDuplicateSleep(hcS, localSleeps)) {
            newSleeps.push({
              ...hcS,
              id: genId(),
              userId,
              mode: sleepMode,
              source: 'health_connect',
            });
          }
        }
        if (newSleeps.length > 0) {
          useTrackingStore.setState((s) => ({
            sleepLogs: [...s.sleepLogs, ...newSleeps],
          }));
        }

        const tagsToApply: Array<{ id: string; hcRecordId: string }> = [];
        for (const local of localSleeps) {
          if (!local.hcRecordId && local.source !== 'health_connect') {
            const hcId = await writeSleepSession(local);
            if (hcId) tagsToApply.push({ id: local.id, hcRecordId: hcId });
          }
        }
        if (tagsToApply.length > 0) {
          useTrackingStore.setState((s) => ({
            sleepLogs: s.sleepLogs.map((l) => {
              const tag = tagsToApply.find((t) => t.id === l.id);
              return tag ? { ...l, hcRecordId: tag.hcRecordId } : l;
            }),
          }));
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
