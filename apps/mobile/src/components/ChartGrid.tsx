import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import type { ChartView, PalaceView, SiHua, StarView } from '@shared/api';
import type { Overlay } from '@/lib/sihua';
import { color, font, gradient, hua } from '@/theme';
import { Mark } from './Mark';
import { CHART_POSITION as POSITION } from '@/lib/chart-position';

// 传统排盘：巳午未申在上，亥子丑寅在下（右到左），辰卯在左、酉戌在右
const SHA = new Set(['擎羊', '陀罗', '火星', '铃星', '地空', '地劫']);

function a11yLabel(p: PalaceView, selected: boolean, related: boolean) {
  const stars = p.majorStars.length
    ? `主星${p.majorStars.map((s) => `${s.name}${s.brightness ?? ''}${s.siHua ? `化${s.siHua}` : ''}`).join('、')}`
    : '没有主星';
  const age = p.ageRange ? `，大限${p.ageRange[0]}到${p.ageRange[1]}岁${p.isCurrentDaXian ? '，正在行运' : ''}` : '';
  return `${p.name}，${p.topic}，${stars}${age}${selected ? '，已选择' : related ? '，关联宫位' : ''}`;
}

function HuaBadge({ siHua, overlay }: { siHua: SiHua; overlay?: string }) {
  return (
    <View style={[styles.hua, { borderColor: hua[siHua] }, overlay ? styles.huaOverlay : { backgroundColor: `${hua[siHua]}22` }]}>
      <Text style={[styles.huaText, { color: hua[siHua] }]}>
        {overlay ? <Text style={styles.huaLabel}>{overlay}</Text> : null}
        {siHua}
      </Text>
    </View>
  );
}

function StarLine({ star, overlay, selected, onPress }: { star: StarView; overlay: Overlay | null; selected: boolean; onPress: () => void }) {
  const ov = overlay?.byStar[star.name];
  return (
    <Pressable onPress={onPress} hitSlop={{ top: 2, bottom: 2, left: 4, right: 4 }} accessibilityRole="button" accessibilityLabel={`${star.name}，查看星曜说明`} style={styles.starLine}>
      <Text style={[styles.star, { color: selected ? color.onPrimary : color.text }]} numberOfLines={1}>
        {star.name}
      </Text>
      {star.brightness ? <Text style={[styles.bright, selected && { color: 'rgba(255,250,255,0.75)' }]}>{star.brightness}</Text> : null}
      {star.siHua ? <HuaBadge siHua={star.siHua} /> : null}
      {ov ? <HuaBadge siHua={ov} overlay={overlay!.label} /> : null}
    </Pressable>
  );
}

