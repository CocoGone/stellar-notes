import { Stack } from 'expo-router';
import { color } from '@/theme';

export default function TodayStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: color.canvas },
        headerShadowVisible: false,
        headerTintColor: color.accent,
        headerTitleStyle: { color: color.text, fontSize: 17, fontWeight: '600' },
        contentStyle: { backgroundColor: color.canvas },
      }}
    >
      <Stack.Screen name="index" options={{ title: '今日', headerShown: false }} />
    </Stack>
  );
}
