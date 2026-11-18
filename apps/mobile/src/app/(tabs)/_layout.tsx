import { useSegments } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Icon } from '@/components/Icon';
import { color } from '@/theme';

export default function TabsLayout() {
  // 二级页面（宫位解读、追问、照片确认等）按设计稿不显示底部 Tab
  const segments = useSegments();
  const nested = segments.length > 2;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.text2,
        tabBarStyle: nested ? { display: 'none' } : { backgroundColor: color.canvas, borderTopColor: color.separator },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="chart" options={{ title: '命盘', tabBarIcon: ({ color: c }) => <Icon name="square.grid.3x3" size={23} tint={c} /> }} />
      <Tabs.Screen name="today" options={{ title: '今日', tabBarIcon: ({ color: c }) => <Icon name="photo" size={23} tint={c} /> }} />
      <Tabs.Screen name="me" options={{ title: '我的', tabBarIcon: ({ color: c }) => <Icon name="person" size={23} tint={c} /> }} />
    </Tabs>
  );
}
