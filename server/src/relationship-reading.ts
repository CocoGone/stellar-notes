import { createHash } from 'node:crypto';
import type { RelationshipBasis, RelationshipKind, RelationshipReading, RelationshipResponse, RelationshipSelfRole } from '../../shared/api.ts';
import { RELATIONSHIP_LABEL } from './relationship.ts';
import { RELATIONSHIP_READING_VERSION } from '../../shared/relationship.ts';
export { RELATIONSHIP_READING_VERSION } from '../../shared/relationship.ts';

type Theme = { id: string; title: string; question: string; palaces: string[] };
const theme = (id: string, title: string, question: string, palaces: string[]): Theme => ({ id, title, question, palaces });

export const RELATIONSHIP_THEMES: Record<RelationshipKind, Theme[]> = {
  partner: [
    theme('needs', '相处需求与互补', '两个人各自需要什么，对方哪一面能接住或难以接住？', ['命宫', '夫妻宫', '福德宫']),
    theme('conflict', '冲突触发与修复', '双方的哪种差异最需要协调，遇到分歧各自该怎么调整？', ['命宫', '夫妻宫', '交友宫']),
    theme('daily', '共同生活与分担', '日常节奏、金钱和责任该先说清楚什么？', ['田宅宫', '财帛宫', '官禄宫']),
  ],
  crush: [
    theme('connection', '吸引与靠近', '双方的相处倾向放在一起，哪些地方容易接上，哪些地方步调不同？', ['命宫', '交友宫', '福德宫']),
    theme('response', '表达与回应', '怎样表达关心更清楚，各自需要怎样的回应？不能替对方确认喜欢或承诺。', ['命宫', '夫妻宫', '福德宫']),
    theme('pace', '推进节奏与边界', '在尚未确认关系的阶段，需要怎样协调靠近与个人空间？', ['交友宫', '迁移宫', '福德宫']),
  ],
  ex: [
    theme('pattern', '牵挂与旧模式', '从双方关系期待的差异看，重新相处需要留意哪个模式？分手原因未知，不能写成已发生的事实。', ['命宫', '夫妻宫', '福德宫']),
    theme('contact', '重新联系的障碍', '双方的表达方式和需要怎样对齐？不能判断对方是否愿意复联。', ['命宫', '交友宫', '福德宫']),
    theme('repair', '先把什么说清楚', '若双方都愿意重新接触，最该先确认的具体约定是什么？', ['夫妻宫', '田宅宫', '交友宫']),
  ],
  friend: [
    theme('support', '共鸣与互相支持', '两个人怎样互相支持、一起获得快乐？只讲友情。', ['命宫', '交友宫', '福德宫']),
    theme('space', '联系节奏与边界', '双方对分享、主动联系和个人空间有什么需要协调的？', ['交友宫', '福德宫', '迁移宫']),
    theme('repair', '分歧与修复', '意见不同时容易卡在哪一类差异，各自怎样表达更有效？', ['命宫', '交友宫', '官禄宫']),
  ],
  parent_child: [
    theme('care', '关心怎样被接住', '家长表达关心的方式与子女需要的回应怎样对齐？', ['命宫', '父母宫', '子女宫', '福德宫']),
    theme('autonomy', '沟通与自主边界', '双方在建议、决定权和倾听方式上，需要怎样调整？', ['命宫', '父母宫', '子女宫']),
    theme('daily', '陪伴与家庭分工', '怎样把关心落实成双方能感受到的陪伴和分担？', ['田宅宫', '福德宫', '父母宫', '子女宫']),
  ],
  family: [
    theme('needs', '彼此的相处需求', '两位家人各自怎样感到被理解？亲属身份未知，不替用户指定辈分。', ['命宫', '福德宫', '田宅宫']),
    theme('space', '意见分歧与边界', '面对家庭意见，双方需要怎样协调自主权和关心？', ['命宫', '田宅宫', '交友宫']),
    theme('support', '支持与分担', '如何把支持落实到各自愿意承担的事情上？', ['田宅宫', '财帛宫', '官禄宫']),
  ],
  colleague: [
    theme('roles', '角色互补与分工', '两个人做事方式怎样搭配，适合先试怎样的分工？不能从命盘决定专业能力。', ['命宫', '官禄宫', '交友宫']),
    theme('decisions', '决策节奏与分歧', '做决定、推进任务和处理分歧时，哪种差异最需要约定？', ['官禄宫', '交友宫', '迁移宫']),
    theme('responsibility', '利益与责任边界', '在投入、交付与共同开支上，双方要先核实哪些现实问题？不能判断诚信、利润或给股权比例。', ['财帛宫', '官禄宫', '交友宫']),
  ],
};

