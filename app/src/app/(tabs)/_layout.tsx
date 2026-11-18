import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Icon } from '../../components/ui';
import { useStore } from '../../lib/store';
import { C, F } from '../../lib/theme';

export default function TabsLayout() {
  const s = useStore();
  if (!s.access || !s.profile.done) return <Redirect href="/welcome" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.ink,
        tabBarInactiveTintColor: '#8e8e93',
        tabBarLabelStyle: { fontFamily: F.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: 'rgba(255,255,255,0.96)', borderTopColor: C.hair },
        sceneStyle: { backgroundColor: C.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color }) => <Icon name="today" size={22} color={String(color)} /> }} />
      <Tabs.Screen
        name="saved"
        options={{ title: 'Saved', tabBarIcon: ({ color }) => <Icon name="saved" size={22} color={String(color)} /> }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: 'Archive',
          tabBarIcon: ({ color }) => <Icon name="week" size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Icon name="user" size={22} color={String(color)} /> }} />
    </Tabs>
  );
}
