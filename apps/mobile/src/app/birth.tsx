import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, LayoutAnimation, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { BirthInput, PlacesResponse, RelationshipKind } from '@shared/api';
import { Segmented } from '@/components/Segmented';
import { TextButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { useApp } from '@/lib/app-state';
import { shichenOf } from '@/lib/format';
import { color } from '@/theme';
import { RELATIONSHIPS } from '@shared/relationship';

const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const LUNAR_DAYS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1900 + 1 }, (_, i) => THIS_YEAR - i);
const pad = (n: number) => String(n).padStart(2, '0');

type TimeStatus = BirthInput['time']['status'];

interface Form {
  nickname: string;
  gender: 'female' | 'male';
  calendar: 'solar' | 'lunar';
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  timeStatus: TimeStatus;
  hour: number;
  minute: number;
  timeNote: string;
  place: BirthInput['place'] | null;
  dstClock: boolean;
}

function fromBirth(b: BirthInput | null): Form {
  return {
    nickname: b?.nickname ?? '',
    gender: b?.gender ?? 'female',
    calendar: b?.calendar ?? 'solar',
    year: b?.year ?? 1995,
    month: b?.month ?? 1,
    day: b?.day ?? 1,
    isLeapMonth: Boolean(b?.isLeapMonth),
    timeStatus: b?.time.status ?? 'exact',
    hour: b?.time.status === 'exact' ? b.time.hour : 12,
    minute: b?.time.status === 'exact' ? b.time.minute : 0,
    timeNote: b?.time.status === 'approx' ? b.time.note ?? '' : '',
    place: b?.place ?? null,
    dstClock: Boolean(b?.dstClock),
  };
}

function toBirth(f: Form): BirthInput {
  return {
    nickname: f.nickname.trim() || undefined,
    gender: f.gender,
    calendar: f.calendar,
    year: f.year,
    month: f.month,
    day: f.day,
    isLeapMonth: f.calendar === 'lunar' ? f.isLeapMonth : undefined,
    time:
      f.timeStatus === 'exact'
        ? { status: 'exact', hour: f.hour, minute: f.minute }
        : f.timeStatus === 'approx'
          ? { status: 'approx', note: f.timeNote.trim() || undefined }
          : { status: 'unknown' },
    place: f.place ?? undefined,
    dstClock: f.dstClock,
  };
}

function Section({ title, children, footer }: { title: string; children: ReactNode; footer?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>{children}</View>
    </View>
  );
}

function Wheel<T extends string | number>({ value, items, onChange, label }: { value: T; items: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <Picker
      selectedValue={value}
      onValueChange={(v) => onChange(v as T)}
      style={{ flex: 1 }}
      itemStyle={styles.wheelItem}
      accessibilityLabel={label}
    >
      {items.map((it) => (
        <Picker.Item key={String(it.value)} label={it.label} value={it.value} color={color.text} />
      ))}
    </Picker>
  );
}

export default function BirthSheet() {
  const { target } = useLocalSearchParams<{ target?: string }>();
  const { partnerReady } = useApp();
  if (target === 'partner' && !partnerReady) return <View style={{ flex: 1, backgroundColor: color.surface, justifyContent: 'center' }}><ActivityIndicator color={color.accent} /></View>;
  return <BirthEditor />;
}

