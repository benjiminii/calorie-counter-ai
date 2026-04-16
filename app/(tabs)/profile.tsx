import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useProfileStore } from '@/store/profile-store';
import { GoalEditorModal } from '@/components/goal-editor-modal';

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'mn', label: 'MN' },
  { code: 'en', label: 'EN' },
];

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const logout = useProfileStore((s) => s.logout);
  const [editorOpen, setEditorOpen] = useState(false);

  const initials = (profile.name || 'D')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
    router.replace('/login' as never);
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="flex-row justify-between items-center px-5 pt-4 pb-2">
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
                    setProfile({ language: lang.code as 'mn' | 'en' });
                    Haptics.selectionAsync();
                  }}
                  className={`px-3 py-1.5 active:opacity-80 ${
                    active ? 'bg-charcoal' : 'bg-cream'
                  }`}
                >
                  <Text
                    style={{ fontFamily: 'DMSans_600SemiBold' }}
                    className={`text-xs ${
                      active ? 'text-off-white' : 'text-charcoal'
                    }`}
                  >
                    {lang.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Avatar block */}
        <View className="items-center pt-6 pb-8 gap-3">
          <View className="w-28 h-28 rounded-3xl bg-charcoal items-center justify-center">
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className="text-4xl text-off-white"
            >
              {initials}
            </Text>
          </View>
          <View className="items-center">
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className="text-2xl text-charcoal"
            >
              {profile.name || t('deglem_user')}
            </Text>
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-sm text-muted mt-0.5"
            >
              {t('deglem_user')}
            </Text>
          </View>
        </View>

        {/* Goal card */}
        <View className="px-5">
          <Pressable
            onPress={() => setEditorOpen(true)}
            className="bg-cream border border-cream-border rounded-2xl p-5 active:opacity-80"
          >
            <View className="flex-row justify-between items-start">
              <View>
                <Text
                  style={{ fontFamily: 'DMSans_400Regular' }}
                  className="text-[10px] text-muted uppercase tracking-widest mb-1"
                >
                  {t('calorie_goal')}
                </Text>
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold' }}
                  className="text-2xl text-charcoal"
                >
                  {profile.calorieGoal}{' '}
                  <Text className="text-sm text-muted">{t('kcal')}</Text>
                </Text>
              </View>
              <View className="bg-cream border border-cream-border rounded-full px-3 py-1">
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold' }}
                  className="text-[10px] text-charcoal uppercase tracking-widest"
                >
                  {profile.useAutoGoal ? t('auto') : t('manual')}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-end gap-1 mt-3">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className="text-xs text-charcoal"
              >
                {t('edit_goal')}
              </Text>
              <MaterialIcons name="chevron-right" size={16} color="#1c1c1c" />
            </View>
          </Pressable>
        </View>

        {/* Personal info */}
        <SectionHeader icon="person" label={t('personal_info')} />
        <View className="mx-5 bg-cream border border-cream-border rounded-2xl overflow-hidden">
          <EditableRow
            title={t('name')}
            value={profile.name}
            suffix=""
            onCommit={(v) => setProfile({ name: v })}
          />
          <Divider />
          <EditableRow
            title={t('current_weight')}
            value={String(profile.weight)}
            suffix={t('kg')}
            numeric
            onCommit={(v) => {
              const n = parseFloat(v.replace(',', '.'));
              if (Number.isFinite(n)) setProfile({ weight: n });
            }}
          />
          <Divider />
          <EditableRow
            title={t('goal_weight')}
            value={String(profile.goalWeight)}
            suffix={t('kg')}
            numeric
            onCommit={(v) => {
              const n = parseFloat(v.replace(',', '.'));
              if (Number.isFinite(n)) setProfile({ goalWeight: n });
            }}
          />
          <Divider />
          <EditableRow
            title={t('height_cm')}
            value={String(profile.height)}
            suffix="cm"
            numeric
            onCommit={(v) => {
              const n = parseFloat(v.replace(',', '.'));
              if (Number.isFinite(n)) setProfile({ height: n });
            }}
          />
        </View>

        {/* General */}
        <SectionHeader icon="settings" label={t('general_settings')} />
        <View className="mx-5 bg-cream border border-cream-border rounded-2xl overflow-hidden">
          <Row icon="language" title={t('language')} valueLabel={i18n.language.toUpperCase()} />
          <Divider />
          <Row icon="dark-mode" title={t('dark_mode')} valueLabel="—" />
        </View>

        {/* Logout */}
        <View className="px-5 mt-8">
          <Pressable
            onPress={handleLogout}
            className="bg-cream border border-cream-border rounded-full py-4 flex-row items-center justify-center gap-2 active:opacity-80"
          >
            <MaterialIcons name="logout" size={18} color="#1c1c1c" />
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className="text-base text-charcoal"
            >
              {t('logout')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <GoalEditorModal visible={editorOpen} onClose={() => setEditorOpen(false)} />
    </SafeAreaView>
  );
}

function SectionHeader({
  icon,
  label,
}: {
  icon?: keyof typeof MaterialIcons.glyphMap;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-2 px-5 pt-8 pb-3">
      {icon && <MaterialIcons name={icon} size={14} color="#5f5f5d" />}
      <Text
        style={{ fontFamily: 'DMSans_600SemiBold' }}
        className="text-[10px] text-muted uppercase tracking-widest"
      >
        {label}
      </Text>
    </View>
  );
}

function Row({
  icon,
  title,
  valueLabel,
  onPress,
}: {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  valueLabel: string;
  onPress?: () => void;
}) {
  const Comp: any = onPress ? Pressable : View;
  return (
    <Comp
      onPress={onPress}
      className={`flex-row items-center justify-between px-5 py-4 ${
        onPress ? 'active:opacity-80' : ''
      }`}
    >
      <View className="flex-row items-center gap-3 flex-1">
        {icon && <MaterialIcons name={icon} size={18} color="#1c1c1c" />}
        <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-sm text-charcoal">
          {title}
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted">
          {valueLabel}
        </Text>
        {onPress && <MaterialIcons name="chevron-right" size={16} color="#5f5f5d" />}
      </View>
    </Comp>
  );
}

function EditableRow({
  title,
  value,
  suffix,
  numeric,
  onCommit,
}: {
  title: string;
  value: string;
  suffix: string;
  numeric?: boolean;
  onCommit: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(value);
  }, [value, focused]);

  function commit() {
    setFocused(false);
    if (text !== value) onCommit(text);
  }

  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-sm text-charcoal">
        {title}
      </Text>
      <View className="flex-row items-center gap-1">
        <TextInput
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused(true)}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType={numeric ? 'decimal-pad' : 'default'}
          returnKeyType="done"
          selectTextOnFocus
          style={{ fontFamily: 'DMSans_400Regular', padding: 0, minWidth: 60, textAlign: 'right' }}
          className="text-sm text-muted"
        />
        {suffix ? (
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-sm text-muted">
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-cream-border mx-5" />;
}
