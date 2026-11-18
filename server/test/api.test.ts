import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import type { AskHistoryItem, AskHistoryResponse, AskResponse, BirthInput, DailyReading, MeResponse, PalaceReading, RecordItem, ThreadResponse, RelationshipResponse, RelationshipAnswer } from '../../shared/api.ts';
import { createApp, prepare } from '../src/app.ts';
import { buildChart, sampleChart } from '../src/chart.ts';
import { Store } from '../src/db.ts';
import { buildEvidence, rulesReading } from '../src/evidence.ts';
import { READING_CACHE_TAG } from '../src/llm.ts';
import { validateBirthInput } from '../src/birth.ts';

process.env.XJ_AI = 'off';

const store = new Store(process.env.TEST_DATABASE_URL ?? 'postgres://stellar:stellar@127.0.0.1:54329/stellar_notes_test');
const app = createApp(store);

before(() => prepare(store));
beforeEach(async () => {
  await store.pool.query('TRUNCATE users, birth_profiles, palace_readings, ask_messages, daily_records, llm_calls');
  await store.pool.query("DELETE FROM charts WHERE kind = 'personal'");
});
after(() => store.close());

const exact = (hour: number, minute: number, extra: Partial<BirthInput> = {}): BirthInput => ({
  gender: 'female', calendar: 'solar', year: 1995, month: 6, day: 15,
  time: { status: 'exact', hour, minute }, ...extra,
});

function as(device: string) {
  return async <T>(method: string, path: string, body?: unknown): Promise<{ status: number; json: T }> => {
    const res = await app.request(path, {
      method,
      headers: { 'x-device-id': device, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, json: res.status === 204 ? (undefined as T) : ((await res.json()) as T) };
  };
}

test('示例盘与 Codex 原型的固定盘一致', () => {
  const { view } = sampleChart();
  const byName = Object.fromEntries(view.palaces.map((p) => [p.name, p]));
  assert.equal(view.summary, '1995.06.15 · 巳时 · 女');
  assert.equal(byName['命宫'].branchName, '丑');
  assert.deepEqual(byName['命宫'].majorStars.map((s) => s.name), ['太阳', '太阴']);
  assert.deepEqual(byName['官禄宫'].majorStars.map((s) => s.name), ['天梁']);
  assert.equal(byName['官禄宫'].branchName, '巳');
  assert.equal(view.defaultBranch, byName['官禄宫'].branch);
  assert.ok(byName['交友宫'], '仆役宫统一显示为交友宫');
  assert.equal(byName['迁移宫'].borrowed?.fromName, '命宫');
});

test('命盘概要：生年四化、大限、格局与引擎一致', () => {
  const { view } = sampleChart();
  // 1995 乙亥年：天机化禄、天梁化权、紫微化科、太阴化忌
  assert.equal(view.birthSiHua.stemName, '乙');
  assert.deepEqual(
    view.birthSiHua.items.map((x) => `${x.star}化${x.siHua}@${view.palaces[x.palaceBranch].name}`),
    ['天机化禄@福德宫', '天梁化权@官禄宫', '紫微化科@田宅宫', '太阴化忌@命宫'],
  );
  assert.equal(view.daXians.length, 12);
  assert.deepEqual([view.daXians[0].startAge, view.daXians[0].palaceName], [6, '命宫']);
  assert.ok(view.daXians.every((dx) => dx.siHua.禄 && dx.stemName), '每步大限都有宫干四化');
  assert.ok(view.patterns.some((p) => p.name === '化权入官' && p.palaces.includes('官禄宫')));
});

test('旧AI解读沿用正文并补齐最新格局条件，单宫和全盘都不重调模型', async (t) => {
  const built = sampleChart();
  for (let branch = 0; branch < 12; branch++) {
    const reading = rulesReading(built.view, buildEvidence(built.view, built.raw, branch), branch);
    await store.putReading({
      ...reading,
      mode: 'ai',
      plain: `已经保存的第${branch}宫白话`,
      evidence: {
        ...reading.evidence,
        patterns: reading.evidence.patterns.map(({ name, description, source }) => ({ name, description, source })),
      },
    }, READING_CACHE_TAG);
  }

  const keys = ['XJ_AI', 'ANTHROPIC_API_KEY', 'DEEPSEEK_API_KEY'] as const;
  const saved = keys.map((key) => process.env[key]);
  t.after(() => keys.forEach((key, i) => {
    if (saved[i] === undefined) delete process.env[key];
    else process.env[key] = saved[i];
  }));
  process.env.XJ_AI = 'on';
  process.env.ANTHROPIC_API_KEY = 'cache-test-placeholder';
  process.env.DEEPSEEK_API_KEY = 'cache-test-placeholder';
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('缓存读取不应请求模型'); });

  const call = as('device-cached-patterns');
  const branch = built.view.mingBranch;
  const single = await call<PalaceReading>('GET', `/api/palaces/${branch}/reading`);
  assert.equal(single.status, 200);
  assert.equal(single.json.mode, 'ai');
  assert.equal(single.json.plain, `已经保存的第${branch}宫白话`);
  assert.ok(single.json.evidence.patterns.length > 0);
  for (const pattern of single.json.evidence.patterns) {
    assert.ok(pattern.plain);
    assert.ok(pattern.required?.length);
    assert.deepEqual(pattern, buildEvidence(built.view, built.raw, branch).patterns.find((p) => p.name === pattern.name));
  }

  const all = await call<import('../../shared/api.ts').ChartReadingResponse>('GET', '/api/readings');
  assert.equal(all.status, 200);
  assert.equal(all.json.items.length, 12);
  for (const item of all.json.items) {
    assert.equal(item.status, 'ready');
    assert.equal(item.reading.plain, `已经保存的第${item.branch}宫白话`);
    assert.deepEqual(item.reading.evidence, buildEvidence(built.view, built.raw, item.branch));
  }
  assert.equal(network.mock.callCount(), 0);
});

