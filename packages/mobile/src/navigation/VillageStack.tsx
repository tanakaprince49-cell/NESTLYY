import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VillageHomeScreen } from '../screens/village/VillageHomeScreen';
import { NestDetailScreen } from '../screens/village/NestDetailScreen';
import type { VillageStackParamList } from './types';

const Stack = createNativeStackNavigator<VillageStackParamList>();

export function VillageStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: '#f43f5e',
        headerTitleStyle: { color: '#1f2937', fontWeight: '600' },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#fff1f2' },
      }}
    >
      <Stack.Screen
        name="VillageHome"
        component={VillageHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NestDetail"
        component={NestDetailScreen}
        options={{ title: 'Nest' }}
      />
    </Stack.Navigator>
  );
}
