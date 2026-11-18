import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChartView } from '@shared/api';
import { type Overlay, type TimeView } from '@/lib/sihua';
import { color, hua } from '@/theme';
import { Icon } from './Icon';

interface Props {
  chart: ChartView;
  view: TimeView;
  onChange: (v: TimeView) => void;
  overlay: Overlay | null;
}

/** 本命 / 大限 / 流年：切到大限或流年时，把对应四化叠加在盘上 */
export function TimeNav({ chart, view, onChange, overlay }: Props) {
  const dxIndex = view.kind === 'daxian' ? view.index : Math.max(chart.currentDaXianIndex, 0);
  const dx = chart.daXians[dxIndex];
  const year = view.kind === 'liunian' ? view.year : new Date().getFullYear();

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.bar} accessibilityRole="tablist">
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: view.kind === 'natal' }} onPress={() => onChange({ kind: 'natal' })} style={[styles.tab, view.kind === 'natal' && styles.active]}>
          <Text style={[styles.label, view.kind === 'natal' && styles.activeLabel]}>本命</Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: view.kind === 'daxian' }}
          disabled={!dx}
          onPress={() => onChange({ kind: 'daxian', index: dxIndex })}
          style={[styles.tab, view.kind === 'daxian' && styles.active]}
        >
          <Text style={[styles.label, view.kind === 'daxian' && styles.activeLabel]} numberOfLines={1}>
            {dx ? `大限 ${dx.startAge}–${dx.endAge}` : '大限'}
          </Text>
        </Pressable>
        <View style={[styles.tab, styles.yearTab, view.kind === 'liunian' && styles.active]}>
          <Pressable hitSlop={8} accessibilityLabel="上一年" onPress={() => onChange({ kind: 'liunian', year: year - 1 })} style={styles.step}>
            <Icon name="chevron.left" size={11} tint={view.kind === 'liunian' ? color.text : color.text2} />
          </Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: view.kind === 'liunian' }} onPress={() => onChange({ kind: 'liunian', year })} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.label, view.kind === 'liunian' && styles.activeLabel]}>流年 {year}</Text>
          </Pressable>
          <Pressable hitSlop={8} accessibilityLabel="下一年" onPress={() => onChange({ kind: 'liunian', year: year + 1 })} style={styles.step}>
            <Icon name="chevron.right" size={11} tint={view.kind === 'liunian' ? color.text : color.text2} />
          </Pressable>
        </View>
      </View>
      {overlay ? (
        <View style={styles.caption} accessibilityLiveRegion="polite">
          <Text style={styles.captionText}>{overlay.caption}：</Text>
          {overlay.items.map((x) => (
            <Text key={x.siHua} style={[styles.captionText, { color: hua[x.siHua] }]}>
              {x.star}化{x.siHua}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.captionText}>本命盘 · 星旁的禄权科忌是生年四化</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: color.surface2, borderRadius: 12, padding: 3, gap: 3 },
  tab: { flex: 1, minHeight: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  yearTab: { flex: 1.4, flexDirection: 'row' },
  step: { width: 22, height: 32, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: color.related, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: color.border },
  label: { color: color.text2, fontSize: 14 },
  activeLabel: { color: color.text, fontWeight: '600' },
  caption: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 2 },
  captionText: { color: color.text2, fontSize: 12, lineHeight: 18 },
});
