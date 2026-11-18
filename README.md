# 星笺 Stellar Notes

把命盘读懂，把今天留下。一个 iOS 优先的紫微斗数 App：先看到自己的命盘，再用白话一步步解释“盘面有什么、传统上怎么说、依据是什么、还有哪些不确定”；每天还可以选一张照片，结合命盘看看今天。

「命盘 → 合盘」添加一位对方后，自动生成两个人的综合关系解读：先说核心判断，再说明互补、摩擦和双方具体怎么做，每节都能展开双方依据。伴侣、暧昧、分开、朋友、亲子、家人、合作各有专属主题；亲子需明确我方身份。双盘与逐宫对照可展开，支持继续追问。朋友追问可选择「想试着修复」或「想拉开距离」，预填后补充经过、主动发送，切换方向保留已写内容。对方出生资料保存在设备，双方时辰确定后才生成合盘。

## 仓库结构

```
apps/mobile/   Expo SDK 58 + Expo Router 的 iOS App（命盘 / 今日 / 我的）
server/        Node + Hono 后端，PostgreSQL 存储，Anthropic SDK 做解读
  src/engine/  排盘引擎与古籍原文，来自 ziwei-doushu@ff9a147（MIT）
  migrations/  数据库迁移，启动时自动执行
shared/api.ts  前后端共用的接口类型
```

## 本地运行

需要 Node 22+、PostgreSQL（macOS：`brew install postgresql@17`）和 Xcode 的 iOS 模拟器。

```bash
# 1. 后端
cd server
npm install
npm run db:up          # 在 server/.pgdata 起一个项目内的 PostgreSQL（端口 54329），并建好 stellar_notes 库
cp .env.example .env   # 填 DATABASE_URL；想开大模型解读就填 ANTHROPIC_API_KEY（可选 ANTHROPIC_BASE_URL 指向 LiteLLM）
npm run dev            # http://127.0.0.1:8787，启动时自动跑迁移

# 2. App（另开一个终端）
cd apps/mobile
npm install
npx expo start --ios   # 在模拟器的 Expo Go 里打开
```

真机调试时，把 `EXPO_PUBLIC_API_URL` 设成电脑的局域网地址（如 `http://192.168.1.10:8787`），后端启动时设 `HOST=0.0.0.0`。

## 大模型

后端用 Anthropic Messages API（默认 `claude-opus-5-5`），配置都在 `server/.env`：

| 变量 | 说明 |
| --- | --- |
| `ANTHROPIC_API_KEY` | 不填则用规则版：宫位解读来自引擎和古籍词条，追问只列依据，今日一图不识图 |
| `ANTHROPIC_BASE_URL` | 可指向 LiteLLM 等网关 |
| `XJ_MODEL` | 换模型 |
| `XJ_FALLBACKS` | 直连 Anthropic 时默认开启服务端拒答回退（`fallbacks: "default"`）；配了网关时默认关闭 |

模型只拿到服务端整理好的盘面依据（主星、亮度、四化、三方四正、格局、古籍原文与出处），提示词要求它只根据依据说话、用观察角度代替断语、不替用户做医疗/财务/感情决定。宫位解读按命盘缓存在数据库里。

## 数据库

`server/migrations/001_init.sql`：

| 表 | 内容 |
| --- | --- |
| `users` | 每台设备一个匿名用户（App 首次启动生成的设备标识） |
| `birth_profiles` | 出生资料；时间不确定时不关联命盘 |
| `charts` | 排好的命盘快照，id 是出生资料的哈希，同一出生资料只排一次 |
| `palace_readings` | 宫位解读缓存（AI 或规则版）及其依据 |
| `ask_messages` | 宫位追问的对话 |
| `daily_records` | 今日一图保存的记录（只存缩略图） |

删除账号会级联删除该用户的所有数据，没人再用的命盘快照一并删除。

`npm run db:psql` 进库，`npm run db:down` 停库。也可以把 `DATABASE_URL` 指向任何 PostgreSQL 13+。

## 排盘口径

沿用 ziwei-doushu：北京时间钟表读数 → 按出生地经度与均时差换算真太阳时定时辰；晚子时（23 点后）按次日排盘；1986–1991 年夏令时由用户确认后减 1 小时；农历输入先换成公历。时辰不知道或只知道大概时，只保存资料，不按子时硬排。

## 测试

```bash
cd server && npm test        # 需要 db:up 起的 stellar_notes_test 库
cd server && npm run typecheck
cd apps/mobile && npx tsc --noEmit && npx expo lint
```


## 致谢与许可

排盘引擎与古籍原文来自 [ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu)（代码 MIT；《骨髓赋》《紫微斗数全集》《紫微斗数全书》为公有领域）。本仓库未使用其 v3/v4 数据集。
