import { Stack } from 'expo-router';
import { color } from '@/theme';

export default function ChartStack() {
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
      <Stack.Screen name="index" options={{ title: '命盘', headerShown: false }} />
    </Stack>
  );
}
