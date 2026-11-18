// 一宫的可追溯依据，以及不调用大模型时的规则版白话解读。

import type { ChartView, PalaceEvidence, PalaceReading, PalaceView, StarInfo, StarView } from '../../shared/api.ts';
import { palaceClassics, starClassics } from './classics/index.ts';
import { STAR_DESCRIPTIONS } from './engine/ziwei/constants';
import type { ZiweiChart } from './engine/ziwei/types';
import {
  MAJOR_STAR_PLAIN,
  MINOR_STAR_PLAIN,
  PALACE_FRAMES,
  PALACE_SHORT,
  SIHUA_PLAIN,
  brightnessPlain,
} from './knowledge.ts';

const ENGINE_SOURCE = '传统星曜关键词';

function starLabel(s: StarView): string {
  return `${s.name}${s.brightness ? `（${s.brightness}）` : ''}${s.siHua ? `化${s.siHua}` : ''}`;
}

/** 当前宫实际用来解读的主星：空宫借对宫 */
export function effectiveStars(palace: PalaceView, chart: ChartView): StarView[] {
  if (palace.majorStars.length > 0) return palace.majorStars;
  if (!palace.borrowed) return [];
  const from = chart.palaces[palace.borrowed.fromBranch];
  return from.majorStars;
}

export function buildEvidence(chart: ChartView, _raw: ZiweiChart, branch: number): PalaceEvidence {
  const palace = chart.palaces[branch];
  const facts: PalaceEvidence['facts'] = [];
  const tradition: PalaceEvidence['tradition'] = [];

  if (palace.majorStars.length > 0) {
    facts.push({
      label: '主星',
      detail: `${palace.name}位于${palace.branchName}宫，主星是${palace.majorStars.map(starLabel).join('、')}。`,
    });
  } else {
    facts.push({
      label: '空宫',
      detail: palace.borrowed
        ? `${palace.name}没有主星，按传统借对宫${palace.borrowed.fromName}的${palace.borrowed.stars.join('、')}来看。`
        : `${palace.name}没有主星，需要一起看相关宫位。`,
    });
  }
  if (palace.otherStars.length > 0) {
    facts.push({ label: '同宫的星', detail: `同宫还有${palace.otherStars.map(starLabel).join('、')}。` });
  }
  if (palace.isMing) facts.push({ label: '命宫', detail: '这一宫就是命宫，代表你自己。' });
  if (palace.isShen) facts.push({ label: '身宫', detail: '身宫也落在这里，传统上说明这件事后来会越来越占分量。' });

  const stars = effectiveStars(palace, chart);
  for (const s of stars) {
    const desc = STAR_DESCRIPTIONS[s.name];
    const plain = MAJOR_STAR_PLAIN[s.name];
    if (desc) {
      tradition.push({
        label: s.name,
        detail: `关键词「${desc.keywords}」，五行属${desc.element}，${desc.nature}。白话说：${plain?.trait ?? ''}。`,
        source: ENGINE_SOURCE,
      });
    }
    const b = brightnessPlain(s.brightness);
    if (b) tradition.push({ label: `${s.name}的亮度`, detail: b, source: '全书派亮度表' });
    if (s.siHua) tradition.push({ label: `${s.name}化${s.siHua}`, detail: SIHUA_PLAIN[s.siHua], source: '生年四化' });
  }
  const { refs: classics, note: classicsNote } = palaceClassics(chart, palace);
  for (const s of palace.otherStars) {
    const plain = MINOR_STAR_PLAIN[s.name];
    if (plain) tradition.push({ label: s.name, detail: plain + (s.siHua ? `；${SIHUA_PLAIN[s.siHua]}` : '') });
  }

  const related = palace.related.map((r) => {
    const p = chart.palaces[r.branch];
    return {
      branch: r.branch,
      name: p.name,
      topic: p.topic,
      relation: r.relation,
      stars: p.majorStars.map((s) => s.name),
    };
  });

  const patterns = chart.patterns
    .filter((pt) => pt.palaces.includes(palace.name))
    .map(({ name, plain, description, source, required, bonus, breaking }) => ({
      name, plain, description, source, required, bonus, breaking,
    }));

  const unknowns = [
    '这里只看本命盘，没有加入大限、流年，也没有看具体的人和事。',
    '亮度、闰月等口径采用全书派默认，其他流派可能有出入。',
  ];
  if (chart.kind === 'sample') unknowns.unshift('这是示例命盘，不是你的盘。');
  if (chart.boundaryMinutes !== undefined && chart.boundaryMinutes <= 10 && chart.kind === 'personal') {
    unknowns.unshift(`出生时间离时辰交界只有约 ${chart.boundaryMinutes} 分钟，记录稍有误差，整张盘都可能不同。`);
  }

  return { facts, tradition, classics, ...(classicsNote ? { classicsNote } : {}), related, patterns, unknowns };
}

