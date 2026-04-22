import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ZeroDataExportV1 } from '@nestly/shared';

// The three Settings "Your Data" confirmation modals broken out of
// SettingsScreen. State stays on the parent (busy flag, error string,
// preview object, typed-DELETE text) — the component is presentation-
// only and receives every callback it needs.

export type DataBusyState = 'idle' | 'exporting' | 'pdf' | 'importing' | 'wiping';

interface YourDataModalsProps {
  importError: string | null;
  importPreview: { data: ZeroDataExportV1; fileDate: string } | null;
  showDeleteConfirm: boolean;
  dataBusy: DataBusyState;
  deleteConfirmText: string;
  onDeleteConfirmTextChange: (text: string) => void;
  onDismissError: () => void;
  onConfirmImport: () => void;
  onCancelImport: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function summarizeImportCounts(data: ZeroDataExportV1): string {
  const t = data.tracking;
  const parts: string[] = [];
  if (data.profile?.userName) parts.push(`profile for ${data.profile.userName}`);
  if (data.profile?.babies?.length) {
    parts.push(`${data.profile.babies.length} ${data.profile.babies.length === 1 ? 'baby' : 'babies'}`);
  }
  if (t.foodEntries.length) parts.push(`${t.foodEntries.length} meals`);
  if (t.feedingLogs.length) parts.push(`${t.feedingLogs.length} feedings`);
  if (t.diaperLogs.length) parts.push(`${t.diaperLogs.length} diapers`);
  if (t.sleepLogs.length) parts.push(`${t.sleepLogs.length} sleep`);
  if (t.weightLogs.length) parts.push(`${t.weightLogs.length} weights`);
  if (t.bloodPressureLogs.length) parts.push(`${t.bloodPressureLogs.length} BP`);
  if (t.kickLogs.length) parts.push(`${t.kickLogs.length} kicks`);
  if (t.symptoms.length) parts.push(`${t.symptoms.length} symptoms`);
  if (t.medicationLogs.length) parts.push(`${t.medicationLogs.length} meds`);
  return parts.length ? parts.slice(0, 6).join(', ') : 'no tracker entries';
}

export const YourDataModals: React.FC<YourDataModalsProps> = ({
  importError,
  importPreview,
  showDeleteConfirm,
  dataBusy,
  deleteConfirmText,
  onDeleteConfirmTextChange,
  onDismissError,
  onConfirmImport,
  onCancelImport,
  onConfirmDelete,
  onCancelDelete,
}) => {
  return (
    <>
      <Modal
        visible={importError !== null}
        transparent
        animationType="fade"
        onRequestClose={onDismissError}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-base font-semibold text-red-500 mb-2">Import failed</Text>
            <Text className="text-sm text-gray-600 mb-4">{importError}</Text>
            <TouchableOpacity
              onPress={onDismissError}
              className="bg-rose-400 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={importPreview !== null}
        transparent
        animationType="fade"
        onRequestClose={onCancelImport}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-base font-semibold text-gray-800 mb-2">Restore this backup?</Text>
            <Text className="text-xs text-gray-500 mb-3">
              This will replace everything on this phone with the contents of the backup.
            </Text>
            {importPreview ? (
              <View className="bg-rose-50 rounded-xl p-3 mb-4">
                <Text className="text-xs text-gray-600">Exported: {importPreview.fileDate}</Text>
                <Text className="text-xs text-gray-600">
                  From: Nestly {importPreview.data.meta.platform === 'mobile' ? 'on another phone' : 'on the web'}
                </Text>
                <Text className="text-xs text-gray-600">App version: v{importPreview.data.meta.appVersion}</Text>
                <Text className="text-xs text-gray-600 mt-1">
                  Includes: {summarizeImportCounts(importPreview.data)}
                </Text>
              </View>
            ) : null}
            <View className="flex-row" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={onCancelImport}
                disabled={dataBusy !== 'idle'}
                className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-500">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirmImport}
                disabled={dataBusy !== 'idle'}
                className="flex-1 bg-rose-400 rounded-xl py-3 items-center"
              >
                {dataBusy === 'importing' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Restore</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={onCancelDelete}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-base font-semibold text-red-500 mb-2">Delete all data?</Text>
            <Text className="text-sm text-gray-600 mb-4">
              Every tracker entry, profile, and baby will be erased from this phone. This cannot be undone.
            </Text>
            <Text className="text-xs text-gray-500 mb-2">Type DELETE to confirm:</Text>
            <TextInput
              value={deleteConfirmText}
              onChangeText={onDeleteConfirmTextChange}
              placeholder="DELETE"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              autoCorrect={false}
              className="bg-gray-50 rounded-xl py-3 px-4 text-base border border-gray-200 mb-4"
            />
            <View className="flex-row" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={onCancelDelete}
                disabled={dataBusy !== 'idle'}
                className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-500">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirmDelete}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || dataBusy !== 'idle'}
                className="flex-1 rounded-xl py-3 items-center"
                style={{
                  backgroundColor:
                    deleteConfirmText.trim().toUpperCase() !== 'DELETE' || dataBusy !== 'idle'
                      ? '#fecdd3'
                      : '#ef4444',
                }}
              >
                {dataBusy === 'wiping' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
