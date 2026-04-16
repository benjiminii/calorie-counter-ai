import {
  DMSans_400Regular,
  DMSans_600SemiBold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { db } from '@/db';
import migrations from '@/db/migrations/migrations';
import i18n from '@/lib/i18n';
import { useProfileStore } from '@/store/profile-store';

SplashScreen.preventAutoHideAsync();

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

  if (migrationError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text>DB migration failed: {migrationError.message}</Text>
      </View>
    );
  }

  if (!fontsLoaded || !migrationsReady) return null;

  return (
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
  );
}
