import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import type { BabyAvatar } from '@nestly/shared';

interface BabySelectorProps {
  babies: BabyAvatar[];
  selectedBabyId: string;
  onSelect: (babyId: string) => void;
}

export function BabySelector({ babies, selectedBabyId, onSelect }: BabySelectorProps) {
  if (babies.length <= 1) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      {babies.map((baby, idx) => {
        const selected = baby.id === selectedBabyId;
        return (
          <TouchableOpacity
            key={baby.id}
            onPress={() => onSelect(baby.id)}
            className={`px-4 py-2 rounded-xl mr-2 border ${
              selected
                ? 'bg-rose-400 border-rose-400'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                selected ? 'text-white' : 'text-gray-500'
              }`}
            >
              {baby.name || `Baby ${idx + 1}`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
