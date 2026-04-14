import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { Nest } from '@nestly/shared';

interface NestCardProps {
  nest: Nest;
  isJoined: boolean;
  isPending: boolean;
  onPress: () => void;
  onJoin: () => void;
  onLeave: () => void;
}

export function NestCard({ nest, isJoined, isPending, onPress, onJoin, onLeave }: NestCardProps) {
  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 mx-4"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          <Text className="text-3xl mr-3">{nest.emoji}</Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
              {nest.name}
            </Text>
            <Text className="text-xs text-rose-500 capitalize mt-0.5">
              {nest.category}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          className={`px-3 py-1.5 rounded-full ${isJoined ? 'bg-rose-100' : 'bg-rose-400'}`}
          onPress={isJoined ? onLeave : onJoin}
          disabled={isPending}
          activeOpacity={0.7}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={isJoined ? '#f43f5e' : '#fff'} />
          ) : (
            <Text className={`text-xs font-semibold ${isJoined ? 'text-rose-600' : 'text-white'}`}>
              {isJoined ? 'Leave' : 'Join'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <Text className="text-sm text-gray-500 mt-2 leading-5" numberOfLines={2}>
        {nest.description}
      </Text>
      <Text className="text-xs text-gray-400 mt-2">
        {nest.memberCount} {nest.memberCount === 1 ? 'member' : 'members'}
      </Text>
    </TouchableOpacity>
  );
}
