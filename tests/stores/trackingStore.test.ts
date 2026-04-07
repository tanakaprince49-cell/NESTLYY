import { describe, it, expect, beforeEach } from 'vitest';
import { useTrackingStore } from '../../packages/shared/src/stores/trackingStore.ts';

describe('trackingStore', () => {
  beforeEach(() => {
    useTrackingStore.getState().resetAllLogs();
  });

  it('starts with empty arrays', () => {
    const state = useTrackingStore.getState();
    expect(state.feedingLogs).toEqual([]);
    expect(state.sleepLogs).toEqual([]);
    expect(state.symptoms).toEqual([]);
  });

  it('addFeedingLog adds a log with generated id and timestamp', () => {
    useTrackingStore.getState().addFeedingLog({
      type: 'breast',
      duration: 15,
      amount: null,
      side: 'left',
      notes: '',
      babyId: 'baby-1',
    } as any);
    const logs = useTrackingStore.getState().feedingLogs;
    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBeDefined();
    expect(logs[0].timestamp).toBeDefined();
  });

  it('removeFeedingLog removes by id', () => {
    useTrackingStore.getState().addFeedingLog({
      type: 'bottle',
      duration: 10,
      amount: 120,
      side: null,
      notes: '',
      babyId: 'baby-1',
    } as any);
    const id = useTrackingStore.getState().feedingLogs[0].id;
    useTrackingStore.getState().removeFeedingLog(id);
    expect(useTrackingStore.getState().feedingLogs).toHaveLength(0);
  });

  it('setFeedingLogs replaces the entire array', () => {
    const mockLogs = [
      { id: '1', timestamp: Date.now(), type: 'breast', duration: 10, amount: null, side: 'left', notes: '', babyId: 'b1' },
      { id: '2', timestamp: Date.now(), type: 'bottle', duration: 5, amount: 60, side: null, notes: '', babyId: 'b1' },
    ] as any[];
    useTrackingStore.getState().setFeedingLogs(mockLogs);
    expect(useTrackingStore.getState().feedingLogs).toHaveLength(2);
  });

  it('resetAllLogs clears everything', () => {
    useTrackingStore.getState().addFeedingLog({ type: 'breast' } as any);
    useTrackingStore.getState().addSleepLog({ quality: 3 } as any);
    useTrackingStore.getState().resetAllLogs();
    const state = useTrackingStore.getState();
    expect(state.feedingLogs).toHaveLength(0);
    expect(state.sleepLogs).toHaveLength(0);
  });
});