export function rulesReading(chart: ChartView, evidence: PalaceEvidence, branch: number): PalaceReading {
  const palace = chart.palaces[branch];
  const frame = PALACE_FRAMES[palace.name];
  const stars = effectiveStars(palace, chart);
  const lead = stars[0];
  const leadPlain = lead ? MAJOR_STAR_PLAIN[lead.name] : undefined;

  const headline = leadPlain ? `${leadPlain.seed}。` : `${palace.topic}，要结合相关宫位一起看。`;

  const starText = stars.map((s) => s.name).join('、');
  const plain = lead && leadPlain
    ? `${palace.borrowed && palace.majorStars.length === 0 ? `这一宫没有主星，借对宫的${starText}来看。` : `这一宫的主星是${starText}。`}`
      + `放到「${palace.topic}」上，可以带出一个观察角度：${frame.scene}，你也许${leadPlain.trait}。`
      + `需要留意的一面是：${leadPlain.watch}。`
    : `这一宫没有主星，传统上要借对宫和三方四正一起看，单看这里不下结论。`;

  const relatedText = evidence.related
    .map((r) => `${r.name}${r.stars.length ? `（${r.stars.join('、')}）` : '（空宫）'}`)
    .join('、');
  const traditionText = evidence.tradition
    .filter((t) => t.source === ENGINE_SOURCE)
    .map((t) => `${t.label}的关键词是${t.detail.match(/「(.+?)」/)?.[1] ?? ''}`)
    .join('；');
  const steps = [
    { title: '先看盘面', body: evidence.facts.map((f) => f.detail).join('') },
    {
      title: '理解传统含义',
      body: (traditionText ? `传统上，${traditionText}。` : '这一宫没有主星的传统词条。')
        + (evidence.classics.length ? '古书里的原话和白话意思，列在下面的「古籍参考」里。' : ''),
    },
    { title: '也看看相关宫位', body: `三方四正：${relatedText}共同参照。` },
    { title: '还没有考虑的', body: evidence.unknowns.join('') },
  ];

  return {
    chartId: chart.id,
    branch,
    mode: 'rules',
    headline,
    plain,
    steps,
    reflect: [frame.question, leadPlain ? `“${leadPlain.watch}”这一点，在你身上出现过吗？` : '对宫的星曜描述，像不像你？'],
    suggestions: [
      `${palace.topic}上，我适合什么样的方向？`,
      `${palace.name}和命宫有什么关系？`,
      '这些说法有什么依据？',
    ],
    evidence,
  };
}

/** 点星曜时的说明：传统关键词、白话、两句古籍原文，以及在这张盘里的位置 */
export function starInfo(chart: ChartView, name: string): StarInfo | null {
  const desc = STAR_DESCRIPTIONS[name];
  const plain = MAJOR_STAR_PLAIN[name];
  const minor = MINOR_STAR_PLAIN[name];
  if (!desc && !minor) return null;

  const palace = chart.palaces.find((p) => [...p.majorStars, ...p.otherStars].some((st) => st.name === name));
  const star = palace && [...palace.majorStars, ...palace.otherStars].find((st) => st.name === name);

  const quotes = desc ? starClassics(name) : [];

  return {
    name,
    kind: star?.kind ?? (desc ? 'major' : 'minor'),
    keywords: desc?.keywords,
    nature: desc?.nature,
    element: desc?.element,
    trait: plain?.trait ?? minor,
    watch: plain?.watch,
    quotes,
    inChart: palace && star
      ? {
          palaceBranch: palace.branch,
          palaceName: palace.name,
          brightness: star.brightness,
          brightnessPlain: brightnessPlain(star.brightness),
          siHua: star.siHua,
          siHuaPlain: star.siHua ? SIHUA_PLAIN[star.siHua] : undefined,
        }
      : undefined,
  };
}
