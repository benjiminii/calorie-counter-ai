import { useAuth } from '@clerk/expo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAction, useQuery } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { api } from '../../convex/_generated/api';
import { formatMnt } from '../../lib/plans';

type DeepLink = { name: string; description: string; link: string };

export default function PaymentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const params = useLocalSearchParams<{
    invoiceId: string;
    qrImage?: string;
    qrText?: string;
    deepLinks?: string;
    amount?: string;
    plan?: string;
  }>();

  const invoiceId = params.invoiceId;
  const amount = params.amount ? Number(params.amount) : null;

  let deepLinks: DeepLink[] = [];
  try {
    if (params.deepLinks) deepLinks = JSON.parse(params.deepLinks);
  } catch {
    deepLinks = [];
  }

  const payment = useQuery(
    api.payments.byInvoiceIdOwned,
    isSignedIn ? { invoiceId } : 'skip'
  );
  const verify = useAction(api.subscriptions.verifyInvoice);
  const [verifying, setVerifying] = useState(false);
  const successFiredRef = useRef(false);

  useEffect(() => {
    if (payment?.status === 'PAID' && !successFiredRef.current) {
      successFiredRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const to = setTimeout(() => {
        router.replace('/(tabs)');
      }, 900);
      return () => clearTimeout(to);
    }
  }, [payment?.status, router]);

  if (!authLoaded) return null;
  if (!isSignedIn) return <Redirect href={'/login' as never} />;

  async function handleVerify() {
    if (verifying) return;
    Haptics.selectionAsync();
    setVerifying(true);
    try {
      const res = await verify({ invoiceId });
      if (res.status === 'PAID') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (res.status === 'FAILED') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(t('payment_failed'));
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(t('payment_pending'));
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t('payment_failed'),
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setVerifying(false);
    }
  }

  async function openLink(url: string) {
    try {
      Haptics.selectionAsync();
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('payment_open_bank_failed'));
    }
  }

  const isPaid = payment?.status === 'PAID';
  const qrUri = params.qrImage ? `data:image/png;base64,${params.qrImage}` : null;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-2 pb-1">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-80"
        >
          <MaterialIcons name="close" size={24} color="#1c1c1c" />
        </Pressable>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className="px-6 pt-2">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-3xl text-charcoal leading-tight"
          >
            {isPaid ? t('payment_success') : t('payment_scan_qr')}
          </Text>
          {amount ? (
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-base text-muted mt-2"
            >
              {formatMnt(amount)}
            </Text>
          ) : null}
        </View>

        <View className="items-center pt-6">
          <View className="bg-off-white border border-cream-border rounded-3xl p-4">
            {qrUri ? (
              <Image
                source={{ uri: qrUri }}
                style={{ width: 220, height: 220 }}
                resizeMode="contain"
              />
            ) : (
              <View className="w-[220px] h-[220px] items-center justify-center">
                <Text
                  style={{ fontFamily: 'DMSans_400Regular' }}
                  className="text-sm text-muted"
                >
                  {t('payment_loading_qr')}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center mt-4 gap-2">
            <View
              className={`w-2 h-2 rounded-full ${
                isPaid ? 'bg-green-500' : 'bg-charcoal/40'
              }`}
            />
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-xs text-muted"
            >
              {isPaid
                ? t('payment_success')
                : payment?.status === 'FAILED'
                  ? t('payment_failed')
                  : t('payment_pending')}
            </Text>
          </View>
        </View>

        {deepLinks.length > 0 && !isPaid ? (
          <View className="px-5 pt-8">
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className="text-[10px] text-muted uppercase tracking-widest mb-3 px-1"
            >
              {t('payment_open_bank')}
            </Text>
            <View className="bg-cream border border-cream-border rounded-2xl overflow-hidden">
              {deepLinks.map((dl, idx) => (
                <View key={`${dl.name}-${idx}`}>
                  <Pressable
                    onPress={() => openLink(dl.link)}
                    className="flex-row items-center justify-between px-5 py-4 active:opacity-80"
                  >
                    <View className="flex-1 pr-3">
                      <Text
                        style={{ fontFamily: 'DMSans_600SemiBold' }}
                        className="text-sm text-charcoal"
                      >
                        {dl.description || dl.name}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={18}
                      color="#5f5f5d"
                    />
                  </Pressable>
                  {idx < deepLinks.length - 1 ? (
                    <View className="h-px bg-cream-border mx-5" />
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View className="px-5 pt-8">
          <Pressable
            onPress={handleVerify}
            disabled={verifying || isPaid}
            className={`rounded-full py-4 items-center active:opacity-80 ${
              isPaid ? 'bg-charcoal/40' : 'bg-charcoal'
            }`}
          >
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className="text-base text-off-white"
            >
              {isPaid
                ? t('payment_success')
                : verifying
                  ? t('payment_verifying')
                  : t('payment_ive_paid')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
