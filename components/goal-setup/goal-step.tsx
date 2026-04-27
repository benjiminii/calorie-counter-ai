import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SliderCard } from '@/components/goal-setup/slider-card';

type HealthyRange = { low: number; high: number };

type GoalStepProps = {
  range: HealthyRange;
  goalWeight: number;
  onGoalWeightChange: (v: number) => void;
  onApplyRecommendedMid: () => void;
  durationMonths: number;
  onDurationChange: (v: number) => void;
  dailyCalories: number;
  maintenance: number;
  onCalorieOverride: (v: number) => void;
  effectiveDurationMonths: number;
  warnings: string[];
};

export function GoalStep({
  range,
  goalWeight,
  onGoalWeightChange,
  onApplyRecommendedMid,
  durationMonths,
  onDurationChange,
  dailyCalories,
  maintenance,
  onCalorieOverride,
  effectiveDurationMonths,
  warnings,
}: GoalStepProps) {
  const { t } = useTranslation();
  const [localCalories, setLocalCalories] = useState(dailyCalories);
  const [slidingCal, setSlidingCal] = useState(false);

  useEffect(() => {
    if (!slidingCal) setLocalCalories(dailyCalories);
  }, [dailyCalories, slidingCal]);

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <Text
        style={{ fontFamily: 'DMSans_600SemiBold' }}
        className="text-3xl text-charcoal tracking-tight"
      >
        {t('setup_goal_title')}
      </Text>
      <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted mt-2 mb-6">
        {t('setup_goal_sub')}
      </Text>

      <View className="bg-cream border border-cream-border rounded-2xl p-4 flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="w-10 h-10 rounded-full bg-charcoal items-center justify-center">
            <MaterialIcons name="recommend" size={18} color="#fcfbf8" />
          </View>
          <View className="flex-1">
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-[10px] text-muted uppercase tracking-widest"
            >
              {t('recommended_range')}
            </Text>
            <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-sm text-charcoal">
              {range.low.toFixed(1)} – {range.high.toFixed(1)} {t('kg')}{' '}
              <Text className="text-[10px] text-muted">({t('healthy_bmi')})</Text>
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            onApplyRecommendedMid();
            Haptics.selectionAsync();
          }}
          className="border border-cream-border rounded-full px-3 py-1.5 active:opacity-80"
        >
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-[10px] text-charcoal uppercase tracking-widest"
          >
            {t('use_recommended')}
          </Text>
        </Pressable>
      </View>

      <SliderCard
        label={t('goal_weight')}
        value={goalWeight}
        unit="kg"
        min={30}
        max={150}
        step={0.5}
        onChange={onGoalWeightChange}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <SliderCard
            label={t('duration_months')}
            value={durationMonths}
            unit="mo"
            min={1}
            max={12}
            step={1}
            onChange={onDurationChange}
          />
        </View>
        <View className="flex-1 bg-charcoal rounded-2xl p-4 justify-between">
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-[10px] text-off-white/60 uppercase tracking-widest"
          >
            {t('daily_calories')}
          </Text>
          <View>
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className="text-2xl text-off-white tracking-tight"
            >
              {dailyCalories.toLocaleString()}
            </Text>
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-[10px] text-off-white/60">
              {t('kcal')} / {t('today').toLowerCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* <View className="mt-3 bg-cream border border-cream-border rounded-2xl p-4">
        <Text
          style={{ fontFamily: 'DMSans_400Regular' }}
          className="text-[10px] text-muted uppercase tracking-widest mb-2"
        >
          {t('daily_calories')}
        </Text>
        <Slider
          minimumValue={1000}
          maximumValue={Math.max(3500, maintenance + 500)}
          step={25}
          value={localCalories}
          minimumTrackTintColor="#1c1c1c"
          maximumTrackTintColor="#eceae4"
          thumbTintColor="#1c1c1c"
          onValueChange={setLocalCalories}
          onSlidingStart={() => setSlidingCal(true)}
          onSlidingComplete={(v) => {
            setSlidingCal(false);
            onCalorieOverride(v);
          }}
        />
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-muted mt-2">
          {t('plan_timeline')}: ~{effectiveDurationMonths.toFixed(1)}{' '}
          {t('duration_months').toLowerCase()}
        </Text>
      </View> */}

      {warnings.length > 0 && (
        <View className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 gap-1">
          {warnings.map((w, i) => (
            <View key={i} className="flex-row items-start gap-2">
              <MaterialIcons name="warning-amber" size={16} color="#b91c1c" />
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="flex-1 text-xs text-red-700">
                {w}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
