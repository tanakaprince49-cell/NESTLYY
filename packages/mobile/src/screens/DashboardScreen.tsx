import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LifecycleStage, getBabySizeForWeek } from '@nestly/shared';
import type { WeightLog, BloodPressureLog } from '@nestly/shared';
import { useProfileStore, useTrackingStore, useHealthConnectStore } from '@nestly/shared/stores';
import type { RootTabParamList } from '../navigation/types';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { ProgressBar } from '../components/ProgressBar';
import { RetirementNoticeBanner } from '../components/RetirementNoticeBanner';
import { getWeeksAndDays, getWeeksRemaining, formatBabyAge } from '../utils/pregnancyCalc';

function getTodayMs(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return { start, end: start + 86400000 };
}

function getSleepHoursToday(sleepLogs: { startTime: string; endTime: string; timestamp: number }[]): string {
  const { start, end } = getTodayMs();
  const total = sleepLogs
    .filter((l) => l.timestamp >= start && l.timestamp < end)
    .reduce((acc, l) => {
      const s = new Date(l.startTime).getTime();
      const e = new Date(l.endTime).getTime();
      if (!isNaN(s) && !isNaN(e) && e > s) {
        acc += (e - s) / (1000 * 60 * 60);
      }
      return acc;
    }, 0);
  if (total === 0) return '--';
  return total.toFixed(1);
}

function getFeedingCountToday(feedingLogs: { timestamp: number }[]): number {
  const { start, end } = getTodayMs();
  return feedingLogs.filter((l) => l.timestamp >= start && l.timestamp < end).length;
}

function getDiaperCountToday(diaperLogs: { timestamp: number }[]): number {
  const { start, end } = getTodayMs();
  return diaperLogs.filter((l) => l.timestamp >= start && l.timestamp < end).length;
}

// Pick the most recent entry by timestamp. Used to surface Health Connect-
// synced weight and blood pressure on the Dashboard so the user sees live
// values after HC sync instead of the stale onboarding snapshot. See #219.
function getLatestWeight(weightLogs: WeightLog[]): number | null {
  if (weightLogs.length === 0) return null;
  const latest = weightLogs.reduce((acc, l) => (l.timestamp > acc.timestamp ? l : acc));
  return latest.weight;
}

function getLatestBP(bpLogs: BloodPressureLog[]): { systolic: number; diastolic: number } | null {
  if (bpLogs.length === 0) return null;
  const latest = bpLogs.reduce((acc, l) => (l.timestamp > acc.timestamp ? l : acc));
  return { systolic: latest.systolic, diastolic: latest.diastolic };
}