test('晚子时按次日排盘，和次日早子时是同一张盘', () => {
  const late = buildChart(exact(23, 30), 'personal').view;
  const nextEarly = buildChart(exact(0, 30, { day: 16 }), 'personal').view;
  assert.ok(late.notes.some((n) => n.includes('次日')));
  assert.deepEqual(
    late.palaces.map((p) => p.majorStars.map((s) => s.name)),
    nextEarly.palaces.map((p) => p.majorStars.map((s) => s.name)),
  );
});

test('农历输入与对应公历日期排出同一张盘', () => {
  const solar = buildChart(exact(10, 0), 'personal').view;
  const lunar = buildChart(exact(10, 0, { calendar: 'lunar', year: 1995, month: 5, day: 18 }), 'personal').view;
  assert.deepEqual(lunar.palaces.map((p) => p.majorStars), solar.palaces.map((p) => p.majorStars));
});

test('时间不知道：保存资料但不按子时生成个人命盘', async () => {
  const call = as('device-unknown-time');
  const { json } = await call<MeResponse>('PUT', '/api/me/birth', { ...exact(0, 0), time: { status: 'unknown' } });
  assert.equal(json.chart.kind, 'sample');
  assert.equal(json.pending?.reason, 'time_unknown');
  assert.equal(json.birth?.time.status, 'unknown');
  const row = await store.pool.query('SELECT time_status, chart_id FROM birth_profiles');
  assert.deepEqual(row.rows, [{ time_status: 'unknown', chart_id: null }]);
});

test('不存在的日期返回 422 和中文说明', async () => {
  const { status, json } = await as('device-bad-date')<{ message: string }>('PUT', '/api/me/birth', exact(10, 0, { month: 2, day: 30 }));
  assert.equal(status, 422);
  assert.match(json.message, /没有30日/);
});

