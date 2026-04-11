import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0D0A1E',
          borderTopWidth: 1,
          borderTopColor: '#ffffff11',
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: '#C9956A',
        tabBarInactiveTintColor: '#555555',
        headerStyle: { backgroundColor: '#0D0A1E' },
        headerTintColor: '#F5E6D0',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>✦</Text>,
          headerTitle: 'Tarot',
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
