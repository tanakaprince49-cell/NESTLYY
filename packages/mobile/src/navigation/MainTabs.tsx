import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { BabyScreen } from '../screens/BabyScreen';
import { ToolsScreen } from '../screens/ToolsScreen';
import { EducationScreen } from '../screens/EducationScreen';
import { AvaScreen } from '../screens/AvaScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home-outline',
  Baby: 'trending-up-outline',
  Ava: 'sparkles-outline',
  Education: 'book-outline',
  Tools: 'grid-outline',
  Settings: 'person-outline',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: '#f43f5e',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Nest' }} />
      <Tab.Screen name="Baby" component={BabyScreen} options={{ tabBarLabel: 'Growth' }} />
      <Tab.Screen name="Ava" component={AvaScreen} options={{ tabBarLabel: 'Ava' }} />
      <Tab.Screen name="Education" component={EducationScreen} options={{ tabBarLabel: 'Articles' }} />
      <Tab.Screen name="Tools" component={ToolsScreen} options={{ tabBarLabel: 'Tools' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}
