import { mergeUploadResults } from '../utils/uploadRetry';
import type { NestMedia } from '@nestly/shared';

type Picked = {
  uri: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
  uploaded?: NestMedia;
};

const media = (extra?: Partial<Picked>): Picked => ({
  uri: 'file:///a.jpg',
  type: 'image',
  filename: 'a.jpg',
  size: 1024,
  ...extra,
});

const nestMedia = (overrides?: Partial<NestMedia>): NestMedia => ({
  id: 'srv_abc',
  type: 'image',
  url: 'https://cdn/a.jpg',
  filename: 'a.jpg',
  size: 1024,
  ...overrides,
});

const success = (value: NestMedia): PromiseFulfilledResult<NestMedia> => ({
  status: 'fulfilled',
  value,
});

const failure = (): PromiseRejectedResult => ({
  status: 'rejected',
  reason: new Error('upload failed'),
});

describe('#272 mergeUploadResults', () => {
  test('all-success stamps the NestMedia on every item', () => {
    const items = [media(), media({ uri: 'file:///b.jpg', filename: 'b.jpg' })];
    const out = mergeUploadResults(items, [
      success(nestMedia({ id: 'srv_a', url: 'https://cdn/a.jpg', thumbnail: 'https://cdn/a-thumb.jpg' })),
      success(nestMedia({ id: 'srv_b', url: 'https://cdn/b.jpg' })),
    ]);
    expect(out[0].uploaded?.id).toBe('srv_a');
    expect(out[0].uploaded?.url).toBe('https://cdn/a.jpg');
    expect(out[0].uploaded?.thumbnail).toBe('https://cdn/a-thumb.jpg');
    expect(out[1].uploaded?.id).toBe('srv_b');
    expect(out[1].uploaded?.url).toBe('https://cdn/b.jpg');
    expect(out[1].uploaded?.thumbnail).toBeUndefined();
  });

  test('partial failure stamps NestMedia on success and leaves failure untouched', () => {
    const items = [media(), media({ uri: 'file:///b.jpg', filename: 'b.jpg' })];
    const out = mergeUploadResults(items, [success(nestMedia({ id: 'srv_a' })), failure()]);
    expect(out[0].uploaded?.id).toBe('srv_a');
    expect(out[1].uploaded).toBeUndefined();
  });

  test('all-failure leaves all items untouched', () => {
    const items = [media(), media({ uri: 'file:///b.jpg' })];
    const out = mergeUploadResults(items, [failure(), failure()]);
    expect(out[0].uploaded).toBeUndefined();
    expect(out[1].uploaded).toBeUndefined();
  });

  test('preserves other fields on each item', () => {
    const items = [media({ size: 9999, type: 'video' as const })];
    const out = mergeUploadResults(items, [success(nestMedia({ id: 'srv_v', type: 'video', url: 'https://cdn/x.mp4' }))]);
    expect(out[0].size).toBe(9999);
    expect(out[0].type).toBe('video');
    expect(out[0].uri).toBe('file:///a.jpg');
  });

  test('shorter results array does not throw and skips missing indices', () => {
    const items = [media(), media({ uri: 'file:///b.jpg' })];
    const out = mergeUploadResults(items, [success(nestMedia({ id: 'srv_a' }))]);
    expect(out[0].uploaded?.id).toBe('srv_a');
    expect(out[1].uploaded).toBeUndefined();
  });

  test('empty input returns empty array', () => {
    expect(mergeUploadResults([], [])).toEqual([]);
  });

  test('does not mutate the input array', () => {
    const items = [media()];
    const before = JSON.parse(JSON.stringify(items));
    mergeUploadResults(items, [success(nestMedia())]);
    expect(items).toEqual(before);
  });

  test('retry skip path: preserves original server-assigned id through re-merge', () => {
    const items = [media({ uploaded: nestMedia({ id: 'srv_original', url: 'https://cdn/a.jpg' }) })];
    const out = mergeUploadResults(items, [
      success(nestMedia({ id: 'srv_original', url: 'https://cdn/a.jpg' })),
    ]);
    expect(out[0].uploaded?.id).toBe('srv_original');
    expect(out[0].uploaded?.url).toBe('https://cdn/a.jpg');
  });
});
