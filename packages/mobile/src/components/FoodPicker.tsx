import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodEntry, searchNutrition, NutritionFood } from '@nestly/shared';

// Mobile port of packages/web/src/components/FoodPicker.tsx (#374, parity with web #322 / #334).
// First cut skips recent-picks persistence and motion transitions — see #374
// follow-ups for those.

interface FoodPickerProps {
  onAddEntry: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void;
}

type LoggedSummary = {
  name: string;
  calories: number;
  protein: number;
  explanation?: string;
};

const MAX_CUSTOM_NAME = 60;
const MAX_CUSTOM_CALORIES = 5000;
const SUCCESS_TIMEOUT_MS = 3000;

export function FoodPicker({ onAddEntry }: FoodPickerProps) {
  const [query, setQuery] = useState('');
  const [loggedFood, setLoggedFood] = useState<LoggedSummary | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customKcal, setCustomKcal] = useState('');
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (successTimer.current) clearTimeout(successTimer.current);
  }, []);

  const matches = useMemo(() => searchNutrition(query, 8), [query]);
  const trimmedQuery = query.trim();
  const showCustomEntry = trimmedQuery.length > 0 && matches.length === 0;

  // Seed the custom name from the query when the fallback form opens, so the
  // user does not retype. Track the query we seeded from so we only overwrite
  // when the query changes, not on every keystroke inside the custom name field.
  const lastSeededQuery = useRef<string>('');
  useEffect(() => {
    if (showCustomEntry && trimmedQuery !== lastSeededQuery.current) {
      setCustomName(trimmedQuery.slice(0, MAX_CUSTOM_NAME));
      lastSeededQuery.current = trimmedQuery;
    }
    if (!showCustomEntry) {
      lastSeededQuery.current = '';
    }
  }, [showCustomEntry, trimmedQuery]);

  const flashSuccess = (summary: LoggedSummary) => {
    setLoggedFood(summary);
    setShowSuccess(true);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setShowSuccess(false), SUCCESS_TIMEOUT_MS);
  };

  const handlePick = (food: NutritionFood) => {
    onAddEntry({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      folate: food.folate,
      iron: food.iron,
      calcium: food.calcium,
    });
    flashSuccess({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      explanation: food.explanation,
    });
    setQuery('');
  };

  const handleCustomSubmit = () => {
    const name = customName.trim().slice(0, MAX_CUSTOM_NAME);
    const kcal = Math.max(0, Math.min(MAX_CUSTOM_CALORIES, Math.round(Number(customKcal) || 0)));
    if (!name || kcal <= 0) return;

    onAddEntry({ name, calories: kcal, protein: 0, folate: 0, iron: 0, calcium: 0 });
    flashSuccess({
      name,
      calories: kcal,
      protein: 0,
      explanation: 'Custom entry — macro values other than kcal left blank.',
    });
    setCustomName('');
    setCustomKcal('');
    setQuery('');
  };

  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm">
      <View className="flex-row items-center mb-3" style={{ gap: 10 }}>
        <View className="bg-rose-100 p-2 rounded-lg">
          <Ionicons name="search-outline" size={18} color="#e11d48" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-800">Log a meal</Text>
          <Text className="text-xs text-rose-500 uppercase tracking-wide">
            Search foods you ate today
          </Text>
        </View>
      </View>

      <TextInput
        className="bg-gray-50 rounded-xl py-3 px-4 text-sm text-gray-700 mb-3"
        placeholder="Search sadza, nyemba, rape, eggs..."
        placeholderTextColor="#94a3b8"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {trimmedQuery && matches.length > 0 ? (
        <ScrollView
          className="mb-3"
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 360 }}
        >
          {matches.map((food) => (
            <TouchableOpacity
              key={food.id}
              onPress={() => handlePick(food)}
              activeOpacity={0.7}
              className="bg-gray-50 rounded-xl p-3 mb-2"
            >
              <View className="flex-row justify-between items-start" style={{ gap: 8 }}>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>
                    {food.name}
                  </Text>
                  {food.explanation ? (
                    <Text className="text-[11px] text-gray-500 italic mt-0.5" numberOfLines={2}>
                      {food.explanation}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-xs font-bold text-rose-600 uppercase">
                  {food.calories} kcal
                </Text>
              </View>
              <View className="flex-row mt-2" style={{ gap: 10, flexWrap: 'wrap' }}>
                <Text className="text-[11px] font-semibold text-gray-500">
                  {food.protein}g protein
                </Text>
                <Text className="text-[11px] font-semibold text-gray-500">
                  {food.folate}mcg folate
                </Text>
                <Text className="text-[11px] font-semibold text-gray-500">
                  {food.iron}mg iron
                </Text>
                <Text className="text-[11px] font-semibold text-gray-500">
                  {food.calcium}mg calcium
                </Text>
                <Text className="text-[11px] text-gray-400 italic">{food.serving}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {showCustomEntry ? (
        <View className="bg-gray-50 rounded-xl p-4 mb-3">
          <Text className="text-xs text-gray-500 italic mb-3">
            No food matched "{trimmedQuery}". Log it as a custom entry below. We save the name
            and kcal only; protein, folate, iron and calcium stay blank.
          </Text>
          <TextInput
            className="bg-white rounded-lg py-2 px-3 text-sm text-gray-700 mb-2 border border-gray-200"
            placeholder="Food name"
            placeholderTextColor="#94a3b8"
            value={customName}
            onChangeText={(v) => setCustomName(v.slice(0, MAX_CUSTOM_NAME))}
            maxLength={MAX_CUSTOM_NAME}
          />
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Text className="text-[10px] font-bold text-gray-400 uppercase w-10">kcal</Text>
            <TextInput
              className="flex-1 bg-white rounded-lg py-2 px-3 text-sm text-gray-700 border border-gray-200"
              placeholder="~200"
              placeholderTextColor="#94a3b8"
              value={customKcal}
              onChangeText={setCustomKcal}
              keyboardType="numeric"
            />
            <TouchableOpacity
              onPress={handleCustomSubmit}
              disabled={!customName.trim() || !(Number(customKcal) > 0)}
              activeOpacity={0.7}
              className={`px-4 py-2 rounded-lg ${
                !customName.trim() || !(Number(customKcal) > 0) ? 'bg-rose-300' : 'bg-rose-600'
              }`}
            >
              <Text className="text-white text-xs font-bold">Log it</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {showSuccess && loggedFood ? (
        <View className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-3">
          <View className="flex-row items-start" style={{ gap: 10 }}>
            <View className="bg-rose-500 rounded-full p-1 mt-0.5">
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-rose-900">
                Logged {loggedFood.name}!
              </Text>
              {loggedFood.explanation ? (
                <Text className="text-xs text-rose-700 italic mt-1 leading-5">
                  {loggedFood.explanation}
                </Text>
              ) : null}
              <View className="flex-row mt-2" style={{ gap: 12 }}>
                <Text className="text-[10px] font-bold text-rose-600 uppercase">
                  {loggedFood.calories} kcal
                </Text>
                {loggedFood.protein > 0 ? (
                  <Text className="text-[10px] font-bold text-rose-600 uppercase">
                    {loggedFood.protein}g protein
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      ) : null}

      <View className="flex-row items-center" style={{ gap: 6 }}>
        <Ionicons name="information-circle-outline" size={12} color="#94a3b8" />
        <Text className="text-[10px] text-gray-400 italic flex-1">
          Values are WHO averages per serving. Nothing you log leaves this phone.
        </Text>
      </View>
    </View>
  );
}
