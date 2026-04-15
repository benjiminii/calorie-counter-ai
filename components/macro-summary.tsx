import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalorieRing } from './calorie-ring';
import { useProfileStore, getMacroGoals } from '@/store/profile-store';
import { MealRow } from '@/db/schema';
import { getTotalsByDate } from '@/db/queries';

interface MacroSummaryProps {
  selectedDate: string;
  meals: MealRow[];
}

export function MacroSummary({ selectedDate, meals }: MacroSummaryProps) {
  const { t } = useTranslation();
  const calorieGoal = useProfileStore((s) => s.profile.calorieGoal);
  const macroGoals = getMacroGoals(calorieGoal);
  const totals = getTotalsByDate(meals, selectedDate);

  const items = [
    {
      key: 'calories',
      label: String(totals.calories),
      sublabel: t('kcal'),
      title: t('calories'),
      progress: totals.calories / (calorieGoal || 1),
      size: 84,
    },
    {
      key: 'protein',
      label: String(totals.protein),
      sublabel: t('g'),
      title: t('protein'),
      progress: totals.protein / (macroGoals.protein || 1),
      size: 68,
    },
    {
      key: 'carbs',
      label: String(totals.carbs),
      sublabel: t('g'),
      title: t('carbs'),
      progress: totals.carbs / (macroGoals.carbs || 1),
      size: 68,
    },
    {
      key: 'fat',
      label: String(totals.fat),
      sublabel: t('g'),
      title: t('fat'),
      progress: totals.fat / (macroGoals.fat || 1),
      size: 68,
    },
  ];

  return (
    <View className="bg-cream border border-cream-border rounded-2xl mx-5 my-3 px-4 py-5">
      <View className="flex-row justify-between items-end">
        {items.map((item) => (
          <View key={item.key} className="items-center gap-1">
            <CalorieRing
              size={item.size}
              strokeWidth={item.size === 84 ? 7 : 6}
              progress={item.progress}
              label={item.label}
              sublabel={item.sublabel}
            />
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-xs text-muted mt-1"
            >
              {item.title}
            </Text>
          </View>
        ))}
      </View>
      <View className="flex-row justify-between mt-4 pt-3 border-t border-cream-border">
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted">
          {t('remaining')}
        </Text>
        <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-sm text-charcoal">
          {Math.max(0, calorieGoal - totals.calories)} {t('kcal')}
        </Text>
      </View>
    </View>
  );
}
