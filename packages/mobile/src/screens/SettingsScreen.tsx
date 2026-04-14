import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '@nestly/shared';
import { LifecycleStage } from '@nestly/shared';
import type { BabyAvatar } from '@nestly/shared';
import { useAuthStore, useAvaChatStore, useProfileStore, useTrackingStore, useHealthConnectStore } from '@nestly/shared/stores';
import { Avatar } from '../components/Avatar';
import { HealthConnectSection } from '../components/settings/HealthConnectSection';
import { requestNotificationPermissions, registerPushToken, cancelAllScheduled } from '../services/notificationService';
import { clearUserStores } from '../stores/bootstrap';

const GENDER_EMOJI: Record<string, string> = {
  boy: '👦',
  girl: '👧',
  surprise: '🎁',
  neutral: '👶',
};

function makeBaby(): BabyAvatar {
  return {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID?.()) || Date.now().toString(),
    name: '',
    skinTone: '#FDDBB4',
    gender: 'surprise',
  };
}

export function SettingsScreen() {
  const { profile } = useProfileStore();
  const [editedName, setEditedName] = useState(profile?.userName ?? '');
  const [newBabyName, setNewBabyName] = useState('');
  const [showAddBaby, setShowAddBaby] = useState(false);

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-50">
        <Text className="text-gray-500">No profile found</Text>
      </View>
    );
  }

  const handleSaveName = () => {
    if (editedName.trim()) {
      useProfileStore.getState().updateProfile({ userName: editedName.trim() });
    }
  };

  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photos Access Needed',
        'Enable photo library access in your device settings to set a profile picture.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;
    const asset = result.assets[0];
    // Fall back to image/jpeg when expo-image-picker does not report a
    // mimeType (mostly on older Android), but prefer the reported one so a
    // picked PNG is not mislabeled as JPEG in the stored dataURL. Web surfaces
    // that validate the prefix (e.g. canvas.toDataURL consumers) reject the
    // image otherwise. See #238.
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${asset.base64}`;
    useProfileStore.getState().updateProfile({ profileImage: dataUrl });
  };

  const handleTheme = (color: 'pink' | 'blue' | 'orange') => {
    useProfileStore.getState().updateProfile({ themeColor: color });
  };

  const handleLifecycle = (stage: LifecycleStage) => {
    useProfileStore.getState().updateProfile({ lifecycleStage: stage });
  };

  const handleRemoveBaby = (id: string) => {
    Alert.alert('Remove Baby', 'Are you sure you want to remove this baby?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = profile.babies.filter((b) => b.id !== id);
          useProfileStore.getState().updateProfile({ babies: updated });
        },
      },
    ]);
  };

  const handleAddBaby = () => {
    const baby = makeBaby();
    baby.name = newBabyName.trim() || 'Baby';
    useProfileStore.getState().updateProfile({ babies: [...profile.babies, baby] });
    setNewBabyName('');
    setShowAddBaby(false);
  };

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications Blocked',
          'Enable notifications in your device settings to receive reminders.',
        );
        return;
      }
      useProfileStore.getState().updateProfile({ notificationsEnabled: true });
      registerPushToken();
    } else {
      useProfileStore.getState().updateProfile({ notificationsEnabled: false });
      cancelAllScheduled();
    }
  }, []);

  // Reset every in-memory Zustand slice that clearUserStores does not touch.
  // clearUserStores wipes AsyncStorage buckets, but the living stores still
  // hold the previous session's data until a fresh rehydrate runs. Without
  // these calls, a new account signing in on the same device would briefly
  // see the prior user's tracking logs and Ava chat history.
  //
  // Health Connect is deliberately NOT in USER_SCOPED_PERSISTED_STORES because
  // its device-level fields (isAvailable, isConnected, permissions) reflect
  // system permissions shared across accounts. But its sync metadata
  // (lastSyncTimestamp, syncError, isSyncing) IS per-user — without the
  // resetSyncState() call, user B would inherit user A's 5-minute throttle
  // window and see a stale syncError from user A's last sync. See #251.
  const resetAllUserStateInMemory = () => {
    useAuthStore.getState().logout();
    useProfileStore.getState().setProfile(null);
    useTrackingStore.getState().resetAllLogs();
    useAvaChatStore.getState().clearMessages();
    useHealthConnectStore.getState().resetSyncState();
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          // Clear persisted user-scoped stores before signing out so the next
          // account signing in on this device cannot inherit stale data.
          await clearUserStores();
          await GoogleSignin.signOut().catch(() => {});
          await signOut(auth);
          resetAllUserStateInMemory();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await clearUserStores();
            await GoogleSignin.signOut().catch(() => {});
            await signOut(auth);
            resetAllUserStateInMemory();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-rose-700 mb-6">Settings</Text>

        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Profile</Text>
          <View className="items-center mb-4">
            <Avatar
              uri={profile.profileImage}
              name={profile.userName ?? ''}
              size={96}
              showEditBadge
              onPress={handlePickAvatar}
            />
            <Text className="text-xs text-gray-400 mt-2">Tap to change photo</Text>
          </View>
          <TextInput
            className="bg-gray-50 rounded-xl py-3 px-4 text-base border border-gray-200 mb-3"
            placeholder="Your name"
            placeholderTextColor="#94a3b8"
            value={editedName}
            onChangeText={setEditedName}
          />
          <TouchableOpacity
            className="bg-rose-400 rounded-xl py-3 items-center"
            onPress={handleSaveName}
          >
            <Text className="text-white font-semibold">Save Name</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">My Babies</Text>
          <FlatList
            data={profile.babies}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Text className="text-xl mr-2">{GENDER_EMOJI[item.gender] ?? '👶'}</Text>
                  <Text className="text-base text-gray-800">{item.name || 'Unnamed baby'}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveBaby(item.id)}>
                  <Text className="text-red-400 text-sm">Remove</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text className="text-gray-400 text-sm text-center py-2">No babies added yet</Text>
            }
          />

          {showAddBaby ? (
            <View className="mt-3">
              <TextInput
                className="bg-gray-50 rounded-xl py-3 px-4 text-base border border-gray-200 mb-2"
                placeholder="Baby's name"
                placeholderTextColor="#94a3b8"
                value={newBabyName}
                onChangeText={setNewBabyName}
              />
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 border border-gray-300 rounded-xl py-2 items-center"
                  onPress={() => { setShowAddBaby(false); setNewBabyName(''); }}
                >
                  <Text className="text-gray-500">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-rose-400 rounded-xl py-2 items-center"
                  onPress={handleAddBaby}
                >
                  <Text className="text-white font-semibold">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              className="mt-3 border-2 border-dashed border-rose-200 rounded-xl py-3 items-center"
              onPress={() => setShowAddBaby(true)}
            >
              <Text className="text-rose-400 font-medium">+ Add Baby</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Theme</Text>
          <View className="flex-row gap-4">
            {(
              [
                { color: 'pink', hex: '#f43f5e' },
                { color: 'blue', hex: '#3b82f6' },
                { color: 'orange', hex: '#f97316' },
              ] as { color: 'pink' | 'blue' | 'orange'; hex: string }[]
            ).map(({ color, hex }) => (
              <TouchableOpacity
                key={color}
                className={`h-12 w-12 rounded-full border-4 items-center justify-center ${
                  profile.themeColor === color ? 'border-gray-800' : 'border-transparent'
                }`}
                style={{ backgroundColor: hex }}
                onPress={() => handleTheme(color)}
              >
                {profile.themeColor === color ? (
                  <Text className="text-white font-bold">✓</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Journey Mode</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl border-2 items-center ${
                profile.lifecycleStage === LifecycleStage.PREGNANCY
                  ? 'bg-rose-400 border-rose-400'
                  : 'bg-white border-gray-200'
              }`}
              onPress={() => handleLifecycle(LifecycleStage.PREGNANCY)}
            >
              <Text
                className={`font-semibold ${
                  profile.lifecycleStage === LifecycleStage.PREGNANCY
                    ? 'text-white'
                    : 'text-gray-600'
                }`}
              >
                Pregnancy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl border-2 items-center ${
                profile.lifecycleStage === LifecycleStage.NEWBORN
                  ? 'bg-rose-400 border-rose-400'
                  : 'bg-white border-gray-200'
              }`}
              onPress={() => handleLifecycle(LifecycleStage.NEWBORN)}
            >
              <Text
                className={`font-semibold ${
                  profile.lifecycleStage === LifecycleStage.NEWBORN
                    ? 'text-white'
                    : 'text-gray-600'
                }`}
              >
                Newborn
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Ionicons name="notifications-outline" size={20} color="#f43f5e" />
              <Text className="text-base font-semibold text-gray-800">Notifications</Text>
            </View>
            <Switch
              value={profile.notificationsEnabled ?? false}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#e2e8f0', true: '#fda4af' }}
              thumbColor={profile.notificationsEnabled ? '#f43f5e' : '#94a3b8'}
            />
          </View>
          <Text className="text-xs text-gray-400 mt-2">
            Daily reminders, vitamin alerts, feeding schedules, and appointment notifications.
          </Text>
        </View>

        <HealthConnectSection />

        <TouchableOpacity
          className="bg-rose-400 rounded-2xl py-4 items-center mb-3"
          onPress={handleSignOut}
        >
          <Text className="text-white font-semibold text-base">Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-4 items-center"
          onPress={handleDeleteAccount}
        >
          <Text className="text-red-500 text-sm">Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
