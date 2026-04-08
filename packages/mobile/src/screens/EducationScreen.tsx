import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Trimester,
  LifecycleStage,
  educationArticles,
  getStageGuidance,
  EDUCATION_CATEGORIES,
  type EducationArticle,
} from '@nestly/shared';
import { useProfileStore } from '@nestly/shared/stores';

export function EducationScreen() {
  const { profile } = useProfileStore();

  const trimester = useMemo(() => {
    if (!profile?.lmpDate) return Trimester.FIRST;
    const weeks = Math.floor(
      (Date.now() - new Date(profile.lmpDate).getTime()) / (7 * 24 * 3600000),
    );
    if (weeks <= 13) return Trimester.FIRST;
    if (weeks <= 26) return Trimester.SECOND;
    return Trimester.THIRD;
  }, [profile?.lmpDate]);

  const isPostpartum = profile?.lifecycleStage !== LifecycleStage.PREGNANCY;

  const [filter, setFilter] = useState<Trimester | 'General' | 'Newborn' | 'All'>(
    isPostpartum ? 'Newborn' : trimester,
  );
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    setFilter(isPostpartum ? 'Newborn' : trimester);
  }, [isPostpartum, trimester]);

  const guidance = useMemo(() => getStageGuidance(trimester, isPostpartum), [trimester, isPostpartum]);

  const filteredArticles = useMemo(() => {
    return educationArticles
      .filter((a) => {
        const stageMatch = filter === 'All' || a.trimester === filter || a.trimester === 'General';
        const catMatch = activeCategory === 'All' || a.category === activeCategory;
        return stageMatch && catMatch;
      })
      .sort((a, b) => {
        const aScore = a.trimester === filter ? 0 : 1;
        const bScore = b.trimester === filter ? 0 : 1;
        return aScore - bScore;
      });
  }, [filter, activeCategory]);

  const openLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the link. Please try again.');
    });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-rose-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-rose-800">Articles</Text>
          <Text className="text-sm text-gray-500 mt-1">Trusted medical insights for your journey</Text>
        </View>

        {/* Stage Guidance Card */}
        <View className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-rose-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-rose-800" style={{ fontFamily: 'Georgia' }}>
              {guidance.title} update
            </Text>
            <View className="bg-rose-50 px-3 py-1 rounded-full">
              <Text className="text-[9px] font-black uppercase tracking-widest text-rose-500">
                Auto-updated
              </Text>
            </View>
          </View>

          <GuidanceSection label="What you might feel" items={guidance.feelings} />
          <GuidanceSection label="What might happen" items={guidance.happenings} />
          <GuidanceSection label="What to focus on" items={guidance.focus} />
        </View>

        {/* Stage Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 8 }}
        >
          {(
            [
              { key: 'All' as const, label: 'All' },
              { key: Trimester.FIRST, label: 'Trimester 1' },
              { key: Trimester.SECOND, label: 'Trimester 2' },
              { key: Trimester.THIRD, label: 'Trimester 3' },
              { key: 'Newborn' as const, label: 'Newborn' },
            ] as const
          ).map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setFilter(item.key)}
              className={`px-4 py-2 rounded-xl border ${
                filter === item.key
                  ? 'bg-rose-900 border-rose-900'
                  : 'bg-white border-rose-200'
              }`}
            >
              <Text
                className={`text-[10px] font-black uppercase tracking-widest ${
                  filter === item.key ? 'text-white' : 'text-rose-400'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}
        >
          {EDUCATION_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl border ${
                activeCategory === cat
                  ? 'bg-gray-800 border-gray-800'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-[10px] font-black uppercase tracking-widest ${
                  activeCategory === cat ? 'text-white' : 'text-gray-400'
                }`}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Articles */}
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} onPress={openLink} />
          ))
        ) : (
          <View className="py-20 items-center">
            <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
              <Ionicons name="book-outline" size={40} color="#d1d5db" />
            </View>
            <Text className="text-gray-400 italic">No articles found for this selection.</Text>
          </View>
        )}

        {/* WHO Banner */}
        <View className="mx-4 mt-6 bg-gray-900 rounded-2xl p-6 overflow-hidden">
          <Text className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia' }}>
            Official WHO Guidelines
          </Text>
          <Text className="text-sm text-gray-400 mb-4">
            Access the complete World Health Organization recommendations for a positive pregnancy and newborn experience.
          </Text>
          <TouchableOpacity
            onPress={() => openLink('https://www.who.int/publications/i/item/9789241549912')}
            className="bg-white self-start px-5 py-3 rounded-xl"
          >
            <Text className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
              View Full Guidelines
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GuidanceSection({ label, items }: { label: string; items: string[] }) {
  return (
    <View className="mb-4">
      <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
        {label}
      </Text>
      {items.map((item, i) => (
        <Text key={i} className="text-sm text-gray-600 leading-relaxed mb-1">
          {item}
        </Text>
      ))}
    </View>
  );
}

function ArticleCard({
  article,
  onPress,
}: {
  article: EducationArticle;
  onPress: (url: string) => void;
}) {
  return (
    <View className="mx-4 mb-4 bg-white rounded-2xl p-5 border border-rose-50">
      <View className="flex-row justify-between items-start mb-3">
        <View className="bg-rose-50 px-3 py-1 rounded-full">
          <Text className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
            {article.category}
          </Text>
        </View>
        <Text className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
          {article.source}
        </Text>
      </View>

      <Text className="text-lg font-bold text-rose-900 mb-2 leading-tight">
        {article.title}
      </Text>

      <Text className="text-sm text-gray-500 leading-relaxed mb-4" numberOfLines={4}>
        {article.summary}
      </Text>

      <View className="flex-row items-center justify-between pt-4 border-t border-gray-50">
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <View className="w-7 h-7 rounded-full bg-rose-50 items-center justify-center">
            <Ionicons name="book-outline" size={12} color="#f43f5e" />
          </View>
          <Text className="text-[10px] font-bold text-gray-400 uppercase">
            {typeof article.trimester === 'string'
              ? article.trimester.replace(' Trimester', '')
              : article.trimester}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onPress(article.link)}
          className="bg-rose-500 px-4 py-2.5 rounded-xl flex-row items-center"
          style={{ gap: 6 }}
        >
          <Text className="text-[10px] font-black text-white uppercase tracking-widest">
            Read Article
          </Text>
          <Ionicons name="open-outline" size={12} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
