import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LifecycleStage,
  babyGrowthData,
  getBabyGrowth,
  type PregnancyProfile,
} from '@nestly/shared';
import { useProfileStore } from '@nestly/shared/stores';
import { formatBabyAge, getWeeksAndDays } from '../utils/pregnancyCalc';
import { Card } from '../components/Card';

const GENDER_EMOJI: Record<string, string> = {
  boy: '👦',
  girl: '👧',
  surprise: '🎁',
  neutral: '👶',
};

// Tile dims: w-16 = 64px, mr-2 = 8px → 72px stride. Used to center the
// current week in the carousel on mount.
const TILE_WIDTH = 64;
const TILE_STRIDE = 72;

function hasValidLmpDate(lmpDate: string | undefined): lmpDate is string {
  if (!lmpDate) return false;
  const parsed = new Date(lmpDate).getTime();
  return Number.isFinite(parsed);
}

function FetalDevelopmentEmptyState() {
  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl mb-4">🌱</Text>
        <Text className="text-xl font-bold text-rose-700 text-center">
          Set your LMP date
        </Text>
        <Text className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
          Open Settings and add the first day of your last period to unlock
          weekly fetal development previews.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// Caller must guarantee profile.lmpDate is a valid date string — the outer
// BabyScreen switches to FetalDevelopmentEmptyState when it is not. This is
// enforced outside the component so we can run hooks unconditionally.
function FetalDevelopmentView({ profile }: { profile: PregnancyProfile }) {
  const { weeks } = getWeeksAndDays(profile.lmpDate);
  const currentWeek = Math.max(4, Math.min(40, weeks));
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const baby = useMemo(() => getBabyGrowth(selectedWeek), [selectedWeek]);

  const weekKeys = useMemo(
    () => Object.keys(babyGrowthData).map(Number).sort((a, b) => a - b),
    [],
  );

  const screenWidth = Dimensions.get('window').width;
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    const idx = weekKeys.findIndex((w) => w >= currentWeek);
    if (idx >= 0 && scrollRef.current) {
      // Center the current-week tile in the viewport. Left edge of tile is
      // at idx * TILE_STRIDE; adding TILE_WIDTH/2 gives the tile center,
      // subtracting screenWidth/2 shifts that center to the middle of the
      // visible area.
      scrollRef.current.scrollTo({
        x: Math.max(0, idx * TILE_STRIDE + TILE_WIDTH / 2 - screenWidth / 2),
        animated: false,
      });
    }
  }, [currentWeek, weekKeys, screenWidth]);

  const trimesterFocus = useMemo(() => {
    if (selectedWeek <= 13) {
      return {
        title: 'Foundations & Growth',
        advice:
          "Your focus this trimester is Folate and cell division. Baby's major organs are forming from scratch!",
        ritual: 'Ginger tea rituals for gentle digestion.',
      };
    }
    if (selectedWeek <= 26) {
      return {
        title: 'The Golden Glow',
        advice:
          "Movement begins! You'll soon feel tiny flutters. Focus on Iron and Vitamin C for energy.",
        ritual: 'Stretching rituals to support your changing center of gravity.',
      };
    }
    return {
      title: 'The Home Stretch',
      advice:
        'Baby is practicing breathing and opening their eyes. High protein is key for rapid brain growth.',
      ritual: 'Evening kick counts as a bonding ritual.',
    };
  }, [selectedWeek]);

  const sizePrefix =
    profile.pregnancyType === 'singleton'
      ? 'a'
      : profile.pregnancyType === 'twins'
        ? 'two'
        : 'three';
  const babyCount =
    profile.pregnancyType === 'twins'
      ? 2
      : profile.pregnancyType === 'triplets'
        ? 3
        : 1;
  const subtitle = selectedWeek === currentWeek ? "Today's Progress" : `Week ${selectedWeek}`;

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="items-center mb-2">
          <Text className="text-2xl font-bold text-rose-700">Fetal Development</Text>
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">
            Exploring {subtitle}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 12 }}
        >
          {weekKeys.map((w) => {
            const isSelected = selectedWeek === w;
            return (
              <TouchableOpacity
                key={w}
                onPress={() => setSelectedWeek(w)}
                className={`w-16 h-20 mr-2 rounded-2xl border-2 items-center justify-center ${
                  isSelected ? 'bg-rose-500 border-rose-400' : 'bg-white border-rose-100'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase ${
                    isSelected ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  Wk {w}
                </Text>
                <Text style={{ fontSize: 22 }}>{babyGrowthData[w].image}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Card>
          <View className="items-center mb-4">
            {babyCount === 1 ? (
              <Text style={{ fontSize: 96 }}>{baby.image}</Text>
            ) : (
              <View className="flex-row flex-wrap justify-center" style={{ gap: 12 }}>
                {Array.from({ length: babyCount }).map((_, i) => (
                  <Text key={i} style={{ fontSize: 64 }}>
                    {baby.image}
                  </Text>
                ))}
              </View>
            )}
          </View>

          <Text className="text-xl font-bold text-rose-700 text-center">
            Size of {sizePrefix} {baby.size}
          </Text>
          <Text className="text-sm italic text-gray-500 mt-2 text-center leading-relaxed">
            "{baby.description}"
          </Text>

          <View className="flex-row mt-4" style={{ gap: 12 }}>
            <View className="flex-1 bg-rose-50 rounded-2xl p-3 items-center">
              <Text className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                Length
              </Text>
              <Text className="text-sm font-bold text-gray-800 mt-1">{baby.length}</Text>
            </View>
            <View className="flex-1 bg-rose-50 rounded-2xl p-3 items-center">
              <Text className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                Weight
              </Text>
              <Text className="text-sm font-bold text-gray-800 mt-1">{baby.weight}</Text>
            </View>
          </View>

          <View className="flex-row items-center mt-4 bg-rose-50 rounded-2xl p-3">
            <Text className="text-xl mr-3">📏</Text>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                Size Comparison
              </Text>
              <Text className="text-xs font-semibold text-gray-700 mt-0.5">
                Comparable to a {baby.size}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2">
            {trimesterFocus.title}
          </Text>
          <Text className="text-xs text-gray-600 leading-relaxed mb-3">
            "{trimesterFocus.advice}"
          </Text>
          <View className="flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-2" />
            <Text className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
              Ritual: {trimesterFocus.ritual}
            </Text>
          </View>
        </Card>

        <Card>
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Milestones
          </Text>
          {baby.milestones.map((m, i) => (
            <View
              key={i}
              className="flex-row items-center bg-rose-50 rounded-2xl p-3 mb-2"
            >
              <View className="w-2 h-2 rounded-full bg-rose-400 mr-3" />
              <Text className="text-xs text-gray-700 font-medium flex-1">{m}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2">
            Mama Connection
          </Text>
          <Text className="text-xs text-gray-600 leading-relaxed">{baby.connection}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

export function BabyScreen() {
  const { profile } = useProfileStore();

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-50">
        <Text className="text-2xl font-bold text-rose-700">Growth</Text>
        <Text className="text-gray-500 mt-2">Loading...</Text>
      </View>
    );
  }

  const isPregnancy =
    profile.lifecycleStage === LifecycleStage.PREGNANCY ||
    profile.lifecycleStage === LifecycleStage.PRE_PREGNANCY;

  if (isPregnancy) {
    if (!hasValidLmpDate(profile.lmpDate)) {
      return <FetalDevelopmentEmptyState />;
    }
    return <FetalDevelopmentView profile={profile} />;
  }

  if (!profile.babies || profile.babies.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-50">
        <Text className="text-2xl font-bold text-rose-700">Growth</Text>
        <Text className="text-gray-500 mt-2">No babies added yet</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-rose-700 mb-4">Growth</Text>
        {profile.babies.map((baby) => (
          <View key={baby.id} className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Text className="text-3xl mr-3">{GENDER_EMOJI[baby.gender] ?? '👶'}</Text>
              <View>
                <Text className="text-lg font-bold text-gray-800">
                  {baby.name || 'Unnamed baby'}
                </Text>
                {baby.birthDate ? (
                  <Text className="text-sm text-gray-500 mt-0.5">
                    Age: {formatBabyAge(baby.birthDate)}
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="flex-row gap-2 mt-2">
              <View className="flex-1 bg-rose-50 rounded-xl p-3 items-center">
                <Text className="text-xs text-gray-500">Gender</Text>
                <Text className="text-sm font-semibold text-gray-700 mt-1 capitalize">
                  {baby.gender}
                </Text>
              </View>
              {baby.birthWeight ? (
                <View className="flex-1 bg-rose-50 rounded-xl p-3 items-center">
                  <Text className="text-xs text-gray-500">Birth Weight</Text>
                  <Text className="text-sm font-semibold text-gray-700 mt-1">
                    {baby.birthWeight} g
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
