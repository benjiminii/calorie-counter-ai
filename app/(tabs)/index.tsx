import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { MacroSummary } from '@/components/macro-summary';
import { MealCard } from '@/components/meal-card';
import { ModelPickerModal } from '@/components/model-picker-modal';
import { WeekCalendar } from '@/components/week-calendar';
import { deleteMeal, getMealsByDate, todayString } from '@/db/queries';
import { useMeals } from '@/hooks/use-meals';
import { findModel } from '@/lib/providers/models';
import { useModelStore } from '@/store/model-store';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const meals = useMeals();
  const dayMeals = getMealsByDate(meals, selectedDate);
  const modelId = useModelStore((s) => s.modelId);
  const currentModel = findModel(modelId);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="flex-row justify-between items-center px-5 pt-4 pb-2">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-3xl text-charcoal tracking-tight"
          >
            {t('app_name')}
          </Text>
        </View>

        <WeekCalendar selectedDate={selectedDate} onDayPress={setSelectedDate} meals={meals} />
        <MacroSummary selectedDate={selectedDate} meals={meals} />

        <View className="px-5 pt-2">
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

      {/* <Pressable
        onPress={() => router.push('/log/camera')}
        className="absolute bottom-6 right-5 bg-charcoal rounded-full w-20 h-20 items-center justify-center active:opacity-80 ios:shadow-md ios:shadow-black/30 android:elevation-4"
      >
        <MaterialIcons name="camera-alt" size={32} color="#fcfbf8" />
      </Pressable> */}
    </SafeAreaView>
  );
}
