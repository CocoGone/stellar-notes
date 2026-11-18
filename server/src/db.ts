// PostgreSQL 存储层。启动时按 migrations/ 目录顺序执行未跑过的迁移。

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import type {
  AskResponse,
  BirthInput,
  ChartView,
  DailyReading,
  PalaceReading,
  RecordItem,
  ThreadMessage,
} from '../../shared/api.ts';

import type { LlmCallRecord } from './llm.ts';

/** 一问一答：问题那条 ask_messages 的 id；回答没写进去时（理论上不会）answer 为空 */
export interface StoredAsk {
  id: string;
  chartId: string;
  branch: number;
  palace: string;
  question: string;
  answer?: string;
  mode?: 'ai' | 'rules';
  basis: string[];
  createdAt: string;
}

/** 后台用的行，字段名和数据库一致 */
export interface RoundRow {
  round_id: string;
  first_id: string;
  created_at: Date;
  kind: string;
  user_id: string | null;
  chart_id: string | null;
  branch: number | null;
  user_input: string | null;
  model: string;
  attempts: number;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number;
  status: string;
  palace: string | null;
  nickname: string | null;
}
export interface CallRow {
  id: string;
  round_id: string;
  attempt: number;
  created_at: Date;
  kind: string;
  user_id: string | null;
  chart_id: string | null;
  branch: number | null;
  user_input: string | null;
  model: string;
  request: unknown;
  response: unknown;
  output: unknown;
  status: string;
  error: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number;
  palace: string | null;
}
export interface UserRow {
  id: string;
  created_at: Date;
  last_seen_at: Date;
  nickname: string | null;
  gender: string | null;
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  time_status: string | null;
  city: string | null;
  asks: number;
  daily: number;
  rounds: number;
}
export interface Overview {
  users_total: number;
  users_today: number;
  users_7d: number;
  rounds_today: number;
  rounds_7d: number;
  asks_today: number;
  asks_7d: number;
  daily_today: number;
  daily_7d: number;
  input_tokens_7d: number;
  output_tokens_7d: number;
}

// date 列按 'YYYY-MM-DD' 字符串返回，不转成本地时区的 Date
pg.types.setTypeParser(1082, (v) => v);

const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations/', import.meta.url));
export const ENGINE_VERSION = 'ziwei-doushu@ff9a147';

