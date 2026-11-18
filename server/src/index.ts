import './env.ts';
import { serve } from '@hono/node-server';
import { createAdminApp } from './admin/index.ts';
import { createApp, prepare } from './app.ts';
import { Store } from './db.ts';
import { AI_MODEL, aiEnabled } from './llm.ts';

const port = Number(process.env.PORT || 8787);
const hostname = process.env.HOST || '127.0.0.1';
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('缺少 DATABASE_URL。本地开发先运行 npm run db:up，再把它打印的地址填进 server/.env。');
  process.exit(1);
}

const store = new Store(databaseUrl);
await prepare(store);

serve({ fetch: createApp(store).fetch, port, hostname }, (info) => {
  console.log(`星笺 server on http://${info.address}:${info.port} · AI ${aiEnabled() ? `on（${AI_MODEL}）` : 'off（规则版解读）'}`);
});

// 后台只监听本机，在 Mac 上用 SSH 隧道打开（见 README「后台」）。ADMIN_PORT=off 关掉。
const adminPort = process.env.ADMIN_PORT ?? '38128';
if (adminPort !== 'off') {
  serve({ fetch: createAdminApp(store).fetch, port: Number(adminPort), hostname: '127.0.0.1' }, (info) => {
    console.log(`星笺后台 on http://${info.address}:${info.port}（只限本机）`);
  });
}

// 调用记录只留 90 天：启动时清一次，之后每天一次
const pruneCalls = () =>
  store.pruneLlmCalls(90).then((n) => n && console.log(`[db] pruned ${n} old llm_calls`)).catch((err) => console.error('[db] prune llm_calls failed', err));
void pruneCalls();
setInterval(pruneCalls, 24 * 60 * 60 * 1000).unref();
