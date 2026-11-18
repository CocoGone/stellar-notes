import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { ChartView, ChatTurn, RelationshipAnswer, RelationshipPalace, RelationshipRequest, RelationshipSide } from '@shared/api';
import { FRIENDSHIP_GOALS } from '@shared/relationship';
import { api } from '@/lib/api';
import { CHART_POSITION } from '@/lib/chart-position';
import { color, font, hua } from '@/theme';
import { ClassicRefs } from './ClassicRefs';
import { Disclosure } from './Disclosure';
import { Icon } from './Icon';
import { PrimaryButton, TextButton } from './Buttons';
import { PatternCards } from './PatternCards';

export function RelationshipMark() {
  return (
    <Svg width={220} height={144} viewBox="0 0 220 144" accessibilityElementsHidden>
      <Circle cx={83} cy={72} r={53} stroke={color.accent} strokeWidth={1} fill={`${color.accent}08`} />
      <Circle cx={137} cy={72} r={53} stroke={color.gold} strokeWidth={1} fill={`${color.gold}08`} />
      <Path d="M83 19L137 125M137 19L83 125" stroke={color.border} strokeWidth={0.6} strokeDasharray="3 5" opacity={0.4} />
      <Circle cx={83} cy={19} r={3.5} fill={color.accent} />
      <Circle cx={137} cy={125} r={3.5} fill={color.gold} />
      <Circle cx={110} cy={72} r={3} fill={color.text} />
    </Svg>
  );
}

