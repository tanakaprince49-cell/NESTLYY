import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivacyStore } from '@nestly/shared/stores';

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

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="items-center mb-6">
          <Ionicons name="shield-checkmark-outline" size={48} color="#f43f5e" />
          <Text className="text-2xl font-bold text-rose-700 mt-4 text-center">
            Your Privacy Matters
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center leading-5">
            We want you to feel safe using Nestly. Here is how we handle your data.
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <InfoSection
            icon="clipboard-outline"
            title="What we collect"
            description="Pregnancy data and health inputs you choose to share, such as due dates, weight, and baby information."
          />
          <InfoSection
            icon="lock-closed-outline"
            title="How it's protected"
            description="Your data is encrypted and stored securely. We never sell your information to third parties."
          />
          <InfoSection
            icon="person-outline"
            title="Your rights"
            description="You have full control over your data. You can delete your account and all associated data at any time."
          />
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
            I agree to the privacy policy
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
