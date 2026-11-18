import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ThreadMessage } from '@shared/api';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-state';
import { color, space } from '@/theme';

function Answer({ m }: { m: ThreadMessage }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.answer}>
      <Text style={styles.answerText}>{m.text}</Text>
      {m.basis.length ? (
        <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.basisToggle}>
          <Text style={styles.basisToggleText}>{open ? '收起依据' : `看依据（${m.basis.length}）`}</Text>
        </Pressable>
      ) : null}
      {open ? m.basis.map((b) => <Text key={b} style={styles.basis}>· {b}</Text>) : null}
      {m.mode === 'rules' ? <Text style={styles.modeNote}>规则版回复：未接入大模型</Text> : null}
    </View>
  );
}

export default function Ask() {
  // q：从别的页面带过来的问题（如历史同盘的"我和他像在哪"），先放进输入框，由用户自己发
  const { branch: raw, q } = useLocalSearchParams<{ branch: string; q?: string }>();
  const branch = Number(raw);
  const insets = useSafeAreaInsets();
  const { me } = useApp();
  const palace = me?.chart.palaces[branch];
  const [messages, setMessages] = useState<ThreadMessage[] | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState(q ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([api.thread(branch), api.reading(branch)])
      .then(([t, r]) => {
        if (!alive) return;
        setMessages(t.messages);
        setSuggestions(r.suggestions);
      })
      .catch((err) => alive && setError((err as Error).message));
    return () => {
      alive = false;
    };
  }, [branch, me?.chart.id]);

  const last = messages?.[messages.length - 1];
  const chips = last?.role === 'assistant' && last.followups.length ? last.followups : suggestions;

  async function send() {
    const question = input.trim();
    if (!question || sending) return;
    setSending(true);
    setError(null);
    const optimistic: ThreadMessage = { id: `local-${Date.now()}`, role: 'user', text: question, basis: [], followups: [], createdAt: new Date().toISOString() };
    setMessages((m) => [...(m ?? []), optimistic]);
    setInput('');
    try {
      const res = await api.ask(branch, question);
      setMessages((m) => [
        ...(m ?? []),
        { id: `local-a-${Date.now()}`, role: 'assistant', text: res.answer, mode: res.mode, basis: res.basis, followups: res.followups, createdAt: new Date().toISOString() },
      ]);
    } catch (err) {
      // 失败时把问题还给输入框，不丢用户写的字
      setMessages((m) => (m ?? []).filter((x) => x.id !== optimistic.id));
      setInput(question);
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (!palace) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.canvas }} behavior="padding" keyboardVerticalOffset={100}>
      <Stack.Screen options={{ title: `追问 · ${palace.name}`, headerBackTitle: palace.name }} />
      <ScrollView
        ref={scroll}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ padding: space.page, gap: 14, flexGrow: 1 }}
        keyboardDismissMode="interactive"
      >
        <Text style={styles.intro}>
          围绕{me?.chart.kind === 'sample' ? '示例盘的' : '你的'}{palace.name}（{palace.topic}）继续问。回答会指出用到的盘面依据。
        </Text>
        {messages === null && !error ? <ActivityIndicator color={color.accent} style={{ marginTop: 20 }} /> : null}
        {messages?.map((m) =>
          m.role === 'user' ? (
            <View key={m.id} style={styles.question}>
              <Text style={styles.questionText}>{m.text}</Text>
            </View>
          ) : (
            <Answer key={m.id} m={m} />
          ),
        )}
        {sending ? <Text style={styles.pending}>正在翻看盘面…</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {chips.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: space.page }} keyboardShouldPersistTaps="handled">
            {chips.map((s) => (
              // 快捷问题只填进输入框，由用户决定是否发送
              <Pressable key={s} onPress={() => setInput(s)} accessibilityRole="button" accessibilityHint="填入输入框" style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={`问问${palace.name}…`}
            placeholderTextColor={color.text2}
            style={styles.input}
            multiline
            maxLength={500}
            accessibilityLabel="追问内容"
          />
          <Pressable
            onPress={send}
            disabled={!input.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="发送"
            style={[styles.send, (!input.trim() || sending) && { opacity: 0.4 }]}
          >
            <Icon name="arrow.up" size={18} tint={color.onPrimary} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  intro: { color: color.text2, fontSize: 14, lineHeight: 21 },
  question: { alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: color.primaryDeep, borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  questionText: { color: color.onPrimary, fontSize: 16, lineHeight: 23 },
  answer: { alignSelf: 'stretch', backgroundColor: color.surface, borderRadius: 16, padding: 14, gap: 6 },
  answerText: { color: color.text, fontSize: 16, lineHeight: 27 },
  basisToggle: { minHeight: 32, justifyContent: 'center' },
  basisToggleText: { color: color.accent, fontSize: 13 },
  basis: { color: color.text2, fontSize: 13, lineHeight: 20 },
  modeNote: { color: color.border, fontSize: 12 },
  pending: { color: color.text2, fontSize: 14 },
  error: { color: color.danger, fontSize: 14 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator, paddingTop: 10, gap: 10, backgroundColor: color.canvas },
  chip: { borderWidth: 1, borderColor: color.separator, borderRadius: 999, paddingHorizontal: 12, minHeight: 34, justifyContent: 'center' },
  chipText: { color: color.text, fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: space.page },
  input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: color.surface, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, color: color.text, fontSize: 16 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
});
