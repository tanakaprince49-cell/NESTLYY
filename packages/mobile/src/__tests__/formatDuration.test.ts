import { formatDuration } from '../utils/formatDuration';

describe('#272 formatDuration', () => {
  test('null and undefined return null', () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(undefined)).toBeNull();
  });

  test('zero and negative return null', () => {
    expect(formatDuration(0)).toBeNull();
    expect(formatDuration(-5)).toBeNull();
  });

  test('non-finite returns null', () => {
    expect(formatDuration(NaN)).toBeNull();
    expect(formatDuration(Infinity)).toBeNull();
  });

  test('sub-minute: pads seconds with leading zero', () => {
    expect(formatDuration(1)).toBe('0:01');
    expect(formatDuration(9)).toBe('0:09');
    expect(formatDuration(23)).toBe('0:23');
    expect(formatDuration(59)).toBe('0:59');
  });

  test('one to nine minutes: m:ss', () => {
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(75)).toBe('1:15');
    expect(formatDuration(599)).toBe('9:59');
  });

  test('ten minutes and up: mm:ss', () => {
    expect(formatDuration(600)).toBe('10:00');
    expect(formatDuration(3600)).toBe('60:00');
  });

  test('floors fractional seconds', () => {
    expect(formatDuration(23.7)).toBe('0:23');
    expect(formatDuration(60.9)).toBe('1:00');
  });
});
