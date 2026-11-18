import test from 'node:test';
import assert from 'node:assert/strict';
import { exampleRelationship } from '../src/relationship.ts';
import { relationshipReadingContext } from '../src/relationship-reading.ts';

test('综合合盘遇到两次空工具参数后改用 JSON 正文，仍校验双方真实依据并记录实际请求', async () => {
  const originalFetch = globalThis.fetch;
  const previousProvider = process.env.XJ_PROVIDER;
  const previousKey = process.env.DEEPSEEK_API_KEY;
  process.env.XJ_PROVIDER = 'deepseek';
  process.env.DEEPSEEK_API_KEY = 'test-only-key';
  const comparison = exampleRelationship('friend');
  const context = relationshipReadingContext(comparison);
  const choose = (side: 'left' | 'right', kind: 'fact' | 'tradition') => [context.basis.find((b) => b.side === side && b.kind === kind)!.id];
  const draft = {
    headline: '共同兴趣接得上，联系节奏要约清楚', summary: '这是一份虚构双盘的解读，用于验证结构化输出恢复。',
    sections: context.themes.map((t) => ({ id: t.id, conclusion: '明确联系频率。', interaction: '双方依据支持进一步核实相处节奏。', selfAction: '给出具体邀约。', otherAction: '明确回复时间。',
      basisIds: { leftFacts: choose('left', 'fact'), leftTradition: choose('left', 'tradition'), rightFacts: choose('right', 'fact'), rightTradition: choose('right', 'tradition') },
    })), followups: ['你们多久见一次？'], openQuestions: ['双方实际喜欢的联系频率是什么？'],
  };
  const requests: Record<string, unknown>[] = [];
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    assert.equal(new URL(request.url).host, 'api.deepseek.com');
    requests.push(await request.json());
    const fallback = requests.length === 3;
    return new Response(JSON.stringify({
      id: `test-${requests.length}`, type: 'message', role: 'assistant', model: 'deepseek-flash',
      content: fallback ? [{ type: 'text', text: JSON.stringify(draft) }] : [{ type: 'tool_use', id: 'empty', name: 'answer', input: {} }],
      stop_reason: fallback ? 'end_turn' : 'tool_use', stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 10 },
    }), { headers: { 'content-type': 'application/json' } });
  };
  const { aiRelationshipReading, setLlmRecorder } = await import('../src/llm.ts');
  const calls: { status: string; request: unknown }[] = [];
  setLlmRecorder(async (call) => { calls.push(call); });
  try {
    const reading = await aiRelationshipReading(comparison, undefined, 'test-relationship-output');
    assert.equal(reading.mode, 'ai');
    assert.equal(reading.sections.length, 3);
    assert.equal(reading.sections[0].basis.length, 4);
    assert.equal(requests.length, 3);
    assert.ok(requests[0].tools);
    assert.equal(requests[2].tools, undefined);
    assert.equal(requests[2].tool_choice, undefined);
    assert.deepEqual(calls.map((c) => c.status), ['invalid', 'invalid', 'ok']);
    assert.equal((calls[2].request as Record<string, unknown>).tools, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    setLlmRecorder(null);
    if (previousProvider === undefined) delete process.env.XJ_PROVIDER; else process.env.XJ_PROVIDER = previousProvider;
    if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY; else process.env.DEEPSEEK_API_KEY = previousKey;
  }
});
