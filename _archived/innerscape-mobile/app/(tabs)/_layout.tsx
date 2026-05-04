import React from 'react';
import { Tabs } from 'expo-router';
import { Brain, Zap, Heart, LayoutDashboard } from 'lucide-react-native';
import { EmotionalContextBanner } from '../../components/EmotionalContextBanner';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <EmotionalContextBanner />
      <Tabs screenOptions={{
        tabBarActiveTintColor: '#4F46E5', // primary from design tokens
      }}>
        <Tabs.Screen
          name="mind"
          options={{
            title: 'Mind',
            tabBarIcon: ({ color }) => <Brain size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="flow"
          options={{
            title: 'Flow',
            tabBarIcon: ({ color }) => <Zap size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="body"
          options={{
            title: 'Body',
            tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="hub"
          options={{
            title: 'Hub',
            tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
