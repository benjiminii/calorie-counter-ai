import { useUser } from '@clerk/expo';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoalStep } from '@/components/goal-setup/goal-step';
import { PlanStep } from '@/components/goal-setup/plan-step';
import { ProfileStep } from '@/components/goal-setup/profile-step';
import { StepIndicator } from '@/components/goal-setup/step-indicator';
import type { GoalSetupStep } from '@/components/goal-setup/types';
import {
  calculateMaintenance,
  calculatePlan,
  healthyWeightRange,
  useProfileStore,
  type Gender,
} from '@/store/profile-store';

export default function StepSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const setOnboarded = useProfileStore((s) => s.setOnboarded);
  const setGuest = useProfileStore((s) => s.setGuest);
  const { user, isSignedIn } = useUser();

  const [step, setStep] = useState<GoalSetupStep>(1);
  const [showNameError, setShowNameError] = useState(false);

  const [name, setName] = useState(profile.name ?? '');
  const [age, setAge] = useState(profile.age ?? 30);
  const [gender, setGender] = useState<Gender>(profile.gender ?? 'male');
  const [height, setHeight] = useState(profile.height ?? 170);
  const [weight, setWeight] = useState(profile.weight ?? 70);
  const [goalWeight, setGoalWeight] = useState(() => {
    if (profile.goalWeight) return profile.goalWeight;
    const r = healthyWeightRange(profile.height ?? 170);
    return Math.round(((r.low + r.high) / 2) * 10) / 10;
  });
  const [goalWeightTouched, setGoalWeightTouched] = useState(false);
  const [durationMonths, setDurationMonths] = useState(profile.goalDurationMonths ?? 3);

  useEffect(() => {
    if (goalWeightTouched) return;
    const r = healthyWeightRange(height);
    const mid = Math.round(((r.low + r.high) / 2) * 10) / 10;
    setGoalWeight(mid);
  }, [height, goalWeightTouched]);

  const maintenance = calculateMaintenance(gender, weight, height, age, 'moderately_active');
  const plan = calculatePlan(weight, goalWeight, durationMonths, maintenance);
  const [overrideCals, setOverrideCals] = useState<number | null>(null);
  const dailyCalories = overrideCals ?? plan.dailyCalories;

  const effectiveDurationMonths = overrideCals
    ? Math.max(
        0.5,
        ((weight - goalWeight) * 7700) / Math.max(1, maintenance - overrideCals) / 30
      )
    : durationMonths;

  const range = healthyWeightRange(height);

  // Match warnings + summary to the actual calorie target (including slider override).
  const dailyImbalanceKcal = maintenance - dailyCalories;
  const weeklyRateFromCalories = (dailyImbalanceKcal * 7) / 7700;

  const warnings: string[] = [];
  if (dailyCalories < (gender === 'male' ? 1500 : 1200)) warnings.push(t('warning_low_cals'));
  if (Math.abs(weeklyRateFromCalories) > 1) warnings.push(t('warning_fast_loss'));
  if (Math.abs(dailyImbalanceKcal) > 1000) warnings.push(t('warning_extreme'));

  async function finishOnboarding() {
    const today = new Date().toISOString().split('T')[0];
    setProfile({
      name: name.trim(),
      age,
      gender,
      height,
      weight,
      goalWeight,
      goalDurationMonths: durationMonths,
      calorieGoal: dailyCalories,
      useAutoGoal: overrideCals === null,
      weightLog: [{ date: today, weight }],
      onboardedAt: today,
    });
    setOnboarded(true);
    try {
      await user?.update({
        unsafeMetadata: { ...(user.unsafeMetadata ?? {}), hasOnboarded: true },
      });
    } catch (err) {
      console.warn('[onboarding] could not update Clerk metadata', err);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  }

  function handleNext() {
    if (step === 1 && !name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowNameError(true);
      return;
    }
    Haptics.selectionAsync();
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else {
      finishOnboarding();
    }
  }

  function handleBack() {
    if (step === 1) {
      if (!isSignedIn) setGuest(false);
      router.replace('/login' as never);
    } else {
      setStep((s) => (s - 1) as GoalSetupStep);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="px-5 pt-2 pb-4">
        <StepIndicator step={step} />
      </View>

      {step === 1 && (
        <ProfileStep
          name={name}
          onNameChange={(v) => {
            setName(v);
            setShowNameError(false);
          }}
          showNameError={showNameError}
          gender={gender}
          onGenderChange={setGender}
          age={age}
          onAgeChange={setAge}
          height={height}
          onHeightChange={setHeight}
          weight={weight}
          onWeightChange={setWeight}
        />
      )}

      {step === 2 && (
        <GoalStep
          range={range}
          goalWeight={goalWeight}
          onGoalWeightChange={(v) => {
            setGoalWeight(v);
            setGoalWeightTouched(true);
            setOverrideCals(null);
          }}
          onApplyRecommendedMid={() => {
            setGoalWeight(Math.round(((range.low + range.high) / 2) * 10) / 10);
            setGoalWeightTouched(false);
            setOverrideCals(null);
          }}
          durationMonths={durationMonths}
          onDurationChange={(v) => {
            setDurationMonths(v);
            setOverrideCals(null);
          }}
          dailyCalories={dailyCalories}
          maintenance={maintenance}
          onCalorieOverride={(v) => setOverrideCals(Math.round(v))}
          effectiveDurationMonths={effectiveDurationMonths}
          warnings={warnings}
        />
      )}

      {step === 3 && (
        <PlanStep
          dailyCalories={dailyCalories}
          weeklyRateKg={weeklyRateFromCalories}
          durationMonths={effectiveDurationMonths}
          goalWeight={goalWeight}
        />
      )}

      <View className="px-5 pt-3 pb-6 gap-2 border-t border-cream-border">
        <Pressable
          onPress={handleNext}
          className="bg-charcoal rounded-full py-4 items-center active:opacity-80"
        >
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-base text-off-white uppercase tracking-widest"
          >
            {step === 3 ? t('get_started') : t('continue_button')}
          </Text>
        </Pressable>
        {step !== 1 && (
        <Pressable onPress={handleBack} className="py-2 items-center active:opacity-70">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-[10px] text-muted uppercase tracking-widest"
          >
            {t('back_button')}
          </Text>
        </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
