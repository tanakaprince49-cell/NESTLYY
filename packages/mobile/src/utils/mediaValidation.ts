const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
export const MAX_VIDEO_DURATION_S = 30;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];

export interface ValidatableAsset {
  type: 'image' | 'video';
  fileSize?: number;
  /** Video length in milliseconds (matches expo-image-picker's `duration` field). */
  durationMs?: number;
  mimeType?: string;
}

export function validateMedia(asset: ValidatableAsset): { ok: boolean; reason?: string } {
  const size = asset.fileSize ?? 0;
  if (asset.type === 'image') {
    if (asset.mimeType && !ALLOWED_IMAGE_TYPES.includes(asset.mimeType)) {
      return { ok: false, reason: 'Only JPEG, PNG, and WebP images are supported.' };
    }
    if (size > MAX_IMAGE_BYTES) {
      return { ok: false, reason: 'Images must be under 10 MB.' };
    }
  } else if (asset.type === 'video') {
    if (asset.mimeType && !ALLOWED_VIDEO_TYPES.includes(asset.mimeType)) {
      return { ok: false, reason: 'Only MP4 and MOV videos are supported.' };
    }
    if (size > MAX_VIDEO_BYTES) {
      return { ok: false, reason: 'Videos must be under 30 MB.' };
    }
    const durationS = asset.durationMs != null ? asset.durationMs / 1000 : 0;
    if (durationS > MAX_VIDEO_DURATION_S) {
      return { ok: false, reason: 'Videos must be 30 seconds or shorter.' };
    }
  }
  return { ok: true };
}
