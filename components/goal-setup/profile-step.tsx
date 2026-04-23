import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Field } from '@/components/goal-setup/field';
import { SliderCard } from '@/components/goal-setup/slider-card';
import type { Gender } from '@/store/profile-store';

type ProfileStepProps = {
  className?: string;
  name: string;
  onNameChange: (v: string) => void;
  showNameError?: boolean;
  gender: Gender;
  onGenderChange: (g: Gender) => void;
  age: number;
  onAgeChange: (v: number) => void;
  height: number;
  onHeightChange: (v: number) => void;
  weight: number;
  onWeightChange: (v: number) => void;
};

export function ProfileStep({
  className,
  name,
  onNameChange,
  showNameError,
  gender,
  onGenderChange,
  age,
  onAgeChange,
  height,
  onHeightChange,
  weight,
  onWeightChange,
}: ProfileStepProps) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} className={className}>
      <Text
        style={{ fontFamily: 'DMSans_600SemiBold' }}
        className="text-3xl text-charcoal tracking-tight"
      >
        {t('setup_personal_title')}
      </Text>
      <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted mt-2 mb-6">
        {t('setup_personal_sub')}
      </Text>

      <Field label={t('name')}>
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder={t('name')}
          placeholderTextColor="#5f5f5d"
          className={`bg-cream rounded-xl px-4 py-3 text-base text-charcoal border ${
            showNameError ? 'border-red-600' : 'border-cream-border'
          }`}
          style={{ fontFamily: 'DMSans_400Regular' }}
        />
        {showNameError ? (
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-red-600 mt-2">
            {t('name_required')}
          </Text>
        ) : null}
      </Field>

      <Field label={t('gender')}>
        <View className="flex-row gap-2">
          {(['male', 'female'] as Gender[]).map((g) => (
            <Pressable
              key={g}
              onPress={() => onGenderChange(g)}
              className={`flex-1 py-3 rounded-xl items-center border active:opacity-80 ${
                gender === g ? 'bg-charcoal border-charcoal' : 'bg-cream border-cream-border'
              }`}
            >
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className={`text-sm ${gender === g ? 'text-off-white' : 'text-charcoal'}`}
              >
                {t(g)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <SliderCard
            label={t('age')}
            value={age || 25}
            unit=""
            min={12}
            max={90}
            step={1}
            onChange={onAgeChange}
          />
        </View>
        <View className="flex-1">
          <SliderCard
            label={t('height_cm')}
            value={height}
            unit="cm"
            min={120}
            max={220}
            step={1}
            onChange={onHeightChange}
          />
        </View>
      </View>

      <SliderCard
        label={t('weight_kg')}
        value={weight}
        unit="kg"
        min={30}
        max={200}
        step={0.5}
        onChange={onWeightChange}
      />
    </ScrollView>
  );
}
