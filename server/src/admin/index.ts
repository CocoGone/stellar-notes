// 后台：只读网页，看每一轮调用大模型的完整上下文、用户和他们的问答。
// 只监听服务器本机（index.ts 里绑 127.0.0.1），在 Mac 上用 SSH 隧道打开，外网访问不到，所以不另设登录。
// 页面用 hono/html 拼：插进去的字符串都会转义，用户输入的内容不会被当成 HTML。

import { Hono } from 'hono';
import { html, raw } from 'hono/html';
import type { HtmlEscapedString } from 'hono/utils/html';
import type { CallRow, RoundRow, Store } from '../db.ts';

type Html = HtmlEscapedString | Promise<HtmlEscapedString>;

const KIND: Record<string, string> = { reading: '宫位解读', ask: '追问', daily: '每日一图', relationship: '合盘追问' };
const STATUS: Record<string, string> = { ok: '成功', invalid: '格式不对', error: '失败' };
const BRANCH = '子丑寅卯辰巳午未申酉戌亥';

const fmt = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});
const time = (d: Date | string | null) => (d ? fmt.format(new Date(d)).replace(/\//g, '-') : '');
const num = (n: number | null | undefined) => (n == null ? '' : n.toLocaleString('en-US'));
const short = (s: string | null | undefined, n = 40) => (!s ? '' : s.length > n ? `${s.slice(0, n)}…` : s);
const pretty = (v: unknown) => JSON.stringify(v, null, 2);

/** 用户消息里常是 JSON 字符串，能解析就展开排版 */
function prettyText(text: string): string {
  const t = text.trim();
  if (t.startsWith('{') || t.startsWith('[')) {
    try {
      return pretty(JSON.parse(t));
    } catch {
      return text;
    }
  }
  return text;
}

const CSS = `
:root { color-scheme: light dark; --bg:#f7f7f8; --fg:#1d1d1f; --muted:#6e6e73; --card:#fff; --line:#e3e3e8; --accent:#5b4bd6; --bad:#c0392b; --warn:#b7791f; --ok:#2e7d32; }
@media (prefers-color-scheme: dark) { :root { --bg:#141416; --fg:#ececf0; --muted:#9a9aa2; --card:#1d1d21; --line:#2e2e34; --accent:#a99cff; --bad:#ff6b5b; --warn:#f0b445; --ok:#6fcf73; } }
* { box-sizing: border-box; }
body { margin:0; font:14px/1.55 -apple-system, "PingFang SC", "Helvetica Neue", sans-serif; background:var(--bg); color:var(--fg); }
header { display:flex; gap:20px; align-items:center; padding:12px 24px; border-bottom:1px solid var(--line); background:var(--card); position:sticky; top:0; }
header b { margin-right:12px; } header a { color:var(--fg); text-decoration:none; } header a.on { color:var(--accent); font-weight:600; }
main { padding:20px 24px 60px; max-width:1400px; }
h1 { font-size:20px; margin:0 0 16px; } h2 { font-size:16px; margin:28px 0 10px; }
a { color:var(--accent); }
.cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:12px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px 14px; }
.card .v { font-size:22px; font-weight:600; } .card .k { color:var(--muted); font-size:12px; }
table { width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--line); border-radius:10px; overflow:hidden; }
th, td { text-align:left; padding:7px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
th { font-weight:600; color:var(--muted); font-size:12px; white-space:nowrap; }
td.n { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
td:first-child, td:nth-child(2) { white-space:nowrap; }
tr:last-child td { border-bottom:none; }
.muted { color:var(--muted); } .s-ok { color:var(--ok); } .s-invalid { color:var(--warn); } .s-error { color:var(--bad); }
pre { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:10px 12px; white-space:pre-wrap; word-break:break-word; margin:6px 0 12px; font:12.5px/1.5 ui-monospace, Menlo, monospace; max-height:640px; overflow:auto; }
details { margin:6px 0; } summary { cursor:pointer; color:var(--muted); }
form.filters { display:flex; gap:10px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
select, input { font:inherit; padding:4px 8px; border-radius:6px; border:1px solid var(--line); background:var(--card); color:var(--fg); }
.attempt { border:1px solid var(--line); border-radius:10px; padding:4px 16px 12px; margin:16px 0; background:var(--card); }
.meta { display:flex; flex-wrap:wrap; gap:6px 18px; color:var(--muted); font-size:13px; margin:10px 0; }
.qa { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:10px 14px; margin:10px 0; }
.qa .q { font-weight:600; } .qa .a { white-space:pre-wrap; margin-top:6px; }
`;

function page(title: string, nav: string, body: Html): Html {
  const link = (href: string, label: string) => html`<a href="${href}" class="${nav === href ? 'on' : ''}">${label}</a>`;
  return html`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · 星笺后台</title><style>${raw(CSS)}</style></head>
<body><header><b>星笺后台</b>${link('/', '概览')}${link('/rounds', '调用轮次')}${link('/users', '用户')}</header>
<main>${body}</main></body></html>`;
}

const statusTag = (s: string) => html`<span class="s-${s}">${STATUS[s] ?? s}</span>`;
const userLink = (id: string | null, nickname?: string | null) =>
  id ? html`<a href="/users/${encodeURIComponent(id)}">${nickname || id.slice(0, 8)}</a>` : html`<span class="muted">—</span>`;
const where = (r: { palace?: string | null; branch: number | null }) =>
  r.palace ?? (r.branch == null ? '' : `${BRANCH[r.branch]}宫`);

function roundsTable(rows: RoundRow[]): Html {
  if (!rows.length) return html`<p class="muted">还没有记录。</p>`;
  return html`<table><tr><th>时间</th><th>类型</th><th>用户</th><th>宫位</th><th>用户输入</th><th>模型</th><th>尝试</th><th>输入 tokens</th><th>输出 tokens</th><th>耗时</th><th>状态</th></tr>
${rows.map(
  (r) => html`<tr><td><a href="/rounds/${r.round_id}">${time(r.created_at)}</a></td><td>${KIND[r.kind] ?? r.kind}</td>
<td>${userLink(r.user_id, r.nickname)}</td><td>${where(r)}</td><td>${short(r.user_input, 50)}</td><td class="muted">${r.model}</td>
<td class="n">${r.attempts}</td><td class="n">${num(r.input_tokens)}</td><td class="n">${num(r.output_tokens)}</td>
<td class="n">${(r.latency_ms / 1000).toFixed(1)}s</td><td>${statusTag(r.status)}</td></tr>`,
)}</table>`;
}

/** 一条 message 的内容：文字（JSON 自动排版）、图片只显示大小、其他块原样 */
function contentBlocks(content: unknown): Html {
  if (typeof content === 'string') return html`<pre>${prettyText(content)}</pre>`;
  if (!Array.isArray(content)) return html`<pre>${pretty(content)}</pre>`;
  return html`${content.map((b: Record<string, any>) => {
    if (b?.type === 'text') return html`<pre>${prettyText(b.text ?? '')}</pre>`;
    if (b?.type === 'image') return html`<p class="muted">[图片 ${b.source?.media_type ?? ''}，约 ${Math.round((b.source?.bytes ?? 0) / 1024)} KB，原图不保存]</p>`;
    if (b?.type === 'thinking') return html`<details><summary>思考过程（${(b.thinking ?? '').length} 字）</summary><pre>${b.thinking ?? ''}</pre></details>`;
    if (b?.type === 'tool_use') return html`<p class="muted">调用工具 ${b.name}：</p><pre>${pretty(b.input)}</pre>`;
    return html`<pre>${pretty(b)}</pre>`;
  })}`;
}

function attemptView(c: CallRow): Html {
  const req = (c.request ?? {}) as Record<string, any>;
  const { system, messages, tools, ...params } = req;
  const res = (c.response ?? null) as Record<string, any> | null;
  return html`<div class="attempt"><h2>第 ${c.attempt} 次 · ${statusTag(c.status)}</h2>
<div class="meta"><span>${time(c.created_at)}</span><span>模型 ${c.model}</span><span>输入 ${num(c.input_tokens)} tokens</span>
<span>输出 ${num(c.output_tokens)} tokens</span><span>耗时 ${(c.latency_ms / 1000).toFixed(1)}s</span>
${res?.stop_reason ? html`<span>结束原因 ${res.stop_reason}</span>` : ''}</div>
${c.error ? html`<p class="s-error">错误：${c.error}</p>` : ''}
<h2>System prompt</h2><pre>${typeof system === 'string' ? system : pretty(system)}</pre>
<h2>Messages</h2>${(Array.isArray(messages) ? messages : []).map((m: Record<string, any>) => html`<p class="muted">${m.role}</p>${contentBlocks(m.content)}`)}
<details><summary>工具定义</summary><pre>${pretty(tools ?? null)}</pre></details>
<details><summary>其他参数</summary><pre>${pretty(params)}</pre></details>
<h2>模型返回</h2>${res ? contentBlocks(res.content) : html`<p class="muted">没有返回</p>`}
${c.output != null ? html`<details open><summary>解析结果</summary><pre>${pretty(c.output)}</pre></details>` : ''}
</div>`;
}

export function createAdminApp(store: Store) {
  const app = new Hono();

  app.onError((err, c) => {
    console.error('[admin]', err);
    return c.html(page('出错了', '', html`<h1>出错了</h1><pre>${err instanceof Error ? err.message : String(err)}</pre>`), 500);
  });

  app.get('/', async (c) => {
    const [o, recent, failed, invalid] = await Promise.all([
      store.overview(),
      store.listRounds({ limit: 15 }),
      store.listRounds({ status: 'error', limit: 10 }),
      store.listRounds({ status: 'invalid', limit: 10 }),
    ]);
    const card = (k: string, v: number) => html`<div class="card"><div class="v">${num(v)}</div><div class="k">${k}</div></div>`;
    const problems = [...failed, ...invalid].sort((a, b) => Number(b.first_id) - Number(a.first_id)).slice(0, 10);
    return c.html(
      page('概览', '/', html`<h1>概览</h1>
<div class="cards">${card('用户总数', o.users_total)}${card('今天活跃用户', o.users_today)}${card('近 7 天活跃用户', o.users_7d)}
${card('今天调用轮次', o.rounds_today)}${card('近 7 天调用轮次', o.rounds_7d)}${card('今天追问', o.asks_today)}${card('近 7 天追问', o.asks_7d)}
${card('今天每日一图', o.daily_today)}${card('近 7 天每日一图', o.daily_7d)}${card('近 7 天输入 tokens', o.input_tokens_7d)}${card('近 7 天输出 tokens', o.output_tokens_7d)}</div>
<h2>最近的调用</h2>${roundsTable(recent)}
<h2>最近出问题的</h2>${roundsTable(problems)}`),
    );
  });

  app.get('/rounds', async (c) => {
    const f = { kind: c.req.query('kind') || undefined, userId: c.req.query('user') || undefined, status: c.req.query('status') || undefined };
    const before = c.req.query('before');
    const rows = await store.listRounds({ ...f, before: before && /^\d+$/.test(before) ? before : undefined, limit: 50 });
    const opt = (v: string, label: string, cur?: string) => html`<option value="${v}" ${cur === v ? 'selected' : ''}>${label}</option>`;
    const next = rows.length === 50 ? `/rounds?${new URLSearchParams({ ...(f.kind ? { kind: f.kind } : {}), ...(f.userId ? { user: f.userId } : {}), ...(f.status ? { status: f.status } : {}), before: rows[rows.length - 1].first_id })}` : null;
    return c.html(
      page('调用轮次', '/rounds', html`<h1>调用轮次</h1>
<form class="filters" method="get" action="/rounds">
<select name="kind">${opt('', '全部类型', f.kind ?? '')}${Object.entries(KIND).map(([k, v]) => opt(k, v, f.kind))}</select>
<select name="status">${opt('', '全部状态', f.status ?? '')}${Object.entries(STATUS).map(([k, v]) => opt(k, v, f.status))}</select>
<input name="user" placeholder="用户 ID" value="${f.userId ?? ''}" size="38"><button>筛选</button>
${f.kind || f.status || f.userId ? html`<a href="/rounds">清除</a>` : ''}</form>
${roundsTable(rows)}${next ? html`<p><a href="${next}">更早的 →</a></p>` : ''}`),
    );
  });

  app.get('/rounds/:id', async (c) => {
    const calls = await store.getRound(c.req.param('id'));
    if (!calls.length) return c.html(page('找不到', '/rounds', html`<h1>找不到这一轮</h1><p><a href="/rounds">返回列表</a></p>`), 404);
    const first = calls[0];
    return c.html(
      page(`${KIND[first.kind] ?? first.kind}`, '/rounds', html`<h1>${KIND[first.kind] ?? first.kind} · ${time(first.created_at)}</h1>
<div class="meta"><span>用户 ${userLink(first.user_id)}</span>${first.branch != null ? html`<span>${where(first)}（${BRANCH[first.branch]}）</span>` : ''}
<span>命盘 ${first.chart_id ?? '—'}</span><span>尝试 ${calls.length} 次</span></div>
<h2>用户输入</h2>${first.user_input ? html`<pre>${first.user_input}</pre>` : html`<p class="muted">（这类调用没有用户输入，如宫位解读）</p>`}
${calls.map(attemptView)}`),
    );
  });

  app.get('/users', async (c) => {
    const users = await store.listUsers(300);
    return c.html(
      page('用户', '/users', html`<h1>用户（${users.length}）</h1>
<table><tr><th>用户</th><th>出生资料</th><th>创建</th><th>最近活跃</th><th>追问</th><th>每日一图</th><th>调用轮次</th></tr>
${users.map(
  (u) => html`<tr><td>${userLink(u.id, u.nickname)}<div class="muted">${u.id}</div></td>
<td>${u.birth_year ? `${u.birth_year}-${u.birth_month}-${u.birth_day} · ${u.gender === 'male' ? '男' : '女'}${u.city ? ` · ${u.city}` : ''}${u.time_status === 'exact' ? '' : ' · 时间不确定'}` : html`<span class="muted">未填</span>`}</td>
<td>${time(u.created_at)}</td><td>${time(u.last_seen_at)}</td><td class="n">${u.asks}</td><td class="n">${u.daily}</td><td class="n">${u.rounds}</td></tr>`,
)}</table>`),
    );
  });

  app.get('/users/:id', async (c) => {
    const id = c.req.param('id');
    const user = await store.getUserRow(id);
    if (!user) return c.html(page('找不到', '/users', html`<h1>找不到这个用户</h1><p><a href="/users">返回列表</a></p>`), 404);
    const [birth, asks, records, rounds] = await Promise.all([
      store.getBirth(id),
      store.listAsks(id, { limit: 500 }),
      store.listRecords(id),
      store.listRounds({ userId: id, limit: 100 }),
    ]);
    return c.html(
      page(user.nickname || id.slice(0, 8), '/users', html`<h1>${user.nickname || '未起昵称'} <span class="muted">${id}</span></h1>
<div class="meta"><span>创建 ${time(user.created_at)}</span><span>最近活跃 ${time(user.last_seen_at)}</span></div>
<h2>出生资料</h2>${birth ? html`<pre>${pretty(birth.birth)}</pre>` : html`<p class="muted">未填</p>`}
<h2>问答记录（${asks.length}）</h2>
${asks.length ? asks.map((a) => html`<div class="qa"><div class="muted">${time(a.createdAt)} · ${a.palace} · ${a.mode === 'rules' ? '规则版' : 'AI'}${a.chartId === (birth?.chartId ?? 'sample') ? '' : ' · 旧命盘'}</div>
<div class="q">${a.question}</div><div class="a">${a.answer ?? '（没有回答）'}</div>
${a.basis.length ? html`<details><summary>依据（${a.basis.length}）</summary><pre>${a.basis.join('\n')}</pre></details>` : ''}</div>`) : html`<p class="muted">还没有问过。</p>`}
<h2>每日一图（${records.length}）</h2>
${records.length ? html`<table><tr><th>日期</th><th>标题</th><th>备注</th><th>方式</th></tr>${records.map((r) => html`<tr><td>${r.date}</td><td>${r.reading.title}</td><td>${r.note ?? ''}</td><td>${r.reading.mode === 'ai' ? 'AI' : '规则版'}</td></tr>`)}</table>` : html`<p class="muted">没有记录。</p>`}
<h2>调用轮次（最近 100）</h2>${roundsTable(rounds)}`),
    );
  });

  return app;
}
