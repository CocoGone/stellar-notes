import { NotoSerifSC_400Regular } from '@expo-google-fonts/noto-serif-sc/400Regular';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppProvider } from '@/lib/app-state';
import { color } from '@/theme';

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: color.accent,
    background: color.canvas,
    card: color.canvas,
    text: color.text,
    border: color.separator,
  },
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 只加载正文标题用的一个字重；加载失败也照常进入，退回系统字体
  const [loaded, error] = useFonts({ NotoSerifSC_400Regular });
  const ready = loaded || Boolean(error);
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  return (
    <AppProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.canvas } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="birth"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: '出生资料',
              headerStyle: { backgroundColor: color.surface },
              headerTintColor: color.accent,
              headerTitleStyle: { color: color.text },
              contentStyle: { backgroundColor: color.surface },
            }}
          />
          <Stack.Screen
            name="star/[name]"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.6, 1],
              sheetGrabberVisible: true,
              sheetCornerRadius: 22,
              contentStyle: { backgroundColor: color.surface },
            }}
          />
        </Stack>
      </ThemeProvider>
    </AppProvider>
  );
}
