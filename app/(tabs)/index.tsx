import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { CalorieRing } from '@/components/calorie-ring';
import { MacroSummary } from '@/components/macro-summary';
import { MealCard } from '@/components/meal-card';
import { ModelPickerModal } from '@/components/model-picker-modal';
import { WeekCalendar } from '@/components/week-calendar';
import { deleteMeal, getMealsByDate, getTotalsByDate, todayString } from '@/db/queries';
import { useMeals } from '@/hooks/use-meals';
import { findModel } from '@/lib/providers/models';
import { useModelStore } from '@/store/model-store';
import { useProfileStore } from '@/store/profile-store';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const meals = useMeals();
  const dayMeals = getMealsByDate(meals, selectedDate);
  const totals = getTotalsByDate(meals, selectedDate);
  const calorieGoal = useProfileStore((s) => s.profile.calorieGoal);
  const modelId = useModelStore((s) => s.modelId);
  const currentModel = findModel(modelId);

  const streak = countStreak(meals);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 pt-2 pb-2">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-3xl text-charcoal tracking-tight"
          >
            {t('app_name')}
          </Text>
          <View className="flex-row items-center gap-1.5 border border-cream-border rounded-full px-3 py-1.5">
            <MaterialIcons name="local-fire-department" size={14} color="#1c1c1c" />
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className="text-xs text-charcoal"
            >
              {streak}
            </Text>
          </View>
        </View>

        <WeekCalendar selectedDate={selectedDate} onDayPress={setSelectedDate} meals={meals} />

        {/* Hero ring */}
        <View className="items-center py-6">
          <CalorieRing
            size={224}
            strokeWidth={10}
            progress={totals.calories / (calorieGoal || 1)}
            label={String(totals.calories)}
            sublabel={`/ ${calorieGoal} ${t('kcal')}`}
          />
        </View>

        <MacroSummary selectedDate={selectedDate} meals={meals} />

        {/* Log meal quick row */}
        <View className="px-5 mt-6">
          <View className="bg-cream border border-cream-border rounded-2xl p-4 gap-3">
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className="text-base text-charcoal"
            >
              {t('log_meal_here')}
            </Text>
            <View className="flex-row gap-2 items-center">
              <View className="flex-1 flex-row items-center bg-cream border border-cream-border rounded-full px-4 h-12 gap-2">
                <MaterialIcons name="search" size={18} color="#5f5f5d" />
                <TextInput
                  editable={false}
                  placeholder={t('search_food')}
                  placeholderTextColor="#5f5f5d"
                  className="flex-1 text-sm text-charcoal"
                  style={{ fontFamily: 'DMSans_400Regular' }}
                />
              </View>
              <Pressable
                onPress={() => router.push('/log/camera')}
                className="w-12 h-12 rounded-full bg-charcoal items-center justify-center active:opacity-80"
              >
                <MaterialIcons name="camera-alt" size={20} color="#fcfbf8" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Recent meals */}
        <View className="px-5 pt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className="text-xl text-charcoal"
            >
              {t('recent_meals')}
            </Text>
            <Pressable
              onPress={() => setModelPickerOpen(true)}
              className="flex-row items-center gap-1.5 border border-cream-border rounded-full px-3 py-1.5 active:opacity-80"
            >
              <MaterialIcons name="tune" size={14} color="#1c1c1c" />
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className="text-xs text-charcoal"
              >
                {currentModel.label}
              </Text>
            </Pressable>
          </View>

          {dayMeals.length === 0 ? (
            <View className="py-10 items-center">
              <Text style={{ fontSize: 40 }}>🍽️</Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-muted text-base mt-3 text-center"
              >
                {t('no_meals')}
              </Text>
            </View>
          ) : (
            dayMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onDelete={() => deleteMeal(meal.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <ModelPickerModal visible={modelPickerOpen} onClose={() => setModelPickerOpen(false)} />
    </SafeAreaView>
  );
}

function countStreak(meals: { date: string; status: string }[]): number {
  const dates = new Set(meals.filter((m) => m.status === 'done').map((m) => m.date));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().split('T')[0];
    if (!dates.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
