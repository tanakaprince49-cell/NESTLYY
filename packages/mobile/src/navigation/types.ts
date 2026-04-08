import type { NavigatorScreenParams } from '@react-navigation/native';

export type ToolsStackParamList = {
  ToolsHub: undefined;
  FeedingTracker: undefined;
  SleepTracker: undefined;
  DiaperTracker: undefined;
  VitalsTracker: undefined;
};

export type RootTabParamList = {
  Dashboard: undefined;
  Baby: undefined;
  Ava: undefined;
  Education: undefined;
  Tools: NavigatorScreenParams<ToolsStackParamList>;
  Settings: undefined;
};
