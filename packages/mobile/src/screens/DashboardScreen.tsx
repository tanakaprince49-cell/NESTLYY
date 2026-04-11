import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LifecycleStage } from '@nestly/shared';
import { useProfileStore, useTrackingStore } from '@nestly/shared/stores';
import type { RootTabParamList } from '../navigation/types';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { ProgressBar } from '../components/ProgressBar';
import { getWeeksAndDays, getWeeksRemaining, formatBabyAge } from '../utils/pregnancyCalc';
import { getBabySizeForWeek } from '../../../shared/src/data/babySizes';

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

export function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { profile } = useProfileStore();
  const { sleepLogs, feedingLogs, diaperLogs } = useTrackingStore();

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-50">
        <Text className="text-gray-500">Loading your nest...</Text>
      </View>
    );
  }

  const isPregnancy = profile.lifecycleStage === LifecycleStage.PREGNANCY;
  const firstBaby = profile.babies?.[0];

  if (isPregnancy) {
    const { weeks, days } = getWeeksAndDays(profile.lmpDate);
    const weeksRemaining = getWeeksRemaining(profile.lmpDate);
    const babySize = getBabySizeForWeek(weeks);
    const sleepHours = getSleepHoursToday(sleepLogs);

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
            <View className="flex-row gap-3">
              <StatCard
                label="Weight"
                value={profile.startingWeight ?? '--'}
                unit={profile.startingWeight ? 'kg' : undefined}
              />
              <StatCard label="Sleep" value={sleepHours} unit={sleepHours !== '--' ? 'h' : undefined} />
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

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
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
