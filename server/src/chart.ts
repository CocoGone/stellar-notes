// 引擎命盘 → App 用的 ChartView；同时提供示例盘。

import { createHash } from 'node:crypto';
import type { BirthInput, ChartView, PalaceView, SiHua, StarView } from '../../shared/api.ts';
import { patternPlain } from '../../shared/pattern-copy.ts';
import { generateChart } from './engine/ziwei/algorithm';
import { BRANCHES, STEMS } from './engine/ziwei/constants';
import { detectPatterns, getMingGongSummary } from './engine/ziwei/patterns';
import { getDaXianSiHua } from './engine/ziwei/sihua';
import type { Palace, Star, ZiweiChart } from './engine/ziwei/types';
import { resolveBirth } from './birth.ts';
import { PALACE_FRAMES } from './knowledge.ts';
import { PATTERN_SOURCE, withoutNi } from './no-ni.ts';

export const SAMPLE_BIRTH: BirthInput = {
  gender: 'female',
  calendar: 'solar',
  year: 1995,
  month: 6,
  day: 15,
  time: { status: 'exact', hour: 10, minute: 0 },
};

export interface BuiltChart {
  view: ChartView;
  raw: ZiweiChart;
}

const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const LUNAR_DAYS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

export function lunarLabel(month: number, day: number, leap = false): string {
  return `${leap ? '闰' : ''}${LUNAR_MONTHS[Math.abs(month) - 1]}月${LUNAR_DAYS[day - 1]}`;
}

export function relatedBranches(branch: number): PalaceView['related'] {
  return [
    { branch: (branch + 6) % 12, relation: '对宫' },
    { branch: (branch + 4) % 12, relation: '三合' },
    { branch: (branch + 8) % 12, relation: '三合' },
  ];
}

/** 引擎宫名是「官禄」「仆役」这类简称，统一成「官禄宫」「交友宫」 */
export function palaceName(raw: string): string {
  const base = raw.replace(/宫$/, '');
  return `${base === '仆役' || base === '奴仆' ? '交友' : base}宫`;
}

function starView(s: Star): StarView {
  return { name: s.name, kind: s.type, brightness: s.brightnessRaw, siHua: s.siHua || undefined };
}

// 次要星曜按对日常解读的分量排序，煞星和吉星在前，杂曜不进列表
const OTHER_ORDER = [
  '左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '禄存', '天马',
  '擎羊', '陀罗', '火星', '铃星', '地空', '地劫',
];

function palaceView(p: Palace, chart: ZiweiChart): PalaceView {
  const name = palaceName(p.name);
  const frame = PALACE_FRAMES[name];
  const others = p.stars
    .filter((s) => s.type !== 'major' && OTHER_ORDER.includes(s.name))
    .sort((a, b) => OTHER_ORDER.indexOf(a.name) - OTHER_ORDER.indexOf(b.name));
  return {
    branch: p.branch,
    branchName: BRANCHES[p.branch],
    stemName: STEMS[p.stem] ?? '',
    name,
    topic: frame?.topic ?? '',
    question: frame?.question ?? '',
    majorStars: p.stars.filter((s) => s.type === 'major').map(starView),
    otherStars: others.map(starView),
    isMing: p.branch === chart.mingGongBranch,
    isShen: p.branch === chart.shenGongBranch,
    related: relatedBranches(p.branch),
    borrowed: p.isEmpty && p.borrowedFromBranch !== undefined
      ? { fromBranch: p.borrowedFromBranch, fromName: palaceName(p.borrowedFromName ?? ''), stars: p.borrowedStars ?? [] }
      : undefined,
    ageRange: p.daXianAge,
    isCurrentDaXian: Boolean(p.isCurrentDaXian),
  };
}

const SIHUA_ORDER: SiHua[] = ['禄', '权', '科', '忌'];

export function chartId(input: BirthInput): string {
  const { nickname: _n, ...rest } = input;
  return createHash('sha256').update(JSON.stringify(rest)).digest('hex').slice(0, 16);
}

export function buildChart(input: BirthInput, kind: ChartView['kind']): BuiltChart {
  const resolved = resolveBirth(input);
  const raw = generateChart(resolved.info);
  const palaces = [...raw.palaces].sort((a, b) => a.branch - b.branch).map((p) => palaceView(p, raw));
  const career = palaces.find((p) => p.name === '官禄宫');
  const date = `${input.year}.${String(input.month).padStart(2, '0')}.${String(input.day).padStart(2, '0')}`;
  const lunar = raw.lunarInfo;

  const view: ChartView = {
    id: kind === 'sample' ? 'sample' : chartId(input),
    kind,
    title: kind === 'sample' ? '示例盘' : input.nickname || '本命',
    summary: [
      input.calendar === 'lunar' ? `农历 ${date}` : date,
      `${BRANCHES[resolved.info.hour]}时`,
      input.gender === 'male' ? '男' : '女',
    ].join(' · '),
    meta: {
      lunar: `农历${lunar.lunarYear}年${lunarLabel(lunar.lunarMonth, lunar.lunarDay, lunar.isLeapMonth)}`,
      fourPillars: lunar.fourPillars,
      wuxingJu: raw.wuxingJuName,
      mingZhu: raw.mingZhu,
      shenZhu: raw.shenZhu,
      yinYangGender: raw.yinYangGender,
    },
    notes: resolved.notes,
    boundaryMinutes: resolved.boundaryMinutes,
    palaces,
    daXians: raw.daXians.map((dx, i) => {
      const sh = getDaXianSiHua(raw, i);
      return {
        startAge: dx.startAge,
        endAge: dx.endAge,
        palaceBranch: dx.palaceBranch,
        palaceName: palaceName(dx.palaceName),
        stemName: sh?.stemName ?? '',
        siHua: sh?.transforms ?? { 禄: '', 权: '', 科: '', 忌: '' },
      };
    }),
    currentDaXianIndex: raw.currentDaXianIndex,
    currentAge: raw.currentAge,
    birthSiHua: {
      stemName: STEMS[lunar.yearStem] ?? '',
      items: SIHUA_ORDER.flatMap((siHua) => {
        const palace = raw.palaces.find((p) => p.stars.some((st) => st.siHua === siHua));
        const star = palace?.stars.find((st) => st.siHua === siHua);
        return palace && star ? [{ siHua, star: star.name, palaceBranch: palace.branch }] : [];
      }),
    },
    patterns: detectPatterns(raw).map((pt) => ({
      name: pt.name,
      plain: patternPlain(pt.name),
      level: pt.level,
      palaces: [...new Set(pt.palaces.map(palaceName))],
      description: withoutNi(pt.description),
      source: PATTERN_SOURCE,
      required: pt.conditions?.required ?? [],
      bonus: pt.conditions?.bonus ?? [],
      breaking: pt.conditions?.breaking ?? [],
    })),
    mingSummary: getMingGongSummary(raw),
    mingBranch: raw.mingGongBranch,
    shenBranch: raw.shenGongBranch,
    defaultBranch: career?.branch ?? raw.mingGongBranch,
  };
  return { view, raw };
}

let sampleCache: BuiltChart | null = null;
export function sampleChart(): BuiltChart {
  sampleCache ??= buildChart(SAMPLE_BIRTH, 'sample');
  return sampleCache;
}
