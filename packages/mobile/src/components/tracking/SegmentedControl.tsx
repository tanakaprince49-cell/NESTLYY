import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-4">
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              isSelected ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                isSelected ? 'text-rose-600' : 'text-gray-500'
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
