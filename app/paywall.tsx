import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAction, useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../convex/_generated/api';
import { useAccessStatus } from '../lib/access';
import {
  formatMnt,
  PLAN_IDS,
  PLANS,
  TEST_PLAN_IDS,
  type PlanId,
} from '../lib/plans';

const BEST_VALUE: PlanId = '360d';
// When true, the paywall skips QPay and grants the subscription directly via
// a Convex mutation. Also surfaces the ₮1,000 / 1-day dev plan.
const isTest = true;

export default function PaywallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const access = useAccessStatus();
  const createInvoice = useAction(api.subscriptions.createInvoice);
  const grantTest = useMutation(api.subscriptions.grantTestSubscription);
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);

  const planList = isTest ? TEST_PLAN_IDS : PLAN_IDS;

  async function handleSelect(plan: PlanId) {
    if (pendingPlan) return;
    Haptics.selectionAsync();
    setPendingPlan(plan);
    try {
      if (isTest) {
        await grantTest({ plan });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)' as never);
        return;
      }
      const invoice = await createInvoice({ plan });
      router.push({
        pathname: '/payment/[invoiceId]' as never,
        params: {
          invoiceId: invoice.invoiceId,
          qrImage: invoice.qrImage,
          qrText: invoice.qrText,
          deepLinks: JSON.stringify(invoice.deepLinks ?? []),
          amount: String(invoice.amount),
          plan: invoice.plan,
        },
      } as never);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t('payment_failed'),
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setPendingPlan(null);
    }
  }

  const subtitleKey =
    access.kind === 'trial'
      ? 'trial_days_left'
      : access.kind === 'expired'
        ? 'trial_expired'
        : 'paywall_sub';

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
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <View className="px-6 pt-4">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-4xl text-charcoal leading-tight"
          >
            {t('paywall_title')}
          </Text>
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-base text-muted mt-3"
          >
            {access.kind === 'trial'
              ? t(subtitleKey, { count: access.daysLeft, days: access.daysLeft })
              : t(subtitleKey)}
          </Text>
        </View>

        {isTest ? (
          <View className="mx-5 mt-6 bg-charcoal/5 border border-cream-border rounded-xl px-4 py-3">
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className="text-[10px] text-muted uppercase tracking-widest"
            >
              Test mode
            </Text>
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-xs text-muted mt-1"
            >
              Subscriptions are granted instantly without payment.
            </Text>
          </View>
        ) : null}

        <View className="px-5 pt-8 gap-3">
          {planList.map((id) => {
            const plan = PLANS[id];
            const busy = pendingPlan === id;
            const best = id === BEST_VALUE;
            return (
              <Pressable
                key={id}
                disabled={pendingPlan !== null}
                onPress={() => handleSelect(id)}
                className={`border rounded-2xl px-5 py-5 active:opacity-80 ${
                  best ? 'bg-charcoal border-charcoal' : 'bg-cream border-cream-border'
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text
                      style={{ fontFamily: 'DMSans_600SemiBold' }}
                      className={`text-lg ${best ? 'text-off-white' : 'text-charcoal'}`}
                    >
                      {t(plan.labelKey)}
                    </Text>
                    <Text
                      style={{ fontFamily: 'DMSans_400Regular' }}
                      className={`text-xs mt-1 ${best ? 'text-off-white/70' : 'text-muted'}`}
                    >
                      {t('plan_days', { days: plan.days })}
                    </Text>
                  </View>
                  <View className="items-end">
                    {best ? (
                      <View className="bg-off-white rounded-full px-2.5 py-1 mb-2">
                        <Text
                          style={{ fontFamily: 'DMSans_600SemiBold' }}
                          className="text-[10px] text-charcoal uppercase tracking-widest"
                        >
                          {t('plan_best_value')}
                        </Text>
                      </View>
                    ) : null}
                    <Text
                      style={{ fontFamily: 'DMSans_600SemiBold' }}
                      className={`text-2xl ${best ? 'text-off-white' : 'text-charcoal'}`}
                    >
                      {formatMnt(plan.amountMnt)}
                    </Text>
                    {busy ? (
                      <Text
                        style={{ fontFamily: 'DMSans_400Regular' }}
                        className={`text-xs mt-1 ${best ? 'text-off-white/70' : 'text-muted'}`}
                      >
                        {t('payment_verifying')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="px-6 pt-6">
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-xs text-muted text-center"
          >
            {t('paywall_footer')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
