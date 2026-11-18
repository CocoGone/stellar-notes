import { Stack } from 'expo-router';
import { color } from '@/theme';

export default function MeStack() {
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
      <Stack.Screen name="index" options={{ title: '我的', headerShown: false }} />
    </Stack>
  );
}
