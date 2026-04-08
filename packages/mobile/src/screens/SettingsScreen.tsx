import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '@nestly/shared';
import { useAuthStore } from '@nestly/shared/stores';

export function SettingsScreen() {
  const { authEmail } = useAuthStore();

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <View className="flex-1 items-center justify-center bg-rose-50">
      <Text className="text-2xl font-bold text-rose-700">Settings</Text>
      <Text className="text-text-secondary mt-2">{authEmail}</Text>
      <TouchableOpacity
        className="mt-6 rounded-xl bg-rose-400 px-6 py-3"
        onPress={handleLogout}
      >
        <Text className="text-base font-semibold text-white">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
