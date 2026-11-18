-- 每一次调用大模型的完整记录，后台按轮次查看用户输入、发给模型的上下文和返回。
-- 同一轮的重试共用 round_id。图片不存原图，request 里只记大小。
-- 用户删除全部数据时一起删；命盘删了记录还在，所以 chart_id 不建外键。保留 90 天。
CREATE TABLE llm_calls (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  round_id       uuid NOT NULL,
  attempt        smallint NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  kind           text NOT NULL CHECK (kind IN ('reading', 'ask', 'daily')),
  user_id        text REFERENCES users (id) ON DELETE CASCADE,
  chart_id       text,
  branch         smallint CHECK (branch BETWEEN 0 AND 11),
  user_input     text,
  model          text NOT NULL,
  request        jsonb NOT NULL,
  response       jsonb,
  output         jsonb,
  status         text NOT NULL CHECK (status IN ('ok', 'invalid', 'error')),
  error          text,
  input_tokens   integer,
  output_tokens  integer,
  latency_ms     integer NOT NULL
);
CREATE INDEX llm_calls_recent ON llm_calls (created_at DESC);
CREATE INDEX llm_calls_user ON llm_calls (user_id, created_at DESC);
CREATE INDEX llm_calls_round ON llm_calls (round_id, attempt);
