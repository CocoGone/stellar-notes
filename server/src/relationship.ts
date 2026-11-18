import type {
  BirthInput, RelationshipKind, RelationshipPalace, RelationshipResponse, RelationshipSide, RelationshipSelfRole,
} from '../../shared/api.ts';
import { buildChart, SAMPLE_BIRTH, type BuiltChart } from './chart.ts';
import { buildEvidence } from './evidence.ts';
import { MAJOR_STAR_PLAIN } from './knowledge.ts';
export { RELATIONSHIPS, RELATIONSHIP_LABEL } from '../../shared/relationship.ts';

const CLOSENESS: Record<RelationshipKind, { label: string; palace: string }> = {
  partner: { label: '亲密关系', palace: '夫妻宫' },
  crush: { label: '靠近与回应', palace: '交友宫' },
  ex: { label: '关系期待', palace: '夫妻宫' },
  friend: { label: '朋友相处', palace: '交友宫' },
  parent_child: { label: '亲子相处', palace: '父母宫' },
  family: { label: '家庭生活', palace: '田宅宫' },
  colleague: { label: '协作分工', palace: '交友宫' },
};

function side(built: BuiltChart, name: string): RelationshipSide {
  const palace = built.view.palaces.find((p) => p.name === name)!;
  const stars = palace.majorStars.length ? palace.majorStars.map((s) => s.name) : palace.borrowed?.stars ?? [];
  const descriptions = stars.flatMap((star) => MAJOR_STAR_PLAIN[star] ? [`${star}：${MAJOR_STAR_PLAIN[star].trait}`] : []);
  const prefix = palace.majorStars.length ? '' : `这一宫没有主星，借${palace.borrowed?.fromName ?? '对宫'}的主星作参考。`;
  return {
    palace,
    plain: `${prefix}${descriptions.length ? descriptions.join('；') + '。' : '主星资料不足，先看相关宫位和具体盘面。'}`,
    evidence: buildEvidence(built.view, built.raw, palace.branch),
  };
}

function questions(name: string, relationship: RelationshipKind): { question: string; exercise: string } {
  if (name === '命宫') return {
    question: '遇到意见不同的时候，我们各自希望怎么被理解？',
    exercise: '各说一件最近意见不同的小事。先复述对方的意思，再说自己的需要。',
  };
  if (name === '夫妻宫') return {
    question: relationship === 'partner' ? '我们各自怎样感受到被在乎？' : '各自在亲密关系里重视什么，和这段关系有什么不同？',
    exercise: '各自写下一个让自己感到被在乎的具体动作，看看对方有没有想到。',
  };
  if (name === '官禄宫') return {
    question: '一起做事时，我们想先定计划，还是先动手试试？',
    exercise: '选一件两个人都要参与的小事，先约定分工、决定方式和检查时间。',
  };
  if (name === '交友宫') return {
    question: '我们各自希望对方帮到哪一步，哪些事想自己决定？',
    exercise: '各说一件希望对方帮忙的事，再说清楚希望对方如何帮忙。',
  };
  if (name === '田宅宫') return {
    question: '什么样的生活空间和日常安排，让我们各自更放松？',
    exercise: '各选一项最在意的生活习惯，约定一个双方都愿意试一周的安排。',
  };
  if (name === '财帛宫') return {
    question: '共同花钱之前，我们各自需要知道哪些信息？',
    exercise: '用一笔小额共同开支练习，把预算、谁决定和怎么分担先说清楚。',
  };
  if (name === '福德宫') return {
    question: '累的时候，我们想独处，还是希望有人陪？',
    exercise: '各说一个自己需要休息的信号，和一个希望对方采取的回应。',
  };
  return {
    question: '这一宫的白话描述，哪些贴近我们的经历，哪些不贴近？',
    exercise: '各举一件真实发生的小事，对照白话描述。把不符合的地方也记下来。',
  };
}

export function compareCharts(left: BuiltChart, right: BuiltChart, relationship: RelationshipKind, example = false): RelationshipResponse {
  const palaces = Array.from({ length: 12 }, (_, i): RelationshipPalace => {
    const name = left.view.palaces[(left.view.mingBranch - i + 12) % 12].name;
    const a = side(left, name);
    const b = side(right, name);
    // 只把实际坐守的主星计作共同星；空宫借星在各自的白话和依据中单列。
    const commonStars = a.palace.majorStars.map((s) => s.name).filter((star) => b.palace.majorStars.some((s) => s.name === star));
    const bothEmpty = !a.palace.majorStars.length && !b.palace.majorStars.length;
    return {
      name, topic: a.palace.topic, left: a, right: b, commonStars,
      observation: commonStars.length
        ? `这一宫都坐有${commonStars.join('、')}。可以从共同的传统关键词聊起；亮度、四化和相关宫位仍要各自核对。`
        : bothEmpty
          ? '两人的这一宫都没有主星，需要分别借各自对宫来看。下面已注明借星来源。'
          : '这一宫的主星组合不同。先各自对照白话含义，再聊聊相处中实际出现的差异。',
      ...questions(name, relationship),
    };
  });
  return {
    kind: example ? 'example' : 'personal', relationship,
    left: left.view, right: right.view,
    topics: [{ label: '相处底色', palace: '命宫' }, CLOSENESS[relationship], { label: '一起做事', palace: '官禄宫' }],
    palaces,
    method: '依据两张本命盘的主星、四化、借星与关系相关宫位，综合一方的需要和另一方的表达，给出互补、摩擦和相处重点。每个判断可展开核对双方盘面事实与传统含义，并用真实相处检验。本版没有跨盘飞化计算，不能从盘面确认对方意愿或关系的确定结果。',
  };
}

export function exampleRelationship(relationship: RelationshipKind, selfRole?: RelationshipSelfRole): RelationshipResponse {
  let a: BirthInput = { ...SAMPLE_BIRTH, nickname: '小禾 · 示例' };
  let b: BirthInput = {
    gender: 'male', calendar: 'solar', year: 1993, month: 11, day: 8,
    nickname: '阿川 · 示例', time: { status: 'exact', hour: 16, minute: 20 },
  };
  if (relationship === 'parent_child') {
    const parent: BirthInput = { ...SAMPLE_BIRTH, year: 1972, nickname: '林女士 · 示例' };
    const child: BirthInput = { ...SAMPLE_BIRTH, nickname: '小禾 · 示例' };
    [a, b] = selfRole === 'child' ? [child, parent] : [parent, child];
  }
  return compareCharts(buildChart(a, 'personal'), buildChart(b, 'personal'), relationship, true);
}

/** 给 AI 的最小盘面上下文：不带原始出生资料、昵称或本版未参与解读的大限年龄。 */
export function relationshipEvidence(comparison: RelationshipResponse, palaceName: string) {
  const selected = comparison.palaces.find((p) => p.name === palaceName)!;
  const relatedNames = new Set([
    ...selected.left.evidence.related.map((p) => p.name),
    ...selected.right.evidence.related.map((p) => p.name),
  ]);
  const contextSide = (s: RelationshipSide) => {
    const { ageRange: _age, isCurrentDaXian: _current, ...palace } = s.palace;
    return { palace, plain: s.plain, evidence: s.evidence };
  };
  const contextPair = (p: RelationshipPalace) => ({ name: p.name, self: contextSide(p.left), other: contextSide(p.right) });
  return { selected: contextPair(selected), related: comparison.palaces.filter((p) => relatedNames.has(p.name)).map(contextPair) };
}
