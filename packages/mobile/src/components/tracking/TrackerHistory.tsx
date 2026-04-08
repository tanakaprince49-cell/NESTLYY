import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TrackerHistoryItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

interface TrackerHistoryProps {
  items: TrackerHistoryItem[];
  emptyMessage?: string;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  if (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  ) {
    return 'Today';
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function TrackerHistory({ items, emptyMessage = 'No entries yet' }: TrackerHistoryProps) {
  const sorted = [...items]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  if (sorted.length === 0) {
    return (
      <View className="py-8 items-center">
        <Text className="text-gray-400 text-sm">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sorted}
      scrollEnabled={false}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="bg-white rounded-2xl p-4 mb-2 flex-row items-center">
          {item.icon && (
            <View className="mr-3">
              <Ionicons name={item.icon} size={20} color={item.iconColor || '#f43f5e'} />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-700">{item.title}</Text>
            {item.subtitle ? (
              <Text className="text-xs text-gray-400 mt-0.5">{item.subtitle}</Text>
            ) : null}
          </View>
          <View className="items-end">
            <Text className="text-xs font-medium text-gray-400">{formatTime(item.timestamp)}</Text>
            <Text className="text-xs text-gray-300">{formatDate(item.timestamp)}</Text>
          </View>
        </View>
      )}
    />
  );
}