function Cell(props: {
  palace: PalaceView;
  size: { w: number; h: number };
  selected: boolean;
  related: boolean;
  overlay: Overlay | null;
  onPress: () => void;
  onStar: (name: string) => void;
}) {
  const { palace, size, selected, related, overlay, onPress, onStar } = props;
  const [row, col] = POSITION[palace.branch];
  const lucky = palace.otherStars.filter((s) => !SHA.has(s.name));
  const sha = palace.otherStars.filter((s) => SHA.has(s.name));
  const muted = selected ? 'rgba(255,250,255,0.78)' : color.text2;
  // 流年/大限四化也可能落在辅星上（文昌、右弼等），在辅星行里一起标出
  const minorHua = (s: StarView) => s.siHua ?? null;
  const minorOverlay = (s: StarView) => overlay?.byStar[s.name] ?? null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel(palace, selected, related)}
      accessibilityHint="选中这一宫，下方显示白话主题"
      accessibilityState={{ selected }}
      style={[
        styles.cell,
        { left: col * size.w, top: row * size.h, width: size.w, height: size.h },
        related && !selected && { backgroundColor: color.related },
      ]}
    >
      {selected ? <LinearGradient colors={gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.selectedFill]} /> : null}

      <View style={styles.head}>
        <Text style={[styles.name, { color: palace.isMing ? (selected ? color.onPrimary : color.accent) : muted }]} numberOfLines={1}>
          {palace.name.replace('宫', '')}
        </Text>
        {palace.isShen ? <Text style={[styles.tag, selected && styles.tagOn]}>身</Text> : null}
        <View style={{ flex: 1 }} />
        <Text style={[styles.ganzhi, { color: muted }]}>{palace.stemName}{palace.branchName}</Text>
      </View>

      <View style={styles.body}>
        {palace.majorStars.length ? (
          palace.majorStars.map((s) => <StarLine key={s.name} star={s} overlay={overlay} selected={selected} onPress={() => onStar(s.name)} />)
        ) : (
          <Text style={[styles.empty, { color: muted }]}>无主星</Text>
        )}
        {lucky.length ? (
          <Text style={[styles.minor, { color: selected ? 'rgba(255,250,255,0.85)' : color.accent }]} numberOfLines={2}>
            {lucky.map((s) => {
              const h = minorHua(s);
              const ov = minorOverlay(s);
              return (
                <Text key={s.name} onPress={() => onStar(s.name)}>
                  {s.name}
                  {h ? <Text style={{ color: hua[h], fontWeight: '700' }}>{h}</Text> : null}
                  {ov ? <Text style={{ color: hua[ov], fontWeight: '700' }}>{`·${overlay!.label}${ov}`}</Text> : null}{' '}
                </Text>
              );
            })}
          </Text>
        ) : null}
        {sha.length ? (
          <Text style={[styles.minor, { color: selected ? 'rgba(255,250,255,0.75)' : 'rgba(255,143,163,0.8)' }]} numberOfLines={1}>
            {sha.map((s) => (
              <Text key={s.name} onPress={() => onStar(s.name)}>{s.name} </Text>
            ))}
          </Text>
        ) : null}
      </View>

      {palace.ageRange ? (
        <Text style={[styles.age, { color: palace.isCurrentDaXian ? (selected ? color.onPrimary : color.gold) : muted }, palace.isCurrentDaXian && styles.ageNow]}>
          {palace.ageRange[0]}–{palace.ageRange[1]}
          {palace.isCurrentDaXian ? ' 行运' : ''}
        </Text>
      ) : null}
    </Pressable>
  );
}

interface Props {
  chart: ChartView;
  selected: number | null;
  overlay: Overlay | null;
  onSelect: (branch: number) => void;
  onStar: (name: string) => void;
}

