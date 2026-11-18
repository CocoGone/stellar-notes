import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RelationshipKind, RelationshipRequest, RelationshipResponse, RelationshipSelfRole } from '@shared/api';
import { PrimaryButton, TextButton } from '@/components/Buttons';
import { ChartGrid } from '@/components/ChartGrid';
import { Disclosure } from '@/components/Disclosure';
import { Icon } from '@/components/Icon';
import { MiniRelationshipChart, RelationshipComparison, RelationshipMark } from '@/components/Relationship';
import { RelationshipReadingPanel } from '@/components/RelationshipReading';
import { Segmented } from '@/components/Segmented';
import { Skeleton } from '@/components/Skeleton';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-state';
import { color, font, space } from '@/theme';

const RELATIONS: { value: RelationshipKind; label: string }[] = [
  { value: 'partner', label: '伴侣' }, { value: 'crush', label: '暧昧' },
  { value: 'ex', label: '分开' }, { value: 'friend', label: '朋友' },
  { value: 'parent_child', label: '亲子' }, { value: 'family', label: '家人' }, { value: 'colleague', label: '合作' },
];

function ProfileButton({ label, name, detail, tone, onPress, disabled }: {
  label: string; name: string; detail: string; tone: string; onPress: () => void; disabled?: boolean;
}) {
  return <Pressable disabled={disabled} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}，${name}，${detail}，编辑出生资料`} style={({ pressed }) => [styles.profile, pressed && { backgroundColor: color.surface2 }, disabled && { opacity: 0.5 }]}>
    <View style={styles.profileHead}><Text style={[styles.person, { color: tone }]}>{label}</Text><Icon name="pencil" size={12} tint={tone} /></View>
    <Text style={styles.profileName}>{name}</Text>
    <Text style={styles.profileDetail}>{detail}</Text>
  </Pressable>;
}

export default function RelationshipScreen() {
  const insets = useSafeAreaInsets();
  const { me, meError, refreshMe, partner, partnerReady, partnerError, reloadPartner, savePartner } = useApp();
  const [example, setExample] = useState(false);
  const [draftRelation, setDraftRelation] = useState<RelationshipKind>('partner');
  const [draftRole, setDraftRole] = useState<RelationshipSelfRole | undefined>();
  const relation = example || !partner ? draftRelation : partner.relationship;
  const selfRole = example || !partner ? draftRole : partner.selfRole;
  const [relationSaving, setRelationSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [palaceName, setPalaceName] = useState('命宫');
  const [expanded, setExpanded] = useState<'left' | 'right' | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: RelationshipResponse; error?: string } | null>(null);
  const ownReady = Boolean(me?.birth && !me.pending && me.chart.kind === 'personal');
  const otherReady = partner?.birth.time.status === 'exact';
  const canCompare = ownReady && otherReady && partnerReady && !partnerError;

  const request = useMemo<RelationshipRequest | null>(() => example
    ? { example: true, relationship: relation, selfRole: relation === 'parent_child' ? selfRole : undefined }
    : canCompare && partner ? { partner: partner.birth, relationship: relation, selfRole: relation === 'parent_child' ? selfRole : undefined } : null,
  [example, relation, canCompare, partner, selfRole]);
  // 包含自己的命盘 id，改完任意一人的资料后不再显示上一组结果。
  const key = JSON.stringify([request, example ? 'example' : me?.chart.id]);
  useEffect(() => {
    if (!request) return;
    const abort = new AbortController();
    api.relationship(request, abort.signal)
      .then((data) => { if (!abort.signal.aborted) setResult({ key, data }); })
      .catch((err) => { if (!abort.signal.aborted) setResult({ key, error: (err as Error).message }); });
    return () => abort.abort();
  }, [request, key, attempt]);
  const data = request && result?.key === key ? result.data : undefined;
  const error = request && result?.key === key ? result.error : undefined;
  const pair = data?.palaces.find((p) => p.name === palaceName);
  const leftName = example ? data?.left.title.replace(/ · 示例$/, '') ?? '甲' : me?.birth?.nickname || '我';
  const rightName = example ? data?.right.title.replace(/ · 示例$/, '') ?? '乙' : partner?.birth.nickname || '对方';
  const fullChart = expanded && data ? data[expanded] : undefined;
  const openPartner = () => router.push({ pathname: '/birth', params: { target: 'partner', relationship: relation, ...(selfRole ? { selfRole } : {}) } });

  async function changeRelation(next: RelationshipKind) {
    setLocalError(null);
    if (!partner || example) { setDraftRelation(next); return; }
    setRelationSaving(true);
    try { await savePartner({ ...partner, relationship: next }); }
    catch (err) { setLocalError((err as Error).message); }
    finally { setRelationSaving(false); }
  }

  async function changeRole(next: RelationshipSelfRole) {
    setLocalError(null);
    if (!partner || example) { setDraftRole(next); return; }
    setRelationSaving(true);
    try { await savePartner({ ...partner, selfRole: next }); }
    catch (err) { setLocalError((err as Error).message); }
    finally { setRelationSaving(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <Stack.Screen options={{ title: '合盘', headerBackTitle: '命盘' }} />
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: space.page, paddingTop: 12, paddingBottom: insets.bottom + 36 }}>
        <Text style={styles.kicker}>两张命盘 · 一段相处</Text>
        <Text style={styles.title} accessibilityRole="header">读懂你们的关系。</Text>
        <Text style={styles.subtitle}>看双方如何互补、哪里容易卡住，以及具体怎样相处。</Text>

        {example ? <View style={styles.exampleBanner}>
          <Text style={styles.exampleText}>示例体验 · 两份虚构的出生资料</Text>
          <TextButton label="看我的合盘" onPress={() => { setExample(false); setPalaceName('命宫'); }} />
        </View> : <View style={styles.profiles}>
          <ProfileButton label="我方" name={me?.birth?.nickname || '我的资料'} detail={ownReady ? me!.chart.summary : me?.pending ? '出生时间待核实' : '填写出生资料'} tone={color.accent} onPress={() => router.push('/birth')} />
          <ProfileButton label="对方" name={partner?.birth.nickname || '另一个人'} detail={partner ? otherReady ? `${partner.birth.calendar === 'lunar' ? '农历 ' : ''}${partner.birth.year}.${String(partner.birth.month).padStart(2, '0')}.${String(partner.birth.day).padStart(2, '0')} · 可编辑` : '出生时间待核实' : '添加出生资料'} tone={color.gold} disabled={!partnerReady} onPress={openPartner} />
        </View>}

        <View style={styles.relationRow} pointerEvents={relationSaving ? 'none' : 'auto'}>
          <Text style={styles.sectionLabel}>我们的关系</Text>
          <View style={styles.relationOptions} accessibilityRole="tablist">
            {RELATIONS.map((r) => <Pressable key={r.value} onPress={() => changeRelation(r.value)} accessibilityRole="tab" accessibilityState={{ selected: relation === r.value }} style={({ pressed }) => [styles.relationOption, relation === r.value && styles.relationActive, pressed && { opacity: 0.7 }]}><Text style={[styles.relationText, relation === r.value && { color: color.text }]}>{r.label}</Text></Pressable>)}
          </View>
          {relation === 'parent_child' ? <View style={styles.roleGroup}><Text style={styles.sectionLabel}>我在这段关系里是</Text><View style={styles.roleOptions}>{([{ value: 'parent', label: '家长' }, { value: 'child', label: '子女' }] as const).map((r) => <Pressable key={r.value} onPress={() => changeRole(r.value)} accessibilityRole="button" accessibilityState={{ selected: selfRole === r.value }} style={[styles.roleOption, selfRole === r.value && styles.relationActive]}><Text style={[styles.relationText, selfRole === r.value && { color: color.text }]}>{r.label}</Text></Pressable>)}</View></View> : null}
        </View>
        {localError ? <Text style={styles.error}>{localError}</Text> : null}
        {partnerError && !example ? <View style={styles.errorBlock}><Text style={styles.error}>{partnerError}</Text><TextButton label="重新读取" onPress={reloadPartner} /></View> : null}
        {meError && !example ? <View style={styles.errorBlock}><Text style={styles.error}>{meError}</Text><TextButton label="重试我的命盘" onPress={refreshMe} /></View> : null}

        {!request ? (
          <View style={styles.start}>
            <RelationshipMark />
            <Text style={styles.startTitle}>{!partnerReady || !me ? '先准备两份出生资料' : !ownReady ? '先建立你的命盘' : !partner ? '再认识另一个人' : !otherReady ? '还需要核实对方的时间' : '核对出生资料后继续'}</Text>
            <Text style={styles.startBody}>填写两人的出生资料，选择关系类型，完成后直接看综合关系解读。也能展开两张盘，核对解读用到的依据。</Text>
            <PrimaryButton label={!ownReady ? '填写我的资料' : partner ? '核实对方的时间' : '添加另一个人'} onPress={() => ownReady ? openPartner() : router.push('/birth')} disabled={!partnerReady || !me} style={{ alignSelf: 'stretch', marginTop: 10 }} />
            <TextButton label="先看一组示例" onPress={() => { setDraftRelation(relation); setDraftRole(selfRole); setExample(true); setPalaceName('命宫'); }} />
          </View>
        ) : error ? (
          <View style={styles.errorBlock}><Text style={styles.error}>{error}</Text><TextButton label="重新排盘" onPress={() => { setResult(null); setAttempt((n) => n + 1); }} /></View>
        ) : !data ? (
          <View style={styles.loading} accessibilityLiveRegion="polite"><Text style={styles.loadingLabel}>正在把两张盘放到一起…</Text><View style={styles.profiles}><View style={styles.loadingBoard} /><View style={styles.loadingBoard} /></View><Skeleton lines={4} /></View>
        ) : (
          <>
            {request && (relation !== 'parent_child' || selfRole) ? <RelationshipReadingPanel key={key} comparison={data} request={request} /> : <View style={styles.errorBlock}><Text style={styles.rolePrompt}>先在上方选择我方是家长还是子女，解读会按双方身份展开。</Text></View>}
            <View style={styles.chartDisclosure}>
            <Disclosure title="双盘与逐宫依据">
            <View style={styles.chartLabels}><Text style={[styles.chartLabel, { color: color.accent }]}>甲 · {leftName}</Text><Text style={[styles.chartLabel, { color: color.gold }]}>乙 · {rightName}</Text></View>
            <View style={styles.boards}>
              <MiniRelationshipChart chart={data.left} palaceName={palaceName} label="甲" tone={color.accent} onPress={() => setExpanded('left')} />
              <MiniRelationshipChart chart={data.right} palaceName={palaceName} label="乙" tone={color.gold} onPress={() => setExpanded('right')} />
            </View>
            <Text style={styles.chartHint}>高亮同名宫位，位置随各自的盘面变化。点盘面可放大。</Text>

            <View style={styles.topics}>
              {data.topics.map((t) => <Pressable key={t.palace} onPress={() => setPalaceName(t.palace)} accessibilityRole="button" accessibilityState={{ selected: palaceName === t.palace }} style={[styles.topic, palaceName === t.palace && styles.topicActive]}><Text style={[styles.topicText, palaceName === t.palace && { color: color.text }]}>{t.label}</Text></Pressable>)}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.palaceOptions} accessibilityLabel="选择要对照的宫位">
              {data.palaces.map((p) => <Pressable key={p.name} onPress={() => setPalaceName(p.name)} accessibilityRole="button" accessibilityState={{ selected: palaceName === p.name }} style={[styles.palaceOption, palaceName === p.name && styles.palaceOptionActive]}><Text style={[styles.palaceOptionText, palaceName === p.name && { color: color.accent }]}>{p.name}</Text></Pressable>)}
            </ScrollView>
            {pair && request ? <>
              <View style={styles.comparisonHeading}><Text style={styles.comparisonTitle}>{pair.name}</Text><Text style={styles.comparisonTopic}>{pair.topic}</Text></View>
              <RelationshipComparison key={`${key}:${pair.name}`} pair={pair} leftName={`甲 · ${leftName}`} rightName={`乙 · ${rightName}`} />
            </> : null}
            </Disclosure>
            </View>
            <View style={styles.method}>
              <Disclosure title="这次合盘怎么看">
                <Text style={styles.methodText}>{data.method}</Text>
                {([{ chart: data.left, label: `甲 · ${leftName}` }, { chart: data.right, label: `乙 · ${rightName}` }]).map(({ chart, label }, i) => <View key={i} style={{ marginTop: 14, gap: 4 }}><Text style={styles.sectionLabel}>{label} · 排盘口径</Text><Text style={styles.methodText}>{chart.summary}{'\n'}{chart.notes.join('；')}。</Text>{chart.boundaryMinutes !== undefined && chart.boundaryMinutes <= 10 ? <Text style={styles.boundary}>离时辰交界约 {chart.boundaryMinutes} 分钟，建议核实出生时间。</Text> : null}</View>)}
              </Disclosure>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={Boolean(fullChart)} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setExpanded(null)}>
        <View style={styles.modal}>
          <View style={styles.modalHead}><Text style={styles.modalTitle}>完整盘面</Text><TextButton label="完成" onPress={() => setExpanded(null)} /></View>
          {fullChart && data ? <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }}>
            <Segmented value={expanded!} options={[{ value: 'left' as const, label: `甲 · ${leftName}` }, { value: 'right' as const, label: `乙 · ${rightName}` }]} onChange={setExpanded} />
            <Text style={styles.fullSummary}>{fullChart.summary}</Text>
            <ChartGrid chart={fullChart} selected={fullChart.palaces.find((p) => p.name === palaceName)?.branch ?? fullChart.mingBranch} overlay={null} onSelect={(branch) => setPalaceName(fullChart.palaces[branch].name)} onStar={(name) => { setExpanded(null); router.push({ pathname: '/star/[name]', params: { name, general: '1' } }); }} />
            <Text style={styles.fullPalaceTitle}>{palaceName} · {expanded === 'left' ? `甲 · ${leftName}` : `乙 · ${rightName}`}</Text>
            <Text style={styles.methodText}>{(expanded === 'left' ? pair?.left : pair?.right)?.plain}</Text>
            <Text style={styles.chartHint}>点宫位切换，另一张盘会同步选择同名宫位；点星曜看通用说明。</Text>
          </ScrollView> : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { color: color.text2, fontSize: 12, letterSpacing: 2 },
  title: { color: color.text, fontFamily: font.serif, fontSize: 31, lineHeight: 48, marginTop: 6 },
  subtitle: { color: color.text2, fontSize: 14, lineHeight: 24, marginTop: 2, marginBottom: 22 },
  profiles: { flexDirection: 'row', gap: 12 },
  profile: { flex: 1, minWidth: 0, backgroundColor: color.surface, borderRadius: 14, padding: 14, gap: 9 },
  profileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  person: { fontSize: 12, fontWeight: '500' },
  profileName: { color: color.text, fontSize: 17, fontWeight: '500', lineHeight: 25 },
  profileDetail: { color: color.text2, fontSize: 12, lineHeight: 20 },
  relationRow: { marginTop: 20, marginBottom: 22, gap: 9 },
  relationOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  relationOption: { flexGrow: 1, flexBasis: '22%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: color.surface, borderWidth: 1, borderColor: 'transparent' },
  relationActive: { backgroundColor: color.related, borderColor: color.border },
  relationText: { color: color.text2, fontSize: 14, fontWeight: '500' },
  roleGroup: { gap: 9, marginTop: 7 },
  roleOptions: { flexDirection: 'row', gap: 10 },
  roleOption: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: color.separator, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface },
  rolePrompt: { color: color.text2, fontSize: 15, lineHeight: 26 },
  chartDisclosure: { paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.separator },
  sectionLabel: { color: color.text2, fontSize: 13, lineHeight: 22 },
  exampleBanner: { backgroundColor: color.surface, borderRadius: 12, paddingLeft: 14, flexDirection: 'row', alignItems: 'center' },
  exampleText: { color: color.gold, fontSize: 12, lineHeight: 20, flex: 1 },
  start: { alignItems: 'center', paddingTop: 5, gap: 14 },
  startTitle: { color: color.text, fontFamily: font.serif, fontSize: 24, lineHeight: 36 },
  startBody: { color: color.text2, fontSize: 15, lineHeight: 27, textAlign: 'center', paddingHorizontal: 14 },
  errorBlock: { backgroundColor: color.surface, padding: 16, borderRadius: 14, gap: 8, marginVertical: 12 },
  error: { color: color.danger, fontSize: 14, lineHeight: 23 },
  loading: { gap: 24, paddingVertical: 12 },
  loadingLabel: { color: color.text2, fontSize: 14 },
  loadingBoard: { flex: 1, height: 240, backgroundColor: color.surface, borderRadius: 12 },
  chartLabels: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  chartLabel: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 24 },
  boards: { flexDirection: 'row', gap: 12 },
  chartHint: { color: color.text2, fontSize: 12, lineHeight: 21, marginTop: 10 },
  topics: { flexDirection: 'row', marginTop: 26, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator },
  topic: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48, borderBottomWidth: 2, borderColor: 'transparent' },
  topicActive: { borderColor: color.accent },
  topicText: { color: color.text2, fontSize: 15, fontWeight: '500' },
  palaceOptions: { gap: 6, paddingVertical: 12 },
  palaceOption: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center', borderRadius: 10 },
  palaceOptionActive: { backgroundColor: color.surface2 },
  palaceOptionText: { color: color.text2, fontSize: 13 },
  comparisonHeading: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 8, marginBottom: 14 },
  comparisonTitle: { color: color.text, fontFamily: font.serif, fontSize: 25 },
  comparisonTopic: { color: color.text2, fontSize: 13, flexShrink: 1 },
  method: { marginTop: 30, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.separator },
  methodText: { color: color.text2, fontSize: 14, lineHeight: 25, marginTop: 8 },
  boundary: { color: color.gold, fontSize: 13, lineHeight: 22, marginTop: 4 },
  modal: { flex: 1, backgroundColor: color.canvas },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 14 },
  modalTitle: { color: color.text, fontSize: 18, fontWeight: '600' },
  fullSummary: { color: color.text2, fontSize: 13, lineHeight: 22, marginVertical: 14 },
  fullPalaceTitle: { color: color.text, fontFamily: font.serif, fontSize: 22, marginTop: 22 },
});
