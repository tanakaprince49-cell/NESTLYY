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

export type RootTabParamList = {
  Dashboard: undefined;
  Baby: undefined;
  Education: undefined;
  Tools: import('@react-navigation/native').NavigatorScreenParams<ToolsStackParamList>;
  Settings: undefined;
};