// 追问围绕报告的三个主题，用日常话提问，避免问句新增未经核对的星曜断言。
const FOLLOWUPS: Record<RelationshipKind, string[]> = {
  partner: ['怎样让双方的关心更容易被接住？', '意见不同时，我们各自先改哪一步？', '共同生活的分工，最该先约定什么？'],
  crush: ['怎样表达好感更清楚，又不给对方压力？', '该观察哪些实际回应，再决定是否继续靠近？', '联系和见面的节奏，怎样和对方说清楚？'],
  ex: ['怎样分清想念对方和重复旧模式？', '如果双方都愿意再聊，第一次该说什么？', '重新接触前，最该先确认哪条边界？'],
  friend: ['怎样分担邀约和主动，让支持更对等？', '联系频率不同，怎样约一个舒服的节奏？', '有分歧时，我们各自怎样开口更有效？'],
  parent_child: ['怎样让家长的关心接上子女的需要？', '建议和决定权，双方该怎样划清？', '怎样把陪伴和家庭分工落到具体安排？'],
  family: ['我们的关心方式，怎样更容易被对方接受？', '家里意见不同时，怎样说清各自的边界？', '家务、开支和照护，怎样商量具体分担？'],
  colleague: ['先试怎样的分工，才能验证双方是否配合？', '遇到分歧时，怎样约定决定权和截止时间？', '开始合作前，投入和交付要写清楚哪些事？'],
};

export function relationshipReadingId(comparison: RelationshipResponse, selfRole?: RelationshipSelfRole): string {
  const role = comparison.relationship === 'parent_child' ? selfRole : undefined;
  return createHash('sha256').update(JSON.stringify([RELATIONSHIP_READING_VERSION, comparison.kind, comparison.left.id, comparison.right.id, comparison.relationship, role])).digest('hex').slice(0, 24);
}

export function relationshipReadingContext(comparison: RelationshipResponse, selfRole?: RelationshipSelfRole) {
  const themes = RELATIONSHIP_THEMES[comparison.relationship];
  const needed = new Set(themes.flatMap((t) => t.palaces));
  const basis: RelationshipBasis[] = [];
  for (const side of ['left', 'right'] as const) {
    const isParent = side === 'left' ? selfRole === 'parent' : selfRole === 'child';
    const relevant = (name: string) => needed.has(name) && !(comparison.relationship === 'parent_child' && selfRole && name === (isParent ? '父母宫' : '子女宫'));
    for (const pair of comparison.palaces.filter((p) => relevant(p.name))) {
      const evidence = pair[side].evidence;
      for (const [kind, items] of [['fact', evidence.facts.slice(0, 2)], ['tradition', evidence.tradition.slice(0, 6)]] as const) {
        items.forEach((item, index) => basis.push({ id: `${side === 'left' ? 'A' : 'B'}:${pair.name}:${kind === 'fact' ? 'F' : 'T'}${index}`, side, palace: pair.name, kind, ...item }));
      }
    }
  }
  return {
    relationship: RELATIONSHIP_LABEL[comparison.relationship],
    kind: comparison.kind,
    roles: comparison.relationship === 'parent_child' && selfRole ? {
      self: selfRole === 'parent' ? '家长' : '子女', other: selfRole === 'parent' ? '子女' : '家长',
    } : { self: '我方', other: '对方' },
    themes, basis,
  };
}

