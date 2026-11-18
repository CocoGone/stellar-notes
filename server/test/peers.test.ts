import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildChart, sampleChart } from '../src/chart.ts';
import { historicalPeers } from '../src/peers/index.ts';
import { PEOPLE } from '../src/peers/people.ts';
import { STORIES } from '../src/peers/stories.ts';

type Item = { text: string; clauses: { t: string; x: string[] }[] };
const corpus: Item[] = JSON.parse(readFileSync(new URL('../src/classics/quanshu.json', import.meta.url), 'utf8')).items;
const norm = (s: string) => s.replace(/[，。、；：…\s]/g, '');

test('人物小传都对得上人物库，古籍参考能在原书里逐字找到', () => {
  const names = new Set(PEOPLE.map((p) => p.name));
  for (const [name, s] of Object.entries(STORIES)) {
    assert.ok(names.has(name), `人物库里没有：${name}`);
    assert.ok(!/你/.test(s.story), `小传里不写"你"：${name}`);
    if (!s.ref) continue;
    const item = corpus.find((i) => norm(i.text).includes(norm(s.ref!.text)));
    assert.ok(item, `原书里找不到：${s.ref.text}`);
    for (const c of s.ref.text.split(/[，。]/).map(norm).filter(Boolean)) {
      const clause: Item['clauses'][number] | undefined = item.clauses.find((x) => norm(x.t).includes(c));
      assert.ok(clause && clause.x.length === 0, `引用了要排除的分句：${c}`);
    }
  }
});

test('示例盘：命宫完全一样的是唐寅，三档依次排列，每人只出现一次', () => {
  const res = historicalPeers(sampleChart().view);
  assert.equal(res.peers[0].level, 'same');
  assert.equal(res.peers[0].name, '唐寅（唐伯虎）');
  const order = { same: 0, star: 1, shen: 2 } as const;
  for (let i = 1; i < res.peers.length; i++) assert.ok(order[res.peers[i - 1].level] <= order[res.peers[i].level]);
  assert.equal(new Set(res.peers.map((p) => p.name)).size, res.peers.length);
});

test('别的盘也能找到人，空宫命宫不报错', () => {
  for (const birth of [
    { gender: 'male' as const, calendar: 'solar' as const, year: 1988, month: 11, day: 3, time: { status: 'exact' as const, hour: 7, minute: 40 } },
    { gender: 'female' as const, calendar: 'solar' as const, year: 2001, month: 2, day: 28, time: { status: 'exact' as const, hour: 23, minute: 15 } },
  ]) {
    const res = historicalPeers(buildChart(birth, 'personal').view);
    assert.ok(res.ming.length > 0);
    for (const p of res.peers) assert.ok(p.diff.length > 0);
  }
});
