import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivacyStore } from '@nestly/shared/stores';
import { LEGAL_PRIVACY_URL, LEGAL_TERMS_URL } from '@nestly/shared';

interface InfoSectionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

function InfoSection({ icon, title, description }: InfoSectionProps) {
  return (
    <View className="flex-row items-start mb-5">
      <View className="bg-rose-100 rounded-full p-2 mr-3 mt-0.5">
        <Ionicons name={icon} size={20} color="#f43f5e" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-800 mb-1">{title}</Text>
        <Text className="text-sm text-gray-500 leading-5">{description}</Text>
      </View>
    </View>
  );
}

export function PrivacyScreen() {
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    usePrivacyStore.getState().setHasAcceptedPrivacy(true);
  };

  const openPrivacy = () => { Linking.openURL(LEGAL_PRIVACY_URL); };
  const openTerms = () => { Linking.openURL(LEGAL_TERMS_URL); };

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="items-center mb-6">
          <Ionicons name="shield-checkmark-outline" size={48} color="#f43f5e" />
          <Text className="text-2xl font-bold text-rose-700 mt-4 text-center">
            Your data stays with you
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center leading-5">
            Nestly does not collect, store, or transmit your tracking data. Here is how that works.
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <InfoSection
            icon="phone-portrait-outline"
            title="Stored on this phone only"
            description="Pregnancy details, feeding, sleep, vitals, journal — every entry lives in this phone's storage. There is no Nestly server holding your data."
          />
          <InfoSection
            icon="download-outline"
            title="You own the export"
            description="Settings -> Your Data lets you back up to a JSON file, restore from one, or wipe everything. There is no account to delete because there is no account."
          />
          <InfoSection
            icon="shield-checkmark-outline"
            title="No tracking, no analytics"
            description="No third-party trackers, no ads, no usage telemetry. Uninstalling or clearing app data permanently erases everything Nestly knows about you."
          />
        </View>

        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <Text className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-2">
            Read the full text
          </Text>
          <TouchableOpacity
            onPress={openPrivacy}
            className="flex-row items-center justify-between py-2"
            activeOpacity={0.7}
          >
            <Text className="text-sm text-rose-600 underline">Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color="#f43f5e" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openTerms}
            className="flex-row items-center justify-between py-2"
            activeOpacity={0.7}
          >
            <Text className="text-sm text-rose-600 underline">Terms of Service</Text>
            <Ionicons name="open-outline" size={16} color="#f43f5e" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="flex-row items-center mb-6"
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.7}
        >
          <View
            className={`h-5 w-5 rounded border-2 mr-3 items-center justify-center ${
              agreed ? 'bg-rose-400 border-rose-400' : 'border-gray-400 bg-white'
            }`}
          >
            {agreed ? <Ionicons name="checkmark" size={12} color="white" /> : null}
          </View>
          <Text className="text-sm text-gray-700 flex-1">
            I have read and agree to the Privacy Policy and Terms of Service.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`rounded-2xl py-4 items-center ${agreed ? 'bg-rose-400' : 'bg-gray-200'}`}
          onPress={handleContinue}
          disabled={!agreed}
        >
          <Text className={`text-base font-semibold ${agreed ? 'text-white' : 'text-gray-400'}`}>
            Continue to Nestly
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
