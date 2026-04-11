import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { C } from '@/lib/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: C.tabBg,
          borderTopWidth: 1,
          borderTopColor: C.tabBorder,
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.tabInactive,
        headerStyle: { backgroundColor: C.bg },
        headerTintColor: C.white,
        headerTitleStyle: { fontWeight: '700', color: C.white },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>✦</Text>,
          headerTitle: "Maia's Voice",
        }}
      />
      <Tabs.Screen
        name="readings"
        options={{
          title: 'Legungen',
          tabBarLabel: 'Legungen',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🃏</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>◉</Text>,
        }}
      />
    </Tabs>
  );
}
