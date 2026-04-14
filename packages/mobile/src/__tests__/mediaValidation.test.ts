// Pure-function tests for validateMedia (#270).

import { validateMedia } from '../utils/mediaValidation';

const MB = 1024 * 1024;

describe('#270 validateMedia -- images', () => {
  test('JPEG image under 10 MB passes', () => {
    const result = validateMedia({ type: 'image', fileSize: 5 * MB, mimeType: 'image/jpeg' });
    expect(result.ok).toBe(true);
  });

  test('PNG image under 10 MB passes', () => {
    const result = validateMedia({ type: 'image', fileSize: 3 * MB, mimeType: 'image/png' });
    expect(result.ok).toBe(true);
  });

  test('WebP image under 10 MB passes', () => {
    const result = validateMedia({ type: 'image', fileSize: 2 * MB, mimeType: 'image/webp' });
    expect(result.ok).toBe(true);
  });

  test('image exactly at 10 MB passes', () => {
    const result = validateMedia({ type: 'image', fileSize: 10 * MB, mimeType: 'image/jpeg' });
    expect(result.ok).toBe(true);
  });

  test('image over 10 MB fails', () => {
    const result = validateMedia({ type: 'image', fileSize: 10 * MB + 1, mimeType: 'image/jpeg' });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/10 MB/);
  });

  test('unsupported image type fails', () => {
    const result = validateMedia({ type: 'image', fileSize: 1 * MB, mimeType: 'image/gif' });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/JPEG|PNG|WebP/);
  });

  test('no mimeType skips type check', () => {
    const result = validateMedia({ type: 'image', fileSize: 1 * MB });
    expect(result.ok).toBe(true);
  });
});

describe('#270 validateMedia -- videos', () => {
  test('MP4 video under 30 MB and 30 seconds passes', () => {
    const result = validateMedia({ type: 'video', fileSize: 20 * MB, duration: 25000, mimeType: 'video/mp4' });
    expect(result.ok).toBe(true);
  });

  test('MOV video passes', () => {
    const result = validateMedia({ type: 'video', fileSize: 10 * MB, duration: 10000, mimeType: 'video/quicktime' });
    expect(result.ok).toBe(true);
  });

  test('video exactly at 30 MB passes', () => {
    const result = validateMedia({ type: 'video', fileSize: 30 * MB, duration: 10000, mimeType: 'video/mp4' });
    expect(result.ok).toBe(true);
  });

  test('video over 30 MB fails', () => {
    const result = validateMedia({ type: 'video', fileSize: 30 * MB + 1, duration: 10000, mimeType: 'video/mp4' });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/30 MB/);
  });

  test('video exactly 30 seconds passes', () => {
    const result = validateMedia({ type: 'video', fileSize: 10 * MB, duration: 30000, mimeType: 'video/mp4' });
    expect(result.ok).toBe(true);
  });

  test('video over 30 seconds fails', () => {
    const result = validateMedia({ type: 'video', fileSize: 10 * MB, duration: 30001, mimeType: 'video/mp4' });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/30 seconds/);
  });

  test('unsupported video type fails', () => {
    const result = validateMedia({ type: 'video', fileSize: 10 * MB, duration: 10000, mimeType: 'video/avi' });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/MP4|MOV/);
  });

  test('no mimeType skips type check', () => {
    const result = validateMedia({ type: 'video', fileSize: 10 * MB, duration: 10000 });
    expect(result.ok).toBe(true);
  });

  test('no duration treats as 0 seconds (passes)', () => {
    const result = validateMedia({ type: 'video', fileSize: 10 * MB, mimeType: 'video/mp4' });
    expect(result.ok).toBe(true);
  });
});
