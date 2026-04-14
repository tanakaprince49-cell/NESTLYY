import type { NestMedia } from '@nestly/shared';

export interface RetryableMedia {
  uri: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
  duration?: number;
  uploaded?: NestMedia;
}

/**
 * Merge per-asset upload outcomes back into the picked-media list. Successful
 * uploads stamp the returned `NestMedia` onto the matching item under
 * `uploaded` so a Send retry skips the asset entirely (preserving its original
 * storage-assigned id, url, thumbnail, size, and duration) instead of
 * re-uploading the bytes. Failed indices stay untouched.
 */
export function mergeUploadResults<T extends RetryableMedia>(
  media: T[],
  results: PromiseSettledResult<NestMedia>[],
): T[] {
  return media.map((item, idx) => {
    const res = results[idx];
    if (!res || res.status !== 'fulfilled') return item;
    return { ...item, uploaded: res.value };
  });
}

export function settledFulfilledCount(results: PromiseSettledResult<unknown>[]): number {
  return results.reduce((n, r) => (r.status === 'fulfilled' ? n + 1 : n), 0);
}
