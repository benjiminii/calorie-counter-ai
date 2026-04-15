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
import '../lib/i18n';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { db } from '@/db';
import migrations from '@/db/migrations/migrations';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({ DMSans_400Regular, DMSans_600SemiBold });
  const { success: migrationsReady, error: migrationError } = useMigrations(db, migrations);

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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="log/camera" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="log/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