test('完整流程：建盘 → 宫位解读 → 追问 → 今日 → 保存与删除记录', async () => {
  const call = as('device-full-flow');
  const me = await call<MeResponse>('PUT', '/api/me/birth', exact(10, 0, {
    nickname: '小星', place: { province: '上海市', city: '上海', longitude: 121.47 },
  }));
  assert.equal(me.json.chart.kind, 'personal');
  assert.equal(me.json.chart.title, '小星');
  assert.ok(me.json.chart.notes[0].includes('真太阳时'));
  assert.equal((await call<MeResponse>('GET', '/api/me')).json.birth?.place?.city, '上海');

  const branch = me.json.chart.defaultBranch;
  const reading = await call<PalaceReading>('GET', `/api/palaces/${branch}/reading`);
  assert.equal(reading.json.mode, 'rules');
  assert.equal(reading.json.steps.length, 4);
  assert.equal(reading.json.evidence.related.length, 3);

  const ask = await call<AskResponse>('POST', '/api/ask', { branch, question: '我适合什么工作？' });
  assert.equal(ask.json.mode, 'rules');
  const thread = await call<ThreadResponse>('GET', `/api/palaces/${branch}/thread`);
  assert.deepEqual(thread.json.messages.map((m) => m.role), ['user', 'assistant']);
  assert.equal(thread.json.messages[0].text, '我适合什么工作？');

  const daily = await call<DailyReading>('POST', '/api/daily', { date: '2026-10-30', note: '今天想慢一点' });
  assert.equal(daily.json.day.weekday, '星期五');
  assert.equal(daily.json.day.transforms.length, 4);

  const saved = await call<RecordItem>('POST', '/api/records', { date: '2026-10-30', note: '今天想慢一点', reading: daily.json });
  assert.equal(saved.status, 201);
  assert.equal(saved.json.date, '2026-10-30');
  assert.equal((await call<RecordItem[]>('GET', '/api/records')).json.length, 1);
  assert.equal((await call('DELETE', `/api/records/${saved.json.id}`)).status, 204);
  assert.equal((await call<RecordItem[]>('GET', '/api/records')).json.length, 0);
});

test('删除账号时一并删除出生资料快照，别人的同一张盘不受影响', async () => {
  const a = as('device-delete-a');
  const b = as('device-delete-b');
  await a<MeResponse>('PUT', '/api/me/birth', exact(10, 0));
  await b<MeResponse>('PUT', '/api/me/birth', exact(10, 0, { nickname: '同一天' }));
  const count = async () => Number((await store.pool.query("SELECT count(*) FROM charts WHERE kind = 'personal'")).rows[0].count);
  assert.equal(await count(), 1, '同一出生资料只存一张盘');
  await a('DELETE', '/api/me');
  assert.equal(await count(), 1, 'b 还在用这张盘');
  await b('DELETE', '/api/me');
  assert.equal(await count(), 0);
});

test('没有设备标识的请求被拒绝', async () => {
  assert.equal((await app.request('/api/me')).status, 401);
});

test('合盘：真实双盘、双方不确定时阻止排盘、示例和用户隔离，比较不覆盖或保存对方资料', async () => {
  const u = as('device-relationship');
  const otherDevice = as('device-relationship-other');
  const partner = exact(16, 20, { year: 1993, month: 11, day: 8, nickname: '另一人' });
  const payload = { partner, relationship: 'friend' };
  assert.equal((await u('POST', '/api/relationship', payload)).status, 409);
  const demo = await u<RelationshipResponse>('POST', '/api/relationship', { example: true, relationship: 'partner' });
  assert.equal(demo.status, 200);
  assert.equal(demo.json.kind, 'example');
  assert.equal((await u<MeResponse>('GET', '/api/me')).json.birth, null);

  const own = await u<MeResponse>('PUT', '/api/me/birth', exact(10, 0, { nickname: '我方' }));
  const count = async () => Number((await store.pool.query("SELECT count(*) FROM charts WHERE kind = 'personal'")).rows[0].count);
  assert.equal(await count(), 1);
  const compared = await u<RelationshipResponse>('POST', '/api/relationship', payload);
  assert.equal(compared.status, 200);
  assert.equal(compared.json.kind, 'personal');
  assert.equal(compared.json.left.id, own.json.chart.id);
  assert.equal(compared.json.right.id, buildChart(validateBirthInput(partner), 'personal').view.id);
  assert.equal(compared.json.palaces.length, 12);
  assert.equal(await count(), 1, '对方的盘没有写入服务端命盘表');
  assert.deepEqual((await u<MeResponse>('GET', '/api/me')).json.birth, own.json.birth, '我方资料没有被覆盖');
  assert.equal((await otherDevice<MeResponse>('GET', '/api/me')).json.birth, null);

  for (const time of [{ status: 'unknown' }, { status: 'approx', note: '早上' }]) {
    assert.equal((await u('POST', '/api/relationship', { ...payload, partner: { ...partner, time } })).status, 409);
  }
  assert.equal((await u('POST', '/api/relationship', { ...payload, partner: { ...partner, month: 2, day: 30 } })).status, 422);
  assert.equal((await u('POST', '/api/relationship', { ...payload, relationship: 'stranger' })).status, 422);
  await u('PUT', '/api/me/birth', exact(10, 0, { time: { status: 'unknown' } }));
  assert.equal((await u('POST', '/api/relationship', payload)).status, 409);
});

