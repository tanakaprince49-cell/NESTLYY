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
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LifecycleStage, ExportValidationError, LEGAL_PRIVACY_URL, LEGAL_TERMS_URL } from '@nestly/shared';
import type { BabyAvatar, ZeroDataExportV1 } from '@nestly/shared';
import { useProfileStore, useTrackingStore, useHealthConnectStore } from '@nestly/shared/stores';
import { Avatar } from '../components/Avatar';
import { HealthConnectSection } from '../components/settings/HealthConnectSection';
import { YourDataModals, DataBusyState } from '../components/settings/YourDataModals';
import { requestNotificationPermissions, cancelAllScheduled } from '../services/notificationService';
import {
  APP_VERSION,
  buildMobileExport,
  saveExportAndShare,
  pickAndLoadExport,
  restoreMobileExport,
  wipeAllMobileData,
  shareDoctorSummaryPdf,
} from '../services/exportService';

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
  const [dataBusy, setDataBusy] = useState<DataBusyState>('idle');
  const [importPreview, setImportPreview] = useState<{ data: ZeroDataExportV1; fileDate: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
    } else {
      useProfileStore.getState().updateProfile({ notificationsEnabled: false });
      cancelAllScheduled();
    }
  }, []);

  const handleExportJson = useCallback(async () => {
    if (dataBusy !== 'idle') return;
    setDataBusy('exporting');
    try {
      const data = buildMobileExport();
      await saveExportAndShare(data);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setDataBusy('idle');
    }
  }, [dataBusy]);

  const handleExportPdf = useCallback(async () => {
    if (dataBusy !== 'idle') return;
    // profile is guaranteed non-null by the early return above, but keep the
    // guard: if a future refactor moves the dataBusy handlers above the guard,
    // the PDF needs a profile to render anything meaningful.
    if (!profile) return;
    const t = useTrackingStore.getState();
    const hasSomeData =
      t.symptoms.length > 0 ||
      t.weightLogs.length > 0 ||
      t.bloodPressureLogs.length > 0 ||
      t.sleepLogs.length > 0 ||
      t.kickLogs.length > 0 ||
      t.feedingLogs.length > 0 ||
      t.diaperLogs.length > 0 ||
      t.medicationLogs.length > 0 ||
      t.entries.length > 0;
    if (!hasSomeData) {
      Alert.alert(
        'Nothing to summarise yet',
        'Log at least one reading (weight, feeding, kicks, or a symptom) so there is something for your midwife or doctor to read.',
      );
      return;
    }
    setDataBusy('pdf');
    try {
      await shareDoctorSummaryPdf();
    } catch (e) {
      Alert.alert('Could not generate PDF', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setDataBusy('idle');
    }
  }, [dataBusy, profile]);

  const handleImport = useCallback(async () => {
    if (dataBusy !== 'idle') return;
    setDataBusy('importing');
    try {
      const data = await pickAndLoadExport();
      if (!data) return;
      const fileDate = new Date(data.meta.exportedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      setImportPreview({ data, fileDate });
    } catch (e) {
      if (e instanceof ExportValidationError) {
        setImportError(e.message);
      } else {
        setImportError(e instanceof Error ? e.message : 'Unknown error');
      }
    } finally {
      setDataBusy('idle');
    }
  }, [dataBusy]);

  const confirmImport = useCallback(() => {
    if (!importPreview) return;
    if (dataBusy !== 'idle') return;
    setDataBusy('importing');
    try {
      restoreMobileExport(importPreview.data);
      setImportPreview(null);
      Alert.alert(
        'Restored',
        'Your data has been replaced with the contents of the backup.',
      );
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setDataBusy('idle');
    }
  }, [importPreview, dataBusy]);

  const openDelete = useCallback(() => {
    setDeleteConfirmText('');
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
    if (dataBusy !== 'idle') return;
    setDataBusy('wiping');
    try {
      await wipeAllMobileData();
      useHealthConnectStore.getState().resetSyncState();
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setDataBusy('idle');
    }
  }, [deleteConfirmText, dataBusy]);

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

        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-1">Your Data</Text>
          <Text className="text-xs text-gray-400 mb-3">
            Everything stays on this phone. Export a backup, bring a summary to your appointment, or move your data to another phone.
          </Text>

          <TouchableOpacity
            onPress={handleExportJson}
            disabled={dataBusy !== 'idle'}
            className="flex-row items-center justify-between py-3"
            style={{ opacity: dataBusy !== 'idle' && dataBusy !== 'exporting' ? 0.5 : 1 }}
          >
            <View className="flex-row items-center" style={{ gap: 12, flex: 1 }}>
              <Ionicons name="download-outline" size={22} color="#f43f5e" />
              <View style={{ flex: 1 }}>
                <Text className="text-sm font-semibold text-gray-800">Back up my data</Text>
                <Text className="text-xs text-gray-400">Saves a file you can keep in Drive, WhatsApp, or another phone.</Text>
              </View>
            </View>
            {dataBusy === 'exporting' ? (
              <ActivityIndicator color="#f43f5e" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportPdf}
            disabled={dataBusy !== 'idle'}
            className="flex-row items-center justify-between py-3"
            style={{ opacity: dataBusy !== 'idle' && dataBusy !== 'pdf' ? 0.5 : 1 }}
          >
            <View className="flex-row items-center" style={{ gap: 12, flex: 1 }}>
              <Ionicons name="document-text-outline" size={22} color="#f43f5e" />
              <View style={{ flex: 1 }}>
                <Text className="text-sm font-semibold text-gray-800">Doctor summary (PDF)</Text>
                <Text className="text-xs text-gray-400">Last 14 days for your midwife or doctor.</Text>
              </View>
            </View>
            {dataBusy === 'pdf' ? (
              <ActivityIndicator color="#f43f5e" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleImport}
            disabled={dataBusy !== 'idle'}
            className="flex-row items-center justify-between py-3"
            style={{ opacity: dataBusy !== 'idle' && dataBusy !== 'importing' ? 0.5 : 1 }}
          >
            <View className="flex-row items-center" style={{ gap: 12, flex: 1 }}>
              <Ionicons name="cloud-upload-outline" size={22} color="#f43f5e" />
              <View style={{ flex: 1 }}>
                <Text className="text-sm font-semibold text-gray-800">Restore from a backup</Text>
                <Text className="text-xs text-gray-400">Pick a backup file to replace everything on this phone.</Text>
              </View>
            </View>
            {dataBusy === 'importing' ? (
              <ActivityIndicator color="#f43f5e" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openDelete}
            disabled={dataBusy !== 'idle'}
            className="flex-row items-center justify-between py-3 mt-2 pt-4 border-t border-rose-100"
            style={{ opacity: dataBusy !== 'idle' ? 0.5 : 1 }}
          >
            <View className="flex-row items-center" style={{ gap: 12, flex: 1 }}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <View style={{ flex: 1 }}>
                <Text className="text-sm font-semibold text-red-500">Delete all data</Text>
                <Text className="text-xs text-gray-400">Erases every entry from this phone.</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>

          <Text className="text-xs text-gray-300 mt-4 text-center">Nestly v{APP_VERSION}</Text>
        </View>

        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-1">Legal</Text>
          <Text className="text-xs text-gray-400 mb-3">
            Nestly does not collect, store, or transmit your tracking data. The full text:
          </Text>

          <TouchableOpacity
            onPress={() => Linking.openURL(LEGAL_PRIVACY_URL)}
            className="flex-row items-center justify-between py-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center" style={{ gap: 12, flex: 1 }}>
              <Ionicons name="document-text-outline" size={22} color="#f43f5e" />
              <View style={{ flex: 1 }}>
                <Text className="text-sm font-semibold text-gray-800">Privacy Policy</Text>
                <Text className="text-xs text-gray-400">Opens in your browser.</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={18} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL(LEGAL_TERMS_URL)}
            className="flex-row items-center justify-between py-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center" style={{ gap: 12, flex: 1 }}>
              <Ionicons name="reader-outline" size={22} color="#f43f5e" />
              <View style={{ flex: 1 }}>
                <Text className="text-sm font-semibold text-gray-800">Terms of Service</Text>
                <Text className="text-xs text-gray-400">Opens in your browser.</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <YourDataModals
        importError={importError}
        importPreview={importPreview}
        showDeleteConfirm={showDeleteConfirm}
        dataBusy={dataBusy}
        deleteConfirmText={deleteConfirmText}
        onDeleteConfirmTextChange={setDeleteConfirmText}
        onDismissError={() => setImportError(null)}
        onConfirmImport={confirmImport}
        onCancelImport={() => setImportPreview(null)}
        onConfirmDelete={confirmDelete}
        onCancelDelete={() => {
          if (dataBusy === 'idle') {
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
          }
        }}
      />
    </SafeAreaView>
  );
}
