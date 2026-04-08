import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ToolsHubScreen } from '../screens/ToolsHubScreen';
import { FeedingTrackerScreen } from '../screens/trackers/FeedingTrackerScreen';
import { SleepTrackerScreen } from '../screens/trackers/SleepTrackerScreen';
import { DiaperTrackerScreen } from '../screens/trackers/DiaperTrackerScreen';
import { VitalsTrackerScreen } from '../screens/trackers/VitalsTrackerScreen';
import type { ToolsStackParamList } from './types';

const Stack = createNativeStackNavigator<ToolsStackParamList>();

export function ToolsStack() {
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
        name="ToolsHub"
        component={ToolsHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FeedingTracker"
        component={FeedingTrackerScreen}
        options={{ title: 'Feeding' }}
      />
      <Stack.Screen
        name="SleepTracker"
        component={SleepTrackerScreen}
        options={{ title: 'Sleep' }}
      />
      <Stack.Screen
        name="DiaperTracker"
        component={DiaperTrackerScreen}
        options={{ title: 'Diaper' }}
      />
      <Stack.Screen
        name="VitalsTracker"
        component={VitalsTrackerScreen}
        options={{ title: 'Vitals' }}
      />
    </Stack.Navigator>
  );
}
