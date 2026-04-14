import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AUTO_DISMISS_MS = 5000;

type Props = {
  message: string;
  onDismiss: () => void;
  inline?: boolean;
};

export function ErrorBanner({ message, onDismiss, inline = false }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  const containerClass = inline
    ? 'bg-rose-500 rounded-xl px-4 py-3 flex-row items-center'
    : 'absolute bottom-24 left-4 right-4 bg-rose-500 rounded-xl px-4 py-3 flex-row items-center';

  return (
    <View className={containerClass}>
      <Text className="flex-1 text-white text-sm">{message}</Text>
      <TouchableOpacity
        onPress={onDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Dismiss error"
      >
        <Ionicons name="close" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
