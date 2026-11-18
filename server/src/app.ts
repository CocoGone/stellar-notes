import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import type {
  AskRequest,
  AskResponse,
  BirthInput,
  DailyReading,
  DayContext,
  DailyRequest,
  MeResponse,
  PalaceReading,
  PlacesResponse,
  RecordItem,
  SaveRecordRequest,
  StarInfo,
  ThreadResponse,
  PeersResponse,
  ChartReadingResponse,
  AskHistoryItem,
  AskHistoryResponse,
  RelationshipResponse,
  RelationshipAnswer,
  RelationshipReading,
} from '../../shared/api.ts';
import { BirthError, validateBirthInput } from './birth.ts';
import { buildChart, chartId, SAMPLE_BIRTH, sampleChart, type BuiltChart } from './chart.ts';
import { dayContext, parseDate, rulesDaily } from './daily.ts';
import type { Store } from './db.ts';
import { buildEvidence, rulesReading, starInfo } from './evidence.ts';
import { historicalPeers } from './peers/index.ts';
import { PROVINCES } from './engine/ziwei/cities';
import { aiAsk, aiDaily, aiEnabled, aiPalaceReading, aiRelationship, aiRelationshipReading, READING_CACHE_TAG, READING_VERSION, setLlmRecorder } from './llm.ts';
import { compareCharts, exampleRelationship, RELATIONSHIPS } from './relationship.ts';
import { RelationshipReadingCache, relationshipReadingId } from './relationship-reading.ts';

type Env = { Variables: { userId: string } };

const DEVICE_ID = /^[A-Za-z0-9-]{8,64}$/;
const RelationshipSchema = z.object({
  partner: z.unknown().optional(),
  relationship: z.enum(RELATIONSHIPS),
  example: z.boolean().optional(),
  selfRole: z.enum(['parent', 'child']).optional(),
});
const RelationshipAskSchema = RelationshipSchema.extend({
  palace: z.string().min(1).max(10),
  question: z.string().trim().min(1).max(500),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(2000) })).max(6).optional(),
  scope: z.enum(['palace', 'overall']).optional(),
});
const RelationshipReadingSchema = RelationshipSchema.extend({ refresh: z.boolean().optional() });

function fail(status: 400 | 401 | 404 | 409 | 422, error: string, message: string) {
  return Response.json({ error, message }, { status });
}

function pendingFor(birth: BirthInput): MeResponse['pending'] {
  if (birth.time.status === 'exact') return undefined;
  return birth.time.status === 'unknown'
    ? { reason: 'time_unknown', message: '出生时间不知道时，不按子时硬排。资料已保存，补上时间后再生成你的命盘。' }
    : { reason: 'time_approx', message: '时间只知道大概时，跨时辰会让整张盘不同。资料已保存，核实到具体时间后再生成。' };
}

/** 跑迁移并写入示例盘（解读缓存和追问都挂在命盘上） */
export async function prepare(store: Store): Promise<void> {
  const applied = await store.migrate();
  if (applied.length) console.log(`[db] applied ${applied.join(', ')}`);
  await store.upsertChart(sampleChart().view, SAMPLE_BIRTH);
}

