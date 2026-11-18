// 出生资料 → 引擎的 BirthInfo。口径与 ziwei-doushu 一致：
// 北京时间钟表读数 → 真太阳时（经度 + 均时差）定时辰，晚子时按次日排盘。

import { Lunar } from 'lunar-javascript';
import type { BirthInput } from '../../shared/api.ts';
import type { BirthInfo } from './engine/ziwei/types';
import {
  calculateTrueSolarTime,
  formatTrueSolarClock,
  isValidGregorianDate,
  resolveZiweiDayOffset,
  shiftGregorianDate,
} from './engine/ziwei/true-solar-time';
import { isChinaDST } from './engine/ziwei/dst-cn';
import { SHICHEN } from './engine/ziwei/constants';

export class BirthError extends Error {}

export interface ResolvedBirth {
  info: BirthInfo;
  notes: string[];
  /** 真太阳时离最近时辰交界的分钟数 */
  boundaryMinutes: number;
}

export function toSolarDate(input: BirthInput): { year: number; month: number; day: number } {
  if (input.calendar === 'solar') {
    if (!isValidGregorianDate(input.year, input.month, input.day)) {
      throw new BirthError(`${input.year}年${input.month}月没有${input.day}日`);
    }
    return { year: input.year, month: input.month, day: input.day };
  }
  try {
    const month = input.isLeapMonth ? -Math.abs(input.month) : input.month;
    const solar = Lunar.fromYmd(input.year, month, input.day).getSolar();
    return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
  } catch {
    throw new BirthError(`农历${input.year}年${input.isLeapMonth ? '闰' : ''}${input.month}月${input.day}日不存在`);
  }
}

export function resolveBirth(input: BirthInput): ResolvedBirth {
  if (input.time.status !== 'exact') {
    throw new BirthError('出生时间不确定时不生成确定的命盘');
  }
  const date = toSolarDate(input);
  if (date.year < 1900 || date.year > new Date().getFullYear()) {
    throw new BirthError('出生年份需在 1900 年到今年之间');
  }
  let { hour, minute } = input.time;
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new BirthError('出生时间格式不对');
  }

  const notes: string[] = [];
  if (input.dstClock) {
    if (!isChinaDST(date.year, date.month, date.day)) {
      throw new BirthError('这一天不在中国夏令时期间，无需换算');
    }
    const total = hour * 60 + minute - 60;
    if (total < 0) throw new BirthError('夏令时换算后跨到前一天，请直接填写换算后的日期和时间');
    hour = Math.floor(total / 60);
    minute = total % 60;
    notes.push('已按夏令时把钟表时间减去 1 小时');
  }

  const longitude = input.place?.longitude;
  const solar = calculateTrueSolarTime({ ...date, clockHour: hour, clockMinute: minute, longitude });
  const dayOffset = resolveZiweiDayOffset(solar, 'next-day');
  const chartDate = shiftGregorianDate(date, dayOffset);

  if (solar.corrected) {
    notes.push(
      `按出生地经度 ${longitude!.toFixed(2)}° 换算真太阳时为 ${formatTrueSolarClock(solar)}，取${SHICHEN[solar.branch].name}`,
    );
  } else {
    notes.push(`未填出生地，按北京时间取${SHICHEN[solar.branch].name}`);
  }
  if (dayOffset !== 0) notes.push('晚子时（23 点后）按次日排盘');

  // 时辰从 23:00 起每两小时一段，离两端交界的最短距离
  const pos = (solar.normalizedMinutes + 60) % 120;
  const boundaryMinutes = Math.round(Math.min(pos, 120 - pos));

  return {
    info: {
      ...chartDate,
      hour: solar.branch,
      gender: input.gender,
      name: input.nickname || undefined,
      province: input.place?.province,
      city: input.place?.city,
      longitude,
      origInput: { ...date, clockHour: input.time.hour, clockMinute: input.time.minute },
    },
    notes,
    boundaryMinutes,
  };
}

export function validateBirthInput(raw: unknown): BirthInput {
  const b = raw as Partial<BirthInput> | null;
  if (!b || typeof b !== 'object') throw new BirthError('缺少出生资料');
  if (b.gender !== 'male' && b.gender !== 'female') throw new BirthError('请选择性别');
  if (b.calendar !== 'solar' && b.calendar !== 'lunar') throw new BirthError('请选择公历或农历');
  for (const k of ['year', 'month', 'day'] as const) {
    if (!Number.isInteger(b[k])) throw new BirthError('请填写完整的出生日期');
  }
  const t = b.time as BirthInput['time'] | undefined;
  if (!t || !['exact', 'approx', 'unknown'].includes(t.status)) throw new BirthError('请选择出生时间的情况');
  const place = b.place;
  if (place && (typeof place.longitude !== 'number' || !Number.isFinite(place.longitude))) {
    throw new BirthError('出生地经度无效');
  }
  return {
    nickname: typeof b.nickname === 'string' ? b.nickname.trim().slice(0, 20) || undefined : undefined,
    gender: b.gender,
    calendar: b.calendar,
    year: b.year!,
    month: b.month!,
    day: b.day!,
    isLeapMonth: b.calendar === 'lunar' ? Boolean(b.isLeapMonth) : undefined,
    time: t,
    place: place ? { province: String(place.province), city: String(place.city), longitude: place.longitude } : undefined,
    dstClock: Boolean(b.dstClock),
  };
}
