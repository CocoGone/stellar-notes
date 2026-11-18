import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PatternEvidence, PatternView } from '@shared/api';
import { patternPlain, patternTerms } from '@shared/pattern-copy';
import { color } from '@/theme';
import { Icon } from './Icon';

type DisplayPattern = PatternEvidence & { palaces?: string[]; level?: PatternView['level'] };
const LEVEL = { excellent: '上格', good: '助力', neutral: '中性', caution: '留意' } as const;

function Conditions({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{title}</Text>
      {items.map((item, i) => (
        <View key={`${item}-${i}`} style={styles.condition}>
          <Text style={styles.bullet}>·</Text>
          <Text style={styles.conditionText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function PatternCard({ pattern }: { pattern: DisplayPattern }) {
  const [open, setOpen] = useState(false);
  const required = pattern.required ?? [];
  const bonus = pattern.bonus ?? [];
  const breaking = pattern.breaking ?? [];
  const terms = patternTerms([...required, ...bonus, ...breaking]);
  const plain = pattern.plain ?? patternPlain(pattern.name)
    ?? '这是按星曜与宫位关系命名的传统组合，可以先对照下面的盘面条件来理解。';

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.name} accessibilityRole="header">{pattern.name}</Text>
        {pattern.palaces?.length ? <Text style={styles.palaces}>{pattern.palaces.join(' · ')}</Text> : null}
      </View>
      <Text style={styles.plain}>{plain}</Text>

      {/* 限制因素始终可见，不能只露出有利解释。 */}
      {breaking.length ? (
        <View style={styles.limit}>
          <Text style={styles.limitTitle}>也要一起看</Text>
          {breaking.map((item, i) => <Text key={`${item}-${i}`} style={styles.conditionText}>· {item}</Text>)}
          <Text style={styles.note}>这些是传统规则中的限制因素，理解这项组合时需要一起考虑。</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${pattern.name}，${open ? '收起' : '展开'}盘面依据`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <Text style={styles.toggleText}>{open ? '收起盘面依据' : '为什么会出现这个格局'}</Text>
        <Icon name={open ? 'chevron.up' : 'chevron.down'} size={12} tint={color.accent} />
      </Pressable>

      {open ? (
        <View style={styles.details}>
          <Conditions title="这张盘符合的条件" items={required} />
          {!required.length ? <Text style={styles.note}>这项组合的成立条件尚待核对，可以继续追问。</Text> : null}
          <Conditions title="有利的配合" items={bonus} />
          {!breaking.length ? <Text style={styles.note}>本次识别未列出额外限制，仍需结合其他宫位和具体情况理解。</Text> : null}

          {terms.length ? (
            <View style={styles.group}>
              <Text style={styles.label}>读懂这些词</Text>
              {terms.map(({ term, plain: meaning }) => (
                <Text key={term} style={styles.term}><Text style={styles.termName}>{term} · </Text>{meaning}</Text>
              ))}
            </View>
          ) : null}

          {pattern.description ? (
            <View style={styles.tradition}>
              <Text style={styles.label}>传统说明</Text>
              {pattern.level ? <Text style={styles.note}>传统分类 · {LEVEL[pattern.level]}</Text> : null}
              <Text style={styles.note}>保留传统表述供你核对，不作为现实结果的保证。</Text>
              <Text style={styles.traditionText}>{pattern.description}</Text>
            </View>
          ) : null}
          <Text style={styles.source}>{pattern.source ? `来源：${pattern.source}` : '出处尚待核对'}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** 命盘总览与宫位详情共用；没有格局时不占位。 */
export function PatternCards({ patterns }: { patterns: DisplayPattern[] }) {
  if (!patterns.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">格局怎么理解</Text>
      <Text style={styles.intro}>先读白话，再对照盘面条件。</Text>
      {patterns.map((pattern, i) => <PatternCard key={`${pattern.name}-${i}`} pattern={pattern} />)}
      <Text style={styles.footnote}>格局是对盘面组合的传统解释，不能保证收入、地位或婚姻结果。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  sectionTitle: { color: color.text, fontSize: 17, fontWeight: '600' },
  intro: { color: color.text2, fontSize: 13, lineHeight: 20, marginTop: -4, marginBottom: 2 },
  card: { backgroundColor: color.surface, borderRadius: 16, padding: 16, gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, color: color.text, fontSize: 17, lineHeight: 26, fontWeight: '600' },
  palaces: { maxWidth: '38%', color: color.text2, fontSize: 12, lineHeight: 22, textAlign: 'right' },
  plain: { color: color.text, fontSize: 15, lineHeight: 26 },
  limit: { borderLeftWidth: 2, borderLeftColor: color.gold, paddingLeft: 12, gap: 5, marginTop: 2 },
  limitTitle: { color: color.gold, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  toggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 8, paddingHorizontal: 4, marginHorizontal: -4 },
  toggleText: { flex: 1, color: color.accent, fontSize: 14, lineHeight: 22 },
  pressed: { backgroundColor: color.surface2 },
  details: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator, paddingTop: 14, gap: 16 },
  group: { gap: 7 },
  label: { color: color.text, fontSize: 14, lineHeight: 22, fontWeight: '600' },
  condition: { flexDirection: 'row', gap: 7 },
  bullet: { color: color.accent, fontSize: 16, lineHeight: 23 },
  conditionText: { flexShrink: 1, color: color.text2, fontSize: 14, lineHeight: 23 },
  term: { color: color.text2, fontSize: 13, lineHeight: 22 },
  termName: { color: color.text, fontWeight: '500' },
  tradition: { gap: 7 },
  traditionText: { color: color.text2, fontSize: 13, lineHeight: 22 },
  note: { color: color.text2, fontSize: 12, lineHeight: 20 },
  source: { color: color.text2, fontSize: 12, lineHeight: 20 },
  footnote: { color: color.text2, fontSize: 12, lineHeight: 20 },
});
