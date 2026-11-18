import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/Buttons';
import { DailyReadingView } from '@/components/DailyReadingView';
import { useApp } from '@/lib/app-state';
import { pickPhoto } from '@/lib/photo';
import { SAMPLE_DAILY } from '@/lib/sample-daily';
import { color, space } from '@/theme';

export default function TodayExample() {
  const insets = useSafeAreaInsets();
  const { setPhoto } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <Stack.Screen options={{ title: '今日解读', headerBackTitle: '今日' }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.page, paddingTop: 8, paddingBottom: 120 }}>
        <DailyReadingView reading={SAMPLE_DAILY} note="今天想慢一点。" badge="固定示例" />
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.page, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: color.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.separator }}>
        <PrimaryButton
          label="用我的照片试试"
          onPress={async () => {
            const picked = await pickPhoto();
            if (!picked) return;
            setPhoto(picked);
            router.replace('/today/confirm');
          }}
        />
      </View>
    </View>
  );
}
