import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import type { PalaceView } from '@shared/api';
import { Badge } from '@/components/Badge';
import { ChartGrid } from '@/components/ChartGrid';
import { ChartOverview } from '@/components/ChartOverview';
import { PeerSection } from '@/components/Peers';
import { TimeNav } from '@/components/TimeNav';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { TextButton } from '@/components/Buttons';
import { useApp } from '@/lib/app-state';
import { overlayFor, type TimeView } from '@/lib/sihua';
import { color, font, hua, space } from '@/theme';

function PalaceRow({ palace, onPress }: { palace: PalaceView; onPress: () => void }) {
  const stars = palace.majorStars.length ? palace.majorStars.map((s) => s.name).join('、') : '无主星';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${palace.name}，${palace.topic}，${stars}，查看解读`} style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.surface2 }]}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.rowTitle}>
          {palace.name}
          {palace.isMing ? <Text style={styles.rowMing}>  命</Text> : null}
        </Text>
        <Text style={styles.rowSub}>{palace.topic} · {stars}</Text>
      </View>
      <Icon name="chevron.right" size={13} />
    </Pressable>
  );
}

export default function ChartHome() {
  const insets = useSafeAreaInsets();
  const { me, meError, refreshMe, selected, setSelected, viewMode, setViewMode } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [time, setTime] = useState<{ chartId: string; view: TimeView } | null>(null);
  const chart = me?.chart;
  const palace = chart && selected !== null ? chart.palaces[selected] : null;
  // 换了一张盘就回到本命视图
  const view = useMemo<TimeView>(() => (time && time.chartId === chart?.id ? time.view : { kind: 'natal' }), [time, chart?.id]);
  const overlay = useMemo(() => (chart ? overlayFor(chart, view) : null), [chart, view]);
  const setView = (v: TimeView) => chart && setTime({ chartId: chart.id, view: v });

  const openPalace = (branch: number) => router.push(`/chart/palace/${branch}`);
  const openStar = (name: string) => router.push(`/star/${encodeURIComponent(name)}`);
  const select = (b: number) => {
    Haptics.selectionAsync();
    setSelected(b);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
    <ScrollView
      style={{ backgroundColor: color.canvas }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: space.page, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          tintColor={color.accent}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await refreshMe();
            setRefreshing(false);
          }}
        />
      }
    >
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">我的命盘</Text>
        <Pressable onPress={() => router.push('/birth')} accessibilityRole="button" accessibilityLabel="填写或修改出生资料" style={styles.plus} hitSlop={6}>
          <Icon name="plus" size={20} tint={color.onPrimary} />
        </Pressable>
      </View>
      <Text style={styles.subtitle}>先看全貌，再读你在意的那一面。</Text>

      {!chart ? (
        meError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{meError}</Text>
            <TextButton label="重试" onPress={refreshMe} />
          </View>
        ) : (
          <View style={{ marginTop: 24 }}>
            <Skeleton lines={4} />
          </View>
        )
      ) : (
        <>
          <Pressable onPress={() => router.push('/birth')} accessibilityRole="button" accessibilityHint="打开出生资料" style={styles.chip}>
            <Badge label={chart.kind === 'sample' ? '示例盘' : chart.title} style={{ alignSelf: 'center' }} />
            <Text style={styles.chipText} numberOfLines={1}>{chart.summary}</Text>
            <Icon name="chevron.right" size={13} />
          </Pressable>

          {me?.pending ? (
            <View style={styles.notice}>
              <Icon name="clock" size={15} tint={color.gold} />
              <Text style={styles.noticeText}>{me.pending.message}</Text>
            </View>
          ) : chart.kind === 'sample' ? (
            <Text style={styles.sampleHint}>这是示例盘。点右上角 +，换成你自己的盘。</Text>
          ) : (
            <Text style={styles.sampleHint}>
              {chart.notes.join('；')}。
              {chart.boundaryMinutes !== undefined && chart.boundaryMinutes <= 10 ? `出生时间离时辰交界只有约 ${chart.boundaryMinutes} 分钟，请核实。` : ''}
            </Text>
          )}

          {!me?.pending ? (
            <Pressable onPress={() => router.push('/chart/all')} accessibilityRole="button" accessibilityLabel="全盘解读，12 宫一起读" style={({ pressed }) => [styles.allCard, pressed && { backgroundColor: color.surface2 }]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.allTitle}>全盘解读</Text>
                <Text style={styles.allSub}>12 宫一起写好，从命宫往下读</Text>
              </View>
              <Icon name="chevron.right" size={14} />
            </Pressable>
          ) : null}

          <Pressable onPress={() => router.push('/chart/relationship')} accessibilityRole="button" accessibilityLabel="合盘解读，读懂你们的关系与相处重点" style={({ pressed }) => [styles.allCard, { marginTop: 0 }, pressed && { backgroundColor: color.surface2 }]}>
            <Icon name="person.2" size={24} tint={color.gold} />
            <View style={{ flex: 1, gap: 4, marginLeft: 12 }}>
              <Text style={styles.allTitle}>合盘</Text>
              <Text style={styles.allSub}>读懂你们的关系与相处重点</Text>
            </View>
            <Icon name="chevron.right" size={14} />
          </Pressable>

          {viewMode === 'grid' ? (
            <>
              <View style={{ marginBottom: 12 }}>
                <TimeNav chart={chart} view={view} onChange={setView} overlay={overlay} />
              </View>
              <ChartGrid chart={chart} selected={selected} overlay={overlay} onSelect={select} onStar={openStar} />
            </>
          ) : (
            <View style={styles.list}>
              {/* 传统顺序：从命宫起，兄弟、夫妻……地支依次递减 */}
              {Array.from({ length: 12 }, (_, i) => chart.palaces[(chart.mingBranch - i + 12) % 12]).map((p, i) => (
                <View key={p.branch}>
                  {i > 0 ? <View style={styles.sep} /> : null}
                  <PalaceRow palace={p} onPress={() => openPalace(p.branch)} />
                </View>
              ))}
            </View>
          )}

          <View style={styles.legendRow}>
            {viewMode === 'grid' ? (
              <View style={styles.legend} accessibilityElementsHidden>
                <View style={[styles.swatch, { backgroundColor: color.primary }]} />
                <Text style={styles.legendText}>选中</Text>
                <View style={[styles.swatch, styles.swatchRelated]} />
                <Text style={styles.legendText}>三方四正</Text>
                {(['禄', '权', '科', '忌'] as const).map((h) => (
                  <Text key={h} style={[styles.legendText, { color: hua[h], marginLeft: 4 }]}>{h}</Text>
                ))}
              </View>
            ) : (
              <Text style={styles.legendText}>十二宫 · 点一行看解读</Text>
            )}
            <Pressable onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} accessibilityRole="button" hitSlop={10} style={styles.modeBtn}>
              <Icon name={viewMode === 'grid' ? 'list.bullet' : 'square.grid.3x3'} size={13} tint={color.accent} />
              <Text style={styles.modeText}>{viewMode === 'grid' ? '列表' : '命盘'}</Text>
            </Pressable>
          </View>

          {palace && viewMode === 'grid' ? (
            <>
              <Pressable onPress={() => openPalace(palace.branch)} accessibilityRole="button" accessibilityLabel={`${palace.name}，${palace.topic}，${palace.question}，展开解读`} style={({ pressed }) => [styles.card, pressed && { backgroundColor: color.surface2 }]}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{palace.name}</Text>
                  <Text style={styles.cardTopic}>{palace.topic}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.cardMeta}>
                    {palace.stemName}{palace.branchName}{palace.ageRange ? ` · ${palace.ageRange[0]}–${palace.ageRange[1]} 岁` : ''}
                  </Text>
                  <Icon name="chevron.right" size={14} />
                </View>
                <Text style={styles.question}>{palace.question}</Text>
                {!palace.majorStars.length ? (
                  <Text style={styles.cardStars}>无主星，借{palace.borrowed?.fromName ?? '对宫'}的{palace.borrowed?.stars.join('、') ?? ''}来看</Text>
                ) : null}
                <View style={styles.starChips}>
                  {[...palace.majorStars, ...palace.otherStars].map((st) => {
                    const ov = overlay?.byStar[st.name];
                    return (
                      <Pressable key={st.name} onPress={() => openStar(st.name)} accessibilityRole="button" accessibilityLabel={`${st.name}，查看星曜说明`} style={[styles.starChip, st.kind === 'major' && styles.starChipMajor]}>
                        <Text style={[styles.starChipText, st.kind === 'major' && { fontWeight: '600', color: color.text }]}>{st.name}</Text>
                        {st.brightness ? <Text style={styles.starChipSub}>{st.brightness}</Text> : null}
                        {st.siHua ? <Text style={[styles.starChipSub, { color: hua[st.siHua], fontWeight: '700' }]}>{st.siHua}</Text> : null}
                        {ov ? <Text style={[styles.starChipSub, { color: hua[ov], fontWeight: '700' }]}>{overlay!.label}{ov}</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </Pressable>
              <Text style={styles.footnote}>点星曜看说明；点卡片看这一宫的白话解读和依据。</Text>
              <ChartOverview
                chart={chart}
                view={view}
                onSelectPalace={select}
                onSelectDaXian={(index) => {
                  Haptics.selectionAsync();
                  setView({ kind: 'daxian', index });
                }}
              />
            </>
          ) : null}

          <PeerSection chartId={chart.id} />
        </>
      )}
    </ScrollView>
      {/* 滚动时内容不从状态栏下面透出来 */}
      <View pointerEvents="none" style={[styles.statusScrim, { height: insets.top }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  statusScrim: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: color.canvas },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: color.text, fontSize: 34, fontWeight: '700' },
  plus: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  subtitle: { color: color.text2, fontSize: 15, marginTop: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, marginTop: 14, marginBottom: 6 },
  chipText: { flex: 1, color: color.text2, fontSize: 14 },
  sampleHint: { color: color.text2, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  allCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.surface, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 14 },
  allTitle: { color: color.text, fontSize: 17, fontWeight: '600' },
  allSub: { color: color.text2, fontSize: 13 },
  notice: { flexDirection: 'row', gap: 8, backgroundColor: color.surface, borderRadius: 12, padding: 12, marginBottom: 12 },
  noticeText: { flex: 1, color: color.text, fontSize: 14, lineHeight: 21 },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, minHeight: 32 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 9, height: 9, borderRadius: 2 },
  swatchRelated: { backgroundColor: color.related, borderWidth: 1, borderColor: color.border, marginLeft: 10 },
  legendText: { color: color.text2, fontSize: 12 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32 },
  modeText: { color: color.accent, fontSize: 13 },
  card: { marginTop: 12, backgroundColor: color.surface, borderRadius: 18, padding: 18, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  cardTitle: { color: color.text, fontSize: 17, fontWeight: '600' },
  cardTopic: { color: color.text2, fontSize: 13 },
  question: { color: color.text, fontFamily: font.serif, fontSize: 21, lineHeight: 31 },
  cardStars: { color: color.text2, fontSize: 13 },
  cardMeta: { color: color.text2, fontSize: 12, fontVariant: ['tabular-nums'] },
  starChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  starChip: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 32, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: color.separator },
  starChipMajor: { borderColor: color.border, backgroundColor: color.surface2 },
  starChipText: { color: color.text2, fontSize: 14 },
  starChipSub: { color: color.text2, fontSize: 11 },
  footnote: { color: color.text2, fontSize: 12, marginTop: 12, marginLeft: 2 },
  list: { backgroundColor: color.surface, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, minHeight: 60 },
  rowTitle: { color: color.text, fontSize: 17, fontWeight: '500' },
  rowMing: { color: color.accent, fontSize: 13 },
  rowSub: { color: color.text2, fontSize: 14 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: color.separator, marginLeft: 16 },
  errorBox: { marginTop: 24, backgroundColor: color.surface, borderRadius: 14, padding: 16, gap: 8, alignItems: 'flex-start' },
  errorText: { color: color.text, fontSize: 15, lineHeight: 22 },
});
