import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DailyReading, MeResponse, RelationshipProfile } from '@shared/api';
import { api } from './api';
import { loadPartner, storePartner } from './relationship-profile';

export interface PhotoDraft {
  uri: string;
  width: number;
  height: number;
}

interface AppState {
  me: MeResponse | null;
  meError: string | null;
  refreshMe: () => Promise<void>;
  setMe: (me: MeResponse) => void;
  /** 命盘页当前选中的宫位（地支序号） */
  selected: number | null;
  setSelected: (branch: number) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  /** 今日一图：选好但还没提交的照片与一句话 */
  photo: PhotoDraft | null;
  setPhoto: (p: PhotoDraft | null) => void;
  note: string;
  setNote: (s: string) => void;
  /** 最近一次今日解读，解读页从这里读取 */
  daily: { reading: DailyReading; photo: PhotoDraft | null; note: string; savedId?: string } | null;
  setDaily: (d: AppState['daily']) => void;
  recordsVersion: number;
  bumpRecords: () => void;
  partner: RelationshipProfile | null;
  partnerReady: boolean;
  partnerError: string | null;
  reloadPartner: () => Promise<void>;
  savePartner: (profile: RelationshipProfile | null) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [me, setMeState] = useState<MeResponse | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [photo, setPhoto] = useState<PhotoDraft | null>(null);
  const [note, setNote] = useState('');
  const [daily, setDaily] = useState<AppState['daily']>(null);
  const [recordsVersion, setRecordsVersion] = useState(0);
  const [partner, setPartner] = useState<RelationshipProfile | null>(null);
  const [partnerReady, setPartnerReady] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const reloadPartner = useCallback(async () => {
    try {
      setPartner(await loadPartner());
      setPartnerError(null);
    } catch (err) {
      setPartnerError((err as Error).message);
    } finally {
      setPartnerReady(true);
    }
  }, []);
  const savePartner = useCallback(async (profile: RelationshipProfile | null) => {
    await storePartner(profile);
    setPartner(profile);
    setPartnerError(null);
    setPartnerReady(true);
  }, []);
  useEffect(() => {
    let alive = true;
    loadPartner()
      .then((profile) => { if (alive) setPartner(profile); })
      .catch((err) => { if (alive) setPartnerError((err as Error).message); })
      .finally(() => { if (alive) setPartnerReady(true); });
    return () => { alive = false; };
  }, []);

  const setMe = useCallback((next: MeResponse) => {
    setMeState((prev) => {
      // 换了一张盘时，回到默认宫位；同一张盘保留用户的选择
      if (!prev || prev.chart.id !== next.chart.id) setSelected(next.chart.defaultBranch);
      return next;
    });
    setMeError(null);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      setMe(await api.me());
    } catch (err) {
      setMeError((err as Error).message);
    }
  }, [setMe]);

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((m) => alive && setMe(m))
      .catch((err) => alive && setMeError((err as Error).message));
    return () => {
      alive = false;
    };
  }, [setMe]);

  const value = useMemo<AppState>(
    () => ({
      me,
      meError,
      refreshMe,
      setMe,
      selected,
      setSelected,
      viewMode,
      setViewMode,
      photo,
      setPhoto,
      note,
      setNote,
      daily,
      setDaily,
      recordsVersion,
      bumpRecords: () => setRecordsVersion((v) => v + 1),
      partner, partnerReady, partnerError, reloadPartner, savePartner,
    }),
    [me, meError, refreshMe, setMe, selected, viewMode, photo, note, daily, recordsVersion, partner, partnerReady, partnerError, reloadPartner, savePartner],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
