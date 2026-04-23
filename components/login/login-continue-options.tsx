import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Platform, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type LoginContinueOptionsProps = {
  onApple: () => void;
  onGoogle: () => void;
  disabled?: boolean;
};

export function LoginContinueOptions({
  onApple,
  onGoogle,
  disabled,
}: LoginContinueOptionsProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-3">
      {Platform.OS === 'ios' && (
        <Pressable
          onPress={onApple}
          disabled={disabled}
          className="bg-charcoal rounded-full py-4 flex-row items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
        >
          <MaterialCommunityIcons name="apple" size={20} color="#fcfbf8" />
          <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-base text-off-white">
            {t('continue_apple')}
          </Text>
        </Pressable>
      )}
      <Pressable
        onPress={onGoogle}
        disabled={disabled}
        className="bg-cream border border-cream-border rounded-full py-4 flex-row items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
      >
        <MaterialCommunityIcons name="google" size={20} color="#1c1c1c" />
        <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-base text-charcoal">
          {t('continue_google')}
        </Text>
      </Pressable>
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-xs text-muted text-center mt-2 px-4"
      >
        {t('login_fineprint')}
      </Text>
    </View>
  );
}
