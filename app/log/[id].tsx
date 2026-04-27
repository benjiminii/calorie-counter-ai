import { and, eq, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db';
import { deleteMeal, setMealStatus, updateMealBasic } from '@/db/queries';
import { meals } from '@/db/schema';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import { useAccessStatus } from '@/lib/access';
import { analyzeAndUpdateMeal } from '@/lib/analyze';
import { useDailyUsage } from '@/lib/usage';

function ShimmerRow({ width }: { width: number }) {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[style, { height: 14, width, borderRadius: 7, backgroundColor: '#eceae4' }]} />;
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: '#16a34a',
  medium: '#d97706',
  low: '#dc2626',
};

export default function MealDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useCurrentUserId();
  const access = useAccessStatus();
  const usage = useDailyUsage();

  const { data } = useLiveQuery(
    db
      .select()
      .from(meals)
      .where(
        userId
          ? and(eq(meals.id, id ?? ''), eq(meals.userId, userId))
          : sql`0 = 1`
      )
      .limit(1)
  );
  const meal = data?.[0] ?? null;

  const [editedName, setEditedName] = useState('');
  const [editedCalories, setEditedCalories] = useState('');
  const [editedProtein, setEditedProtein] = useState('');
  const [editedCarbs, setEditedCarbs] = useState('');
  const [editedFat, setEditedFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  // Populate edit fields when meal data first arrives (status done)
  useEffect(() => {
    if (meal && meal.status === 'done') {
      setEditedName(meal.name ?? '');
      setEditedCalories(String(meal.calories ?? 0));
      setEditedProtein(String(meal.protein ?? 0));
      setEditedCarbs(String(meal.carbs ?? 0));
      setEditedFat(String(meal.fat ?? 0));
    }
  }, [meal?.status]);

  async function handleSave() {
    if (!meal) return;
    setSaving(true);
    await updateMealBasic(meal.id, {
      name: editedName,
      calories: parseInt(editedCalories) || 0,
      protein: parseInt(editedProtein) || 0,
      carbs: parseInt(editedCarbs) || 0,
      fat: parseInt(editedFat) || 0,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    router.back();
  }

  async function handleDelete() {
    if (!meal) return;
    await deleteMeal(meal.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.back();
  }

  async function handleReanalyze() {
    if (!meal?.photoUri) return;
    if (access.kind === 'expired') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.replace('/paywall' as never);
      return;
    }
    // Re-analysis doesn't create a new row on the server, so the 10/day cap
    // has to be enforced here.
    if (!usage.loading && !usage.allowed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(t('daily_limit_reached'), t('daily_limit_sub'));
      return;
    }
    setReanalyzing(true);
    try {
      await setMealStatus(meal.id, 'analyzing');
      analyzeAndUpdateMeal(meal.id, meal.photoUri, '');
    } finally {
      setReanalyzing(false);
    }
  }

  const isAnalyzing = meal?.status === 'analyzing';
  const isError = meal?.status === 'error';
  const ingredients: string[] = meal?.ingredients ? JSON.parse(meal.ingredients) : [];

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Photo */}
        {meal?.photoUri && (
          <Image
            source={{ uri: meal.photoUri }}
            style={{ width: '100%', height: 260 }}
            resizeMode="cover"
          />
        )}

        {/* Close / back button overlay */}
        <View className="absolute top-4 left-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center active:opacity-70"
          >
            <Text style={{ color: 'white', fontSize: 18, lineHeight: 20 }}>✕</Text>
          </Pressable>
        </View>

        <View className="px-5 pt-5 gap-4">
          {/* Analyzing state */}
          {isAnalyzing && (
            <View className="gap-3">
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted text-sm">
                {t('analyzing')}
              </Text>
              <ShimmerRow width={200} />
              <ShimmerRow width={140} />
              <ShimmerRow width={160} />
            </View>
          )}

          {/* Error state */}
          {isError && (
            <View className="bg-cream border border-cream-border rounded-xl p-4 gap-3 items-center">
              <Text style={{ fontSize: 32 }}>⚠️</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted text-sm text-center">
                {t('error_analysis')}
              </Text>
              {meal?.photoUri && (
                <Pressable
                  onPress={handleReanalyze}
                  disabled={reanalyzing}
                  className="bg-charcoal rounded-md px-6 py-3 active:opacity-80"
                >
                  <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-off-white text-sm">
                    {reanalyzing ? t('analyzing') : t('retry')}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Done state */}
          {meal?.status === 'done' && (
            <>
              {/* Confidence badge */}
              {meal.confidence && (
                <View className="flex-row items-center gap-2">
                  <View
                    style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CONFIDENCE_COLOR[meal.confidence] ?? '#888' }}
                  />
                  <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-muted capitalize">
                    {t(`confidence_${meal.confidence}`)}
                  </Text>
                  {meal.photoUri && (
                    <Pressable onPress={handleReanalyze} disabled={reanalyzing} className="ml-auto">
                      <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-muted underline">
                        {t('re_estimate')}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Description */}
              {!!meal.description && (
                <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted leading-relaxed">
                  {meal.description}
                </Text>
              )}

              {/* Ingredients */}
              {ingredients.length > 0 && (
                <View className="gap-2">
                  <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-sm text-charcoal">
                    {t('ingredients')}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {ingredients.map((ing, i) => (
                      <View key={i} className="border border-cream-border rounded-full px-3 py-1">
                        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-charcoal">
                          {ing}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Editable fields — shown even during analyzing so user can see structure */}
          {!isAnalyzing && (
            <>
              {/* Food name */}
              <View className="gap-1">
                <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted">
                  {t('food_name')}
                </Text>
                <TextInput
                  value={editedName}
                  onChangeText={setEditedName}
                  className="bg-cream border border-cream-border rounded-md px-4 py-3 text-base text-charcoal"
                  style={{ fontFamily: 'DMSans_400Regular' }}
                />
              </View>

              {/* Macros grid */}
              <View className="flex-row gap-2">
                {[
                  { label: t('calories'), value: editedCalories, set: setEditedCalories, unit: t('kcal') },
                  { label: t('protein'), value: editedProtein, set: setEditedProtein, unit: t('g') },
                  { label: t('carbs'), value: editedCarbs, set: setEditedCarbs, unit: t('g') },
                  { label: t('fat'), value: editedFat, set: setEditedFat, unit: t('g') },
                ].map(({ label, value, set, unit }) => (
                  <View key={label} className="flex-1 gap-1">
                    <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-muted text-center">
                      {label}
                    </Text>
                    <TextInput
                      value={value}
                      onChangeText={set}
                      keyboardType="number-pad"
                      className="bg-cream border border-cream-border rounded-lg py-3 text-center text-base text-charcoal"
                      style={{ fontFamily: 'DMSans_600SemiBold' }}
                    />
                    <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-muted text-center">
                      {unit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Save */}
              <Pressable
                onPress={handleSave}
                disabled={saving}
                className="bg-charcoal rounded-md py-4 items-center active:opacity-80 mt-2"
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-off-white text-base">
                  {saving ? t('saving') : t('save_changes')}
                </Text>
              </Pressable>

              {/* Delete */}
              <Pressable onPress={handleDelete} className="items-center py-2">
                <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-red-500 text-sm">
                  {t('delete_meal')}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
