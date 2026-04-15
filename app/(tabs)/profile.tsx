import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  useProfileStore,
  calculateCalorieGoal,
  type ActivityLevel,
  type Gender,
} from '@/store/profile-store';

const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extra_active',
];

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'mn', label: 'MN' },
  { code: 'en', label: 'EN' },
];

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { profile, setProfile, addWeightEntry } = useProfileStore();

  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [weight, setWeight] = useState(String(profile.weight));
  const [height, setHeight] = useState(String(profile.height));
  const [activity, setActivity] = useState<ActivityLevel>(profile.activityLevel);
  const [useAuto, setUseAuto] = useState(profile.useAutoGoal);
  const [manualGoal, setManualGoal] = useState(String(profile.calorieGoal));
  const [saved, setSaved] = useState(false);

  const autoGoal = calculateCalorieGoal(
    gender,
    parseFloat(weight) || 70,
    parseFloat(height) || 170,
    activity
  );

  function handleSave() {
    const weightNum = parseFloat(weight) || profile.weight;
    const heightNum = parseFloat(height) || profile.height;
    const goalNum = useAuto ? autoGoal : parseInt(manualGoal) || autoGoal;

    setProfile({
      name,
      gender,
      weight: weightNum,
      height: heightNum,
      activityLevel: activity,
      useAutoGoal: useAuto,
      calorieGoal: goalNum,
    });

    if (weightNum !== profile.weight) {
      addWeightEntry(weightNum);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className="flex-row justify-between items-center px-5 pt-4 pb-6">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-3xl text-charcoal"
          >
            {t('profile_title')}
          </Text>
          <View className="flex-row border border-cream-border rounded-full overflow-hidden">
            {LANGUAGES.map((lang) => {
              const active = i18n.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => {
                    i18n.changeLanguage(lang.code);
                    Haptics.selectionAsync();
                  }}
                  className={`px-3 py-1.5 active:opacity-80 ${active ? 'bg-charcoal' : 'bg-cream'}`}
                >
                  <Text
                    style={{ fontFamily: 'DMSans_600SemiBold' }}
                    className={`text-xs ${active ? 'text-off-white' : 'text-charcoal'}`}
                  >
                    {lang.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="px-5 gap-5">
          {/* Name */}
          <View className="gap-2">
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted">
              {t('name')}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="bg-cream border border-cream-border rounded-md px-4 py-3 text-base text-charcoal"
              style={{ fontFamily: 'DMSans_400Regular' }}
              placeholderTextColor="#5f5f5d"
              placeholder={t('name')}
            />
          </View>

          {/* Gender */}
          <View className="gap-2">
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted">
              {t('gender')}
            </Text>
            <View className="flex-row gap-2">
              {(['male', 'female'] as Gender[]).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  className={`flex-1 py-3 rounded-md items-center border active:opacity-80 ${
                    gender === g
                      ? 'bg-charcoal border-charcoal'
                      : 'bg-cream border-cream-border'
                  }`}
                >
                  <Text
                    style={{ fontFamily: 'DMSans_400Regular' }}
                    className={`text-base ${gender === g ? 'text-off-white' : 'text-charcoal'}`}
                  >
                    {t(g)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Weight & Height */}
          <View className="flex-row gap-3">
            <View className="flex-1 gap-2">
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted">
                {t('weight_kg')}
              </Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                className="bg-cream border border-cream-border rounded-md px-4 py-3 text-base text-charcoal"
                style={{ fontFamily: 'DMSans_400Regular' }}
                placeholderTextColor="#5f5f5d"
              />
            </View>
            <View className="flex-1 gap-2">
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted">
                {t('height_cm')}
              </Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                className="bg-cream border border-cream-border rounded-md px-4 py-3 text-base text-charcoal"
                style={{ fontFamily: 'DMSans_400Regular' }}
                placeholderTextColor="#5f5f5d"
              />
            </View>
          </View>

          {/* Activity Level */}
          <View className="gap-2">
            <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted">
              {t('activity_level')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ACTIVITY_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setActivity(level)}
                  className={`px-3 py-2 rounded-full border active:opacity-80 ${
                    activity === level
                      ? 'bg-charcoal border-charcoal'
                      : 'bg-cream border-cream-border'
                  }`}
                >
                  <Text
                    style={{ fontFamily: 'DMSans_400Regular' }}
                    className={`text-sm ${activity === level ? 'text-off-white' : 'text-charcoal'}`}
                  >
                    {t(level)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Calorie Goal */}
          <View className="gap-2">
            <View className="flex-row justify-between items-center">
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted">
                {t('calorie_goal')}
              </Text>
              <Pressable onPress={() => setUseAuto(!useAuto)} className="flex-row items-center gap-2">
                <View
                  className={`w-10 h-6 rounded-full ${useAuto ? 'bg-charcoal' : 'bg-cream-border'}`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white m-0.5 ${useAuto ? 'translate-x-4' : 'translate-x-0'}`}
                    style={{ transform: [{ translateX: useAuto ? 16 : 0 }] }}
                  />
                </View>
                <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-muted">
                  {t('auto_calculate')}
                </Text>
              </Pressable>
            </View>
            {useAuto ? (
              <View className="bg-cream border border-cream-border rounded-md px-4 py-3">
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold' }}
                  className="text-xl text-charcoal"
                >
                  {autoGoal} <Text className="text-sm font-normal text-muted">{t('kcal')}</Text>
                </Text>
              </View>
            ) : (
              <TextInput
                value={manualGoal}
                onChangeText={setManualGoal}
                keyboardType="number-pad"
                className="bg-cream border border-cream-border rounded-md px-4 py-3 text-base text-charcoal"
                style={{ fontFamily: 'DMSans_400Regular' }}
              />
            )}
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            className="bg-charcoal rounded-md py-4 items-center mt-3 active:opacity-80"
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-base text-off-white">
              {saved ? t('saved') : t('save')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
