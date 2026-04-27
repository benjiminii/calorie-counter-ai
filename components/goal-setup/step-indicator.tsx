import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { GoalSetupStep } from '@/components/goal-setup/types';

type StepIndicatorProps = {
  step: GoalSetupStep;
};

export function StepIndicator({ step }: StepIndicatorProps) {
  const { t } = useTranslation();
  const steps = [
    { n: 1 as GoalSetupStep, label: t('setup_step_personal') },
    { n: 2 as GoalSetupStep, label: t('setup_step_goal') },
    { n: 3 as GoalSetupStep, label: t('setup_step_plan') },
  ];
  return (
    <View className="flex-row items-center justify-center gap-2">
      {steps.map((s, i) => {
        const active = s.n === step;
        const done = s.n < step;
        return (
          <View key={s.n} className="flex-row items-center gap-2">
            <View
              className={`w-6 h-6 rounded-full items-center justify-center ${
                active ? 'bg-charcoal' : done ? 'bg-charcoal' : 'bg-cream border border-cream-border'
              }`}
            >
              {done ? (
                <MaterialIcons name="check" size={14} color="#fcfbf8" />
              ) : (
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold' }}
                  className={`text-[10px] ${active ? 'text-off-white' : 'text-muted'}`}
                >
                  {s.n}
                </Text>
              )}
            </View>
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className={`text-[10px] uppercase tracking-widest ${
                active || done ? 'text-charcoal' : 'text-muted'
              }`}
            >
              {s.label}
            </Text>
            {i < steps.length - 1 && <View className="w-6 h-px bg-cream-border" />}
          </View>
        );
      })}
    </View>
  );
}