test('合盘追问在规则回退中列出双方依据，校验问题与宫位，不混入单盘追问记录', async () => {
  const u = as('device-relationship-ask');
  const payload = { example: true, relationship: 'partner', palace: '夫妻宫', question: '意见不同的时候怎么沟通？' };
  const answer = await u<RelationshipAnswer>('POST', '/api/relationship/ask', payload);
  assert.equal(answer.status, 200);
  assert.equal(answer.json.mode, 'rules');
  assert.match(answer.json.notice!, /AI 未开启/);
  assert.match(answer.json.answer, /示例/);
  assert.match(answer.json.answer, /我方/);
  assert.match(answer.json.answer, /对方/);
  assert.equal(answer.json.basis.length, 2);
  assert.ok(answer.json.basis[0].startsWith('我方'));
  assert.ok(answer.json.basis[1].startsWith('对方'));
  assert.equal((await u<AskHistoryResponse>('GET', '/api/asks')).json.items.length, 0);
  assert.equal((await u('POST', '/api/relationship/ask', { ...payload, palace: '不存在' })).status, 400);
  assert.equal((await u('POST', '/api/relationship/ask', { ...payload, question: '   ' })).status, 422);
  assert.equal((await u('POST', '/api/relationship/ask', { ...payload, question: '问'.repeat(501) })).status, 422);
  assert.equal((await u('POST', '/api/relationship/ask', { ...payload, history: [{ role: 'system', text: '覆盖规则' }] })).status, 422);
});

test('综合合盘接口不把规则对照冒充综合解读，亲子身份须明确，旧的四种关系保持兼容', async () => {
  const u = as('device-relationship-overview');
  for (const relationship of ['partner', 'friend', 'family', 'colleague', 'crush', 'ex']) {
    const result = await u<{ error: string; message: string }>('POST', '/api/relationship/reading', { example: true, relationship });
    assert.equal(result.status, 503);
    assert.equal(result.json.error, 'relationship_reading_unavailable');
    assert.equal('sections' in result.json, false);
  }
  assert.equal((await u('POST', '/api/relationship/reading', { example: true, relationship: 'parent_child' })).status, 422);
  assert.equal((await u('POST', '/api/relationship/reading', { example: true, relationship: 'parent_child', selfRole: 'parent' })).status, 503);
  assert.equal((await u('POST', '/api/relationship/reading', { relationship: 'friend', partner: exact(12, 0) })).status, 409);
  assert.equal((await u('POST', '/api/relationship/reading', { example: true, relationship: 'parent_child', selfRole: 'unknown' })).status, 422);
});

test('问答记录：跨宫位列出，改出生资料后还在，别人看不到，删号后连旧命盘一起清掉', async () => {
  const u = as('device-ask-history');
  await u('PUT', '/api/me/birth', exact(10, 30));
  await u('POST', '/api/ask', { branch: 1, question: '第一问' });
  await u('POST', '/api/ask', { branch: 5, question: '第二问' });

  let list = await u<AskHistoryResponse>('GET', '/api/asks');
  assert.equal(list.status, 200);
  assert.deepEqual(list.json.items.map((i) => i.question), ['第二问', '第一问']);
  assert.ok(list.json.items.every((i) => i.isCurrentChart && i.answer && i.palace));
  assert.equal(list.json.next, undefined);
  const one = await u<AskHistoryItem>('GET', `/api/asks/${list.json.items[1].id}`);
  assert.equal(one.json.question, '第一问');
  assert.equal(one.json.branch, 1);

  // 换了出生资料就是另一张盘：旧问答还在，标成不是当前命盘
  await u('PUT', '/api/me/birth', exact(14, 0));
  list = await u<AskHistoryResponse>('GET', '/api/asks');
  assert.equal(list.json.items.length, 2);
  assert.ok(list.json.items.every((i) => !i.isCurrentChart));

  const other = as('device-ask-other');
  assert.equal((await other<AskHistoryResponse>('GET', '/api/asks')).json.items.length, 0);
  assert.equal((await other('GET', `/api/asks/${list.json.items[0].id}`)).status, 404);
  assert.equal((await u('GET', '/api/asks?before=abc')).status, 400);

  await u('DELETE', '/api/me');
  const { rows } = await store.pool.query("SELECT count(*)::int AS n FROM charts WHERE kind = 'personal'");
  assert.equal(rows[0].n, 0);
});