export class Store {
  readonly pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString, max: 10 });
  }

  async migrate(): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT pg_advisory_lock(20261030)');
      await client.query(
        'CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
      );
      const done = new Set((await client.query<{ version: string }>('SELECT version FROM schema_migrations')).rows.map((r) => r.version));
      const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
      const applied: string[] = [];
      for (const file of files) {
        if (done.has(file)) continue;
        const sql = await readFile(MIGRATIONS_DIR + file, 'utf8');
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
          await client.query('COMMIT');
          applied.push(file);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      }
      return applied;
    } finally {
      await client.query('SELECT pg_advisory_unlock(20261030)').catch(() => {});
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // ── 用户与出生资料 ──────────────────────────────

  async ensureUser(id: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO UPDATE SET last_seen_at = now()',
      [id],
    );
  }

  async getBirth(userId: string): Promise<{ birth: BirthInput; chartId: string | null } | null> {
    const { rows } = await this.pool.query('SELECT * FROM birth_profiles WHERE user_id = $1', [userId]);
    const r = rows[0];
    if (!r) return null;
    const time: BirthInput['time'] =
      r.time_status === 'exact'
        ? { status: 'exact', hour: r.birth_hour, minute: r.birth_minute }
        : r.time_status === 'approx'
          ? { status: 'approx', note: r.time_note ?? undefined }
          : { status: 'unknown' };
    return {
      chartId: r.chart_id,
      birth: {
        nickname: r.nickname ?? undefined,
        gender: r.gender,
        calendar: r.calendar,
        year: r.birth_year,
        month: r.birth_month,
        day: r.birth_day,
        isLeapMonth: r.calendar === 'lunar' ? r.is_leap_month : undefined,
        time,
        place: r.province ? { province: r.province, city: r.city, longitude: r.longitude } : undefined,
        dstClock: r.dst_clock,
      },
    };
  }

  /** 保存出生资料；chart 为空表示时间不确定，暂不关联命盘 */
  async saveBirth(userId: string, birth: BirthInput, chart: ChartView | null): Promise<void> {
    if (chart) await this.upsertChart(chart, birth);
    const t = birth.time;
    await this.pool.query(
      `INSERT INTO birth_profiles (user_id, nickname, gender, calendar, birth_year, birth_month, birth_day, is_leap_month,
         time_status, birth_hour, birth_minute, time_note, province, city, longitude, dst_clock, chart_id, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, now())
       ON CONFLICT (user_id) DO UPDATE SET
         nickname = EXCLUDED.nickname, gender = EXCLUDED.gender, calendar = EXCLUDED.calendar,
         birth_year = EXCLUDED.birth_year, birth_month = EXCLUDED.birth_month, birth_day = EXCLUDED.birth_day,
         is_leap_month = EXCLUDED.is_leap_month, time_status = EXCLUDED.time_status,
         birth_hour = EXCLUDED.birth_hour, birth_minute = EXCLUDED.birth_minute, time_note = EXCLUDED.time_note,
         province = EXCLUDED.province, city = EXCLUDED.city, longitude = EXCLUDED.longitude,
         dst_clock = EXCLUDED.dst_clock, chart_id = EXCLUDED.chart_id, updated_at = now()`,
      [
        userId, birth.nickname ?? null, birth.gender, birth.calendar, birth.year, birth.month, birth.day,
        Boolean(birth.isLeapMonth), t.status,
        t.status === 'exact' ? t.hour : null, t.status === 'exact' ? t.minute : null,
        t.status === 'approx' ? t.note ?? null : null,
        birth.place?.province ?? null, birth.place?.city ?? null, birth.place?.longitude ?? null,
        Boolean(birth.dstClock), chart?.id ?? null,
      ],
    );
    await this.pruneCharts();
  }

  async clearBirth(userId: string): Promise<void> {
    await this.pool.query('DELETE FROM birth_profiles WHERE user_id = $1', [userId]);
    await this.pruneCharts();
  }

  async deleteUser(userId: string): Promise<void> {
    await this.pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await this.pruneCharts();
  }

  /** 不再被任何人使用的个人命盘连同出生资料快照一起删掉。还有追问挂在上面的留着，改了出生资料以后问答记录不丢。 */
  private async pruneCharts(): Promise<void> {
    await this.pool.query(
      `DELETE FROM charts c WHERE c.kind = 'personal'
         AND NOT EXISTS (SELECT 1 FROM birth_profiles b WHERE b.chart_id = c.id)
         AND NOT EXISTS (SELECT 1 FROM ask_messages a WHERE a.chart_id = c.id)`,
    );
  }

  // ── 命盘与解读 ──────────────────────────────────

  async upsertChart(chart: ChartView, birth: BirthInput): Promise<void> {
    const { nickname: _omit, ...birthNoName } = birth;
    await this.pool.query(
      `INSERT INTO charts (id, kind, birth, view, engine_version) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET view = EXCLUDED.view, engine_version = EXCLUDED.engine_version`,
      [chart.id, chart.kind, birthNoName, { ...chart, title: chart.kind === 'sample' ? chart.title : '本命' }, ENGINE_VERSION],
    );
  }

  /** version 给了就只认这个版本写的解读（model 列存"模型#版本"，见 llm.ts）；换模型不影响已经写好的。 */
  async getReading(chartId: string, branch: number, version?: string): Promise<PalaceReading | null> {
    const { rows } = version
      ? await this.pool.query('SELECT * FROM palace_readings WHERE chart_id = $1 AND branch = $2 AND model LIKE $3', [chartId, branch, `%#${version}`])
      : await this.pool.query('SELECT * FROM palace_readings WHERE chart_id = $1 AND branch = $2', [chartId, branch]);
    const r = rows[0];
    if (!r) return null;
    return {
      chartId: r.chart_id,
      branch: r.branch,
      mode: r.mode,
      headline: r.headline,
      plain: r.plain,
      steps: r.steps,
      reflect: r.reflect,
      suggestions: r.suggestions,
      evidence: r.evidence,
    };
  }

  /** 一张盘已经写好的全部宫位解读（只认这个版本的缓存） */
  async getReadings(chartId: string, version: string): Promise<Map<number, PalaceReading>> {
    const { rows } = await this.pool.query('SELECT * FROM palace_readings WHERE chart_id = $1 AND model LIKE $2', [chartId, `%#${version}`]);
    return new Map(
      rows.map((r) => [
        r.branch as number,
        { chartId: r.chart_id, branch: r.branch, mode: r.mode, headline: r.headline, plain: r.plain, steps: r.steps, reflect: r.reflect, suggestions: r.suggestions, evidence: r.evidence },
      ]),
    );
  }

  async putReading(reading: PalaceReading, model: string | null): Promise<void> {
    await this.pool.query(
      `INSERT INTO palace_readings (chart_id, branch, mode, model, headline, plain, steps, reflect, suggestions, evidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (chart_id, branch) DO UPDATE SET mode = EXCLUDED.mode, model = EXCLUDED.model,
         headline = EXCLUDED.headline, plain = EXCLUDED.plain, steps = EXCLUDED.steps, reflect = EXCLUDED.reflect,
         suggestions = EXCLUDED.suggestions, evidence = EXCLUDED.evidence, created_at = now()`,
      [
        reading.chartId, reading.branch, reading.mode, model, reading.headline, reading.plain,
        JSON.stringify(reading.steps), JSON.stringify(reading.reflect), JSON.stringify(reading.suggestions),
        reading.evidence,
      ],
    );
  }

  // ── 追问 ────────────────────────────────────────

  async listThread(userId: string, chartId: string, branch: number): Promise<ThreadMessage[]> {
    const { rows } = await this.pool.query(
      `SELECT id, role, content, mode, basis, followups, created_at FROM ask_messages
       WHERE user_id = $1 AND chart_id = $2 AND branch = $3 ORDER BY id`,
      [userId, chartId, branch],
    );
    return rows.map((r) => ({
      id: String(r.id),
      role: r.role,
      text: r.content,
      mode: r.mode ?? undefined,
      basis: r.basis,
      followups: r.followups,
      createdAt: (r.created_at as Date).toISOString(),
    }));
  }

  async addExchange(userId: string, chartId: string, branch: number, question: string, answer: AskResponse): Promise<void> {
    await this.pool.query(
      `INSERT INTO ask_messages (user_id, chart_id, branch, role, content, mode, basis, followups)
       VALUES ($1,$2,$3,'user',$4,NULL,'[]','[]'), ($1,$2,$3,'assistant',$5,$6,$7,$8)`,
      [userId, chartId, branch, question, answer.answer, answer.mode, JSON.stringify(answer.basis), JSON.stringify(answer.followups)],
    );
  }

  async clearThread(userId: string, chartId: string, branch: number): Promise<void> {
    await this.pool.query('DELETE FROM ask_messages WHERE user_id = $1 AND chart_id = $2 AND branch = $3', [userId, chartId, branch]);
  }

  /**
   * 一个用户的全部问答，跨命盘、跨宫位，新的在前。每个问题配上同一宫里紧跟着的那条回答
   * （一问一答是同一条 INSERT 写进去的，见 addExchange）。before 是上一页最后一条的 id。
   */
  async listAsks(userId: string, opts: { before?: string; limit?: number; id?: string } = {}): Promise<StoredAsk[]> {
    const { rows } = await this.pool.query(
      `WITH m AS (
         SELECT id, chart_id, branch, role, content, created_at,
                LEAD(role) OVER w AS next_role, LEAD(content) OVER w AS answer,
                LEAD(mode) OVER w AS mode, LEAD(basis) OVER w AS basis
         FROM ask_messages WHERE user_id = $1
         WINDOW w AS (PARTITION BY chart_id, branch ORDER BY id)
       )
       SELECT m.*, c.view -> 'palaces' -> m.branch ->> 'name' AS palace
       FROM m JOIN charts c ON c.id = m.chart_id
       WHERE m.role = 'user' AND ($2::bigint IS NULL OR m.id < $2) AND ($4::bigint IS NULL OR m.id = $4)
       ORDER BY m.id DESC LIMIT $3`,
      [userId, opts.before ?? null, opts.limit ?? 50, opts.id ?? null],
    );
    return rows.map((r) => {
      const answered = r.next_role === 'assistant';
      return {
        id: String(r.id),
        chartId: r.chart_id,
        branch: r.branch,
        palace: r.palace ?? '',
        question: r.content,
        answer: answered ? r.answer : undefined,
        mode: answered ? (r.mode ?? undefined) : undefined,
        basis: answered ? (r.basis ?? []) : [],
        createdAt: (r.created_at as Date).toISOString(),
      };
    });
  }

  // ── 大模型调用记录（后台） ───────────────────────

  async insertLlmCall(r: LlmCallRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO llm_calls (round_id, attempt, kind, user_id, chart_id, branch, user_input, model, request, response, output,
         status, error, input_tokens, output_tokens, latency_ms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        r.roundId, r.attempt, r.kind, r.userId ?? null, r.chartId ?? null, r.branch ?? null, r.userInput ?? null, r.model,
        JSON.stringify(r.request), r.response === undefined ? null : JSON.stringify(r.response),
        r.output === undefined ? null : JSON.stringify(r.output), r.status, r.error ?? null,
        r.inputTokens ?? null, r.outputTokens ?? null, r.latencyMs,
      ],
    );
  }

  /** 只留最近 days 天的调用记录 */
  async pruneLlmCalls(days: number): Promise<number> {
    const res = await this.pool.query('DELETE FROM llm_calls WHERE created_at < now() - make_interval(days => $1)', [days]);
    return res.rowCount ?? 0;
  }

  /** 按轮次列出调用，新的在前；status 取这一轮最后一次尝试的结果 */
  async listRounds(f: { kind?: string; userId?: string; status?: string; before?: string; limit?: number } = {}): Promise<RoundRow[]> {
    const { rows } = await this.pool.query(
      `SELECT g.*, c.view -> 'palaces' -> g.branch ->> 'name' AS palace, b.nickname
       FROM (
       SELECT round_id, min(id) AS first_id, min(created_at) AS created_at, min(kind) AS kind, min(user_id) AS user_id,
              min(chart_id) AS chart_id, min(branch) AS branch, min(user_input) AS user_input, max(model) AS model,
              count(*)::int AS attempts, sum(input_tokens)::int AS input_tokens, sum(output_tokens)::int AS output_tokens,
              sum(latency_ms)::int AS latency_ms, (array_agg(status ORDER BY attempt DESC))[1] AS status
       FROM llm_calls
       WHERE ($1::text IS NULL OR kind = $1) AND ($2::text IS NULL OR user_id = $2)
       GROUP BY round_id
       HAVING ($3::text IS NULL OR (array_agg(status ORDER BY attempt DESC))[1] = $3) AND ($4::bigint IS NULL OR min(id) < $4)
       ) g
       LEFT JOIN charts c ON c.id = g.chart_id
       LEFT JOIN birth_profiles b ON b.user_id = g.user_id
       ORDER BY g.first_id DESC LIMIT $5`,
      [f.kind || null, f.userId || null, f.status || null, f.before || null, f.limit ?? 50],
    );
    return rows.map((r) => ({ ...r, first_id: String(r.first_id) }));
  }

  async getRound(roundId: string): Promise<CallRow[]> {
    if (!/^[0-9a-f-]{36}$/i.test(roundId)) return [];
    const { rows } = await this.pool.query(
      `SELECT l.*, c.view -> 'palaces' -> l.branch ->> 'name' AS palace
       FROM llm_calls l LEFT JOIN charts c ON c.id = l.chart_id WHERE l.round_id = $1 ORDER BY l.attempt`,
      [roundId],
    );
    return rows;
  }

  async listUsers(limit = 200, id?: string): Promise<UserRow[]> {
    const { rows } = await this.pool.query(
      `SELECT u.id, u.created_at, u.last_seen_at, b.nickname, b.gender, b.birth_year, b.birth_month, b.birth_day,
              b.time_status, b.city,
              (SELECT count(*)::int FROM ask_messages a WHERE a.user_id = u.id AND a.role = 'user') AS asks,
              (SELECT count(*)::int FROM daily_records d WHERE d.user_id = u.id) AS daily,
              (SELECT count(DISTINCT round_id)::int FROM llm_calls l WHERE l.user_id = u.id) AS rounds
       FROM users u LEFT JOIN birth_profiles b ON b.user_id = u.id
       WHERE ($2::text IS NULL OR u.id = $2)
       ORDER BY u.last_seen_at DESC LIMIT $1`,
      [limit, id ?? null],
    );
    return rows;
  }

  async getUserRow(id: string): Promise<UserRow | null> {
    return (await this.listUsers(1, id))[0] ?? null;
  }

  /** 概览：今天和近 7 天 */
  async overview(): Promise<Overview> {
    const { rows } = await this.pool.query(
      `SELECT
         (SELECT count(*)::int FROM users) AS users_total,
         (SELECT count(*)::int FROM users WHERE last_seen_at >= current_date) AS users_today,
         (SELECT count(*)::int FROM users WHERE last_seen_at >= current_date - 6) AS users_7d,
         (SELECT count(DISTINCT round_id)::int FROM llm_calls WHERE created_at >= current_date) AS rounds_today,
         (SELECT count(DISTINCT round_id)::int FROM llm_calls WHERE created_at >= current_date - 6) AS rounds_7d,
         (SELECT count(*)::int FROM ask_messages WHERE role = 'user' AND created_at >= current_date) AS asks_today,
         (SELECT count(*)::int FROM ask_messages WHERE role = 'user' AND created_at >= current_date - 6) AS asks_7d,
         (SELECT count(*)::int FROM daily_records WHERE created_at >= current_date) AS daily_today,
         (SELECT count(*)::int FROM daily_records WHERE created_at >= current_date - 6) AS daily_7d,
         (SELECT coalesce(sum(input_tokens), 0)::int FROM llm_calls WHERE created_at >= current_date - 6) AS input_tokens_7d,
         (SELECT coalesce(sum(output_tokens), 0)::int FROM llm_calls WHERE created_at >= current_date - 6) AS output_tokens_7d`,
    );
    return rows[0];
  }

  // ── 今日记录 ────────────────────────────────────

  async addRecord(userId: string, r: { date: string; note?: string; thumb?: string; reading: DailyReading }): Promise<RecordItem> {
    const { rows } = await this.pool.query(
      `INSERT INTO daily_records (user_id, record_date, note, thumb, chart_id, mode, title, reading)
       VALUES ($1, $2, $3, $4, (SELECT id FROM charts WHERE id = $5), $6, $7, $8)
       RETURNING *`,
      [userId, r.date, r.note ?? null, r.thumb ?? null, r.reading.chartId, r.reading.mode, r.reading.title, r.reading],
    );
    return toRecord(rows[0]);
  }

  async listRecords(userId: string): Promise<RecordItem[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM daily_records WHERE user_id = $1 ORDER BY created_at DESC, id',
      [userId],
    );
    return rows.map(toRecord);
  }

  async deleteRecord(userId: string, id: string): Promise<boolean> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
    const res = await this.pool.query('DELETE FROM daily_records WHERE user_id = $1 AND id = $2', [userId, id]);
    return (res.rowCount ?? 0) > 0;
  }
}

function toRecord(r: Record<string, unknown>): RecordItem {
  return {
    id: r.id as string,
    date: r.record_date as string,
    note: (r.note as string | null) ?? undefined,
    thumb: (r.thumb as string | null) ?? undefined,
    reading: r.reading as DailyReading,
    createdAt: (r.created_at as Date).toISOString(),
  };
}
