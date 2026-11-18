// server/.env 优先于外部环境变量。index.ts 第一个导入它，必须在其他模块读环境变量之前执行。
// 原因：在 Claude Code 这类工具的终端里启动时，外部已经有 ANTHROPIC_BASE_URL、ANTHROPIC_AUTH_TOKEN（工具自己的会话令牌）。
// node --env-file 不覆盖已有变量，请求就会带着工具的令牌发到别处，返回 401 "Invalid bearer token"（2026-10-30 遇到过）。
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const file = new URL('../.env', import.meta.url);
if (existsSync(file)) {
  const vars = parseEnv(readFileSync(file, 'utf8'));
  Object.assign(process.env, vars);
  // .env 给的是 API key 时，不让 SDK 再读到外部的 Bearer 令牌
  if (vars.ANTHROPIC_API_KEY && !vars.ANTHROPIC_AUTH_TOKEN) delete process.env.ANTHROPIC_AUTH_TOKEN;
}
