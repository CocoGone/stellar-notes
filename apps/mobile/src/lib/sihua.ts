import type { ChartView, SiHua } from '@shared/api';

// 年干四化表（甲→癸：化禄、化权、化科、化忌），与后端引擎 constants.ts 的 SI_HUA_TABLE 相同
const SI_HUA_TABLE: [string, string, string, string][] = [
  ['廉贞', '破军', '武曲', '太阳'],
  ['天机', '天梁', '紫微', '太阴'],
  ['天同', '天机', '文昌', '廉贞'],
  ['太阴', '天同', '天机', '巨门'],
  ['贪狼', '太阴', '右弼', '天机'],
  ['武曲', '贪狼', '天梁', '文曲'],
  ['太阳', '武曲', '太阴', '天同'],
  ['巨门', '太阳', '文曲', '文昌'],
  ['天梁', '紫微', '左辅', '武曲'],
  ['破军', '巨门', '太阴', '贪狼'],
];
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const HUA_ORDER: SiHua[] = ['禄', '权', '科', '忌'];

export type TimeView = { kind: 'natal' } | { kind: 'daxian'; index: number } | { kind: 'liunian'; year: number };

export interface Overlay {
  /** 叠加在盘上的标记：限 / 年 */
  label: string;
  caption: string;
  /** 星名 → 四化 */
  byStar: Record<string, SiHua>;
  items: { siHua: SiHua; star: string }[];
}

/** 流年天干：与引擎 getYearStemIndex 同口径（按公历年） */
function yearStem(year: number): number {
  return (((year - 4) % 10) + 10) % 10;
}

export function overlayFor(chart: ChartView, view: TimeView): Overlay | null {
  if (view.kind === 'natal') return null;
  let stemName: string;
  let table: Record<SiHua, string>;
  let label: string;
  let caption: string;
  if (view.kind === 'daxian') {
    const dx = chart.daXians[view.index];
    if (!dx) return null;
    stemName = dx.stemName;
    table = dx.siHua;
    label = '限';
    caption = `大限 ${dx.startAge}–${dx.endAge} 岁 · ${dx.palaceName} · ${stemName}干四化`;
  } else {
    const stem = yearStem(view.year);
    stemName = STEMS[stem];
    const row = SI_HUA_TABLE[stem];
    table = { 禄: row[0], 权: row[1], 科: row[2], 忌: row[3] };
    label = '年';
    caption = `${view.year} 流年 · ${stemName}年四化`;
  }
  const items = HUA_ORDER.map((siHua) => ({ siHua, star: table[siHua] })).filter((x) => x.star);
  return { label, caption, items, byStar: Object.fromEntries(items.map((x) => [x.star, x.siHua])) };
}
