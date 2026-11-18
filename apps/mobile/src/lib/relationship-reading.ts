import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RelationshipReading, RelationshipRequest, RelationshipResponse } from '@shared/api';
import { RELATIONSHIP_READING_VERSION } from '@shared/relationship';

const PREFIX = 'stellar-notes.relationship-reading.';
export function relationshipReadingKey(comparison: RelationshipResponse, request: RelationshipRequest): string {
  return PREFIX + JSON.stringify([RELATIONSHIP_READING_VERSION, comparison.kind, comparison.left.id, comparison.right.id, request.relationship, request.relationship === 'parent_child' ? request.selfRole : undefined]);
}
export async function cachedRelationshipReading(key: string): Promise<RelationshipReading | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const reading = JSON.parse(raw) as RelationshipReading;
    if (reading.version !== RELATIONSHIP_READING_VERSION || reading.mode !== 'ai' || reading.sections?.length !== 3) return null;
    return reading;
  } catch { return null; }
}
export async function cacheRelationshipReading(key: string, reading: RelationshipReading): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(reading));
  const others = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX) && k !== key);
  if (others.length > 7) await AsyncStorage.multiRemove(others.slice(0, others.length - 7));
}
export async function clearRelationshipReadings(): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
  if (keys.length) await AsyncStorage.multiRemove(keys);
}