/** 缩略盘只呈现主星，点击整张盘展开可操作的完整十二宫。 */
export function MiniRelationshipChart({ chart, palaceName, label, tone, onPress }: {
  chart: ChartView; palaceName: string; label: string; tone: string; onPress: () => void;
}) {
  const [width, setWidth] = useState(0);
  const w = width / 4;
  const h = w * 1.48;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}的命盘，已高亮${palaceName}，点按放大查看`} style={({ pressed }) => [styles.miniWrap, { opacity: pressed ? 0.75 : 1 }]}>
      <View style={[styles.mini, { height: h * 4 || 240 }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {width > 0 ? chart.palaces.map((p) => {
          const [row, col] = CHART_POSITION[p.branch];
          const active = p.name === palaceName;
          return (
            <View key={p.branch} style={[styles.miniCell, { left: col * w, top: row * h, width: w, height: h }, active && { backgroundColor: `${tone}25`, borderColor: tone, borderWidth: 1 }]}>
              <Text style={[styles.miniName, { color: active ? tone : color.text2 }]} maxFontSizeMultiplier={1.1}>{p.name.replace('宫', '')}</Text>
              {p.majorStars.length ? p.majorStars.map((s) => <Text key={s.name} style={styles.miniStar} maxFontSizeMultiplier={1.1}>{s.name}</Text>) : <Text style={styles.miniEmpty} maxFontSizeMultiplier={1.1}>空宫</Text>}
            </View>
          );
        }) : null}
        {width > 0 ? <View style={[styles.miniCenter, { left: w, top: h, width: w * 2, height: h * 2 }]}>
          <Text style={[styles.miniSeal, { color: tone }]} maxFontSizeMultiplier={1.2}>{label}</Text>
          <Text style={styles.miniMeta} maxFontSizeMultiplier={1.1}>{chart.meta.wuxingJu}</Text>
          <Text style={styles.miniMeta} maxFontSizeMultiplier={1.1}>命在{chart.palaces[chart.mingBranch].branchName}</Text>
          <Icon name="arrow.up.left.and.arrow.down.right" size={12} tint={tone} />
        </View> : null}
      </View>
    </Pressable>
  );
}

function StarNames({ side, tone }: { side: RelationshipSide; tone: string }) {
  const p = side.palace;
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.palaceLocation}>{p.name} · {p.stemName}{p.branchName}</Text>
      {p.majorStars.length ? p.majorStars.map((s) => (
        <Text key={s.name} style={[styles.starName, { color: tone }]}>{s.name} <Text style={styles.starMeta}>{s.brightness}</Text>{s.siHua ? <Text style={{ color: hua[s.siHua], fontSize: 13 }}> 化{s.siHua}</Text> : null}</Text>
      )) : <Text style={[styles.starName, { color: tone }]}>无主星<Text style={styles.starMeta}>{'\n'}借{p.borrowed?.fromName ?? '对宫'} · {p.borrowed?.stars.join('、') ?? '待核对'}</Text></Text>}
    </View>
  );
}

export function RelationshipComparison({ pair, leftName, rightName }: { pair: RelationshipPalace; leftName: string; rightName: string }) {
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.readingColumns}>
        {([{ side: pair.left, name: leftName, tone: color.accent }, { side: pair.right, name: rightName, tone: color.gold }]).map(({ side, name, tone }, i) => (
          <View key={i} style={styles.readingSide}>
            <Text style={[styles.personLabel, { color: tone }]}>{name}</Text>
            <StarNames side={side} tone={tone} />
            <Text style={styles.plain}>{side.plain}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.observation}>{pair.observation}</Text>
      <View style={styles.questionCard}>
        <Text style={styles.eyebrow}>留给两个人的问题</Text>
        <Text style={styles.question}>{pair.question}</Text>
        <Text style={styles.exercise}>{pair.exercise}</Text>
      </View>
      <View style={styles.evidence}>
        <Disclosure title="盘面依据与古籍">
          <Text style={styles.evidenceNote}>主星白话是单宫传统含义的转述。相处问题是讨论建议，古籍原文列在各自盘面下。</Text>
          {([{ side: pair.left, name: leftName, tone: color.accent }, { side: pair.right, name: rightName, tone: color.gold }]).map(({ side, name, tone }, i) => (
            <View key={i} style={styles.evidenceSide}>
              <Text style={[styles.personLabel, { color: tone }]}>{name} · {side.palace.name}</Text>
              {side.evidence.facts.map((f, j) => <Text key={j} style={styles.detail}><Text style={{ color: color.text }}>{f.label}　</Text>{f.detail}</Text>)}
              <Text style={styles.detail}>三方四正　{side.evidence.related.map((p) => `${p.relation} ${p.name}（${p.stars.join('、') || '无主星'}）`).join('；')}</Text>
              <Disclosure title="传统含义">
                {side.evidence.tradition.map((t, j) => <View key={j} style={{ gap: 3, marginBottom: 12 }}><Text style={styles.detail}><Text style={{ color: color.text }}>{t.label}　</Text>{t.detail}</Text>{t.source ? <Text style={styles.unknown}>{t.source}</Text> : null}</View>)}
                <PatternCards patterns={side.evidence.patterns} />
              </Disclosure>
              <ClassicRefs refs={side.evidence.classics} note={side.evidence.classicsNote} fitLabel="对照这张盘" onSurface />
              {side.evidence.unknowns.map((u, j) => <Text key={j} style={styles.unknown}>{u}</Text>)}
            </View>
          ))}
        </Disclosure>
      </View>
    </View>
  );
}

export function RelationshipQuestions({ request, pair, scope = 'palace', suggestions }: { request: RelationshipRequest; pair: RelationshipPalace; scope?: 'palace' | 'overall'; suggestions?: string[] }) {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<{ question: string; answer: RelationshipAnswer }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const input = useRef<TextInputInstance>(null);
  const friendshipGoals = request.relationship === 'friend' && scope === 'overall';
  useEffect(() => () => controller.current?.abort(), []);

  function chooseFriendshipGoal(goal: (typeof FRIENDSHIP_GOALS)[number]) {
    const previous = FRIENDSHIP_GOALS.find((g) => question.startsWith(g.prompt));
    const context = (previous ? question.slice(previous.prompt.length) : question).trim();
    const next = `${goal.prompt}\n\n${context || '最近发生的是：'}`;
    if (next.length > 500) {
      setError('这段话接近500字，请精简后再选方向，原文已保留。');
      input.current?.focus();
      return;
    }
    setQuestion(next);
    setError(null);
    input.current?.focus();
  }

  async function send() {
    const text = question.trim();
    if (!text || busy) return;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError(null);
    const history: ChatTurn[] = turns.flatMap((t) => [
      { role: 'user' as const, text: t.question },
      { role: 'assistant' as const, text: t.answer.answer.slice(0, 2000) },
    ]).slice(-6);
    try {
      const answer = await api.relationshipAsk({ ...request, palace: pair.name, question: text, history, scope }, abort.signal);
      if (!abort.signal.aborted) {
        setTurns((prev) => [...prev.slice(-2), { question: text, answer }]);
        setQuestion('');
      }
    } catch (err) {
      if (!abort.signal.aborted) setError((err as Error).message);
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }

  return (
    <View style={styles.askSection}>
      <Text style={styles.sectionTitle}>{scope === 'overall' ? '继续聊你们的关系' : '把你们的情况带进来'}</Text>
      <Text style={styles.detail}>{friendshipGoals ? '选一个方向，再补充发生的事；也可以直接问。' : scope === 'overall' ? '补充真实发生的事，结合双方盘面继续解读。' : `结合双方的${pair.name}和相关宫位继续聊。`}</Text>
      {turns.map((t, i) => <View key={i} style={styles.answerCard}>
        <Text style={styles.userQuestion}>{t.question}</Text>
        <Text style={styles.eyebrow}>{t.answer.mode === 'ai' ? 'AI 双盘解读' : '盘面对照'}</Text>
        {t.answer.notice ? <Text style={styles.notice}>{t.answer.notice}</Text> : null}
        <Text style={styles.answer}>{t.answer.answer}</Text>
        <Disclosure title="这次用到的依据">
          {t.answer.basis.map((b, j) => <Text key={j} style={styles.detail}>{b}</Text>)}
        </Disclosure>
        {t.answer.followups.slice(0, 2).map((q, j) => <Pressable key={j} onPress={() => setQuestion(q)} accessibilityRole="button" disabled={busy} style={styles.followup}><Text style={styles.followupText}>{q}</Text><Icon name="arrow.down.left" size={12} /></Pressable>)}
      </View>)}
      {friendshipGoals ? <View style={styles.goalChoices}>
        {FRIENDSHIP_GOALS.map((goal) => {
          const selected = question.startsWith(goal.prompt);
          return <Pressable key={goal.id} disabled={busy} onPress={() => chooseFriendshipGoal(goal)} accessibilityRole="button" accessibilityLabel={goal.label} accessibilityHint="预填到下方，可编辑后再发送" accessibilityState={{ selected, disabled: busy }} style={({ pressed }) => [styles.goalChoice, selected && styles.goalSelected, pressed && { backgroundColor: color.surface2 }, busy && { opacity: 0.5 }]}>
            <View style={styles.goalCopy}><Text style={styles.goalTitle}>{goal.label}</Text><Text style={styles.goalDetail}>{goal.detail}</Text></View>
            <Icon name="arrow.down.left" size={14} tint={selected ? color.accent : color.text2} />
          </Pressable>;
        })}
      </View> : !turns.length ? (suggestions?.length ? suggestions : [pair.question]).slice(0, 3).map((q, i) => <Pressable key={i} disabled={busy} onPress={() => setQuestion(q)} accessibilityRole="button" style={styles.followup}><Text style={styles.followupText}>{q}</Text><Icon name="plus" size={12} /></Pressable>) : null}
      <TextInput ref={input} value={question} onChangeText={setQuestion} multiline maxLength={500} placeholder={friendshipGoals ? '比如：我们因为一次安排起了争执，之后谁也没再开口……' : '比如：我们意见不同时，总是一个急着说，一个先沉默……'} placeholderTextColor={color.text2} style={styles.input} accessibilityLabel="合盘追问，描述两个人的具体情况" editable={!busy} />
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      {busy ? <View style={styles.busy} accessibilityLiveRegion="polite"><ActivityIndicator color={color.accent} /><Text style={styles.detail}>正在结合双方盘面…</Text><TextButton label="取消" onPress={() => { controller.current?.abort(); setBusy(false); }} /></View> : <PrimaryButton label="结合两张盘聊聊" onPress={send} disabled={!question.trim()} />}
      <Text style={styles.privacy}>追问时会把双方盘面交给 AI，调用记录可在「我的」删除全部数据。{scope === 'overall' ? '切换对象、关系类型或离开本页会清空这里的对话。' : '切换宫位或离开本页会清空这里的对话。'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  miniWrap: { flex: 1, minWidth: 0 },
  mini: { backgroundColor: color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: color.separator, borderRadius: 10, overflow: 'hidden' },
  miniCell: { position: 'absolute', paddingTop: 5, alignItems: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator },
  miniName: { fontSize: 9, marginBottom: 3 },
  miniStar: { color: color.text, fontSize: 10, lineHeight: 14 },
  miniEmpty: { color: color.text2, fontSize: 9, lineHeight: 14 },
  miniCenter: { position: 'absolute', justifyContent: 'center', alignItems: 'center', gap: 5, paddingHorizontal: 3 },
  miniSeal: { fontFamily: font.serif, fontSize: 21 },
  miniMeta: { color: color.text2, fontSize: 10 },
  readingColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  readingSide: { flex: 1, flexBasis: 145, padding: 14, borderRadius: 14, backgroundColor: color.surface, gap: 12 },
  personLabel: { fontSize: 14, fontWeight: '600', lineHeight: 21 },
  palaceLocation: { color: color.text2, fontSize: 12 },
  starName: { fontFamily: font.serif, fontSize: 20, lineHeight: 26 },
  starMeta: { color: color.text2, fontSize: 12, fontFamily: undefined, lineHeight: 21 },
  plain: { color: color.text, fontSize: 14, lineHeight: 25 },
  observation: { color: color.text2, fontSize: 14, lineHeight: 24 },
  questionCard: { paddingVertical: 20, paddingHorizontal: 18, borderLeftWidth: 2, borderLeftColor: color.gold, backgroundColor: `${color.gold}07`, gap: 10 },
  eyebrow: { color: color.text2, fontSize: 12, letterSpacing: 1 },
  question: { color: color.text, fontFamily: font.serif, fontSize: 20, lineHeight: 33 },
  exercise: { color: color.text2, fontSize: 14, lineHeight: 24 },
  evidence: { paddingHorizontal: 16, paddingVertical: 7, backgroundColor: color.surface, borderRadius: 14 },
  evidenceNote: { color: color.text2, fontSize: 13, lineHeight: 22, marginVertical: 10 },
  evidenceSide: { paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.separator, gap: 9 },
  detail: { color: color.text2, fontSize: 14, lineHeight: 24 },
  unknown: { color: color.text2, fontSize: 12, lineHeight: 20 },
  askSection: { gap: 12, marginTop: 30 },
  sectionTitle: { color: color.text, fontSize: 21, fontFamily: font.serif },
  answerCard: { backgroundColor: color.surface, borderRadius: 14, padding: 16, gap: 12 },
  userQuestion: { color: color.accent, fontSize: 16, lineHeight: 26, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator },
  answer: { color: color.text, fontSize: 16, lineHeight: 28 },
  notice: { color: color.gold, fontSize: 13, lineHeight: 22 },
  followup: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  followupText: { color: color.accent, fontSize: 14, lineHeight: 23, flex: 1 },
  goalChoices: { gap: 8 },
  goalChoice: { minHeight: 74, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.surface, borderWidth: 1, borderColor: color.separator, borderRadius: 12 },
  goalSelected: { borderColor: color.accent, backgroundColor: color.related },
  goalCopy: { flex: 1, gap: 4 },
  goalTitle: { color: color.text, fontSize: 16, lineHeight: 24, fontWeight: '500' },
  goalDetail: { color: color.text2, fontSize: 12, lineHeight: 20 },
  input: { backgroundColor: color.surface2, borderColor: color.separator, borderWidth: 1, borderRadius: 14, padding: 14, paddingTop: 14, color: color.text, fontSize: 16, lineHeight: 26, minHeight: 108, maxHeight: 220, textAlignVertical: 'top' },
  busy: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  error: { color: color.danger, fontSize: 14, lineHeight: 22 },
  privacy: { color: color.text2, fontSize: 12, lineHeight: 20 },
});