export function createApp(store: Store) {
  const app = new Hono<Env>();
  const charts = new Map<string, BuiltChart>();
  const relationshipReadings = new RelationshipReadingCache();
  // 每次调大模型都记一条，后台按轮查看（见 llm.ts、admin/）
  setLlmRecorder((r) => store.insertLlmCall(r));

  async function current(userId: string): Promise<{ built: BuiltChart; birth: BirthInput | null; pending?: MeResponse['pending'] }> {
    const saved = await store.getBirth(userId);
    if (!saved) return { built: sampleChart(), birth: null };
    const { birth } = saved;
    if (birth.time.status !== 'exact') return { built: sampleChart(), birth, pending: pendingFor(birth) };
    const id = chartId(birth);
    let built = charts.get(id);
    if (!built) {
      built = buildChart(birth, 'personal');
      charts.set(id, built);
    }
    return { built, birth };
  }

  async function me(userId: string): Promise<MeResponse> {
    const { built, birth, pending } = await current(userId);
    return { birth, chart: built.view, pending, ai: { enabled: aiEnabled() } };
  }

  // 宫位解读：写好就存进数据库（按命盘 id，同一份出生资料就是同一张盘），以后直接读，不再重跑。
  // 同一宫正在写时，后来的请求等同一个结果，不重复调大模型。
  const writing = new Map<string, Promise<PalaceReading>>();
  const failed = new Set<string>();

  /** userId 只用于记录是谁触发了这次写作；解读按命盘缓存，同盘的人共用 */
  async function palaceReading(built: BuiltChart, branch: number, userId?: string): Promise<PalaceReading> {
    const chart = built.view;
    const evidence = buildEvidence(chart, built.raw, branch);
    if (!aiEnabled()) return rulesReading(chart, evidence, branch);
    const cached = await store.getReading(chart.id, branch, READING_VERSION);
    // 白话沿用缓存，盘面依据按当前引擎重建；补展示字段不必重跑大模型。
    if (cached?.mode === 'ai') return { ...cached, evidence };
    const key = `${chart.id}:${branch}`;
    const inFlight = writing.get(key);
    if (inFlight) return inFlight;
    const job = aiPalaceReading(chart, branch, evidence, userId)
      .then(async (reading) => {
        await store.putReading(reading, READING_CACHE_TAG);
        failed.delete(key);
        return reading;
      })
      .catch((err) => {
        console.error('[ai] palace reading failed, using rules', err);
        failed.add(key);
        return rulesReading(chart, evidence, branch);
      })
      .finally(() => writing.delete(key));
    writing.set(key, job);
    return job;
  }

  /** 从命宫起的传统顺序 */
  const palaceOrder = (chart: BuiltChart['view']) => Array.from({ length: 12 }, (_, i) => (chart.mingBranch - i + 12) % 12);

  /** 打开一张盘就把 12 宫一起写好（最多同时写 4 宫）；已经写好的直接跳过。 */
  async function writeAll(built: BuiltChart, userId: string): Promise<void> {
    if (!aiEnabled()) return;
    const done = await store.getReadings(built.view.id, READING_VERSION);
    const todo = palaceOrder(built.view).filter((b) => !done.has(b) && !failed.has(`${built.view.id}:${b}`));
    let next = 0;
    const worker = async () => {
      while (next < todo.length) await palaceReading(built, todo[next++], userId);
    };
    await Promise.all(Array.from({ length: Math.min(4, todo.length) }, worker));
  }
  const startWriteAll = (built: BuiltChart, userId: string) => {
    writeAll(built, userId).catch((err) => console.error('[ai] write all failed', err));
  };

  function parseBranch(raw: unknown): number | null {
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 && n <= 11 ? n : null;
  }

  app.onError((err, c) => {
    if (err instanceof BirthError) return c.json({ error: 'invalid_birth', message: err.message }, 422);
    console.error(err);
    return c.json({ error: 'internal', message: '服务出了点问题，请稍后再试' }, 500);
  });

  app.get('/health', (c) => c.json({ ok: true, ai: aiEnabled() }));

  app.use('/api/*', async (c, next) => {
    const id = c.req.header('x-device-id');
    if (!id || !DEVICE_ID.test(id)) return fail(401, 'no_device', '缺少设备标识');
    await store.ensureUser(id);
    c.set('userId', id);
    await next();
  });

  app.get('/api/places', (c) => c.json<PlacesResponse>({ provinces: PROVINCES }));

  app.get('/api/me', async (c) => {
    const res = await me(c.get('userId'));
    if (!res.pending) startWriteAll((await current(c.get('userId'))).built, c.get('userId'));
    return c.json<MeResponse>(res);
  });

  app.put('/api/me/birth', async (c) => {
    const userId = c.get('userId');
    const birth = validateBirthInput(await c.req.json());
    // 时间确定时先排盘，资料有误在保存前就报错
    const built = birth.time.status === 'exact' ? buildChart(birth, 'personal') : null;
    if (built) charts.set(built.view.id, built);
    await store.saveBirth(userId, birth, built?.view ?? null);
    if (built) startWriteAll(built, userId);
    return c.json<MeResponse>(await me(userId));
  });

  app.delete('/api/me/birth', async (c) => {
    await store.clearBirth(c.get('userId'));
    return c.json<MeResponse>(await me(c.get('userId')));
  });

  app.delete('/api/me', async (c) => {
    relationshipReadings.clearUser(c.get('userId'));
    await store.deleteUser(c.get('userId'));
    return c.body(null, 204);
  });

  async function relationship(userId: string, input: z.infer<typeof RelationshipSchema>): Promise<RelationshipResponse | Response> {
    if (input.example) return exampleRelationship(input.relationship, input.selfRole);
    const own = await current(userId);
    if (!own.birth || own.pending || own.built.view.kind !== 'personal') {
      return fail(409, 'own_chart_pending', '先补全你的出生时间，生成自己的命盘，再开始合盘。');
    }
    const partner = validateBirthInput(input.partner);
    if (partner.time.status !== 'exact') return fail(409, 'partner_chart_pending', '对方的出生时间还需要核实，补全后再合盘。');
    // 不写出生资料表、命盘缓存或 AI 解读缓存，避免改动当前用户的个人盘。
    return compareCharts(own.built, buildChart(partner, 'personal'), input.relationship);
  }

  const relationshipLimit = bodyLimit({ maxSize: 32 * 1024, onError: () => fail(400, 'too_large', '输入内容过长，请精简后重试。') });
  app.post('/api/relationship', relationshipLimit, async (c) => {
    const parsed = RelationshipSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return fail(422, 'invalid_relationship', '请检查关系类型和出生资料。');
    const result = await relationship(c.get('userId'), parsed.data);
    return result instanceof Response ? result : c.json<RelationshipResponse>(result);
  });

  app.post('/api/relationship/reading', relationshipLimit, async (c) => {
    const parsed = RelationshipReadingSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return fail(422, 'invalid_relationship', '请检查关系类型和出生资料。');
    const input = parsed.data;
    if (input.relationship === 'parent_child' && !input.selfRole) return fail(422, 'missing_relationship_role', '请选择我方是家长还是子女，再生成亲子解读。');
    const userId = c.get('userId');
    const result = await relationship(userId, input);
    if (result instanceof Response) return result;
    if (!aiEnabled()) return c.json({ error: 'relationship_reading_unavailable', message: '综合关系解读需要 AI，目前尚未开启。双盘和逐宫依据可以继续查看。' }, 503);
    try {
      const reading = await relationshipReadings.get(userId, relationshipReadingId(result, input.selfRole), () => aiRelationshipReading(result, input.selfRole, userId), input.refresh);
      return c.json<RelationshipReading>(reading);
    } catch (err) {
      console.error('[ai] relationship overview failed', err);
      return c.json({ error: 'relationship_reading_failed', message: '这份关系解读暂时未能完成，请重试。双盘和逐宫依据可以继续查看。' }, 503);
    }
  });

  app.post('/api/relationship/ask', relationshipLimit, async (c) => {
    const parsed = RelationshipAskSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return fail(422, 'invalid_relationship_question', '请填写 1–500 字的问题，并选择要对照的宫位。');
    const input = parsed.data;
    const result = await relationship(c.get('userId'), input);
    if (result instanceof Response) return result;
    const pair = result.palaces.find((p) => p.name === input.palace);
    if (!pair) return fail(400, 'bad_palace', '请选择有效的宫位。');
    if (aiEnabled()) {
      try {
        return c.json<RelationshipAnswer>(await aiRelationship(result, pair.name, input.question, input.history ?? [], c.get('userId'), input.scope, input.selfRole));
      } catch (err) {
        console.error('[ai] relationship failed, using comparison', err);
      }
    }
    return c.json<RelationshipAnswer>({
      mode: 'rules',
      notice: aiEnabled() ? 'AI 暂时未能回答，先列出双方盘面供你们对照。' : 'AI 未开启，下面是双方的规则对照，暂时不能回应具体追问。',
      answer: `${result.kind === 'example' ? '这两张是虚构示例盘。' : ''}我方的${pair.name}：${pair.left.plain}\n\n对方的${pair.name}：${pair.right.plain}\n\n${pair.observation}\n可以一起聊聊：${pair.question}`,
      basis: [
        `我方 · ${pair.name}：${pair.left.evidence.facts.map((f) => f.detail).join('；')}`,
        `对方 · ${pair.name}：${pair.right.evidence.facts.map((f) => f.detail).join('；')}`,
      ],
      followups: [pair.question],
    });
  });

  app.get('/api/palaces/:branch/reading', async (c) => {
    const branch = parseBranch(c.req.param('branch'));
    if (branch === null) return fail(400, 'bad_branch', '宫位不存在');
    const { built } = await current(c.get('userId'));
    return c.json<PalaceReading>(await palaceReading(built, branch, c.get('userId')));
  });

  // 规则版解读（含盘面依据），不调用大模型，立即返回；App 在等大模型时先展示这里的依据
  app.get('/api/palaces/:branch/preview', async (c) => {
    const branch = parseBranch(c.req.param('branch'));
    if (branch === null) return fail(400, 'bad_branch', '宫位不存在');
    const { built } = await current(c.get('userId'));
    return c.json<PalaceReading>(rulesReading(built.view, buildEvidence(built.view, built.raw, branch), branch));
  });

  // 全盘解读：12 宫一起给。还在写的宫先给规则版，App 隔几秒再取一次
  app.get('/api/readings', async (c) => {
    const { built, pending } = await current(c.get('userId'));
    if (pending) return fail(409, 'chart_pending', pending.message);
    startWriteAll(built, c.get('userId'));
    const done = aiEnabled() ? await store.getReadings(built.view.id, READING_VERSION) : new Map();
    const items = palaceOrder(built.view).map((branch) => {
      const ready = done.get(branch);
      if (ready) return {
        branch,
        status: 'ready' as const,
        reading: { ...ready, evidence: buildEvidence(built.view, built.raw, branch) },
      };
      const rules = rulesReading(built.view, buildEvidence(built.view, built.raw, branch), branch);
      const stillWriting = aiEnabled() && !failed.has(`${built.view.id}:${branch}`);
      return { branch, status: stillWriting ? ('writing' as const) : ('ready' as const), reading: rules };
    });
    return c.json<ChartReadingResponse>({ chartId: built.view.id, items });
  });

  // 历史同盘：历史上和你命宫一样的人
  app.get('/api/peers', async (c) => {
    const { built } = await current(c.get('userId'));
    return c.json<PeersResponse>(historicalPeers(built.view));
  });

  app.get('/api/stars/:name', async (c) => {
    const { built } = await current(c.get('userId'));
    const info = starInfo(built.view, decodeURIComponent(c.req.param('name')));
    return info ? c.json<StarInfo>(info) : fail(404, 'unknown_star', '暂时没有这颗星的说明');
  });

  // 某一天的日干四化落在本命盘哪些宫，立即返回
  app.get('/api/day', async (c) => {
    const date = c.req.query('date') ?? '';
    try {
      parseDate(date);
    } catch {
      return fail(400, 'bad_date', '日期格式不对');
    }
    const { built } = await current(c.get('userId'));
    return c.json<DayContext>(dayContext(built.view, date));
  });

  app.get('/api/palaces/:branch/thread', async (c) => {
    const branch = parseBranch(c.req.param('branch'));
    if (branch === null) return fail(400, 'bad_branch', '宫位不存在');
    const userId = c.get('userId');
    const { built } = await current(userId);
    return c.json<ThreadResponse>({ messages: await store.listThread(userId, built.view.id, branch) });
  });

  app.delete('/api/palaces/:branch/thread', async (c) => {
    const branch = parseBranch(c.req.param('branch'));
    if (branch === null) return fail(400, 'bad_branch', '宫位不存在');
    const userId = c.get('userId');
    const { built } = await current(userId);
    await store.clearThread(userId, built.view.id, branch);
    return c.body(null, 204);
  });

  // 问答记录：这个用户在所有命盘、所有宫位下的问答，新的在前；before 是上一页最后一条的 id
  app.get('/api/asks', async (c) => {
    const userId = c.get('userId');
    const before = c.req.query('before');
    if (before !== undefined && !/^\d{1,18}$/.test(before)) return fail(400, 'bad_cursor', '分页参数不对');
    const limit = 30;
    const [{ built }, rows] = await Promise.all([current(userId), store.listAsks(userId, { before, limit: limit + 1 })]);
    const items = rows.slice(0, limit).map((r): AskHistoryItem => ({ ...r, isCurrentChart: r.chartId === built.view.id }));
    return c.json<AskHistoryResponse>({ items, next: rows.length > limit ? items[items.length - 1].id : undefined });
  });

  app.get('/api/asks/:id', async (c) => {
    const id = c.req.param('id');
    if (!/^\d{1,18}$/.test(id)) return fail(404, 'not_found', '这条问答已经不在了');
    const userId = c.get('userId');
    const [{ built }, rows] = await Promise.all([current(userId), store.listAsks(userId, { id, limit: 1 })]);
    if (!rows[0]) return fail(404, 'not_found', '这条问答已经不在了');
    return c.json<AskHistoryItem>({ ...rows[0], isCurrentChart: rows[0].chartId === built.view.id });
  });

  app.post('/api/ask', async (c) => {
    const body = (await c.req.json()) as AskRequest;
    const question = typeof body.question === 'string' ? body.question.trim().slice(0, 500) : '';
    const branch = parseBranch(body.branch);
    if (!question) return fail(400, 'empty_question', '先写下你想问的');
    if (branch === null) return fail(400, 'bad_branch', '宫位不存在');
    const userId = c.get('userId');
    const { built } = await current(userId);
    const chart = built.view;
    const evidence = buildEvidence(chart, built.raw, branch);

    let answer: AskResponse | null = null;
    if (aiEnabled()) {
      try {
        const [reading, thread] = await Promise.all([
          store.getReading(chart.id, branch),
          store.listThread(userId, chart.id, branch),
        ]);
        answer = await aiAsk(chart, branch, evidence, reading, thread, question, userId);
      } catch (err) {
        console.error('[ai] ask failed', err);
      }
    }
    if (!answer) {
      const palace = chart.palaces[branch];
      answer = {
        mode: 'rules',
        answer: `追问需要接入大模型，目前还没有开启，所以这次没能回答你的问题。先把${palace.name}相关的盘面依据列给你，可以对照着看。`,
        basis: [...evidence.facts.map((f) => f.detail), ...evidence.related.map((r) => `${r.relation}${r.name}：${r.stars.join('、') || '空宫'}`)],
        followups: [],
      };
    }
    await store.addExchange(userId, chart.id, branch, question, answer);
    return c.json<AskResponse>(answer);
  });

  app.post(
    '/api/daily',
    bodyLimit({ maxSize: 8 * 1024 * 1024, onError: () => fail(422, 'too_large', '照片太大了，换一张小一点的试试') }),
    async (c) => {
      const body = (await c.req.json()) as DailyRequest;
      try {
        parseDate(body.date);
      } catch {
        return fail(400, 'bad_date', '日期格式不对');
      }
      if (body.image && !['image/jpeg', 'image/png'].includes(body.image.mediaType)) {
        return fail(422, 'bad_image', '只支持 JPEG 或 PNG 图片');
      }
      const { built } = await current(c.get('userId'));
      const ctx = dayContext(built.view, body.date);
      if (aiEnabled()) {
        try {
          return c.json<DailyReading>(await aiDaily(built.view, ctx, body, c.get('userId')));
        } catch (err) {
          console.error('[ai] daily failed', err);
        }
      }
      return c.json<DailyReading>(rulesDaily(built.view, ctx, body.note, Boolean(body.image)));
    },
  );

  app.get('/api/records', async (c) => c.json<RecordItem[]>(await store.listRecords(c.get('userId'))));

  app.post(
    '/api/records',
    bodyLimit({ maxSize: 1024 * 1024, onError: () => fail(422, 'too_large', '缩略图太大') }),
    async (c) => {
      const body = (await c.req.json()) as SaveRecordRequest;
      if (!body.reading || typeof body.date !== 'string') return fail(400, 'bad_record', '记录内容不完整');
      try {
        parseDate(body.date);
      } catch {
        return fail(400, 'bad_date', '日期格式不对');
      }
      const record = await store.addRecord(c.get('userId'), {
        date: body.date,
        note: body.note?.slice(0, 200),
        thumb: typeof body.thumb === 'string' && body.thumb.startsWith('data:image/') ? body.thumb : undefined,
        reading: body.reading,
      });
      return c.json<RecordItem>(record, 201);
    },
  );

  app.delete('/api/records/:id', async (c) => {
    const ok = await store.deleteRecord(c.get('userId'), c.req.param('id'));
    return ok ? c.body(null, 204) : fail(404, 'not_found', '这条记录已经不在了');
  });

  return app;
}
