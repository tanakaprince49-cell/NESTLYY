import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ToolsHubScreen } from '../screens/ToolsHubScreen';
import { FeedingTrackerScreen } from '../screens/trackers/FeedingTrackerScreen';
import { SleepTrackerScreen } from '../screens/trackers/SleepTrackerScreen';
import { DiaperTrackerScreen } from '../screens/trackers/DiaperTrackerScreen';
import { VitalsTrackerScreen } from '../screens/trackers/VitalsTrackerScreen';
import { SymptomTrackerScreen } from '../screens/trackers/SymptomTrackerScreen';
import { KickCounterScreen } from '../screens/trackers/KickCounterScreen';
import { ContractionTimerScreen } from '../screens/trackers/ContractionTimerScreen';
import { MedicationTrackerScreen } from '../screens/trackers/MedicationTrackerScreen';
import { VitaminTrackerScreen } from '../screens/trackers/VitaminTrackerScreen';
import { BloodPressureTrackerScreen } from '../screens/trackers/BloodPressureTrackerScreen';
import { KegelTrackerScreen } from '../screens/trackers/KegelTrackerScreen';
import { ReportCenterScreen } from '../screens/ReportCenterScreen';
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
      <Stack.Screen
        name="SymptomTracker"
        component={SymptomTrackerScreen}
        options={{ title: 'Symptoms' }}
      />
      <Stack.Screen
        name="KickCounter"
        component={KickCounterScreen}
        options={{ title: 'Kick Counter' }}
      />
      <Stack.Screen
        name="ContractionTimer"
        component={ContractionTimerScreen}
        options={{ title: 'Contractions' }}
      />
      <Stack.Screen
        name="MedicationTracker"
        component={MedicationTrackerScreen}
        options={{ title: 'Medications' }}
      />
      <Stack.Screen
        name="VitaminTracker"
        component={VitaminTrackerScreen}
        options={{ title: 'Vitamins' }}
      />
      <Stack.Screen
        name="BloodPressureTracker"
        component={BloodPressureTrackerScreen}
        options={{ title: 'Blood Pressure' }}
      />
      <Stack.Screen
        name="KegelTracker"
        component={KegelTrackerScreen}
        options={{ title: 'Kegels' }}
      />
      <Stack.Screen
        name="ReportCenter"
        component={ReportCenterScreen}
        options={{ title: 'Reports' }}
      />
    </Stack.Navigator>
  );
}
