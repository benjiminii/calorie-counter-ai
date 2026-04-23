import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import {
  DMSans_400Regular,
  DMSans_600SemiBold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { db } from '@/db';
import migrations from '@/db/migrations/migrations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CloudHydrationOnSignIn } from '@/lib/auth/sync-cloud-hydrate';
import { ConvexUserSync } from '@/lib/auth/sync-convex-user';
import { ProfileCloudSync } from '@/lib/auth/sync-profile-cloud';
import { ProfileStoreUserSync } from '@/lib/auth/sync-profile-store';
import { convex } from '@/lib/convex-client';
import i18n from '@/lib/i18n';
import { useProfileStore } from '@/store/profile-store';

SplashScreen.preventAutoHideAsync();

function redact(v: string | undefined, keep = 16): string {
  if (!v) return '<missing>';
  return v.length > keep ? `${v.slice(0, keep)}…` : v;
}

if (__DEV__) {
  console.log('[env]', {
    isDev: __DEV__,
    nodeEnv: process.env.NODE_ENV,
    runtime: Constants.executionEnvironment,
    appOwnership: Constants.appOwnership,
    platform: Platform.OS,
    easProfile: process.env.EAS_BUILD_PROFILE,
    clerkKey: redact(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, 16),
    convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL ?? '<missing>',
    googleWeb: redact(process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID, 20),
    googleIos: redact(process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID, 20),
    iosScheme: process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME ?? '<missing>',
  });
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const missingEnv = [
  !publishableKey && 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  !convexUrl && 'EXPO_PUBLIC_CONVEX_URL',
].filter(Boolean) as string[];

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({ DMSans_400Regular, DMSans_600SemiBold });
  const { success: migrationsReady, error: migrationError } = useMigrations(db, migrations);
  const language = useProfileStore((s) => s.profile.language);

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    if (fontsLoaded && (migrationsReady || migrationError)) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, migrationsReady, migrationError]);

  if (missingEnv.length > 0 || !publishableKey || !convex) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f7f4ed' }}>
        <Text style={{ fontWeight: '600', marginBottom: 8, color: '#1c1c1c' }}>
          Missing environment variables
        </Text>
        <Text style={{ color: '#5f5f5d', textAlign: 'center' }}>
          Set these in .env.local and restart Metro:
          {'\n\n'}
          {missingEnv.join('\n')}
        </Text>
      </View>
    );
  }

  if (migrationError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text>DB migration failed: {migrationError.message}</Text>
      </View>
    );
  }

  if (!fontsLoaded || !migrationsReady) return null;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ProfileStoreUserSync />
        <ConvexUserSync />
        <ProfileCloudSync />
        <CloudHydrationOnSignIn />
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="step-section" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="log/camera" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="log/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
