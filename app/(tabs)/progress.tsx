import { useRef, useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-gifted-charts';
import { useProfileStore } from '@/store/profile-store';
import { useMeals } from '@/hooks/use-meals';
import { getTotalsByDate } from '@/db/queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;

function getPast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function getPast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ProgressScreen() {
  const { t } = useTranslation();
  const meals = useMeals();
  const weightLog = useProfileStore((s) => s.profile.weightLog);
  const calorieGoal = useProfileStore((s) => s.profile.calorieGoal);

  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const past7 = getPast7Days();
  const past14 = getPast14Days();

  const calorieData = past7.map((date) => ({
    value: getTotalsByDate(meals, date).calories,
    label: formatShortDate(date),
  }));

  const weightData = weightLog
    .slice(-7)
    .map((e) => ({ value: e.weight, label: formatShortDate(e.date) }));

  const hasWeightData = weightData.length > 0;

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActivePage(page);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text
          style={{ fontFamily: 'DMSans_600SemiBold' }}
          className="text-3xl text-charcoal px-5 pt-4 pb-4"
        >
          {t('progress_title')}
        </Text>

        <View className="bg-cream border border-cream-border rounded-2xl mx-5 overflow-hidden">
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
          >
            <View style={{ width: SCREEN_WIDTH - 40, padding: 16 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-base text-charcoal mb-4">
                {t('calories_chart')}
              </Text>
              <LineChart
                data={calorieData}
                width={CHART_WIDTH - 64}
                height={160}
                color="#1c1c1c"
                dataPointsColor="#1c1c1c"
                dataPointsRadius={4}
                thickness={2}
                hideRules
                yAxisTextStyle={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#5f5f5d' }}
                xAxisLabelTextStyle={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#5f5f5d' }}
                backgroundColor="#f7f4ed"
                referenceLine1Config={{ color: '#eceae4', dashWidth: 4, dashGap: 4 }}
                referenceLine1Position={calorieGoal}
                showReferenceLine1
                curved
                areaChart
                startFillColor="rgba(28,28,28,0.08)"
                endFillColor="rgba(28,28,28,0.01)"
              />
            </View>

            <View style={{ width: SCREEN_WIDTH - 40, padding: 16 }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-base text-charcoal mb-4">
                {t('weight_chart')} ({t('kg')})
              </Text>
              {hasWeightData ? (
                <LineChart
                  data={weightData}
                  width={CHART_WIDTH - 64}
                  height={160}
                  color="#1c1c1c"
                  dataPointsColor="#1c1c1c"
                  dataPointsRadius={4}
                  thickness={2}
                  hideRules
                  yAxisTextStyle={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#5f5f5d' }}
                  xAxisLabelTextStyle={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#5f5f5d' }}
                  backgroundColor="#f7f4ed"
                  curved
                  areaChart
                  startFillColor="rgba(28,28,28,0.08)"
                  endFillColor="rgba(28,28,28,0.01)"
                />
              ) : (
                <View className="h-40 items-center justify-center">
                  <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted text-sm text-center">
                    {t('no_weight_data')}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View className="flex-row justify-center gap-2 pb-4">
            {[0, 1].map((i) => (
              <View key={i} className={`w-1.5 h-1.5 rounded-full ${activePage === i ? 'bg-charcoal' : 'bg-cream-border'}`} />
            ))}
          </View>
        </View>

        <View className="px-5 mt-5">
          <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-xl text-charcoal mb-3">
            {t('history')}
          </Text>
          {past14
            .slice()
            .reverse()
            .map((date) => {
              const totals = getTotalsByDate(meals, date);
              const d = new Date(date + 'T00:00:00');
              return (
                <View key={date} className="flex-row justify-between items-center py-3 border-b border-cream-border">
                  <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-base text-charcoal">
                    {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-base text-charcoal">
                    {totals.calories > 0 ? `${totals.calories} ${t('kcal')}` : '—'}
                  </Text>
                </View>
              );
            })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
