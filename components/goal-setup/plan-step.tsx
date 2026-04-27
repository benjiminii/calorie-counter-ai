import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

type PlanStepProps = {
  dailyCalories: number;
  weeklyRateKg: number;
  durationMonths: number;
  goalWeight: number;
};

export function PlanStep({
  dailyCalories,
  weeklyRateKg,
  durationMonths,
  goalWeight,
}: PlanStepProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timeout);
  }, []);

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  useEffect(() => {
    if (!loading) {
      opacity.value = withTiming(1, { duration: 500 });
      scale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.2)) });
    }
  }, [loading]);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center px-5 gap-4">
        <PulseDot />
        <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-base text-charcoal">
          {t('setup_generating')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <Text
        style={{ fontFamily: 'DMSans_600SemiBold' }}
        className="text-3xl text-charcoal tracking-tight"
      >
        {t('setup_plan_title')}
      </Text>
      <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted mt-2 mb-6">
        {t('setup_plan_sub')}
      </Text>

      <Animated.View style={cardStyle} className="bg-charcoal rounded-2xl p-6 mb-4">
        <Text
          style={{ fontFamily: 'DMSans_400Regular' }}
          className="text-[10px] text-off-white/60 uppercase tracking-widest mb-2"
        >
          {t('daily_calories')}
        </Text>
        <Text
          style={{ fontFamily: 'DMSans_600SemiBold' }}
          className="text-5xl text-off-white tracking-tight"
        >
          {dailyCalories.toLocaleString()}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-off-white/60 mt-1">
          {t('kcal')}
        </Text>
      </Animated.View>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-cream border border-cream-border rounded-2xl p-4">
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-[10px] text-muted uppercase tracking-widest"
          >
            {t('plan_weekly_rate')}
          </Text>
          <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-xl text-charcoal mt-1">
            {weeklyRateKg > 0 ? '-' : '+'}
            {Math.abs(weeklyRateKg).toFixed(2)} {t('kg')}
          </Text>
        </View>
        <View className="flex-1 bg-cream border border-cream-border rounded-2xl p-4">
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-[10px] text-muted uppercase tracking-widest"
          >
            {t('plan_timeline')}
          </Text>
          <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-xl text-charcoal mt-1">
            {durationMonths.toFixed(1)} {t('duration_months').split(' ')[0]}
          </Text>
        </View>
      </View>

      <View className="bg-cream border border-cream-border rounded-2xl p-4 mb-3">
        <Text
          style={{ fontFamily: 'DMSans_400Regular' }}
          className="text-[10px] text-muted uppercase tracking-widest"
        >
          {t('plan_target')}
        </Text>
        <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-xl text-charcoal mt-1">
          {goalWeight.toFixed(1)} {t('kg')}
        </Text>
      </View>

      {[t('plan_motivation_1'), t('plan_motivation_2'), t('plan_motivation_3')].map((line, i) => (
        <MotivationRow key={i} index={i} text={line} />
      ))}
    </ScrollView>
  );
}

function MotivationRow({ index, text }: { index: number; text: string }) {
  const translateX = useSharedValue(20);
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(200 + index * 150, withTiming(1, { duration: 400 }));
    translateX.value = withDelay(200 + index * 150, withTiming(0, { duration: 400 }));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));
  return (
    <Animated.View
      style={style}
      className="flex-row items-start gap-3 bg-cream border border-cream-border rounded-2xl p-4 mb-2"
    >
      <MaterialIcons name="check-circle" size={18} color="#1c1c1c" />
      <Text style={{ fontFamily: 'DMSans_400Regular' }} className="flex-1 text-sm text-charcoal">
        {text}
      </Text>
    </Animated.View>
  );
}

function PulseDot() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      style={[
        style,
        {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#1c1c1c',
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <ActivityIndicator size="small" color="#fcfbf8" />
    </Animated.View>
  );
}
