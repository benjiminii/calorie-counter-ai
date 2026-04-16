import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MacroRing } from './macro-ring';
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

  return (
    <View className="flex-row gap-3 px-5 mt-4">
      <MacroRing
        icon="bread-slice-outline"
        label={t('carbs')}
        value={`${totals.carbs}${t('g')}`}
        progress={totals.carbs / (macroGoals.carbs || 1)}
      />
      <MacroRing
        icon="food-steak"
        label={t('protein')}
        value={`${totals.protein}${t('g')}`}
        progress={totals.protein / (macroGoals.protein || 1)}
      />
      <MacroRing
        icon="water-outline"
        label={t('fat')}
        value={`${totals.fat}${t('g')}`}
        progress={totals.fat / (macroGoals.fat || 1)}
      />
    </View>
  );
}
