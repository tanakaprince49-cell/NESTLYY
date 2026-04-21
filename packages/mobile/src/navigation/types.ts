import type { NavigatorScreenParams } from '@react-navigation/native';

export type ToolsStackParamList = {
  ToolsHub: undefined;
  FeedingTracker: undefined;
  NutritionTracker: undefined;
  SleepTracker: undefined;
  DiaperTracker: undefined;
  VitalsTracker: undefined;
  SymptomTracker: undefined;
  KickCounter: undefined;
  ContractionTimer: undefined;
  MedicationTracker: undefined;
  VitaminTracker: undefined;
  BloodPressureTracker: undefined;
  KegelTracker: undefined;
  ReportCenter: undefined;
};

export type VillageStackParamList = {
  VillageHome: undefined;
  NestDetail: { nestId: string };
};

export type RootTabParamList = {
  Dashboard: undefined;
  Baby: undefined;
  Education: undefined;
  Tools: NavigatorScreenParams<ToolsStackParamList>;
  Village: NavigatorScreenParams<VillageStackParamList>;
  Settings: undefined;
};
