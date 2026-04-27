import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { analyzeAndUpdateMeal } from '@/lib/analyze';
import { insertMeal, todayString } from '@/db/queries';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import { useAccessStatus } from '@/lib/access';
import { useDailyUsage } from '@/lib/usage';

function goBack(router: ReturnType<typeof useRouter>) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

export default function CameraScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [context, setContext] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const userId = useCurrentUserId();
  const access = useAccessStatus();
  const usage = useDailyUsage();

  if (!permission) return null;

  // Wait for Clerk / profile-store to resolve before allowing capture;
  // otherwise a tap can fire with userId === null and silently no-op.
  if (!userId) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted">
          {t('loading')}
        </Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8">
        <Text style={{ fontSize: 56 }}>📷</Text>
        <Text
          style={{ fontFamily: 'DMSans_600SemiBold' }}
          className="text-2xl text-charcoal text-center mt-4 mb-2"
        >
          {t('permission_title')}
        </Text>
        <Text
          style={{ fontFamily: 'DMSans_400Regular' }}
          className="text-base text-muted text-center mb-8"
        >
          {t('permission_body')}
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-charcoal rounded-md px-8 py-4 active:opacity-80"
        >
          <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-off-white text-base">
            {t('permission_button')}
          </Text>
        </Pressable>
        <Pressable onPress={() => goBack(router)} className="mt-4 py-3">
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted text-base">
            {t('cancel')}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  async function saveMealAndAnalyze(photoUri: string) {
    if (!userId) {
      // Defensive: the guard above short-circuits rendering, but keep this
      // so a stale capture callback doesn't write a row with NULL user_id.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (access.kind === 'expired') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.replace('/paywall' as never);
      return;
    }
    if (!usage.loading && !usage.allowed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(t('daily_limit_reached'), t('daily_limit_sub'));
      return;
    }
    const id = Date.now().toString();
    await insertMeal({ id, photoUri, date: todayString(), userId });
    // Fire-and-forget — analysis runs after navigation
    analyzeAndUpdateMeal(id, photoUri, context);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/');
  }

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, imageType: 'jpg' });
      if (photo?.uri) {
        await saveMealAndAnalyze(photo.uri);
      }
    } finally {
      setCapturing(false);
    }
  }

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await saveMealAndAnalyze(result.assets[0].uri);
    }
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />

      <SafeAreaView
        edges={['top']}
        className="absolute top-0 left-0 right-0"
        style={{ pointerEvents: 'box-none' }}
      >
        <Pressable onPress={() => goBack(router)} className="self-start m-4 p-2">
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 28, color: 'white' }}>✕</Text>
        </Pressable>
      </SafeAreaView>

      <SafeAreaView
        edges={['bottom']}
        className="absolute bottom-0 left-0 right-0 px-5 pb-4"
        style={{ pointerEvents: 'box-none' }}
      >
        <TextInput
          value={context}
          onChangeText={setContext}
          placeholder={t('add_context')}
          placeholderTextColor="rgba(255,255,255,0.5)"
          className="text-white rounded-full px-4 py-3 mb-6 text-base"
          style={{ fontFamily: 'DMSans_400Regular', backgroundColor: 'rgba(0,0,0,0.4)' }}
        />

        <View className="flex-row justify-between items-center" style={{ pointerEvents: 'auto' }}>
          <Pressable
            onPress={handlePickPhoto}
            style={{
              width: 64, height: 64, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MaterialIcons name="photo-library" size={28} color="white" />
          </Pressable>

          <Pressable
            onPress={handleCapture}
            disabled={capturing}
            style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: capturing ? '#ccc' : 'white',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)',
            }}
          />

          <Pressable
            onPress={() => goBack(router)}
            style={{
              width: 64, alignItems: 'center',
              paddingVertical: 8, paddingHorizontal: 4,
              borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
            }}
          >
            <Text style={{ fontFamily: 'DMSans_400Regular', color: 'white', fontSize: 13 }}>
              {t('cancel')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
