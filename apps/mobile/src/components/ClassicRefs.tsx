import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ClassicRef } from '@shared/api';
import { color, font } from '@/theme';

const FOOT = '原文出自《紫微斗数全书》（维基文库公版）。古书是古人的文学化说法，不代表今天的收入、成就或婚姻结果。';

/** 古书版框：上下各一粗一细两道线 */
function Rule({ bottom = false }: { bottom?: boolean }) {
  return (
    <View style={{ gap: 2 }}>
      <View style={bottom ? styles.thin : styles.thick} />
      <View style={bottom ? styles.thick : styles.thin} />
    </View>
  );
}

/**
 * 「古籍参考」（方案 B）：原文用宋体在上，出处右对齐，白话用"按"引出；默认只露第一条。
 * 宫位解读页和星曜说明页共用。没有可列的原文时传 note 说明原因。
 */
export function ClassicRefs({ refs, note, fitLabel = '对照你的盘' }: { refs: ClassicRef[]; note?: string; onSurface?: boolean; fitLabel?: string }) {
  const [open, setOpen] = useState(false);
  if (!refs.length && !note) return null;
  const shown = open ? refs : refs.slice(0, 1);
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">古籍参考</Text>
        <Text style={styles.count}>{refs.length ? `《紫微斗数全书》· ${refs.length} 条` : '本篇不列'}</Text>
      </View>
      <Rule />
      <View style={styles.body}>
        {refs.length === 0 ? <Text style={styles.note}>{note}</Text> : null}
        {shown.map((r, i) => (
          <View key={r.text} style={[styles.item, i > 0 && styles.itemBorder]}>
            <Text style={styles.text} accessibilityLabel={`原文：${r.text}`}>{r.text}</Text>
            <Text style={styles.source}>——{r.source.replace('《紫微斗数全书》', '').trim()}</Text>
            <View style={styles.plainRow}>
              <View style={styles.anno} accessibilityLabel="按语">
                <Text style={styles.annoText}>按</Text>
              </View>
              <Text style={styles.plain}>{r.plain}</Text>
            </View>
            {r.fit ? <Text style={styles.fit}>{fitLabel}：{r.fit}</Text> : null}
          </View>
        ))}
        {refs.length > 1 ? (
          <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button" hitSlop={8} style={styles.more}>
            <Text style={styles.moreText}>{open ? '收起' : `展开另外 ${refs.length - 1} 条`}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.foot}>{FOOT}</Text>
      </View>
      <Rule bottom />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { color: color.text, fontSize: 17, fontWeight: '600' },
  count: { color: color.text2, fontSize: 12 },
  thick: { height: 2, backgroundColor: color.border },
  thin: { height: StyleSheet.hairlineWidth * 2, backgroundColor: color.separator },
  body: { paddingVertical: 6 },
  item: { paddingVertical: 12, gap: 6 },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator },
  text: { color: color.text, fontFamily: font.serif, fontSize: 17, lineHeight: 29, letterSpacing: 0.3 },
  source: { color: color.text2, fontSize: 12, textAlign: 'right' },
  plainRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 2 },
  anno: { width: 20, height: 20, borderWidth: 1, borderColor: color.border, borderRadius: 3, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  annoText: { color: color.text2, fontFamily: font.serif, fontSize: 12, lineHeight: 14 },
  plain: { flex: 1, color: color.text, fontSize: 15, lineHeight: 24 },
  fit: { color: color.text2, fontSize: 13, lineHeight: 20, marginLeft: 28 },
  note: { color: color.text2, fontSize: 15, lineHeight: 24, paddingVertical: 10 },
  more: { paddingVertical: 8 },
  moreText: { color: color.accent, fontSize: 15, fontWeight: '600' },
  foot: { color: color.text2, fontSize: 12, lineHeight: 18, marginTop: 6 },
});