export interface RelationshipReadingDraft {
  headline: string;
  summary: string;
  sections: { id: string; conclusion: string; interaction: string; selfAction: string; otherAction: string; basisIds: string[] }[];
  followups: string[];
  openQuestions: string[];
}

/** 只允许引用已提供的依据，每个关系判断都必须同时有两个人的对应宫位。 */
export function groundRelationshipReading(comparison: RelationshipResponse, draft: RelationshipReadingDraft, selfRole?: RelationshipSelfRole): RelationshipReading {
  const context = relationshipReadingContext(comparison, selfRole);
  if (draft.sections.length !== context.themes.length || new Set(draft.sections.map((s) => s.id)).size !== context.themes.length) throw new Error('合盘解读主题不完整');
  const sections = context.themes.map((t) => {
    const section = draft.sections.find((s) => s.id === t.id);
    if (!section) throw new Error('合盘解读缺少当前关系主题');
    const basis = [...new Set(section.basisIds)].map((id) => {
      const item = context.basis.find((b) => b.id === id);
      if (!item) throw new Error('合盘解读引用了当前关系范围内未提供的依据');
      return item;
    });
    if (!basis.some((b) => b.side === 'left') || !basis.some((b) => b.side === 'right')) throw new Error('关系判断需要同时引用双方依据');
    for (const side of ['left', 'right'] as const) {
      if (!basis.some((b) => b.side === side && b.kind === 'fact') || !basis.some((b) => b.side === side && b.kind === 'tradition')) throw new Error('关系判断需要分别引用双方盘面事实和传统含义');
    }
    return { id: t.id, title: t.title, conclusion: section.conclusion, interaction: section.interaction, selfAction: section.selfAction, otherAction: section.otherAction, basis };
  });
  return {
    id: relationshipReadingId(comparison, selfRole), version: RELATIONSHIP_READING_VERSION,
    kind: comparison.kind, mode: 'ai', relationship: comparison.relationship,
    ...(comparison.relationship === 'parent_child' ? { selfRole } : {}),
    headline: draft.headline, summary: draft.summary, sections,
    followups: [...FOLLOWUPS[comparison.relationship]], openQuestions: draft.openQuestions.slice(0, 3), generatedAt: new Date().toISOString(),
  };
}

/** 每用户短时缓存并合并重复请求；不保存原始出生资料，删号时可清空。 */
export class RelationshipReadingCache {
  private results = new Map<string, { value: RelationshipReading; at: number }>();
  private jobs = new Map<string, Promise<RelationshipReading>>();
  async get(userId: string, id: string, build: () => Promise<RelationshipReading>, refresh = false): Promise<RelationshipReading> {
    const key = `${userId}:${id}`;
    if (!refresh) {
      const cached = this.results.get(key);
      if (cached && Date.now() - cached.at < 6 * 3600_000) return cached.value;
    }
    const pending = this.jobs.get(key);
    if (pending) return pending;
    const job = build().then((value) => {
      if (this.jobs.get(key) === job) {
        this.results.delete(key);
        this.results.set(key, { value, at: Date.now() });
        while (this.results.size > 64) this.results.delete(this.results.keys().next().value!);
      }
      return value;
    }).finally(() => { if (this.jobs.get(key) === job) this.jobs.delete(key); });
    this.jobs.set(key, job);
    return job;
  }
  clearUser(userId: string): void {
    for (const key of this.results.keys()) if (key.startsWith(`${userId}:`)) this.results.delete(key);
    for (const key of this.jobs.keys()) if (key.startsWith(`${userId}:`)) this.jobs.delete(key);
  }
}
