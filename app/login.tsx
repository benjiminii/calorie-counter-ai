import { useSignInWithApple } from '@clerk/expo/apple';
import { useSignInWithGoogle } from '@clerk/expo/google';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginContinueOptions } from '@/components/login/login-continue-options';
import { LoginHero } from '@/components/login/login-hero';
import { useProfileStore } from '@/store/profile-store';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const setGuest = useProfileStore((s) => s.setGuest);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  async function handle(provider: 'apple' | 'google') {
    if (busy) return;
    setBusy(true);
    setError(null);
    Haptics.selectionAsync();
    try {
      const startFn =
        provider === 'apple' ? startAppleAuthenticationFlow : startGoogleAuthenticationFlow;
      const { createdSessionId, setActive } = await startFn();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        setGuest(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/' as never);
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'ERR_REQUEST_CANCELED' || code === 'SIGN_IN_CANCELLED' || code === '-5') {
        return;
      }
      console.warn('[login] oauth failed', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setError('Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="flex-1 px-5 justify-between py-10">
        <View />

        <LoginHero />

        <View>
          <LoginContinueOptions
            onApple={() => handle('apple')}
            onGoogle={() => handle('google')}
            disabled={busy}
          />
          {error && (
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-xs text-red-500 text-center mt-3"
            >
              {error}
            </Text>
          )}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setGuest(true);
              router.replace('/' as never);
            }}
            disabled={busy}
            className="mt-3 py-3 items-center active:opacity-70 disabled:opacity-50"
          >
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className="text-[11px] text-muted uppercase tracking-widest"
            >
              {t('continue_guest')}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
