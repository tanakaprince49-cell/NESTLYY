import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LifecycleStage } from '@nestly/shared';
import type { BabyAvatar, PregnancyProfile } from '@nestly/shared';
import { useProfileStore } from '@nestly/shared/stores';
import { Stepper } from '../components/Stepper';
import { getDueDate, validateLmpDate } from '../utils/pregnancyCalc';

const SKIN_TONES = ['#FDDBB4', '#F1C27D', '#C68642', '#8D5524', '#4A2912'];
const TOTAL_STEPS = 8;

function makeBabyAvatar(overrides: Partial<BabyAvatar> = {}): BabyAvatar {
  return {
    id: crypto.randomUUID?.() ?? Date.now().toString(),
    name: '',
    skinTone: SKIN_TONES[0],
    gender: 'surprise',
    ...overrides,
  };
}

function getCountForType(type: 'singleton' | 'twins' | 'triplets'): number {
  if (type === 'twins') return 2;
  if (type === 'triplets') return 3;
  return 1;
}

export function SetupScreen() {
  const [step, setStep] = useState(0);
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>(LifecycleStage.PREGNANCY);
  const [userName, setUserName] = useState('');
  const [lmpMode, setLmpMode] = useState<'date' | 'week'>('date');
  const [lmpDateStr, setLmpDateStr] = useState('');
  const [weekStr, setWeekStr] = useState('');
  const [lmpError, setLmpError] = useState('');
  const [pregnancyType, setPregnancyType] = useState<'singleton' | 'twins' | 'triplets'>('singleton');
  const [babies, setBabies] = useState<BabyAvatar[]>([makeBabyAvatar()]);
  const [themeColor, setThemeColor] = useState<'pink' | 'blue' | 'orange'>('pink');
  const [weightStr, setWeightStr] = useState('');

  const isPregnancy = lifecycleStage === LifecycleStage.PREGNANCY;

  const goNext = () => {
    if (step === 2 && !isPregnancy) {
      setStep(4);
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  };

  const goBack = () => {
    if (step === 4 && !isPregnancy) {
      setStep(2);
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };

  const handleLmpContinue = () => {
    setLmpError('');
    if (lmpMode === 'date') {
      const parsed = new Date(lmpDateStr);
      if (isNaN(parsed.getTime())) {
        setLmpError('Please enter a valid date (YYYY-MM-DD)');
        return;
      }
      const err = validateLmpDate(parsed);
      if (err) {
        setLmpError(err);
        return;
      }
    } else {
      const w = parseInt(weekStr, 10);
      if (isNaN(w) || w < 1 || w > 42) {
        setLmpError('Please enter a week between 1 and 42');
        return;
      }
    }
    goNext();
  };

  const updateBabyCount = (type: 'singleton' | 'twins' | 'triplets') => {
    setPregnancyType(type);
    const count = getCountForType(type);
    setBabies((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        return [...prev, ...Array.from({ length: count - prev.length }, () => makeBabyAvatar())];
      }
      return prev.slice(0, count);
    });
  };

  const updateBaby = (index: number, updates: Partial<BabyAvatar>) => {
    setBabies((prev) => prev.map((b, i) => (i === index ? { ...b, ...updates } : b)));
  };

  const getLmpDate = (): string => {
    if (lmpMode === 'date') return lmpDateStr;
    const w = parseInt(weekStr, 10);
    const lmp = new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000);
    return lmp.toISOString().slice(0, 10);
  };

  const getCalculatedDueDate = (): string => {
    try {
      const lmp = getLmpDate();
      if (!lmp) return '';
      const due = getDueDate(lmp);
      return due.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleFinish = () => {
    const lmp = isPregnancy ? getLmpDate() : new Date().toISOString().slice(0, 10);
    const due = isPregnancy ? getDueDate(lmp).toISOString().slice(0, 10) : '';

    const profile: PregnancyProfile = {
      userName: userName || 'Friend',
      lmpDate: lmp,
      dueDate: due,
      isManualDueDate: false,
      pregnancyType,
      babies,
      themeColor,
      profileImage: undefined,
      startingWeight: weightStr ? parseFloat(weightStr) : undefined,
      customTargets: undefined,
      albums: {
        bump: [],
        baby: [],
        ultrasound: [],
        nursery: [],
        family: [],
        other: [],
      },
      lifecycleStage,
      privacyAccepted: true,
    };

    useProfileStore.getState().setProfile(profile);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-4xl font-bold text-rose-700 text-center mb-3">
              Welcome to Nestly
            </Text>
            <Text className="text-base text-gray-500 text-center leading-6">
              Your pregnancy and baby companion. Let us get your nest set up.
            </Text>
          </View>
        );

      case 1:
        return (
          <View className="px-6">
            <Text className="text-xl font-bold text-gray-800 text-center mb-6">
              What brings you here?
            </Text>
            <TouchableOpacity
              className={`bg-white rounded-2xl p-5 mb-4 border-2 shadow-sm ${
                lifecycleStage === LifecycleStage.PREGNANCY
                  ? 'border-rose-400'
                  : 'border-transparent'
              }`}
              onPress={() => setLifecycleStage(LifecycleStage.PREGNANCY)}
            >
              <Text className="text-2xl mb-2">🤰</Text>
              <Text className="text-lg font-semibold text-gray-800">I'm Pregnant</Text>
              <Text className="text-sm text-gray-500 mt-1">Track your pregnancy journey</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`bg-white rounded-2xl p-5 border-2 shadow-sm ${
                lifecycleStage === LifecycleStage.NEWBORN
                  ? 'border-rose-400'
                  : 'border-transparent'
              }`}
              onPress={() => setLifecycleStage(LifecycleStage.NEWBORN)}
            >
              <Text className="text-2xl mb-2">👶</Text>
              <Text className="text-lg font-semibold text-gray-800">I Have a Baby</Text>
              <Text className="text-sm text-gray-500 mt-1">Track feeding, sleep, and growth</Text>
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View className="px-6">
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              What should we call you?
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-6">Your first name is fine</Text>
            <TextInput
              className="bg-white rounded-2xl py-4 px-4 text-base border border-gray-200 text-center text-lg"
              placeholder="Your name"
              placeholderTextColor="#94a3b8"
              value={userName}
              onChangeText={setUserName}
              autoFocus
            />
          </View>
        );

      case 3:
        return (
          <View className="px-6">
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              How far along are you?
            </Text>
            <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg items-center ${
                  lmpMode === 'date' ? 'bg-white shadow-sm' : ''
                }`}
                onPress={() => setLmpMode('date')}
              >
                <Text className={`text-sm font-medium ${lmpMode === 'date' ? 'text-rose-700' : 'text-gray-500'}`}>
                  I know my last period date
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg items-center ${
                  lmpMode === 'week' ? 'bg-white shadow-sm' : ''
                }`}
                onPress={() => setLmpMode('week')}
              >
                <Text className={`text-sm font-medium ${lmpMode === 'week' ? 'text-rose-700' : 'text-gray-500'}`}>
                  I know my current week
                </Text>
              </TouchableOpacity>
            </View>

            {lmpMode === 'date' ? (
              <TextInput
                className="bg-white rounded-2xl py-4 px-4 text-base border border-gray-200 mb-3"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={lmpDateStr}
                onChangeText={setLmpDateStr}
                keyboardType="numeric"
              />
            ) : (
              <TextInput
                className="bg-white rounded-2xl py-4 px-4 text-base border border-gray-200 mb-3"
                placeholder="Week number (1-42)"
                placeholderTextColor="#94a3b8"
                value={weekStr}
                onChangeText={setWeekStr}
                keyboardType="numeric"
              />
            )}

            {lmpError ? (
              <Text className="text-red-500 text-sm mb-3">{lmpError}</Text>
            ) : null}

            {getCalculatedDueDate() ? (
              <View className="bg-rose-50 rounded-xl p-3 items-center">
                <Text className="text-xs text-gray-500">Estimated due date</Text>
                <Text className="text-base font-semibold text-rose-700 mt-1">
                  {getCalculatedDueDate()}
                </Text>
              </View>
            ) : null}
          </View>
        );

      case 4:
        return (
          <ScrollView className="px-6">
            <Text className="text-xl font-bold text-gray-800 text-center mb-4">
              How many babies?
            </Text>
            <View className="flex-row justify-center gap-3 mb-6">
              {(['singleton', 'twins', 'triplets'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`px-5 py-3 rounded-xl border-2 ${
                    pregnancyType === type
                      ? 'bg-rose-400 border-rose-400'
                      : 'bg-white border-gray-200'
                  }`}
                  onPress={() => updateBabyCount(type)}
                >
                  <Text
                    className={`font-semibold ${
                      pregnancyType === type ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {type === 'singleton' ? '1' : type === 'twins' ? '2' : '3'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {babies.map((baby, index) => (
              <View key={baby.id} className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <Text className="text-base font-semibold text-gray-700 mb-3">
                  Baby {index + 1}
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl py-3 px-4 text-base border border-gray-200 mb-3"
                  placeholder={`Baby ${index + 1} name`}
                  placeholderTextColor="#94a3b8"
                  value={baby.name}
                  onChangeText={(v) => updateBaby(index, { name: v })}
                />
                <Text className="text-sm text-gray-500 mb-2">Gender</Text>
                <View className="flex-row gap-2 mb-3">
                  {(['boy', 'girl', 'surprise'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      className={`flex-1 py-2 rounded-xl border-2 items-center ${
                        baby.gender === g
                          ? 'bg-rose-400 border-rose-400'
                          : 'bg-white border-gray-200'
                      }`}
                      onPress={() => updateBaby(index, { gender: g })}
                    >
                      <Text
                        className={`text-sm font-medium capitalize ${
                          baby.gender === g ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="text-sm text-gray-500 mb-2">Skin tone</Text>
                <View className="flex-row gap-2">
                  {SKIN_TONES.map((tone) => (
                    <TouchableOpacity
                      key={tone}
                      className={`h-8 w-8 rounded-full border-2 ${
                        baby.skinTone === tone ? 'border-rose-400' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: tone }}
                      onPress={() => updateBaby(index, { skinTone: tone })}
                    />
                  ))}
                </View>
                {!isPregnancy && (
                  <View className="mt-3">
                    <Text className="text-sm text-gray-500 mb-2">Birth date (YYYY-MM-DD)</Text>
                    <TextInput
                      className="bg-gray-50 rounded-xl py-3 px-4 text-base border border-gray-200"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={baby.birthDate ?? ''}
                      onChangeText={(v) => updateBaby(index, { birthDate: v })}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        );

      case 5:
        return (
          <View className="px-6">
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              Choose your theme
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-8">Pick a color for your nest</Text>
            <View className="flex-row justify-center gap-6">
              {(
                [
                  { color: 'pink', hex: '#f43f5e' },
                  { color: 'blue', hex: '#3b82f6' },
                  { color: 'orange', hex: '#f97316' },
                ] as { color: 'pink' | 'blue' | 'orange'; hex: string }[]
              ).map(({ color, hex }) => (
                <TouchableOpacity
                  key={color}
                  className={`h-16 w-16 rounded-full border-4 items-center justify-center ${
                    themeColor === color ? 'border-gray-800' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: hex }}
                  onPress={() => setThemeColor(color)}
                >
                  {themeColor === color ? (
                    <Text className="text-white font-bold text-lg">✓</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 6:
        return (
          <View className="px-6">
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              Your starting weight
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-6">
              Optional - helps track healthy weight gain
            </Text>
            <View className="flex-row items-center bg-white rounded-2xl border border-gray-200 px-4">
              <TextInput
                className="flex-1 py-4 text-2xl text-center font-semibold text-gray-800"
                placeholder="0.0"
                placeholderTextColor="#94a3b8"
                value={weightStr}
                onChangeText={setWeightStr}
                keyboardType="numeric"
              />
              <Text className="text-lg text-gray-500 ml-2">kg</Text>
            </View>
          </View>
        );

      case 7:
        return (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-5xl mb-4">🪺</Text>
            <Text className="text-2xl font-bold text-rose-700 text-center mb-3">
              You're all set!
            </Text>
            <Text className="text-base text-gray-500 text-center leading-6">
              {userName ? `Welcome, ${userName}!` : 'Welcome!'} Your nest is ready.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    if (step === 2 && !userName.trim()) return false;
    return true;
  };

  const handleContinue = () => {
    if (step === 3) {
      handleLmpContinue();
      return;
    }
    if (step === 7) {
      handleFinish();
      return;
    }
    if (!isStepValid()) return;
    goNext();
  };

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Stepper totalSteps={TOTAL_STEPS} currentStep={step} />

        <View className="flex-1 justify-center">{renderStep()}</View>

        <View className="px-6 pb-6 flex-row gap-3">
          {step > 0 ? (
            <TouchableOpacity
              className="flex-1 py-4 rounded-2xl border-2 border-rose-400 items-center"
              onPress={goBack}
            >
              <Text className="text-rose-400 font-semibold text-base">Back</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            className={`flex-1 py-4 rounded-2xl items-center ${
              isStepValid() ? 'bg-rose-400' : 'bg-gray-200'
            }`}
            onPress={handleContinue}
            disabled={!isStepValid()}
          >
            <Text
              className={`font-semibold text-base ${
                isStepValid() ? 'text-white' : 'text-gray-400'
              }`}
            >
              {step === 7 ? 'Enter My Nest' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
