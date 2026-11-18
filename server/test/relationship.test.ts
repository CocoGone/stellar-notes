import { test } from 'node:test';
import type { RelationshipSelfRole } from '../../shared/api.ts';
import assert from 'node:assert/strict';
import { buildChart, SAMPLE_BIRTH } from '../src/chart.ts';
import { compareCharts, exampleRelationship, relationshipEvidence, RELATIONSHIPS } from '../src/relationship.ts';
import { groundRelationshipReading, relationshipReadingContext, relationshipReadingId, RelationshipReadingCache, type RelationshipReadingDraft } from '../src/relationship-reading.ts';

test('合盘按宫名对齐两张不同位置的盘，盘面与原引擎一致', () => {
  const left = buildChart(SAMPLE_BIRTH, 'personal');
  const right = buildChart({ ...SAMPLE_BIRTH, year: 1993, month: 11, day: 8, time: { status: 'exact', hour: 16, minute: 20 } }, 'personal');
  const result = compareCharts(left, right, 'partner');
  assert.equal(result.palaces.length, 12);
  assert.equal(new Set(result.palaces.map((p) => p.name)).size, 12);
  assert.notEqual(left.view.mingBranch, right.view.mingBranch, '测试需要两张命宫位置不同的盘');
  for (const pair of result.palaces) {
    const a = left.view.palaces.find((p) => p.name === pair.name)!;
    const b = right.view.palaces.find((p) => p.name === pair.name)!;
    assert.deepEqual(pair.left.palace, a);
    assert.deepEqual(pair.right.palace, b);
    assert.deepEqual(pair.commonStars, a.majorStars.map((s) => s.name).filter((name) => b.majorStars.some((s) => s.name === name)));
    assert.equal(pair.left.evidence.related.length, 3);
    assert.equal(pair.right.evidence.related.length, 3);
    for (const side of [pair.left, pair.right]) {
      if (side.palace.borrowed) assert.ok(side.plain.includes(`借${side.palace.borrowed.fromName}`), '空宫必须明确说出借星来源');
    }
  }
  const swapped = compareCharts(right, left, 'partner');
  for (const pair of result.palaces) {
    const opposite = swapped.palaces.find((p) => p.name === pair.name)!;
    assert.deepEqual(pair.left, opposite.right);
    assert.deepEqual(pair.right, opposite.left);
  }
});

test('伴侣、朋友、家人、搭档各自有合适的入口，示例始终明确标注', () => {
  const expected = { partner: '夫妻宫', crush: '交友宫', ex: '夫妻宫', friend: '交友宫', parent_child: '父母宫', family: '田宅宫', colleague: '交友宫' };
  for (const relationship of RELATIONSHIPS) {
    const result = exampleRelationship(relationship);
    assert.equal(result.kind, 'example');
    assert.equal(result.topics[1].palace, expected[relationship]);
    assert.match(result.left.title, /示例/);
    assert.match(result.right.title, /示例/);
    assert.notEqual(result.left.id, result.right.id);
    assert.ok(result.palaces.every((p) => p.question && p.exercise));
    assert.equal('score' in result, false);
  }
});

function draftFor(result: ReturnType<typeof exampleRelationship>, role?: RelationshipSelfRole): RelationshipReadingDraft {
  const { themes, basis } = relationshipReadingContext(result, role);
  return {
    headline: '测试关系判断', summary: '测试综合解读', followups: ['怎样落实分工？'], openQuestions: ['双方目前怎样做决定？'],
    sections: themes.map((t) => ({ id: t.id, conclusion: '测试结论', interaction: '测试双方互动', selfAction: '我方动作', otherAction: '对方动作', basisIds: (['left', 'right'] as const).flatMap((side) => (['fact', 'tradition'] as const).map((kind) => basis.find((b) => b.side === side && b.kind === kind && t.palaces.includes(b.palace))!.id)) })),
  };
}

