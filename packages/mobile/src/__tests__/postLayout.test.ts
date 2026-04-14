// Pure-function tests for buildMediaLayout (#270).

import { buildMediaLayout } from '../utils/postLayout';
import type { NestMedia } from '@nestly/shared';

function makeMedia(overrides: Partial<NestMedia> & { id: string }): NestMedia {
  return {
    type: 'image',
    url: `https://example.com/${overrides.id}.jpg`,
    filename: `${overrides.id}.jpg`,
    size: 1000,
    ...overrides,
  };
}

describe('#270 buildMediaLayout -- single item', () => {
  test('returns one item with gridArea single', () => {
    const media = [makeMedia({ id: 'a' })];
    const result = buildMediaLayout(media);
    expect(result).toHaveLength(1);
    expect(result[0].gridArea).toBe('single');
    expect(result[0].isVideo).toBe(false);
  });

  test('uses thumbnail uri when available', () => {
    const media = [makeMedia({ id: 'a', thumbnail: 'https://thumb.example.com/a.jpg' })];
    const result = buildMediaLayout(media);
    expect(result[0].uri).toBe('https://thumb.example.com/a.jpg');
  });

  test('falls back to url when no thumbnail', () => {
    const media = [makeMedia({ id: 'a' })];
    const result = buildMediaLayout(media);
    expect(result[0].uri).toBe('https://example.com/a.jpg');
  });

  test('marks video items as isVideo true', () => {
    const media = [makeMedia({ id: 'v', type: 'video' })];
    const result = buildMediaLayout(media);
    expect(result[0].isVideo).toBe(true);
  });
});

describe('#270 buildMediaLayout -- two items', () => {
  test('returns two items with pair-left and pair-right', () => {
    const media = [makeMedia({ id: 'a' }), makeMedia({ id: 'b' })];
    const result = buildMediaLayout(media);
    expect(result).toHaveLength(2);
    expect(result[0].gridArea).toBe('pair-left');
    expect(result[1].gridArea).toBe('pair-right');
  });

  test('both items have aspect 1', () => {
    const media = [makeMedia({ id: 'a' }), makeMedia({ id: 'b' })];
    const result = buildMediaLayout(media);
    expect(result[0].aspect).toBe(1);
    expect(result[1].aspect).toBe(1);
  });
});

describe('#270 buildMediaLayout -- three items', () => {
  test('returns three items with left, right-top, right-bottom', () => {
    const media = [makeMedia({ id: 'a' }), makeMedia({ id: 'b' }), makeMedia({ id: 'c' })];
    const result = buildMediaLayout(media);
    expect(result).toHaveLength(3);
    expect(result[0].gridArea).toBe('left');
    expect(result[1].gridArea).toBe('right-top');
    expect(result[2].gridArea).toBe('right-bottom');
  });

  test('left tile has aspect 2/3', () => {
    const media = [makeMedia({ id: 'a' }), makeMedia({ id: 'b' }), makeMedia({ id: 'c' })];
    const result = buildMediaLayout(media);
    expect(result[0].aspect).toBeCloseTo(2 / 3);
  });
});

describe('#270 buildMediaLayout -- four items', () => {
  test('returns four items with grid areas', () => {
    const media = [
      makeMedia({ id: 'a' }),
      makeMedia({ id: 'b' }),
      makeMedia({ id: 'c' }),
      makeMedia({ id: 'd' }),
    ];
    const result = buildMediaLayout(media);
    expect(result).toHaveLength(4);
    expect(result[0].gridArea).toBe('grid-tl');
    expect(result[1].gridArea).toBe('grid-tr');
    expect(result[2].gridArea).toBe('grid-bl');
    expect(result[3].gridArea).toBe('grid-br');
  });
});

describe('#270 buildMediaLayout -- edge cases', () => {
  test('empty array returns empty array', () => {
    expect(buildMediaLayout([])).toHaveLength(0);
  });

  test('5 items: only first 4 are used', () => {
    const media = ['a', 'b', 'c', 'd', 'e'].map((id) => makeMedia({ id }));
    const result = buildMediaLayout(media);
    expect(result).toHaveLength(4);
  });

  test('10 items: only first 4 are used', () => {
    const media = Array.from({ length: 10 }, (_, i) => makeMedia({ id: String(i) }));
    const result = buildMediaLayout(media);
    expect(result).toHaveLength(4);
  });
});
