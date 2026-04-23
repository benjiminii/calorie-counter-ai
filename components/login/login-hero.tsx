import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function LoginHero() {
  const { t } = useTranslation();

  return (
    <View className="items-center gap-3">
      <View className="w-20 h-20 rounded-full bg-charcoal items-center justify-center mb-4">
        <MaterialCommunityIcons name="silverware-fork-knife" size={36} color="#fcfbf8" />
      </View>
      <Text
        style={{ fontFamily: 'DMSans_600SemiBold' }}
        className="text-5xl text-charcoal tracking-tight"
      >
        {t('app_name')}
      </Text>
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-base text-muted text-center px-6 mt-1"
      >
        {t('login_tagline')}
      </Text>
    </View>
  );
}
