import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { StarInfo } from '@shared/api';
import { Badge } from '@/components/Badge';
import { ClassicRefs } from '@/components/ClassicRefs';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-state';
import { color, font, hua } from '@/theme';

const KIND: Record<StarInfo['kind'], string> = { major: '主星', lucky: '吉星', sha: '煞星', minor: '辅星' };

/** 点星曜弹出的说明页（系统 sheet） */
export default function StarSheet() {
  const { name: raw, general } = useLocalSearchParams<{ name: string; general?: string }>();
  const name = decodeURIComponent(raw ?? '');
  const { me, setSelected } = useApp();
  const [result, setResult] = useState<{ name: string; info?: StarInfo; error?: string } | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .star(name)
      .then((info) => alive && setResult({ name, info }))
      .catch((err) => alive && setResult({ name, error: (err as Error).message }));
    return () => {
      alive = false;
    };
  }, [name]);

  const info = result?.name === name ? result.info : undefined;
  const error = result?.name === name ? result.error : undefined;

  return (
    <ScrollView style={{ backgroundColor: color.surface }} contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>
      <View style={styles.head}>
        <Text style={styles.name} accessibilityRole="header">{name}</Text>
        {info ? <Badge label={KIND[info.kind]} /> : null}
      </View>
      {!info && !error ? <ActivityIndicator color={color.accent} style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.body}>{error}</Text> : null}
      {info ? (
        <>
          {info.inChart && general !== '1' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityHint="回到命盘并选中这一宫"
              onPress={() => {
                setSelected(info.inChart!.palaceBranch);
                router.back();
              }}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>
                在{me?.chart.kind === 'sample' ? '示例盘的' : '你的'}{info.inChart.palaceName}
              </Text>
              {info.inChart.brightnessPlain ? <Text style={styles.cardLine}>亮度 {info.inChart.brightnessPlain}</Text> : null}
              {info.inChart.siHua && info.inChart.siHuaPlain ? (
                <Text style={styles.cardLine}>
                  <Text style={{ color: hua[info.inChart.siHua], fontWeight: '700' }}>生年{info.inChart.siHua}　</Text>
                  {info.inChart.siHuaPlain}
                </Text>
              ) : null}
            </Pressable>
          ) : null}

          {info.keywords ? (
            <View style={styles.block}>
              <Text style={styles.label}>传统关键词</Text>
              <Text style={styles.keywords}>{info.keywords}</Text>
              <Text style={styles.meta}>五行属{info.element} · {info.nature}</Text>
            </View>
          ) : null}

          {info.trait ? (
            <View style={styles.block}>
              <Text style={styles.label}>白话说</Text>
              <Text style={styles.body}>{info.trait}。</Text>
              {info.watch ? <Text style={[styles.body, { color: color.text2 }]}>需要留意的一面：{info.watch}。</Text> : null}
            </View>
          ) : null}

          <View style={styles.block}>
            <ClassicRefs refs={info.quotes} onSurface />
          </View>

          <Text style={styles.footnote}>传统解释是一种观察角度，不是人生定论。</Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: color.text, fontFamily: font.serif, fontSize: 30 },
  card: { backgroundColor: color.surface2, borderRadius: 14, padding: 14, gap: 6, marginTop: 16 },
  cardTitle: { color: color.text, fontSize: 16, fontWeight: '600' },
  cardLine: { color: color.text2, fontSize: 14, lineHeight: 21 },
  block: { marginTop: 20, gap: 6 },
  label: { color: color.text2, fontSize: 13 },
  keywords: { color: color.text, fontSize: 18, fontWeight: '600' },
  meta: { color: color.text2, fontSize: 13 },
  body: { color: color.text, fontSize: 16, lineHeight: 27 },
  footnote: { color: color.text2, fontSize: 12, marginTop: 24 },
});
