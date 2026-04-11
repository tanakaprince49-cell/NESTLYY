import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LifecycleStage } from '@nestly/shared';
import { useProfileStore } from '@nestly/shared/stores';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ToolsStackParamList } from '../navigation/types';

interface ToolItem {
  key: keyof ToolsStackParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  pregnancyOnly?: boolean;
  postpartumOnly?: boolean;
}

const ALL_TOOLS: ToolItem[] = [
  { key: 'NutritionTracker', label: 'Nutrition', icon: 'nutrition-outline', color: '#f43f5e', bgColor: '#ffe4e6', pregnancyOnly: true },
  { key: 'FeedingTracker', label: 'Feeding', icon: 'restaurant-outline', color: '#0ea5e9', bgColor: '#e0f2fe', postpartumOnly: true },
  { key: 'SleepTracker', label: 'Sleep', icon: 'moon-outline', color: '#6366f1', bgColor: '#e0e7ff' },
  { key: 'DiaperTracker', label: 'Diaper', icon: 'water-outline', color: '#06b6d4', bgColor: '#cffafe', postpartumOnly: true },
  { key: 'VitalsTracker', label: 'Vitals', icon: 'pulse-outline', color: '#ef4444', bgColor: '#fee2e2' },
  { key: 'SymptomTracker', label: 'Symptoms', icon: 'thermometer-outline', color: '#f59e0b', bgColor: '#fef3c7', pregnancyOnly: true },
  { key: 'KickCounter', label: 'Kicks', icon: 'footsteps-outline', color: '#ec4899', bgColor: '#fce7f3', pregnancyOnly: true },
  { key: 'ContractionTimer', label: 'Contractions', icon: 'timer-outline', color: '#a855f7', bgColor: '#f3e8ff', pregnancyOnly: true },
  { key: 'MedicationTracker', label: 'Medications', icon: 'medkit-outline', color: '#10b981', bgColor: '#d1fae5' },
  { key: 'VitaminTracker', label: 'Vitamins', icon: 'leaf-outline', color: '#22c55e', bgColor: '#dcfce7' },
  { key: 'BloodPressureTracker', label: 'Blood Pressure', icon: 'heart-circle-outline', color: '#f43f5e', bgColor: '#ffe4e6', pregnancyOnly: true },
  { key: 'KegelTracker', label: 'Kegels', icon: 'fitness-outline', color: '#8b5cf6', bgColor: '#ede9fe', pregnancyOnly: true },
  { key: 'ReportCenter', label: 'Reports', icon: 'document-text-outline', color: '#be185d', bgColor: '#ffe4e6' },
];

interface Props {
  navigation: NativeStackNavigationProp<ToolsStackParamList, 'ToolsHub'>;
}

export function ToolsHubScreen({ navigation }: Props) {
  const { profile } = useProfileStore();

  // PRE_PREGNANCY shares the pregnancy tool set with PREGNANCY because both
  // stages are trying to conceive or are pregnant, and the maternal nutrition
  // and symptom tiles are relevant to both. Matches the FeedingRouter stage
  // check so the hub tile and the resolved tracker stay in sync.
  //
  // Null profile also defaults to the pregnancy tool set so a future code
  // path that mounts MainTabs before profile hydration cannot silently show
  // a postpartum grid to a pregnant user.
  const isPregnancyLike =
    !profile ||
    profile.lifecycleStage === LifecycleStage.PREGNANCY ||
    profile.lifecycleStage === LifecycleStage.PRE_PREGNANCY;

  const visibleTools = ALL_TOOLS.filter((tool) => {
    if (isPregnancyLike && tool.postpartumOnly) return false;
    if (!isPregnancyLike && tool.pregnancyOnly) return false;
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-rose-700">Tools</Text>
        <Text className="text-sm text-gray-500 mt-1">Track your daily activities</Text>
      </View>
      <FlatList
        data={visibleTools}
        numColumns={3}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate(item.key)}
            className="flex-1 bg-white rounded-2xl p-4 items-center"
            style={{ maxWidth: '33%' }}
          >
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: item.bgColor }}
            >
              <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <Text className="text-xs font-semibold text-gray-700">{item.label}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="py-12 items-center">
            <Text className="text-gray-400 text-sm">No tools available for this stage yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