export function ChartGrid({ chart, selected, overlay, onSelect, onStar }: Props) {
  const [width, setWidth] = useState(0);
  const size = { w: width / 4, h: Math.round((width / 4) * 1.36) };
  const related = selected === null ? [] : chart.palaces[selected].related.map((r) => r.branch);
  const relatedSet = new Set(related);
  const center = (b: number) => {
    const [row, col] = POSITION[b];
    return { x: (col + 0.5) * size.w, y: (row + 0.5) * size.h };
  };
  const dx = chart.daXians[chart.currentDaXianIndex];
  const ming = chart.palaces[chart.mingBranch];
  const shen = chart.palaces[chart.shenBranch];

  return (
    <View style={[styles.board, { height: size.h * 4 }]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <>
          {chart.palaces.map((p) => (
            <Cell
              key={p.branch}
              palace={p}
              size={size}
              selected={p.branch === selected}
              related={relatedSet.has(p.branch)}
              overlay={overlay}
              onPress={() => onSelect(p.branch)}
              onStar={onStar}
            />
          ))}

          <View style={[styles.center, { left: size.w, top: size.h, width: size.w * 2, height: size.h * 2 }]} accessible accessibilityLabel={`命宫在${ming.branchName}，身宫在${shen.branchName}，${chart.meta.wuxingJu}${dx ? `，当前大限${dx.startAge}到${dx.endAge}岁，${dx.palaceName}` : ''}`}>
            <Mark size={30} />
            <Text style={styles.centerTitle}>{chart.meta.wuxingJu}</Text>
            <Text style={styles.centerLine}>
              命宫 <Text style={styles.centerStrong}>{ming.branchName}</Text>　身宫 <Text style={styles.centerStrong}>{shen.branchName}</Text>
            </Text>
            {chart.meta.mingZhu ? (
              <Text style={styles.centerLine}>
                命主 <Text style={styles.centerStrong}>{chart.meta.mingZhu}</Text>　身主 <Text style={styles.centerStrong}>{chart.meta.shenZhu}</Text>
              </Text>
            ) : null}
            {dx ? (
              <View style={styles.dxBox}>
                <Text style={styles.dxLabel}>当前大限 · 虚岁 {chart.currentAge}</Text>
                <Text style={styles.dxValue}>{dx.startAge}–{dx.endAge} 岁 · {dx.palaceName}</Text>
              </View>
            ) : null}
            <Text style={styles.centerSmall}>{chart.meta.lunar.replace('农历', '')}</Text>
            {chart.meta.fourPillars ? <Text style={styles.centerSmall}>{chart.meta.fourPillars.join(' ')}</Text> : null}
          </View>

          {selected !== null ? (
            <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={size.h * 4}>
              {(() => {
                const p0 = center(selected);
                const [opp, t1, t2] = related.map(center);
                const dash = { stroke: color.accent, strokeOpacity: 0.45, strokeWidth: 1.2, strokeDasharray: '5 5', strokeLinecap: 'round' as const };
                return (
                  <>
                    <Line x1={p0.x} y1={p0.y} x2={opp.x} y2={opp.y} {...dash} />
                    <Line x1={p0.x} y1={p0.y} x2={t1.x} y2={t1.y} {...dash} />
                    <Line x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y} {...dash} />
                    <Line x1={t2.x} y1={t2.y} x2={p0.x} y2={p0.y} {...dash} />
                    {[opp, t1, t2].map((pt, i) => (
                      <Circle key={i} cx={pt.x} cy={pt.y} r={3} fill={color.accent} fillOpacity={0.55} />
                    ))}
                  </>
                );
              })()}
            </Svg>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const line = StyleSheet.hairlineWidth * 2;

const styles = StyleSheet.create({
  board: { backgroundColor: color.surface, borderRadius: 14, overflow: 'hidden', borderWidth: line, borderColor: color.separator },
  cell: {
    position: 'absolute',
    borderRightWidth: line,
    borderBottomWidth: line,
    borderColor: color.separator,
    paddingHorizontal: 5,
    paddingTop: 5,
    paddingBottom: 4,
  },
  selectedFill: { borderWidth: 1, borderColor: 'rgba(225, 190, 255, 0.6)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  name: { fontSize: 11, fontWeight: '500' },
  tag: { fontSize: 9, color: color.accent, borderWidth: 1, borderColor: color.border, borderRadius: 3, paddingHorizontal: 1, overflow: 'hidden' },
  tagOn: { color: color.onPrimary, borderColor: 'rgba(255,250,255,0.6)' },
  ganzhi: { fontSize: 9, fontVariant: ['tabular-nums'] },
  body: { flex: 1, marginTop: 4, gap: 1 },
  starLine: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 19 },
  star: { fontSize: 14, fontWeight: '600', letterSpacing: -0.3 },
  bright: { fontSize: 9, color: color.text2 },
  hua: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 2, minWidth: 14, alignItems: 'center' },
  huaOverlay: { borderStyle: 'dashed' },
  huaText: { fontSize: 9, fontWeight: '700', lineHeight: 12 },
  huaLabel: { fontSize: 7, fontWeight: '400' },
  empty: { fontSize: 12 },
  minor: { fontSize: 10, lineHeight: 14 },
  age: { fontSize: 9, fontVariant: ['tabular-nums'] },
  ageNow: { fontWeight: '700' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: 4, borderRightWidth: line, borderBottomWidth: line, borderColor: color.separator, paddingHorizontal: 8 },
  centerTitle: { color: color.text, fontFamily: font.serif, fontSize: 18, marginTop: 2 },
  centerLine: { color: color.text2, fontSize: 12 },
  centerStrong: { color: color.text, fontWeight: '600' },
  dxBox: { borderWidth: 1, borderColor: color.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center', marginVertical: 2, backgroundColor: 'rgba(145, 68, 235, 0.12)' },
  dxLabel: { color: color.text2, fontSize: 10 },
  dxValue: { color: color.gold, fontSize: 12, fontWeight: '600' },
  centerSmall: { color: color.text2, fontSize: 10, fontVariant: ['tabular-nums'] },
});