export function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { profile } = useProfileStore();
  const { sleepLogs, feedingLogs, diaperLogs, weightLogs, bloodPressureLogs } = useTrackingStore();
  // Subscribe to HC connection + error state so the sync-issue banner reacts
  // to auto-sync failures without the user having to navigate to Settings.
  // See #253.
  const hcConnected = useHealthConnectStore((s) => s.isConnected);
  const hcSyncError = useHealthConnectStore((s) => s.syncError);

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-50">
        <Text className="text-gray-500">Loading your nest...</Text>
      </View>
    );
  }

  const isPregnancy = profile.lifecycleStage === LifecycleStage.PREGNANCY;
  const firstBaby = profile.babies?.[0];

  // HC-sourced maternal values. Computed before the branch split because both
  // pregnancy (#219) and newborn/postpartum (#252) dashboards surface them.
  // Pregnancy falls back to the onboarding startingWeight when weightLogs is
  // empty; newborn shows only actually-logged values so a stale pre-pregnancy
  // snapshot never appears in the postpartum view.
  const hcLatestWeight = getLatestWeight(weightLogs);
  const hcLatestBP = getLatestBP(bloodPressureLogs);

  // Tap-to-fix banner shown in both branches when an auto-sync fails while
  // Health Connect is otherwise connected. Without this, failures set
  // syncError in the store but nothing in the Dashboard surfaces it, so the
  // user sees stale values with no indication anything is wrong. See #253.
  const syncIssueBanner =
    hcConnected && hcSyncError ? (
      <TouchableOpacity
        className="mb-3 flex-row items-center rounded-xl border border-orange-200 bg-orange-50 px-3 py-2"
        style={{ gap: 8 }}
        onPress={() => navigation.navigate('Settings')}
        accessibilityRole="button"
        accessibilityLabel="Health Connect sync issue, tap to open Settings"
      >
        <Ionicons name="alert-circle-outline" size={16} color="#f97316" />
        <Text className="flex-1 text-xs text-orange-700">
          Health Connect sync issue. Tap to review.
        </Text>
        <Ionicons name="chevron-forward" size={14} color="#f97316" />
      </TouchableOpacity>
    ) : null;

  if (isPregnancy) {
    const { weeks, days } = getWeeksAndDays(profile.lmpDate);
    const weeksRemaining = getWeeksRemaining(profile.lmpDate);
    const babySize = getBabySizeForWeek(weeks);
    const sleepHours = getSleepHoursToday(sleepLogs);
    // Prefer the most recent weightLogs entry (which Health Connect sync
    // writes into) and fall back to the onboarding startingWeight only
    // when nothing has been logged yet. Before #219 the card always read
    // startingWeight, so HC-synced values never showed up on the
    // Dashboard even after a successful sync.
    const latestWeight = hcLatestWeight ?? profile.startingWeight ?? null;
    const latestBP = hcLatestBP;

    const formattedDue = profile.dueDate
      ? new Date(profile.dueDate).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : '--';

    return (
      <SafeAreaView className="flex-1 bg-rose-50">
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <RetirementNoticeBanner />
          {syncIssueBanner}
          <View className="mb-4 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-2xl font-bold text-rose-700">
                Hello, {profile.userName}
              </Text>
              <View className="mt-1 self-start bg-rose-100 rounded-full px-3 py-1">
                <Text className="text-sm font-medium text-rose-700">
                  Week {weeks}, Day {days}
                </Text>
              </View>
            </View>
            <Avatar uri={profile.profileImage} name={profile.userName ?? ''} size={48} />
          </View>

          <Card>
            <Text className="text-base font-semibold text-gray-800 mb-3">Journey Progress</Text>
            <ProgressBar weeks={weeks} />
            <View className="flex-row justify-between mt-3">
              <Text className="text-sm text-gray-500">{weeksRemaining} weeks to go</Text>
              <Text className="text-sm text-gray-500">Due {formattedDue}</Text>
            </View>
          </Card>

          {babySize ? (
            <Card>
              <Text className="text-base font-semibold text-gray-800 mb-3">Baby Size</Text>
              <View className="items-center">
                <Text style={{ fontSize: 48 }}>{babySize.emoji}</Text>
                <Text className="text-xl font-bold text-rose-700 mt-2">{babySize.size}</Text>
                <Text className="text-sm text-gray-500 mt-1">Week {weeks}</Text>
                <Text className="text-sm text-gray-400 mt-1">
                  {babySize.lengthCm} cm, {babySize.weightG} g
                </Text>
              </View>
            </Card>
          ) : null}

          <Card>
            <Text className="text-base font-semibold text-gray-800 mb-3">Daily Glance</Text>
            <View className="flex-row" style={{ gap: 8 }}>
              <StatCard
                label="Weight"
                value={latestWeight ?? '--'}
                unit={latestWeight != null ? 'kg' : undefined}
              />
              <StatCard
                label="Sleep"
                value={sleepHours}
                unit={sleepHours !== '--' ? 'h' : undefined}
              />
              <StatCard
                label="BP"
                value={latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : '--'}
              />
            </View>
          </Card>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-rose-400 rounded-2xl py-4 items-center"
              onPress={() => navigation.navigate('Tools', { screen: 'FeedingTracker' })}
            >
              <Text className="text-white font-semibold">Log Food</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl py-4 items-center border border-rose-200"
              onPress={() => navigation.navigate('Tools', { screen: 'SleepTracker' })}
            >
              <Text className="text-rose-700 font-semibold">Track Sleep</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const feedingCount = getFeedingCountToday(feedingLogs);
  const sleepHours = getSleepHoursToday(sleepLogs);
  const diaperCount = getDiaperCountToday(diaperLogs);
  const babyAgeStr = firstBaby?.birthDate ? formatBabyAge(firstBaby.birthDate) : '';

  // Maternal Health card only renders when HC is connected and has delivered
  // at least one weight or BP reading. Postpartum moms who sync a scale or BP
  // cuff through Health Connect would otherwise see their data flow in
  // silently with no surface in the newborn Dashboard. Gated on isConnected
  // so users without HC do not see a dead card. See #252.
  const showMaternalCard = hcConnected && (hcLatestWeight !== null || hcLatestBP !== null);

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <RetirementNoticeBanner />
        {syncIssueBanner}
        <View className="mb-4 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-rose-700">
              Hello, {profile.userName}
            </Text>
            {firstBaby ? (
              <Text className="text-base text-gray-500 mt-1">
                {firstBaby.name || 'Baby'}
                {babyAgeStr ? ` · ${babyAgeStr}` : ''}
              </Text>
            ) : null}
          </View>
          <Avatar uri={profile.profileImage} name={profile.userName ?? ''} size={48} />
        </View>

        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-3">Today's Stats</Text>
          <View className="flex-row gap-2">
            <StatCard label="Feedings" value={feedingCount} />
            <StatCard label="Sleep" value={sleepHours} unit={sleepHours !== '--' ? 'h' : undefined} />
            <StatCard label="Diapers" value={diaperCount} />
            <StatCard label="Mood" value="--" />
          </View>
        </Card>

        {showMaternalCard ? (
          <Card>
            <Text className="text-base font-semibold text-gray-800 mb-3">Your Health</Text>
            <View className="flex-row" style={{ gap: 8 }}>
              <StatCard
                label="Weight"
                value={hcLatestWeight ?? '--'}
                unit={hcLatestWeight != null ? 'kg' : undefined}
              />
              <StatCard
                label="BP"
                value={hcLatestBP ? `${hcLatestBP.systolic}/${hcLatestBP.diastolic}` : '--'}
              />
            </View>
          </Card>
        ) : null}

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-rose-400 rounded-2xl py-4 items-center"
            onPress={() => navigation.navigate('Tools', { screen: 'FeedingTracker' })}
          >
            <Text className="text-white font-semibold">Log Food</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white rounded-2xl py-4 items-center border border-rose-200"
            onPress={() => navigation.navigate('Tools', { screen: 'SleepTracker' })}
          >
            <Text className="text-rose-700 font-semibold">Track Sleep</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
