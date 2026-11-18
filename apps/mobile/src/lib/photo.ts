import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import type { PhotoDraft } from './app-state';

/** 系统相册选一张图；取消返回 null。iOS 用 PHPicker，不需要整个相册的权限 */
export async function pickPhoto(): Promise<PhotoDraft | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsMultipleSelection: false });
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
  return { uri: a.uri, width: a.width, height: a.height };
}

async function jpeg(photo: PhotoDraft, maxWidth: number, compress: number): Promise<string> {
  const ctx = ImageManipulator.manipulate(photo.uri);
  if (photo.width > maxWidth) ctx.resize({ width: maxWidth, height: null });
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
  if (!saved.base64) throw new Error('照片读取失败，换一张试试');
  return saved.base64;
}

/** 发送给解读服务的版本：长边压到 1280 以内的 JPEG（HEIC 也会转成 JPEG） */
export async function uploadVersion(photo: PhotoDraft) {
  return { base64: await jpeg(photo, 1280, 0.75), mediaType: 'image/jpeg' as const };
}

/** 保存记录用的小缩略图 */
export async function thumbnail(photo: PhotoDraft): Promise<string> {
  return `data:image/jpeg;base64,${await jpeg(photo, 240, 0.6)}`;
}
