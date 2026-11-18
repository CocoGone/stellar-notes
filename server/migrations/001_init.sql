-- 星笺初始表结构

-- 每台设备一个匿名用户；id 是 App 首次启动时生成的设备标识
CREATE TABLE users (
  id            text PRIMARY KEY,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);

-- 排好的命盘快照。id 是出生资料（不含昵称）的哈希，示例盘为 'sample'。
-- 同一出生资料只排一次，宫位解读按命盘缓存。
CREATE TABLE charts (
  id              text PRIMARY KEY,
  kind            text NOT NULL CHECK (kind IN ('sample', 'personal')),
  birth           jsonb NOT NULL,
  view            jsonb NOT NULL,
  engine_version  text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 出生资料。时间不确定时 chart_id 为空，不生成确定命盘。
CREATE TABLE birth_profiles (
  user_id        text PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  nickname       text,
  gender         text NOT NULL CHECK (gender IN ('male', 'female')),
  calendar       text NOT NULL CHECK (calendar IN ('solar', 'lunar')),
  birth_year     smallint NOT NULL,
  birth_month    smallint NOT NULL CHECK (birth_month BETWEEN 1 AND 12),
  birth_day      smallint NOT NULL CHECK (birth_day BETWEEN 1 AND 31),
  is_leap_month  boolean NOT NULL DEFAULT false,
  time_status    text NOT NULL CHECK (time_status IN ('exact', 'approx', 'unknown')),
  birth_hour     smallint CHECK (birth_hour BETWEEN 0 AND 23),
  birth_minute   smallint CHECK (birth_minute BETWEEN 0 AND 59),
  time_note      text,
  province       text,
  city           text,
  longitude      double precision,
  dst_clock      boolean NOT NULL DEFAULT false,
  chart_id       text REFERENCES charts (id) ON DELETE SET NULL,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (time_status <> 'exact' OR (birth_hour IS NOT NULL AND birth_minute IS NOT NULL))
);
CREATE INDEX birth_profiles_chart ON birth_profiles (chart_id);

-- 宫位解读缓存（大模型或规则版），依据随解读一起存，便于追溯
CREATE TABLE palace_readings (
  chart_id     text NOT NULL REFERENCES charts (id) ON DELETE CASCADE,
  branch       smallint NOT NULL CHECK (branch BETWEEN 0 AND 11),
  mode         text NOT NULL CHECK (mode IN ('ai', 'rules')),
  model        text,
  headline     text NOT NULL,
  plain        text NOT NULL,
  steps        jsonb NOT NULL,
  reflect      jsonb NOT NULL,
  suggestions  jsonb NOT NULL,
  evidence     jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chart_id, branch)
);

-- 宫位追问的对话记录
CREATE TABLE ask_messages (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  chart_id    text NOT NULL REFERENCES charts (id) ON DELETE CASCADE,
  branch      smallint NOT NULL CHECK (branch BETWEEN 0 AND 11),
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  mode        text CHECK (mode IN ('ai', 'rules')),
  basis       jsonb NOT NULL DEFAULT '[]',
  followups   jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ask_messages_thread ON ask_messages (user_id, chart_id, branch, id);

-- 「今日一图」保存的记录。只存缩略图，不存原图。
CREATE TABLE daily_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  record_date  date NOT NULL,
  note         text,
  thumb        text,
  chart_id     text REFERENCES charts (id) ON DELETE SET NULL,
  mode         text NOT NULL CHECK (mode IN ('ai', 'rules')),
  title        text NOT NULL,
  reading      jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX daily_records_user ON daily_records (user_id, created_at DESC);
