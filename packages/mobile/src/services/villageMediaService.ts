import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTask,
} from 'firebase/storage';
import { app } from '@nestly/shared';
import type { NestMedia } from '@nestly/shared';
import { MAX_VIDEO_DURATION_S } from '../utils/mediaValidation';
export { validateMedia } from '../utils/mediaValidation';

export interface PickedMedia {
  uri: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
  duration?: number;
  uploadedUrl?: string;
  thumbnailUrl?: string;
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

function contentTypeForAsset(type: 'image' | 'video'): string {
  return type === 'video' ? 'video/mp4' : 'image/jpeg';
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
  onTask,
}: {
  nestId: string;
  authorUid: string;
  tempKey: string;
  asset: PickedMedia;
  onProgress?: (progress: number) => void;
  onTask?: (task: UploadTask) => void;
}): Promise<NestMedia> {
  const storage = getStorage(app);
  const mediaId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ext = extForType(asset.type);
  const mainContentType = contentTypeForAsset(asset.type);
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
    const task = uploadBytesResumable(mediaRef, mainBlob, { contentType: mainContentType });
    onTask?.(task);
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
    const thumbPath = `village/${nestId}/${authorUid}/${tempKey}/thumb_${mediaId}.jpg`;
    const thumbRef = ref(storage, thumbPath);
    try {
      const thumbBlob = await uriToBlob(thumbnailUri);
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(thumbRef, thumbBlob, { contentType: 'image/jpeg' });
        task.on('state_changed', null, reject, () => resolve());
      });
      thumbnail = await getDownloadURL(thumbRef);
    } catch (err) {
      // Thumbnail failed after main upload succeeded — orphan cleanup so we
      // don't leak a bare main file the post will never reference.
      await deleteObject(mediaRef).catch(() => {});
      throw err;
    }
  }

  const result: NestMedia = {
    id: mediaId,
    type: asset.type,
    url,
    thumbnail,
    filename: asset.filename,
    size: mainBlob.size,
  };
  if (asset.type === 'video' && asset.duration != null && asset.duration > 0) {
    result.duration = Math.round(asset.duration / 1000);
  }
  return result;
}
