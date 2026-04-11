import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  uri?: string;
  name: string;
  size: number;
  showEditBadge?: boolean;
  onPress?: () => void;
}

// Shared presentational avatar used by SettingsScreen (96px, tappable with
// edit badge) and DashboardScreen (48px, non-interactive). Falls back to the
// first letter of the user's name on a rose background when no image is set.
export function Avatar({ uri, name, size, showEditBadge, onPress }: AvatarProps) {
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  const radius = size / 2;

  const content = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: '#fda4af',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={{
            color: '#ffffff',
            fontSize: Math.round(size * 0.45),
            fontWeight: '700',
          }}
        >
          {initial}
        </Text>
      )}
    </View>
  );

  const badge = showEditBadge ? (
    <View
      style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: Math.round(size * 0.3),
        height: Math.round(size * 0.3),
        borderRadius: Math.round(size * 0.15),
        backgroundColor: '#f43f5e',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
      }}
    >
      <Ionicons name="camera" size={Math.round(size * 0.16)} color="#ffffff" />
    </View>
  ) : null;

  const wrapperStyle = { width: size, height: size };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={wrapperStyle}>
        {content}
        {badge}
      </TouchableOpacity>
    );
  }

  return (
    <View style={wrapperStyle}>
      {content}
      {badge}
    </View>
  );
}
