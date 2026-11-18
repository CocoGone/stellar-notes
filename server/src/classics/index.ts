// 给一宫、一颗星挑古籍参考。原文和白话都在 refs.ts 里预先写好，这里只负责挑和写"对照你的盘"。

import type { ChartView, ClassicRef, PalaceView, StarView } from '../../../shared/api.ts';
import { NATURE_AS, NO_QUOTE_NOTE, type PalaceName, QUOTES, type QuoteEntry } from './refs.ts';

const MAX_REFS = 3;

const BRIGHT_WORD: Record<string, string> = { 庙: '庙', 旺: '旺', 得: '得地', 利: '利', 平: '平', 不: '不得地', 陷: '落陷' };

function brightCondition(bright: string[]): string {
  return bright.length === 1 ? `力道足（${BRIGHT_WORD[bright[0]]}）` : `力道足（${bright.map((b) => BRIGHT_WORD[b]).join('、')}）`;
}

/** 原文的条件和这张盘对不上的地方，以及借星、性情句之类的说明 */
function fitFor(q: QuoteEntry, star: StarView, palace: PalaceView, borrowedFrom: PalaceView | null): string | undefined {
  const lines: string[] = [];
  if (borrowedFrom) {
    lines.push(`你的${palace.name}没有主星，${star.name}是从对面${borrowedFrom.name}借来的。`);
  }
  const at = borrowedFrom ?? palace;
  if (q.bright && !(star.brightness && q.bright.includes(star.brightness))) {
    const now = star.brightness ? `是${BRIGHT_WORD[star.brightness] ?? star.brightness}` : '没有标亮度';
    lines.push(`原文说的是${star.name}${brightCondition(q.bright)}的时候；你的${star.name}${now}，这句只算一半。`);
  }
  if (q.branches && !q.branches.includes(at.branchName)) {
    lines.push(`原文说的是在${q.branches.join('、')}宫；你的${star.name}在${at.branchName}宫，这句只算一半。`);
  }
  if (!q.palace && !q.combo && !palace.isMing) {
    const as = NATURE_AS[palace.name as PalaceName];
    if (as) lines.push(`这句说的是${star.name}本身的性情；在${palace.name}，用来看${as}。`);
  }
  if (q.palace === '夫妻宫' && /妻/.test(q.text) && !q.note) lines.push('古书按男命写"妻"，这里泛指伴侣。');
  if (q.note) lines.push(q.note);
  return lines.length ? lines.join('') : undefined;
}

function toRef(q: QuoteEntry, fit?: string): ClassicRef {
  return { text: q.text, plain: q.plain, source: q.source, ...(fit ? { fit } : {}) };
}

/** 一宫的古籍参考：每颗用来解读的主星一句（有"××同"的句子优先），命宫再加一句两星同宫的；最多 3 句。 */
export function palaceClassics(chart: ChartView, palace: PalaceView): { refs: ClassicRef[]; note?: string } {
  const name = palace.name as PalaceName;
  const noQuote = NO_QUOTE_NOTE[name];
  if (noQuote) return { refs: [], note: noQuote };

  const borrowedFrom = palace.majorStars.length === 0 && palace.borrowed ? chart.palaces[palace.borrowed.fromBranch] : null;
  const stars = borrowedFrom ? borrowedFrom.majorStars : palace.majorStars;
  // 判断"××同"时，看这一宫（或借来的那一宫）里所有的星
  const present = new Set([...(borrowedFrom ?? palace).majorStars, ...(borrowedFrom ?? palace).otherStars].map((s) => s.name));
  const refs: ClassicRef[] = [];
  const used = new Set<string>();
  const push = (q: QuoteEntry | undefined, star: StarView) => {
    if (!q || used.has(q.text) || refs.length >= MAX_REFS) return;
    used.add(q.text);
    refs.push(toRef(q, fitFor(q, star, palace, borrowedFrom)));
  };

  if (palace.isMing && stars.length >= 2) {
    const names = stars.map((s) => s.name);
    const combo = QUOTES.find((q) => q.combo && q.combo.every((n) => names.includes(n)));
    if (combo) push(combo, stars.find((s) => s.name === combo.star) ?? stars[0]);
  }
  const covered = new Set<string>();
  for (const star of stars.slice(0, 2)) {
    const own = QUOTES.filter((q) => q.star === star.name && q.palace === name && !q.combo);
    const matches = (q: QuoteEntry) =>
      (!q.with || q.with.every((n) => present.has(n))) && (!q.withAny || q.withAny.some((n) => present.has(n)));
    // 上一颗星的句子已经讲了"和这颗星同宫"，这颗星就不再挑"和上一颗同宫"的句子，免得两句说一回事
    const specific = covered.has(star.name) ? undefined : own.find((q) => (q.with || q.withAny) && matches(q));
    if (specific) for (const n of [...(specific.with ?? []), ...(specific.withAny ?? [])]) covered.add(n);
    const plain = own.find((q) => !q.with && !q.withAny);
    const nature = QUOTES.find((q) => q.star === star.name && !q.palace && !q.combo);
    push(specific ?? plain ?? nature, star);
  }
  return refs.length ? { refs } : { refs, note: '这一篇不列古籍原文。' };
}

/** 星曜说明页：这颗星本身的性情句 */
export function starClassics(name: string): ClassicRef[] {
  return QUOTES.filter((q) => q.star === name && !q.palace && !q.combo).map((q) => toRef(q));
}

export { REFS_FOOT } from './refs.ts';
