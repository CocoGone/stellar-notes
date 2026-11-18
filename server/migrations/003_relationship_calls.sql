ALTER TABLE llm_calls DROP CONSTRAINT llm_calls_kind_check;
ALTER TABLE llm_calls ADD CONSTRAINT llm_calls_kind_check
  CHECK (kind IN ('reading', 'ask', 'daily', 'relationship'));
