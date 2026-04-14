import type { NestMedia } from '@nestly/shared';

export interface MediaLayoutItem {
  uri: string;
  aspect: number;
  isVideo: boolean;
  duration?: number;
  gridArea: 'single' | 'left' | 'right-top' | 'right-bottom' | 'grid-tl' | 'grid-tr' | 'grid-bl' | 'grid-br' | 'pair-left' | 'pair-right';
}

export function buildMediaLayout(media: NestMedia[]): MediaLayoutItem[] {
  const clamped = media.slice(0, 4);
  const toItem = (m: NestMedia, gridArea: MediaLayoutItem['gridArea']): MediaLayoutItem => ({
    uri: m.thumbnail ?? m.url,
    aspect: 1,
    isVideo: m.type === 'video',
    duration: m.duration,
    gridArea,
  });

  switch (clamped.length) {
    case 1:
      return [toItem(clamped[0], 'single')];
    case 2:
      return [
        toItem(clamped[0], 'pair-left'),
        toItem(clamped[1], 'pair-right'),
      ];
    case 3:
      return [
        { ...toItem(clamped[0], 'left'), aspect: 2 / 3 },
        toItem(clamped[1], 'right-top'),
        toItem(clamped[2], 'right-bottom'),
      ];
    case 4:
      return [
        toItem(clamped[0], 'grid-tl'),
        toItem(clamped[1], 'grid-tr'),
        toItem(clamped[2], 'grid-bl'),
        toItem(clamped[3], 'grid-br'),
      ];
    default:
      return [];
  }
}
