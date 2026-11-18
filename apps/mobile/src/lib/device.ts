import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

const KEY = 'stellar-notes.device-id';
let cached: string | null = null;

/** 匿名设备标识：首次启动生成，之后用它识别这台设备的资料和记录 */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const saved = await AsyncStorage.getItem(KEY);
  cached = saved ?? randomUUID();
  if (!saved) await AsyncStorage.setItem(KEY, cached);
  return cached;
}

export async function resetDeviceId(): Promise<void> {
  cached = null;
  await AsyncStorage.removeItem(KEY);
}
