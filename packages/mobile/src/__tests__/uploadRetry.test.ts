import { mergeUploadResults } from '../utils/uploadRetry';
import type { NestMedia } from '@nestly/shared';

type Picked = {
  uri: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
  uploadedUrl?: string;
  thumbnailUrl?: string;
};

const media = (extra?: Partial<Picked>): Picked => ({
  uri: 'file:///a.jpg',
  type: 'image',
  filename: 'a.jpg',
  size: 1024,
  ...extra,
});

const success = (url: string, thumbnail?: string): PromiseFulfilledResult<NestMedia> => ({
  status: 'fulfilled',
  value: { id: '1', type: 'image', url, thumbnail, filename: 'a.jpg', size: 1024 },
});

const failure = (): PromiseRejectedResult => ({
  status: 'rejected',
  reason: new Error('upload failed'),
});

describe('#272 mergeUploadResults', () => {
  test('all-success leaves uploadedUrl stamped on every item', () => {
    const items = [media(), media({ uri: 'file:///b.jpg', filename: 'b.jpg' })];
    const out = mergeUploadResults(items, [
      success('https://cdn/a.jpg', 'https://cdn/a-thumb.jpg'),
      success('https://cdn/b.jpg'),
    ]);
    expect(out[0].uploadedUrl).toBe('https://cdn/a.jpg');
    expect(out[0].thumbnailUrl).toBe('https://cdn/a-thumb.jpg');
    expect(out[1].uploadedUrl).toBe('https://cdn/b.jpg');
    expect(out[1].thumbnailUrl).toBeUndefined();
  });

  test('partial failure stamps URL on success and leaves failure untouched', () => {
    const items = [media(), media({ uri: 'file:///b.jpg', filename: 'b.jpg' })];
    const out = mergeUploadResults(items, [success('https://cdn/a.jpg'), failure()]);
    expect(out[0].uploadedUrl).toBe('https://cdn/a.jpg');
    expect(out[1].uploadedUrl).toBeUndefined();
  });

  test('all-failure leaves all items untouched', () => {
    const items = [media(), media({ uri: 'file:///b.jpg' })];
    const out = mergeUploadResults(items, [failure(), failure()]);
    expect(out[0].uploadedUrl).toBeUndefined();
    expect(out[1].uploadedUrl).toBeUndefined();
  });

  test('preserves other fields on each item', () => {
    const items = [media({ size: 9999, type: 'video' as const })];
    const out = mergeUploadResults(items, [success('https://cdn/x.mp4')]);
    expect(out[0].size).toBe(9999);
    expect(out[0].type).toBe('video');
    expect(out[0].uri).toBe('file:///a.jpg');
  });

  test('shorter results array does not throw and skips missing indices', () => {
    const items = [media(), media({ uri: 'file:///b.jpg' })];
    const out = mergeUploadResults(items, [success('https://cdn/a.jpg')]);
    expect(out[0].uploadedUrl).toBe('https://cdn/a.jpg');
    expect(out[1].uploadedUrl).toBeUndefined();
  });

  test('empty input returns empty array', () => {
    expect(mergeUploadResults([], [])).toEqual([]);
  });

  test('does not mutate the input array', () => {
    const items = [media()];
    const before = JSON.parse(JSON.stringify(items));
    mergeUploadResults(items, [success('https://cdn/a.jpg')]);
    expect(items).toEqual(before);
  });

  test('retry skip path: re-merging already-stamped item keeps the URL', () => {
    const items = [media({ uploadedUrl: 'https://cdn/a.jpg' })];
    const out = mergeUploadResults(items, [success('https://cdn/a.jpg')]);
    expect(out[0].uploadedUrl).toBe('https://cdn/a.jpg');
  });
});