test('综合解读覆盖七种关系的专属主题，朋友/亲子/合作不沿用夫妻主题，身份由用户明确选择', () => {
  for (const relationship of RELATIONSHIPS) {
    const result = exampleRelationship(relationship);
    const context = relationshipReadingContext(result, 'parent');
    assert.equal(context.themes.length, 3);
    if (['friend', 'parent_child', 'colleague'].includes(relationship)) assert.ok(context.basis.every((b) => b.palace !== '夫妻宫'));
    const role = relationship === 'parent_child' ? 'parent' : undefined;
    const reading = groundRelationshipReading(result, draftFor(result, role), role);
    assert.equal(reading.relationship, relationship);
    assert.equal(reading.sections.length, 3);
    assert.ok(reading.sections.every((s) => s.basis.some((b) => b.side === 'left') && s.basis.some((b) => b.side === 'right')));
    const raw = JSON.stringify(context);
    assert.ok(!raw.includes(result.left.summary) && !raw.includes(result.right.title));
  }
  const parent = exampleRelationship('parent_child');
  assert.deepEqual(relationshipReadingContext(parent, 'parent').roles, { self: '家长', other: '子女' });
  assert.deepEqual(relationshipReadingContext(parent, 'child').roles, { self: '子女', other: '家长' });
  assert.notEqual(relationshipReadingId(parent, 'parent'), relationshipReadingId(parent, 'child'));
  const parentBasis = relationshipReadingContext(parent, 'parent').basis;
  assert.ok(parentBasis.some((b) => b.side === 'left' && b.palace === '子女宫'));
  assert.ok(!parentBasis.some((b) => b.side === 'left' && b.palace === '父母宫'));
  assert.ok(parentBasis.some((b) => b.side === 'right' && b.palace === '父母宫'));
  assert.ok(!parentBasis.some((b) => b.side === 'right' && b.palace === '子女宫'));
});

test('综合关系判断拒绝单方依据、编造依据、超出关系范围的引用和缺失主题', () => {
  const comparison = exampleRelationship('partner');
  const draft = draftFor(comparison);
  const mutate = () => structuredClone(draft);
  const oneSided = mutate();
  oneSided.sections[0].basisIds = oneSided.sections[0].basisIds.filter((id) => id.startsWith('A'));
  assert.throws(() => groundRelationshipReading(comparison, oneSided), /双方依据/);
  const invented = mutate();
  invented.sections[0].basisIds.push('invented');
  assert.throws(() => groundRelationshipReading(comparison, invented), /未提供/);
  const friend = exampleRelationship('friend');
  const unrelated = draftFor(friend);
  unrelated.sections[0].basisIds.push('A:夫妻宫:F0');
  assert.throws(() => groundRelationshipReading(friend, unrelated), /关系范围/);
  const missing = mutate(); missing.sections.pop();
  assert.throws(() => groundRelationshipReading(comparison, missing), /主题不完整/);
});

test('综合解读合并重复请求、按用户和报告隔离；失败可重试，删用户后未完成任务不能重建缓存', async () => {
  const cache = new RelationshipReadingCache();
  const comparison = exampleRelationship('friend');
  const reading = groundRelationshipReading(comparison, draftFor(comparison));
  let calls = 0;
  let resolve!: () => void;
  const gate = new Promise<void>((done) => { resolve = done; });
  const build = async () => { calls++; await gate; return reading; };
  const a = cache.get('user-a', reading.id, build);
  const b = cache.get('user-a', reading.id, build);
  assert.equal(calls, 1);
  resolve();
  await Promise.all([a, b]);
  await cache.get('user-a', reading.id, build);
  assert.equal(calls, 1);
  await cache.get('user-b', reading.id, build);
  assert.equal(calls, 2);
  await cache.get('user-a', reading.id, build, true);
  assert.equal(calls, 3);
  await assert.rejects(cache.get('user-c', reading.id, async () => { throw new Error('network'); }));
  await cache.get('user-c', reading.id, build);
  assert.equal(calls, 4);
  let finish!: () => void;
  const delayed = cache.get('delete-me', reading.id, async () => { await new Promise<void>((done) => { finish = done; }); return reading; });
  cache.clearUser('delete-me');
  finish(); await delayed;
  await cache.get('delete-me', reading.id, build);
  assert.equal(calls, 5);
});

test('AI 上下文只传当前双宫与相关盘面，不带昵称、原始生日或大限年龄', () => {
  const result = exampleRelationship('partner');
  const context = relationshipEvidence(result, '夫妻宫');
  const pair = result.palaces.find((p) => p.name === '夫妻宫')!;
  assert.deepEqual(context.selected.self.palace.majorStars, pair.left.palace.majorStars);
  assert.deepEqual(context.selected.other.palace.majorStars, pair.right.palace.majorStars);
  assert.deepEqual(context.selected.self.evidence, pair.left.evidence);
  assert.equal('ageRange' in context.selected.self.palace, false);
  assert.equal('isCurrentDaXian' in context.selected.other.palace, false);
  const raw = JSON.stringify(context);
  for (const privateValue of [result.left.title, result.right.title, result.left.summary, result.right.summary]) {
    assert.equal(raw.includes(privateValue), false);
  }
  assert.ok(context.related.length >= 3 && context.related.length <= 6);
});
