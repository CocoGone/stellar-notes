import type {
  AskHistoryItem,
  AskHistoryResponse,
  AskResponse,
  BirthInput,
  DailyReading,
  DailyRequest,
  DayContext,
  MeResponse,
  PalaceReading,
  PeersResponse,
  ChartReadingResponse,
  PlacesResponse,
  RecordItem,
  SaveRecordRequest,
  StarInfo,
  ThreadResponse,
  RelationshipRequest,
  RelationshipResponse,
  RelationshipAskRequest,
  RelationshipAnswer,
  RelationshipReading,
} from '@shared/api';
import { getDeviceId } from './device';

// 模拟器里 localhost 就是本机后端；真机调试时用 EXPO_PUBLIC_API_URL 指到电脑的局域网地址
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      signal,
      headers: { 'x-device-id': await getDeviceId(), 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, '连不上服务，请检查网络后重试');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.message ?? '服务出了点问题，请稍后再试');
  return data as T;
}

export const api = {
  me: () => request<MeResponse>('GET', '/api/me'),
  saveBirth: (birth: BirthInput) => request<MeResponse>('PUT', '/api/me/birth', birth),
  clearBirth: () => request<MeResponse>('DELETE', '/api/me/birth'),
  deleteMe: () => request<void>('DELETE', '/api/me'),
  places: () => request<PlacesResponse>('GET', '/api/places'),
  reading: (branch: number) => request<PalaceReading>('GET', `/api/palaces/${branch}/reading`),
  preview: (branch: number) => request<PalaceReading>('GET', `/api/palaces/${branch}/preview`),
  star: (name: string) => request<StarInfo>('GET', `/api/stars/${encodeURIComponent(name)}`),
  peers: () => request<PeersResponse>('GET', '/api/peers'),
  relationship: (req: RelationshipRequest, signal?: AbortSignal) => request<RelationshipResponse>('POST', '/api/relationship', req, signal),
  relationshipAsk: (req: RelationshipAskRequest, signal?: AbortSignal) => request<RelationshipAnswer>('POST', '/api/relationship/ask', req, signal),
  relationshipReading: (req: RelationshipRequest & { refresh?: boolean }, signal?: AbortSignal) => request<RelationshipReading>('POST', '/api/relationship/reading', req, signal),
  readings: () => request<ChartReadingResponse>('GET', '/api/readings'),
  day: (date: string) => request<DayContext>('GET', `/api/day?date=${date}`),
  thread: (branch: number) => request<ThreadResponse>('GET', `/api/palaces/${branch}/thread`),
  clearThread: (branch: number) => request<void>('DELETE', `/api/palaces/${branch}/thread`),
  ask: (branch: number, question: string) => request<AskResponse>('POST', '/api/ask', { branch, question }),
  asks: (before?: string) => request<AskHistoryResponse>('GET', before ? `/api/asks?before=${before}` : '/api/asks'),
  askItem: (id: string) => request<AskHistoryItem>('GET', `/api/asks/${id}`),
  daily: (req: DailyRequest, signal?: AbortSignal) => request<DailyReading>('POST', '/api/daily', req, signal),
  records: () => request<RecordItem[]>('GET', '/api/records'),
  saveRecord: (req: SaveRecordRequest) => request<RecordItem>('POST', '/api/records', req),
  deleteRecord: (id: string) => request<void>('DELETE', `/api/records/${id}`),
};
