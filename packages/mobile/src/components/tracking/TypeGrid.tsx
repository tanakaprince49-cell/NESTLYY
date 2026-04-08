import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TypeGridOption<T extends string> {
  value: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface TypeGridProps<T extends string> {
  options: TypeGridOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  columns?: 2 | 3;
}

export function TypeGrid<T extends string>({
  options,
  selected,
  onSelect,
  columns = 3,
}: TypeGridProps<T>) {
  return (
    <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        const width = columns === 2 ? '48%' : '31%';
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={{ width }}
            className={`p-4 rounded-2xl border-2 items-center ${
              isSelected
                ? 'bg-rose-50 border-rose-400'
                : 'bg-white border-gray-100 opacity-60'
            }`}
          >
            <Ionicons
              name={opt.icon}
              size={28}
              color={isSelected ? '#f43f5e' : '#94a3b8'}
            />
            <Text
              className={`text-xs font-semibold mt-2 ${
                isSelected ? 'text-rose-600' : 'text-gray-400'
              }`}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
