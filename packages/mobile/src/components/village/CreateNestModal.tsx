import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NestCategory } from '@nestly/shared';

const EMOJI_OPTIONS = ['🌸', '🌿', '🦋', '🌙', '🔥', '💪', '🧘', '🎯', '🫶', '☀️', '🍼', '🎀'];

const CATEGORY_OPTIONS: { label: string; value: NestCategory }[] = [
  { label: 'Trimester', value: 'trimester' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Diet', value: 'diet' },
  { label: 'Support', value: 'support' },
  { label: 'Postpartum', value: 'postpartum' },
  { label: 'General', value: 'general' },
];

interface CreateNestModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: {
    name: string;
    description: string;
    category: NestCategory;
    emoji: string;
  }) => Promise<void>;
}

export function CreateNestModal({ visible, onClose, onCreate }: CreateNestModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<NestCategory>('general');
  const [emoji, setEmoji] = useState('🌸');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && description.trim().length >= 2;

  const reset = () => {
    setName('');
    setDescription('');
    setCategory('general');
    setEmoji('🌸');
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ name: name.trim(), description: description.trim(), category, emoji });
      reset();
    } catch {
      setError("Couldn't create nest. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-rose-50">
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3 bg-white border-b border-rose-100">
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-gray-800">Create a Nest</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`px-4 py-1.5 rounded-full ${canSubmit && !submitting ? 'bg-rose-400' : 'bg-rose-200'}`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white text-sm font-semibold">Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {EMOJI_OPTIONS.map((e) => (
              <TouchableOpacity
                key={e}
                className={`w-10 h-10 mr-2 rounded-xl items-center justify-center ${emoji === e ? 'bg-rose-400' : 'bg-white'}`}
                onPress={() => setEmoji(e)}
              >
                <Text className="text-xl">{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text className="text-sm font-semibold text-gray-700 mb-1">Name</Text>
          <TextInput
            className="bg-white rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-4"
            placeholder="Give your nest a name (at least 2 characters)"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            maxLength={60}
          />

          <Text className="text-sm font-semibold text-gray-700 mb-1">Description</Text>
          <TextInput
            className="bg-white rounded-xl px-3 py-2.5 text-sm text-gray-800 mb-4"
            placeholder="What is this nest about? (at least 2 characters)"
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={280}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          <Text className="text-sm font-semibold text-gray-700 mb-2">Category</Text>
          <View className="flex-row flex-wrap mb-4">
            {CATEGORY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`mr-2 mb-2 px-3 py-1.5 rounded-full ${category === opt.value ? 'bg-rose-400' : 'bg-white'}`}
                onPress={() => setCategory(opt.value)}
              >
                <Text
                  className={`text-xs font-semibold ${category === opt.value ? 'text-white' : 'text-gray-600'}`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error && (
            <View className="bg-rose-500 rounded-xl px-4 py-3 mb-4">
              <Text className="text-white text-sm text-center">{error}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
