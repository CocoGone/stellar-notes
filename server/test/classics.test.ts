import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildChart, sampleChart } from '../src/chart.ts';
import { QUOTES } from '../src/classics/refs.ts';
import { buildEvidence, rulesReading, starInfo } from '../src/evidence.ts';

type Item = { text: string; clauses: { t: string; x: string[] }[] };
const corpus: Item[] = JSON.parse(readFileSync(new URL('../src/classics/quanshu.json', import.meta.url), 'utf8')).items;
const norm = (s: string) => s.replace(/[，。、；：…\s]/g, '');

test('古籍参考的每句原文都能在维基文库《全书》里逐字找到，且不含排除的分句', () => {
  for (const q of QUOTES) {
    const parts = q.text.split('……').map(norm).filter(Boolean);
    const item = corpus.find((i) => {
      const n = norm(i.text);
      let at = 0;
      for (const p of parts) {
        const k = n.indexOf(p, at);
        if (k < 0) return false;
        at = k + p.length;
      }
      return true;
    });
    assert.ok(item, `原书里找不到：${q.text}`);
    for (const part of q.text.split('……')) {
      for (const c of part.split(/[，。]/).map(norm).filter(Boolean)) {
        const clause: Item["clauses"][number] | undefined = item.clauses.find((x) => norm(x.t).includes(c));
        assert.ok(clause, `跨了分句：${c}`);
        assert.deepEqual(clause.x, [], `引用了要排除的分句：${c}`);
      }
    }
    assert.ok(q.plain.length > 0, `没有白话：${q.text}`);
    assert.match(q.source, /^《紫微斗数全书》卷[一二三] · /);
  }
});

const charts = [
  sampleChart(),
  buildChart({ gender: 'male', calendar: 'solar', year: 1988, month: 11, day: 3, time: { status: 'exact', hour: 7, minute: 40 } }, 'personal'),
  buildChart({ gender: 'female', calendar: 'solar', year: 2001, month: 2, day: 28, time: { status: 'exact', hour: 23, minute: 15 } }, 'personal'),
];
const texts = new Set(QUOTES.map((q) => q.text));

test('十二宫的古籍参考：只从核对过的表里挑，最多 3 句，疾厄宫不列，正文不贴原文', () => {
  let total = 0;
  for (const { view, raw } of charts) {
    for (let branch = 0; branch < 12; branch++) {
      const evidence = buildEvidence(view, raw, branch);
      const palace = view.palaces[branch];
      assert.ok(evidence.classics.length <= 3);
      if (palace.name === '疾厄宫') {
        assert.equal(evidence.classics.length, 0);
        assert.ok(evidence.classicsNote);
      }
      if (evidence.classics.length === 0) assert.ok(evidence.classicsNote, `${palace.name} 没有古籍也没有说明`);
      for (const ref of evidence.classics) {
        assert.ok(texts.has(ref.text), `不在核对表里：${ref.text}`);
        total++;
      }
      const reading = rulesReading(view, evidence, branch);
      for (const step of reading.steps) {
        for (const ref of evidence.classics) assert.ok(!step.body.includes(ref.text), `${step.title} 里贴了原文：${ref.text}`);
      }
      for (const pt of evidence.patterns) assert.ok(!/倪师|倪海厦|天纪/.test(pt.description), pt.description);
    }
  }
  assert.ok(total >= 30, `三张盘一共只找到 ${total} 句古籍参考`);
});

test('条件对不上、星是借来的，都会写"对照你的盘"', () => {
  const { view, raw } = sampleChart();
  // 示例盘财帛宫（酉）是空宫，借福德宫的天机、巨门
  const wealth = view.palaces.findIndex((p) => p.name === '财帛宫');
  const refs = buildEvidence(view, raw, wealth).classics;
  assert.ok(refs.length > 0);
  assert.match(refs[0].fit ?? '', /借来的/);
});

test('星曜说明里的古籍也来自核对表', () => {
  const { view } = sampleChart();
  const info = starInfo(view, '天梁');
  assert.ok(info && info.quotes.length > 0);
  for (const q of info.quotes) assert.ok(texts.has(q.text));
});
