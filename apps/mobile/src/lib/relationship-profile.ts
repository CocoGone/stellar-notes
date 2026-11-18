import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RelationshipProfile } from '@shared/api';
import { RELATIONSHIPS } from '@shared/relationship';
import { clearRelationshipReadings } from './relationship-reading';

const KEY = 'stellar-notes.relationship-profile.v1';

export async function loadPartner(): Promise<RelationshipProfile | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  const p = JSON.parse(raw) as RelationshipProfile;
  const b = p?.birth;
  if (!RELATIONSHIPS.includes(p?.relationship)
    || !b || !['male', 'female'].includes(b.gender) || !['solar', 'lunar'].includes(b.calendar)
    || ![b.year, b.month, b.day].every(Number.isInteger)
    || !b.time || !['exact', 'approx', 'unknown'].includes(b.time.status)
    || (p.selfRole !== undefined && !['parent', 'child'].includes(p.selfRole))) {
    throw new Error('本机合盘资料未能读取，可以重新填写。');
  }
  return p;
}

export async function storePartner(profile: RelationshipProfile | null): Promise<void> {
  if (profile) await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  else {
    await clearRelationshipReadings();
    await AsyncStorage.removeItem(KEY);
  }
}
