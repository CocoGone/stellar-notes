import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import type { DailyReading } from '@shared/api';
import { dateLabel } from '@/lib/format';
import { color, font } from '@/theme';
import { Badge } from './Badge';
import { Disclosure } from './Disclosure';
import { PhotoThumbArt } from './PhotoArt';

interface Props {
  reading: DailyReading;
  /** 照片地址（本地 uri 或缩略图 data URI）；没有时显示插画 */
  image?: string;
  note?: string;
  badge: string;
}

export function DailyReadingView({ reading, image, note, badge }: Props) {
  const sections = [
    { n: '01', title: '画面里的线索', body: reading.seen },
    { n: '02', title: '从命盘换个角度', body: reading.chartAngle },
    { n: '03', title: '今天可以做的一件小事', body: reading.smallThing },
  ];
  return (
    <View>
      <Badge label={badge} />
      <Text style={styles.title} accessibilityRole="header">{reading.title}</Text>
      <Text style={styles.date}>{dateLabel(reading.day.date, false)} · {reading.day.lunarLabel} · {reading.day.dayGanZhi}</Text>

      <View style={styles.photoCard}>
        {image ? <Image source={{ uri: image }} style={styles.photo} contentFit="cover" accessibilityLabel="今天的照片" /> : <PhotoThumbArt size={64} />}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.photoTitle}>{reading.photoTitle}</Text>
          {note ? <Text style={styles.note} numberOfLines={2}>“{note}”</Text> : <Text style={styles.noteMuted}>没有补充文字</Text>}
        </View>
      </View>

      {sections.map((s, i) => (
        <View key={s.n} style={[styles.section, i > 0 && styles.sectionBorder]}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.num}>{s.n}  </Text>
            {s.title}
          </Text>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}

      {reading.basis.length ? (
        <View style={styles.basisWrap}>
          <Disclosure title="命盘依据">
            <View style={{ gap: 6, paddingBottom: 4 }}>
              {reading.basis.map((b) => (
                <Text key={b} style={styles.basis}>· {b}</Text>
              ))}
              <Text style={styles.source}>日干四化按当天日柱天干推算；照片内容只作为话题，不作为推算依据。</Text>
            </View>
          </Disclosure>
        </View>
      ) : null}

      {reading.caution ? <Text style={styles.caution}>{reading.caution}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: color.text, fontFamily: font.serif, fontSize: 28, lineHeight: 40, marginTop: 14 },
  date: { color: color.text2, fontSize: 14, marginTop: 6 },
  photoCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: color.surface, borderRadius: 18, padding: 14, marginTop: 20, marginBottom: 8 },
  photo: { width: 64, height: 64, borderRadius: 10 },
  photoTitle: { color: color.text, fontSize: 17, fontWeight: '600' },
  note: { color: color.text2, fontSize: 14 },
  noteMuted: { color: color.text2, fontSize: 13 },
  section: { paddingVertical: 16, gap: 6 },
  sectionBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator },
  sectionTitle: { color: color.text, fontSize: 17, fontWeight: '600' },
  num: { color: color.accent, fontVariant: ['tabular-nums'] },
  body: { color: color.text, fontSize: 16, lineHeight: 27 },
  basisWrap: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator, paddingTop: 4 },
  basis: { color: color.text2, fontSize: 14, lineHeight: 21 },
  source: { color: color.border, fontSize: 12, marginTop: 4 },
  caution: { color: color.text2, fontSize: 12, marginTop: 12 },
});
