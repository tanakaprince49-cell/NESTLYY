import type { NestMedia } from '@nestly/shared';

export interface RetryableMedia {
  uri: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
  duration?: number;
  uploadedUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Merge per-asset upload outcomes back into the picked-media list. Successful
 * uploads stamp `uploadedUrl` (and `thumbnailUrl` when present) onto the
 * matching item so a retry skips the asset entirely instead of re-uploading
 * the bytes. Failed indices stay untouched.
 */
export function mergeUploadResults<T extends RetryableMedia>(
  media: T[],
  results: PromiseSettledResult<NestMedia>[],
): T[] {
  return media.map((item, idx) => {
    const res = results[idx];
    if (!res || res.status !== 'fulfilled') return item;
    return { ...item, uploadedUrl: res.value.url, thumbnailUrl: res.value.thumbnail };
  });
}

export function settledFulfilledCount(results: PromiseSettledResult<unknown>[]): number {
  return results.reduce((n, r) => (r.status === 'fulfilled' ? n + 1 : n), 0);
}
