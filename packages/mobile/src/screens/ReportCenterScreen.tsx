import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LifecycleStage } from '@nestly/shared';
import { useProfileStore, useTrackingStore } from '@nestly/shared/stores';
import { generateAndSharePdf } from '../services/pdfService';
import {
  buildPregnancyDailyHtml,
  buildNewbornDailyHtml,
  buildLaborSummaryHtml,
  buildFullPregnancyArchiveHtml,
  buildFullNewbornArchiveHtml,
} from '../services/reportHtmlTemplates';

export function ReportCenterScreen() {
  const { profile } = useProfileStore();
  const store = useTrackingStore();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPregnancy = profile?.lifecycleStage === LifecycleStage.PREGNANCY;

  const onDateChange = useCallback((_e: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selected) setDate(selected);
  }, []);

  const setQuickRange = useCallback((days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    setDate(d);
  }, []);

  const runReport = useCallback(
    async (builder: () => string, filename: string) => {
      if (!profile) {
        Alert.alert('Profile Required', 'Please set up your profile first.');
        return;
      }
      setLoading(true);
      try {
        const html = builder();
        await generateAndSharePdf(html, filename);
      } catch {
        Alert.alert('Error', 'Could not generate PDF. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [profile],
  );

  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const fmtFileDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return (
    <SafeAreaView className="flex-1 bg-rose-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="bg-white rounded-2xl p-5 border border-rose-100">
          {/* Title */}
          <View className="flex-row items-center mb-1" style={{ gap: 10 }}>
            <View className="w-10 h-10 rounded-xl bg-rose-100 items-center justify-center">
              <Ionicons name="document-text" size={22} color="#be185d" />
            </View>
            <View>
              <Text className="text-xl font-bold text-gray-900">Report Center</Text>
              <Text className="text-xs text-gray-400">Archive and export your journey</Text>
            </View>
          </View>

          {/* Date Picker */}
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-5 mb-2">
            Select Date
          </Text>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            className="bg-gray-50 rounded-xl px-4 py-3 flex-row items-center justify-between"
          >
            <Text className="text-sm text-gray-700">{dateStr}</Text>
            <Ionicons name="calendar-outline" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              maximumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          {/* Quick Range */}
          <View className="flex-row mt-3" style={{ gap: 8 }}>
            {[
              { label: '7 Days Ago', days: 7 },
              { label: '30 Days Ago', days: 30 },
              { label: 'Today', days: 0 },
            ].map((r) => (
              <TouchableOpacity
                key={r.label}
                onPress={() => (r.days === 0 ? setDate(new Date()) : setQuickRange(r.days))}
                className="bg-rose-50 px-3 py-2 rounded-xl"
              >
                <Text className="text-[10px] font-bold text-rose-600 uppercase">{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Report Buttons */}
          <View className="mt-6" style={{ gap: 10 }}>
            {/* Daily Report */}
            <TouchableOpacity
              onPress={() =>
                runReport(
                  () =>
                    isPregnancy
                      ? buildPregnancyDailyHtml({
                          profile: profile!,
                          date,
                          weightLogs: store.weightLogs,
                          entries: store.entries,
                          sleepLogs: store.sleepLogs,
                          symptoms: store.symptoms,
                          journalEntries: store.journalEntries,
                          kickLogs: store.kickLogs,
                          kegelLogs: store.kegelLogs,
                        })
                      : buildNewbornDailyHtml({
                          profile: profile!,
                          date,
                          feedingLogs: store.feedingLogs,
                          diaperLogs: store.diaperLogs,
                          sleepLogs: store.sleepLogs,
                          tummyTimeLogs: store.tummyTimeLogs,
                          babyGrowthLogs: store.babyGrowthLogs,
                          journalEntries: store.journalEntries,
                        }),
                  `Nestly_${isPregnancy ? 'Pregnancy' : 'Newborn'}_Daily_${fmtFileDate}.pdf`,
                )
              }
              disabled={loading}
              className="bg-rose-900 rounded-xl py-4 px-5 flex-row items-center justify-center"
              style={{ gap: 8 }}
            >
              <Ionicons name="today-outline" size={18} color="#fff" />
              <Text className="text-sm font-bold text-white">
                {isPregnancy ? 'Daily Pregnancy PDF' : 'Daily Newborn PDF'}
              </Text>
            </TouchableOpacity>

            {/* Labor Summary - pregnancy only */}
            {isPregnancy && (
              <TouchableOpacity
                onPress={() =>
                  runReport(
                    () =>
                      buildLaborSummaryHtml({
                        profile: profile!,
                        date,
                        contractions: store.contractions,
                      }),
                    `Nestly_Labor_Summary_${fmtFileDate}.pdf`,
                  )
                }
                disabled={loading}
                className="border border-rose-100 rounded-xl py-4 px-5 flex-row items-center justify-center"
                style={{ gap: 8 }}
              >
                <Ionicons name="timer-outline" size={18} color="#f43f5e" />
                <Text className="text-sm font-bold text-rose-500">Labor Summary PDF</Text>
              </TouchableOpacity>
            )}

            {/* Full Archive */}
            <TouchableOpacity
              onPress={() =>
                runReport(
                  () =>
                    isPregnancy
                      ? buildFullPregnancyArchiveHtml({
                          profile: profile!,
                          kickLogs: store.kickLogs,
                          weightLogs: store.weightLogs,
                          symptoms: store.symptoms,
                          kegelLogs: store.kegelLogs,
                        })
                      : buildFullNewbornArchiveHtml({
                          profile: profile!,
                          feedingLogs: store.feedingLogs,
                          milestones: store.milestones,
                          diaperLogs: store.diaperLogs,
                          tummyTimeLogs: store.tummyTimeLogs,
                        }),
                  `Nestly_${isPregnancy ? 'Pregnancy' : 'Newborn'}_Full_Archive.pdf`,
                )
              }
              disabled={loading}
              className="bg-rose-50 rounded-xl py-4 px-5 flex-row items-center justify-center"
              style={{ gap: 8 }}
            >
              <Ionicons name="archive-outline" size={18} color="#881337" />
              <Text className="text-sm font-bold text-rose-900">Full Archive (all time)</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <View className="flex-row items-center mt-5 px-2" style={{ gap: 6 }}>
            <Ionicons name="lock-closed" size={12} color="#94a3b8" />
            <Text className="text-[10px] text-gray-400 italic flex-1">
              Reports are generated on your device. No data is sent to any server.
            </Text>
          </View>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View className="items-center mt-6" style={{ gap: 8 }}>
            <ActivityIndicator size="large" color="#f43f5e" />
            <Text className="text-sm text-gray-500">Generating PDF...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
