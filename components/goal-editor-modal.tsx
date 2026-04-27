import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function GoalEditorModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { profile, setProfile, addWeightEntry } = useProfileStore();

  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [weight, setWeight] = useState(String(profile.weight));
  const [height, setHeight] = useState(String(profile.height));
  const [goalWeight, setGoalWeight] = useState(String(profile.goalWeight));
  const [activity, setActivity] = useState<ActivityLevel>(profile.activityLevel);
  const [useAuto, setUseAuto] = useState(profile.useAutoGoal);
  const [manualGoal, setManualGoal] = useState(String(profile.calorieGoal));

  const autoGoal = calculateCalorieGoal(
    gender,
    parseFloat(weight) || 70,
    parseFloat(height) || 170,
    activity,
    profile.age
  );

  function handleSave() {
    const weightNum = parseFloat(weight) || profile.weight;
    const heightNum = parseFloat(height) || profile.height;
    const goalWeightNum = parseFloat(goalWeight) || profile.goalWeight;
    const goalNum = useAuto ? autoGoal : parseInt(manualGoal) || autoGoal;

    setProfile({
      name,
      gender,
      weight: weightNum,
      height: heightNum,
      goalWeight: goalWeightNum,
      activityLevel: activity,
      useAutoGoal: useAuto,
      calorieGoal: goalNum,
    });

    if (weightNum !== profile.weight) {
      addWeightEntry(weightNum);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
        <View className="flex-row justify-between items-center px-5 pt-2 pb-3 border-b border-cream-border">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-xl text-charcoal"
          >
            {t('edit_goal')}
          </Text>
          <Pressable onPress={onClose} className="active:opacity-80 p-2">
            <MaterialIcons name="close" size={24} color="#1c1c1c" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <View className="gap-5">
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
                      className={`text-base ${
                        gender === g ? 'text-off-white' : 'text-charcoal'
                      }`}
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
                <Text
                  style={{ fontFamily: 'DMSans_400Regular' }}
                  className="text-sm text-muted"
                >
                  {t('weight_kg')}
                </Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  className="bg-cream border border-cream-border rounded-md px-4 py-3 text-base text-charcoal"
                  style={{ fontFamily: 'DMSans_400Regular' }}
                />
              </View>
              <View className="flex-1 gap-2">
                <Text
                  style={{ fontFamily: 'DMSans_400Regular' }}
                  className="text-sm text-muted"
                >
                  {t('height_cm')}
                </Text>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                  className="bg-cream border border-cream-border rounded-md px-4 py-3 text-base text-charcoal"
                  style={{ fontFamily: 'DMSans_400Regular' }}
                />
              </View>
            </View>

            {/* Goal weight */}
            <View className="gap-2">
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted">
                {t('goal_weight')} ({t('kg')})
              </Text>
              <TextInput
                value={goalWeight}
                onChangeText={setGoalWeight}
                keyboardType="decimal-pad"
                className="bg-cream border border-cream-border rounded-md px-4 py-3 text-base text-charcoal"
                style={{ fontFamily: 'DMSans_400Regular' }}
              />
            </View>

            {/* Activity */}
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
                      className={`text-sm ${
                        activity === level ? 'text-off-white' : 'text-charcoal'
                      }`}
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
                <Text
                  style={{ fontFamily: 'DMSans_400Regular' }}
                  className="text-sm text-muted"
                >
                  {t('calorie_goal')}
                </Text>
                <Pressable
                  onPress={() => setUseAuto(!useAuto)}
                  className="flex-row items-center gap-2"
                >
                  <View
                    className={`w-10 h-6 rounded-full ${
                      useAuto ? 'bg-charcoal' : 'bg-cream-border'
                    }`}
                  >
                    <View
                      className="w-5 h-5 rounded-full bg-white m-0.5"
                      style={{ transform: [{ translateX: useAuto ? 16 : 0 }] }}
                    />
                  </View>
                  <Text
                    style={{ fontFamily: 'DMSans_400Regular' }}
                    className="text-xs text-muted"
                  >
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
                    {autoGoal}{' '}
                    <Text className="text-sm font-normal text-muted">{t('kcal')}</Text>
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

            <Pressable
              onPress={handleSave}
              className="bg-charcoal rounded-full py-4 items-center mt-3 active:opacity-80"
            >
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className="text-base text-off-white"
              >
                {t('save')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
