import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ChartView } from '@shared/api';
import type { TimeView } from '@/lib/sihua';
import { color, hua } from '@/theme';
import { Icon } from './Icon';
import { PatternCards } from './PatternCards';

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>
        {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
      </View>
      {children}
    </View>
  );
}

interface Props {
  chart: ChartView;
  view: TimeView;
  onSelectPalace: (branch: number) => void;
  onSelectDaXian: (index: number) => void;
}

/** 命盘概要：命宫、生年四化、格局、大限时间轴（参考 ziwei-doushu 的 ChartSummary / PatternsCard） */
export function ChartOverview({ chart, view, onSelectPalace, onSelectDaXian }: Props) {
  const ming = chart.palaces[chart.mingBranch];
  const activeDx = view.kind === 'daxian' ? view.index : chart.currentDaXianIndex;

  return (
    <View>
      <Section title="命宫" note={ming.majorStars.length ? undefined : `无主星，借${ming.borrowed?.fromName ?? '对宫'}`}>
        <Pressable onPress={() => onSelectPalace(chart.mingBranch)} accessibilityRole="button" style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Text style={styles.mingStars}>{(chart.mingSummary.stars.length ? chart.mingSummary.stars : ming.borrowed?.stars ?? []).join(' · ') || '空宫'}</Text>
            {chart.mingSummary.nature && chart.mingSummary.nature !== '空宫' ? <Text style={styles.sectionNote}>{chart.mingSummary.nature}</Text> : null}
          </View>
          {chart.mingSummary.keywords.length ? (
            <View style={styles.chips}>
              {chart.mingSummary.keywords.map((k) => (
                <Text key={k} style={styles.keyword}>{k}</Text>
              ))}
            </View>
          ) : null}
        </Pressable>
      </Section>

      <Section title="生年四化" note={`${chart.birthSiHua.stemName}年生`}>
        <View style={styles.card}>
          {chart.birthSiHua.items.map((x, i) => {
            const p = chart.palaces[x.palaceBranch];
            return (
              <Pressable key={x.siHua} onPress={() => onSelectPalace(x.palaceBranch)} accessibilityRole="button" accessibilityLabel={`${x.star}化${x.siHua}，在${p.name}，选中这一宫`} style={[styles.huaRow, i > 0 && styles.rowBorder]}>
                <Text style={[styles.huaTag, { color: hua[x.siHua], borderColor: hua[x.siHua] }]}>化{x.siHua}</Text>
                <Text style={styles.huaStar}>{x.star}</Text>
                <Text style={styles.huaPalace}>{p.name} · {p.topic}</Text>
                <Icon name="chevron.right" size={11} />
              </Pressable>
            );
          })}
        </View>
      </Section>

      {chart.patterns.length ? (
        <View style={styles.section}>
          <PatternCards key={chart.id} patterns={chart.patterns} />
        </View>
      ) : null}

      <Section title="大限" note={`虚岁 ${chart.currentAge}`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {chart.daXians.map((dx, i) => {
            const active = i === activeDx;
            const now = i === chart.currentDaXianIndex;
            return (
              <Pressable
                key={dx.palaceBranch}
                onPress={() => onSelectDaXian(i)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${dx.startAge}到${dx.endAge}岁，${dx.palaceName}${now ? '，当前大限' : ''}，叠加这一步大限的四化`}
                style={[styles.dx, active && styles.dxActive]}
              >
                <Text style={[styles.dxAge, now && { color: color.gold }]}>{dx.startAge}–{dx.endAge}</Text>
                <Text style={styles.dxPalace}>{dx.palaceName.replace('宫', '')}</Text>
                <Text style={styles.dxStem}>{dx.stemName}干{now ? ' · 当前' : ''}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.footnote}>点一步大限，盘上会叠加这十年的四化。</Text>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { color: color.text, fontSize: 17, fontWeight: '600' },
  sectionNote: { color: color.text2, fontSize: 12 },
  card: { backgroundColor: color.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  mingStars: { color: color.text, fontSize: 18, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  keyword: { color: color.text, fontSize: 13, backgroundColor: color.related, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  huaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator },
  huaTag: { fontSize: 12, fontWeight: '700', borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1, overflow: 'hidden' },
  huaStar: { color: color.text, fontSize: 16, fontWeight: '600', width: 44 },
  huaPalace: { flex: 1, color: color.text2, fontSize: 14 },
  footnote: { color: color.text2, fontSize: 12, marginTop: 8 },
  dx: { width: 74, backgroundColor: color.surface, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: 'transparent' },
  dxActive: { borderColor: color.border, backgroundColor: color.related },
  dxAge: { color: color.text, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  dxPalace: { color: color.text, fontSize: 13 },
  dxStem: { color: color.text2, fontSize: 11 },
});
