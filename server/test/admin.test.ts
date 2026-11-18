import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createAdminApp } from '../src/admin/index.ts';
import { prepare } from '../src/app.ts';
import { Store } from '../src/db.ts';

process.env.XJ_AI = 'off';

const store = new Store(process.env.TEST_DATABASE_URL ?? 'postgres://stellar:stellar@127.0.0.1:54329/stellar_notes_test');
const admin = createAdminApp(store);

before(() => prepare(store));
beforeEach(async () => {
  await store.pool.query('TRUNCATE users, birth_profiles, palace_readings, ask_messages, daily_records, llm_calls');
  await store.pool.query("DELETE FROM charts WHERE kind = 'personal'");
});
after(() => store.close());

async function page(path: string) {
  const res = await admin.request(path);
  return { status: res.status, text: await res.text() };
}

test('后台能按轮看到一次调用的完整上下文，用户输入会转义，图片只显示大小', async () => {
  const user = 'device-admin-test';
  await store.ensureUser(user);
  const roundId = randomUUID();
  const base = {
    kind: 'ask' as const, userId: user, chartId: 'sample', branch: 1, userInput: '<b>我想问</b>事业', roundId, model: 'deepseek-v4-pro',
    request: {
      system: '系统提示：你是星笺的解读者',
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', bytes: 20480 } },
        { type: 'text', text: JSON.stringify({ question: '我想问事业' }) },
      ] }],
      tools: [{ name: 'answer' }],
      max_tokens: 9000,
    },
  };
  await store.insertLlmCall({ ...base, attempt: 1, response: { stop_reason: 'tool_use', content: [] }, output: {}, status: 'invalid', error: 'answer 为空', inputTokens: 1000, outputTokens: 10, latencyMs: 3000 });
  await store.insertLlmCall({
    ...base, attempt: 2, status: 'ok', inputTokens: 1200, outputTokens: 300, latencyMs: 4200,
    response: { stop_reason: 'tool_use', content: [{ type: 'thinking', thinking: '先看兄弟宫' }, { type: 'tool_use', name: 'answer', input: { answer: '可以先观察' } }] },
    output: { answer: '可以先观察' },
  });

  const list = await page('/rounds');
  assert.equal(list.status, 200);
  assert.ok(list.text.includes('&lt;b&gt;我想问'));
  assert.ok(!list.text.includes('<b>我想问'));
  assert.ok(list.text.includes('成功'), '一轮的状态取最后一次尝试');

  const detail = await page(`/rounds/${roundId}`);
  assert.equal(detail.status, 200);
  for (const s of ['系统提示：你是星笺的解读者', '约 20 KB', '可以先观察', '先看兄弟宫', '第 1 次', '第 2 次', 'answer 为空', '&quot;question&quot;: &quot;我想问事业&quot;']) {
    assert.ok(detail.text.includes(s), `详情页应包含 ${s}`);
  }

  assert.equal((await page(`/users/${user}`)).status, 200);
  assert.ok((await page('/users')).text.includes(user));
  assert.equal((await page('/')).status, 200);
  assert.equal((await page('/rounds?kind=daily')).text.includes('我想问'), false);
  assert.equal((await page(`/rounds/${randomUUID()}`)).status, 404);
  assert.equal((await page('/users/nobody-here')).status, 404);
});

test('删除用户时合盘调用记录一起删；90 天前的记录会被清理', async () => {
  const user = 'device-admin-delete';
  await store.ensureUser(user);
  const rec = { kind: 'relationship' as const, userId: user, roundId: randomUUID(), attempt: 1, model: 'm', request: {}, status: 'ok' as const, latencyMs: 1 };
  await store.insertLlmCall(rec);
  await store.insertLlmCall({ ...rec, userId: undefined, roundId: randomUUID() });
  await store.pool.query("UPDATE llm_calls SET created_at = now() - interval '91 days' WHERE user_id IS NULL");
  assert.equal(await store.pruneLlmCalls(90), 1);
  await store.deleteUser(user);
  const { rows } = await store.pool.query('SELECT count(*)::int AS n FROM llm_calls');
  assert.equal(rows[0].n, 0);
});