function BirthEditor() {
  const { target, relationship, selfRole } = useLocalSearchParams<{ target?: string; relationship?: string; selfRole?: string }>();
  const isPartner = target === 'partner';
  const { me, setMe, partner, savePartner, partnerReady } = useApp();
  const birth = isPartner ? partner?.birth : me?.birth;
  const initial = useMemo(() => fromBirth(birth ?? null), [birth]);
  const [form, setForm] = useState<Form>(initial);
  const [places, setPlaces] = useState<PlacesResponse['provinces'] | null>(null);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.places().then((r) => setPlaces(r.provinces)).catch(() => setPlaces([]));
  }, []);

  // 中国大陆 1986–1991 年夏季实行过夏令时，只在可能的年月提示
  const maybeDst = form.calendar === 'solar' && form.year >= 1986 && form.year <= 1991 && form.month >= 4 && form.month <= 9;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const next = toBirth({ ...form, dstClock: maybeDst && form.dstClock });
      if (isPartner) await savePartner({ ...partner, birth: next, relationship: partner?.relationship ?? (RELATIONSHIPS.includes(relationship as RelationshipKind) ? relationship as RelationshipKind : 'partner'), selfRole: partner?.selfRole ?? (selfRole === 'parent' || selfRole === 'child' ? selfRole : undefined) });
      else setMe(await api.saveBirth(next));
      router.back();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    if (!dirty) return router.back();
    Alert.alert('放弃这次修改？', '填写的出生资料还没有保存。', [
      { text: '继续编辑', style: 'cancel' },
      { text: '放弃', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  function clearBirth() {
    Alert.alert(isPartner ? '移除对方的出生资料？' : '清除出生资料？', isPartner ? '会删除保存在这台设备上的合盘资料。' : '会回到示例盘。已保存的今日记录不受影响。', [
      { text: '取消', style: 'cancel' },
      {
        text: '清除',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isPartner) await savePartner(null);
            else setMe(await api.clearBirth());
            router.back();
          } catch (err) {
            setError((err as Error).message);
          }
        },
      },
    ]);
  }

  const province = places?.find((p) => p.name === form.place?.province);

  return (
    <View style={{ flex: 1, backgroundColor: color.surface }}>
      <Stack.Screen
        options={{
          title: isPartner ? '对方的出生资料' : '出生资料',
          headerLeft: () => <TextButton label="取消" tone="muted" onPress={cancel} />,
          headerRight: () => <TextButton label={saving ? '保存中' : '完成'} onPress={save} disabled={saving || (isPartner && !partnerReady)} />,
          gestureEnabled: !dirty,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {isPartner ? <Text style={[styles.footer, { marginBottom: 18 }]}>请使用已获对方同意的出生资料。资料保存在这台设备，查看合盘时会发送到星笺排盘。</Text> : null}
        {error ? (
          <View style={styles.error} accessibilityLiveRegion="polite">
            <Icon name="exclamationmark.circle" size={15} tint={color.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Section title="基本">
          <Row label="昵称">
            <TextInput
              value={form.nickname}
              onChangeText={(v) => set('nickname', v)}
              placeholder="可不填"
              placeholderTextColor={color.text2}
              style={styles.textInput}
              maxLength={20}
              accessibilityLabel="昵称"
            />
          </Row>
          <View style={styles.sep} />
          <View style={styles.padded}>
            <Segmented value={form.gender} onChange={(v) => set('gender', v)} options={[{ value: 'female', label: '女' }, { value: 'male', label: '男' }]} />
          </View>
        </Section>

        <Section title="出生日期" footer={form.calendar === 'lunar' ? '农历按出生当年的月份选择，闰月请打开“闰月”。' : undefined}>
          <View style={styles.padded}>
            <Segmented value={form.calendar} onChange={(v) => set('calendar', v)} options={[{ value: 'solar', label: '公历' }, { value: 'lunar', label: '农历' }]} />
          </View>
          {form.calendar === 'solar' ? (
            <DateTimePicker
              value={new Date(form.year, form.month - 1, form.day)}
              mode="date"
              display="spinner"
              style={{ alignSelf: 'center' }}
              locale="zh-Hans"
              themeVariant="dark"
              textColor={color.text}
              minimumDate={new Date(1900, 0, 1)}
              maximumDate={new Date()}
              onChange={(_, d) => d && setForm((f) => ({ ...f, year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }))}
            />
          ) : (
            <>
              <View style={styles.wheels}>
                <Wheel label="农历年" value={form.year} onChange={(v) => set('year', v)} items={YEARS.map((y) => ({ value: y, label: `${y}年` }))} />
                <Wheel label="农历月" value={form.month} onChange={(v) => set('month', v)} items={LUNAR_MONTHS.map((m, i) => ({ value: i + 1, label: `${form.isLeapMonth ? '闰' : ''}${m}月` }))} />
                <Wheel label="农历日" value={Math.min(form.day, 30)} onChange={(v) => set('day', v)} items={LUNAR_DAYS.map((d, i) => ({ value: i + 1, label: d }))} />
              </View>
              <View style={styles.sep} />
              <Row label="闰月">
                <Switch value={form.isLeapMonth} onValueChange={(v) => set('isLeapMonth', v)} trackColor={{ true: color.primary }} />
              </Row>
            </>
          )}
        </Section>

        <Section
          title="出生时间"
          footer={
            form.timeStatus === 'exact'
              ? `按北京时间约为${shichenOf(form.hour, form.minute)}。选了出生地后，会按真太阳时校正。`
              : form.timeStatus === 'approx'
                ? '时辰每两小时一换，跨时辰整张盘都会不同。先保存资料，核实到具体时间后再生成你的命盘。'
                : '不知道时辰时，不会按子时硬排。资料先保存，之后补上时间即可。'
          }
        >
          <View style={styles.padded}>
            <Segmented
              value={form.timeStatus}
              onChange={(v) => set('timeStatus', v)}
              options={[{ value: 'exact', label: '知道' }, { value: 'approx', label: '大概知道' }, { value: 'unknown', label: '不知道' }]}
            />
          </View>
          {form.timeStatus === 'exact' ? (
            <View style={styles.wheels}>
              <Wheel label="小时" value={form.hour} onChange={(v) => set('hour', v)} items={Array.from({ length: 24 }, (_, h) => ({ value: h, label: `${pad(h)} 时` }))} />
              <Wheel label="分钟" value={form.minute} onChange={(v) => set('minute', v)} items={Array.from({ length: 60 }, (_, m) => ({ value: m, label: `${pad(m)} 分` }))} />
            </View>
          ) : form.timeStatus === 'approx' ? (
            <Row label="大概时间">
              <TextInput
                value={form.timeNote}
                onChangeText={(v) => set('timeNote', v)}
                placeholder="比如：上午九点到十一点"
                placeholderTextColor={color.text2}
                style={styles.textInput}
                maxLength={40}
                accessibilityLabel="大概的出生时间"
              />
            </Row>
          ) : null}
          {maybeDst && form.timeStatus === 'exact' ? (
            <>
              <View style={styles.sep} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { flex: 1, marginRight: 12 }]}>那年夏天实行夏令时。填的是当年钟表上的时间吗？</Text>
                <Switch value={form.dstClock} onValueChange={(v) => set('dstClock', v)} trackColor={{ true: color.primary }} accessibilityLabel="填写的是夏令时钟表时间" />
              </View>
            </>
          ) : null}
        </Section>

        <Section title="出生地" footer="用于真太阳时校正。不填就按北京时间排盘。">
          <Pressable
            style={[styles.row, { justifyContent: 'space-between' }]}
            accessibilityRole="button"
            accessibilityState={{ expanded: placeOpen }}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              if (!placeOpen && !form.place && places?.length) {
                const p = places[0];
                set('place', { province: p.name, city: p.cities[0].name, longitude: p.cities[0].longitude });
              }
              setPlaceOpen(!placeOpen);
            }}
          >
            <Text style={styles.rowLabel}>省 / 市</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.rowValue, !form.place && { color: color.text2 }]}>
                {form.place ? `${form.place.province} · ${form.place.city}` : '未选择'}
              </Text>
              <Icon name={placeOpen ? 'chevron.up' : 'chevron.down'} size={12} />
            </View>
          </Pressable>
          {placeOpen && places && form.place ? (
            <>
              <View style={styles.wheels}>
                <Wheel
                  label="省份"
                  value={form.place.province}
                  onChange={(name) => {
                    const p = places.find((x) => x.name === name)!;
                    set('place', { province: p.name, city: p.cities[0].name, longitude: p.cities[0].longitude });
                  }}
                  items={places.map((p) => ({ value: p.name, label: p.name }))}
                />
                <Wheel
                  label="城市"
                  value={form.place.city}
                  onChange={(name) => {
                    const c = province?.cities.find((x) => x.name === name);
                    if (c && province) set('place', { province: province.name, city: c.name, longitude: c.longitude });
                  }}
                  items={(province?.cities ?? []).map((c) => ({ value: c.name, label: c.name }))}
                />
              </View>
              <View style={styles.sep} />
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={styles.footerInline}>经度 {form.place.longitude.toFixed(2)}°E</Text>
                <TextButton label="不填出生地" tone="muted" onPress={() => { set('place', null); setPlaceOpen(false); }} />
              </View>
            </>
          ) : null}
        </Section>

        <Text style={styles.privacy}>{isPartner ? '你可以随时在这里移除对方资料。' : '出生资料只用于排盘和解读，可以在「我的」里随时删除。'}</Text>
        {birth ? (
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <TextButton label={isPartner ? '移除对方资料' : '清除出生资料，回到示例盘'} tone="danger" onPress={clearBirth} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 22 },
  sectionTitle: { color: color.text2, fontSize: 13, marginBottom: 8, marginLeft: 4 },
  group: { backgroundColor: color.surface2, borderRadius: 14, overflow: 'hidden' },
  footer: { color: color.text2, fontSize: 13, lineHeight: 19, marginTop: 8, marginHorizontal: 4 },
  footerInline: { color: color.text2, fontSize: 13 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  rowLabel: { color: color.text, fontSize: 16 },
  rowValue: { color: color.text, fontSize: 16 },
  padded: { padding: 10 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: color.separator, marginLeft: 14 },
  textInput: { color: color.text, fontSize: 16, textAlign: 'right', minWidth: 160, minHeight: 44 },
  wheels: { flexDirection: 'row', height: 190, paddingHorizontal: 4 },
  wheelItem: { color: color.text, fontSize: 19, height: 190 },
  error: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255, 143, 163, 0.12)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { flex: 1, color: color.text, fontSize: 14, lineHeight: 20 },
  privacy: { color: color.text2, fontSize: 12, textAlign: 'center', marginTop: 4 },
});
