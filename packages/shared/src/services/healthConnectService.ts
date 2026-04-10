import type { WeightLog, BloodPressureLog, SleepLog } from '../types.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- optional native module, unavailable in web/Expo Go
let _hc: any = null;

// The HC module must be injected from the mobile package via registerHealthConnectModule().
// This avoids dynamic import/require in shared, which breaks both Vite (can't resolve RN
// Flow syntax) and Metro production builds (rejects non-literal require arguments).
export function registerHealthConnectModule(mod: any): void {
  _hc = mod;
}

function getHC(): any {
  return _hc;
}

const genId = (): string =>
  (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
  (Date.now().toString(36) + Math.random().toString(36).slice(2));

// -- Availability -----------------------------------------------------------

export async function initializeHealthConnect(): Promise<void> {
  const hc = await getHC();
  if (!hc) return;
  await hc.initialize();
}

export async function isHealthConnectAvailable(): Promise<boolean> {
  const hc = await getHC();
  if (!hc) return false;
  try {
    const status = await hc.getSdkStatus();
    return status === hc.SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

// -- Permissions ------------------------------------------------------------

export type HealthConnectPermissionType = 'Weight' | 'BloodPressure' | 'HeartRate' | 'SleepSession';

const ALL_PERMISSIONS = [
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'write', recordType: 'Weight' },
  { accessType: 'read', recordType: 'BloodPressure' },
  { accessType: 'write', recordType: 'BloodPressure' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'write', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'write', recordType: 'SleepSession' },
];

export async function requestHealthConnectPermissions(): Promise<boolean> {
  const hc = await getHC();
  if (!hc) return false;
  try {
    const granted = await hc.requestPermission(ALL_PERMISSIONS);
    return granted.length > 0;
  } catch {
    return false;
  }
}

export async function hasHealthConnectPermissions(): Promise<Record<HealthConnectPermissionType, boolean>> {
  const defaults: Record<HealthConnectPermissionType, boolean> = {
    Weight: false, BloodPressure: false, HeartRate: false, SleepSession: false,
  };
  const hc = await getHC();
  if (!hc) return defaults;
  try {
    const granted: Array<{ recordType?: string }> = await hc.getGrantedPermissions();
    const types = new Set(granted.map((p) => p.recordType));
    return {
      Weight: types.has('Weight'),
      BloodPressure: types.has('BloodPressure'),
      HeartRate: types.has('HeartRate'),
      SleepSession: types.has('SleepSession'),
    };
  } catch {
    return defaults;
  }
}

export async function revokeHealthConnectPermissions(): Promise<void> {
  const hc = await getHC();
  if (!hc) return;
  try {
    await hc.revokeAllPermissions();
  } catch {
    // User can revoke via HC app
  }
}

// -- Read from Health Connect -----------------------------------------------

export async function readWeightRecords(startDate: Date, endDate: Date): Promise<WeightLog[]> {
  const hc = await getHC();
  if (!hc) return [];
  try {
    const result = await hc.readRecords('Weight', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });
    // RecordResult<'Weight'> has: time, weight (MassResult), metadata?
    return result.records.map((r: any) => ({
      id: genId(),
      weight: r.weight?.inKilograms ?? 0,
      timestamp: new Date(r.time).getTime(),
      source: 'health_connect' as const,
      hcRecordId: r.metadata?.id,
    }));
  } catch {
    return [];
  }
}

export async function readBloodPressureRecords(startDate: Date, endDate: Date): Promise<BloodPressureLog[]> {
  const hc = await getHC();
  if (!hc) return [];
  try {
    const timeRange = {
      timeRangeFilter: {
        operator: 'between' as const,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    };
    const bpResult = await hc.readRecords('BloodPressure', timeRange);
    const hrResult = await hc.readRecords('HeartRate', timeRange);

    // RecordResult<'BloodPressure'> has: time, systolic (PressureResult), diastolic (PressureResult)
    // RecordResult<'HeartRate'> has: startTime, endTime, samples: HeartRateSample[]
    return bpResult.records.map((r: any) => {
      const bpTime = new Date(r.time).getTime();
      // Correlate heart rate by timestamp (HeartRate is IntervalRecord: startTime, not time)
      const matchingHr = hrResult.records.find((hr: any) => {
        const hrTime = new Date(hr.startTime).getTime();
        return Math.abs(hrTime - bpTime) < 60_000;
      });
      const pulse: number | undefined = matchingHr?.samples?.[0]?.beatsPerMinute;

      return {
        id: genId(),
        systolic: r.systolic?.inMillimetersOfMercury ?? 0,
        diastolic: r.diastolic?.inMillimetersOfMercury ?? 0,
        pulse,
        timestamp: bpTime,
        source: 'health_connect' as const,
        hcRecordId: r.metadata?.id,
      };
    });
  } catch {
    return [];
  }
}

export async function readSleepSessions(startDate: Date, endDate: Date): Promise<SleepLog[]> {
  const hc = await getHC();
  if (!hc) return [];
  try {
    const result = await hc.readRecords('SleepSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });
    // RecordResult<'SleepSession'> has: startTime, endTime, stages?, title?, notes?, metadata?
    return result.records.map((r: any) => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      const durationMs = end.getTime() - start.getTime();
      const isNap = durationMs < 3 * 60 * 60 * 1000;

      return {
        id: genId(),
        userId: '',
        startTime: r.startTime as string,
        endTime: r.endTime as string,
        mode: 'pregnancy' as const,
        type: isNap ? ('nap' as const) : ('night' as const),
        timestamp: start.getTime(),
        source: 'health_connect' as const,
        hcRecordId: r.metadata?.id,
      };
    });
  } catch {
    return [];
  }
}

// -- Write to Health Connect ------------------------------------------------

export async function writeWeightRecord(log: WeightLog): Promise<string | undefined> {
  const hc = await getHC();
  if (!hc) return undefined;
  try {
    // insertRecords returns string[] (record IDs)
    const ids: string[] = await hc.insertRecords([
      {
        recordType: 'Weight',
        time: new Date(log.timestamp).toISOString(),
        weight: { value: log.weight, unit: 'kilograms' },
      },
    ]);
    return ids[0];
  } catch {
    return undefined;
  }
}

export async function writeBloodPressureRecord(log: BloodPressureLog): Promise<string | undefined> {
  const hc = await getHC();
  if (!hc) return undefined;
  try {
    const time = new Date(log.timestamp).toISOString();
    const bpIds: string[] = await hc.insertRecords([
      {
        recordType: 'BloodPressure',
        time,
        systolic: { value: log.systolic, unit: 'millimetersOfMercury' },
        diastolic: { value: log.diastolic, unit: 'millimetersOfMercury' },
        measurementLocation: 0,
        bodyPosition: 0,
      },
    ]);
    // Write heart rate as a separate call (insertRecords requires same type)
    if (log.pulse) {
      await hc.insertRecords([
        {
          recordType: 'HeartRate',
          startTime: time,
          endTime: time,
          samples: [{ time, beatsPerMinute: log.pulse }],
        },
      ]).catch(() => {});
    }
    return bpIds[0];
  } catch {
    return undefined;
  }
}

export async function writeSleepSession(log: SleepLog): Promise<string | undefined> {
  const hc = await getHC();
  if (!hc) return undefined;
  try {
    const ids: string[] = await hc.insertRecords([
      {
        recordType: 'SleepSession',
        startTime: log.startTime,
        endTime: log.endTime,
      },
    ]);
    return ids[0];
  } catch {
    return undefined;
  }
}

// -- Deduplication helpers --------------------------------------------------

const DEDUP_WINDOW_MS = 60_000;

export function findDuplicateWeight(
  hcRecord: WeightLog,
  localRecords: WeightLog[],
): WeightLog | undefined {
  return localRecords.find(
    (local) =>
      Math.abs(local.timestamp - hcRecord.timestamp) < DEDUP_WINDOW_MS &&
      Math.abs(local.weight - hcRecord.weight) < 0.1,
  );
}

export function findDuplicateBP(
  hcRecord: BloodPressureLog,
  localRecords: BloodPressureLog[],
): BloodPressureLog | undefined {
  return localRecords.find(
    (local) =>
      Math.abs(local.timestamp - hcRecord.timestamp) < DEDUP_WINDOW_MS &&
      local.systolic === hcRecord.systolic &&
      local.diastolic === hcRecord.diastolic,
  );
}

export function findDuplicateSleep(
  hcRecord: SleepLog,
  localRecords: SleepLog[],
): SleepLog | undefined {
  const hcStart = new Date(hcRecord.startTime).getTime();
  const hcEnd = new Date(hcRecord.endTime).getTime();
  return localRecords.find((local) => {
    const localStart = new Date(local.startTime).getTime();
    const localEnd = new Date(local.endTime).getTime();
    return (
      Math.abs(localStart - hcStart) < DEDUP_WINDOW_MS &&
      Math.abs(localEnd - hcEnd) < DEDUP_WINDOW_MS
    );
  });
}
