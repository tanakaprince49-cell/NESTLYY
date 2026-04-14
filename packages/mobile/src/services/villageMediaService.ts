import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '@nestly/shared';
import type { NestMedia } from '@nestly/shared';

export interface PickedMedia {
  uri: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
  duration?: number;
  uploadedUrl?: string;
  thumbnailUrl?: string;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
const MAX_VIDEO_DURATION_S = 30;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];

export function validateMedia(asset: {
  type: 'image' | 'video';
  fileSize?: number;
  duration?: number;
  mimeType?: string;
}): { ok: boolean; reason?: string } {
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
    const durationS = asset.duration != null ? asset.duration / 1000 : 0;
    if (durationS > MAX_VIDEO_DURATION_S) {
      return { ok: false, reason: 'Videos must be 30 seconds or shorter.' };
    }
  }
  return { ok: true };
}

export async function pickMedia({ maxCount }: { maxCount: number }): Promise<PickedMedia[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    selectionLimit: maxCount,
    quality: 0.9,
    videoMaxDuration: MAX_VIDEO_DURATION_S,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => ({
    uri: asset.uri,
    type: asset.type === 'video' ? 'video' : 'image',
    filename: asset.fileName ?? `media_${Date.now()}`,
    size: asset.fileSize ?? 0,
    duration: asset.duration ?? undefined,
  }));
}

export async function compressImage(
  uri: string,
): Promise<{ uri: string; width: number; height: number }> {
  const info = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: info.uri, width: info.width, height: info.height };
}

export async function generateImageThumbnail(
  uri: string,
): Promise<{ uri: string; width: number; height: number }> {
  const info = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 320 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: info.uri, width: info.width, height: info.height };
}

export async function generateVideoThumbnail(
  uri: string,
): Promise<{ uri: string; width: number; height: number }> {
  const result = await VideoThumbnails.getThumbnailAsync(uri, { time: 0 });
  return { uri: result.uri, width: result.width, height: result.height };
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

function extForType(type: 'image' | 'video'): string {
  return type === 'video' ? 'mp4' : 'jpg';
}

export async function uploadMediaToStorage({
  nestId,
  authorUid,
  tempKey,
  asset,
  onProgress,
}: {
  nestId: string;
  authorUid: string;
  tempKey: string;
  asset: PickedMedia;
  onProgress?: (progress: number) => void;
}): Promise<NestMedia> {
  const storage = getStorage(app);
  const mediaId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ext = extForType(asset.type);
  const mediaPath = `village/${nestId}/${authorUid}/${tempKey}/${mediaId}.${ext}`;
  const mediaRef = ref(storage, mediaPath);

  let uploadUri = asset.uri;
  let thumbnailUri: string | undefined;

  if (asset.type === 'image') {
    const compressed = await compressImage(asset.uri);
    uploadUri = compressed.uri;
    const thumb = await generateImageThumbnail(asset.uri);
    thumbnailUri = thumb.uri;
  } else {
    const thumb = await generateVideoThumbnail(asset.uri);
    thumbnailUri = thumb.uri;
  }

  const mainBlob = await uriToBlob(uploadUri);
  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(mediaRef, mainBlob);
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          onProgress(snapshot.bytesTransferred / snapshot.totalBytes);
        }
      },
      reject,
      () => resolve(),
    );
  });
  const url = await getDownloadURL(mediaRef);

  let thumbnail: string | undefined;
  if (thumbnailUri) {
    const thumbBlob = await uriToBlob(thumbnailUri);
    const thumbPath = `village/${nestId}/${authorUid}/${tempKey}/thumb_${mediaId}.jpg`;
    const thumbRef = ref(storage, thumbPath);
    await new Promise<void>((resolve, reject) => {
      const task = uploadBytesResumable(thumbRef, thumbBlob);
      task.on('state_changed', null, reject, () => resolve());
    });
    thumbnail = await getDownloadURL(thumbRef);
  }

  return {
    id: mediaId,
    type: asset.type,
    url,
    thumbnail,
    filename: asset.filename,
    size: mainBlob.size,
  };
}
