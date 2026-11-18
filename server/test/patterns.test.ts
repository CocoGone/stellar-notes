import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildChart, palaceName, sampleChart } from '../src/chart.ts';
import { buildEvidence } from '../src/evidence.ts';
import { detectPatterns } from '../src/engine/ziwei/patterns.ts';
import { PATTERN_SOURCE } from '../src/no-ni.ts';

test('宫位格局保留引擎的成立、加分和限制条件，白话与原说明分开', () => {
  const charts = [sampleChart()];
  // 跨日期和时辰，覆盖空列表、有配合条件和有限制条件的实际命盘。
  for (const year of [1988, 1995, 2001]) {
    for (const hour of [0, 4, 8, 12, 16, 20]) {
      charts.push(buildChart({ gender: 'female', calendar: 'solar', year, month: 6, day: 15, time: { status: 'exact', hour, minute: 0 } }, 'personal'));
    }
  }
  let sawBreaking = false;
  let sawBonus = false;
  let sawEmpty = false;
  for (const { view, raw } of charts) {
    const engine = detectPatterns(raw);
    for (const palace of view.palaces) {
      const patterns = buildEvidence(view, raw, palace.branch).patterns;
      const expected = engine.filter((p) => p.palaces.map(palaceName).includes(palace.name));
      assert.deepEqual(patterns.map((p) => p.name), expected.map((p) => p.name));
      if (!patterns.length) sawEmpty = true;
      for (const [i, p] of patterns.entries()) {
        assert.deepEqual(p.required, expected[i].conditions?.required ?? []);
        assert.deepEqual(p.bonus, expected[i].conditions?.bonus ?? []);
        assert.deepEqual(p.breaking, expected[i].conditions?.breaking ?? []);
        assert.ok(p.plain, `格局没有白话：${p.name}`);
        assert.notEqual(p.plain, p.description);
        assert.doesNotMatch(p.plain, /主大富大贵|注定|必然|倪师|倪海厦|天纪/);
        assert.equal(p.source, PATTERN_SOURCE, '未核实的上游格局出处不能冒充古籍引文');
        sawBreaking ||= Boolean(p.breaking?.length);
        sawBonus ||= Boolean(p.bonus?.length);
      }
    }
  }
  assert.ok(sawBreaking && sawBonus && sawEmpty, '样本应覆盖限制、有利配合和无格局三种情况');
});
