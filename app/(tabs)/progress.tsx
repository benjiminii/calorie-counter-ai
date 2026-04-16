import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MealRow } from '@/db/schema';
import { useMeals } from '@/hooks/use-meals';
import type { WeightEntry } from '@/store/profile-store';
import { useProfileStore } from '@/store/profile-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40; // 20 px horizontal padding
const CHART_WIDTH = CARD_WIDTH - 60;

type Range = 'daily' | 'weekly' | 'monthly';

function toKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function startOfWeek(d: Date): Date {
  const c = new Date(d);
  const day = c.getDay(); // 0 sun
  const diff = (day + 6) % 7; // treat monday as start
  c.setDate(c.getDate() - diff);
  c.setHours(0, 0, 0, 0);
  return c;
}

function caloriesByDate(meals: MealRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const meal of meals) {
    if (meal.status !== 'done') continue;
    m.set(meal.date, (m.get(meal.date) ?? 0) + meal.calories);
  }
  return m;
}

function buildCalorieSeries(
  meals: MealRow[],
  range: Range,
  startDate: Date
): { value: number; label: string }[] {
  const byDate = caloriesByDate(meals);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (range === 'daily') {
    const earliestWindow = addDays(today, -6);
    const start = startDate > earliestWindow ? startDate : earliestWindow;
    const days = Math.max(
      1,
      Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1
    );
    const out: { value: number; label: string }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      out.push({
        value: byDate.get(toKey(d)) ?? 0,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }
    return out;
  }

  if (range === 'weekly') {
    const out: { value: number; label: string }[] = [];
    const thisWeek = startOfWeek(today);
    for (let i = 7; i >= 0; i--) {
      const weekStart = addDays(thisWeek, -i * 7);
      let sum = 0;
      let days = 0;
      for (let j = 0; j < 7; j++) {
        const d = addDays(weekStart, j);
        if (d > today) break;
        sum += byDate.get(toKey(d)) ?? 0;
        days++;
      }
      out.push({
        value: days > 0 ? Math.round(sum / days) : 0,
        label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      });
    }
    return out;
  }

  // monthly
  const out: { value: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const next = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
    let sum = 0;
    let days = 0;
    const cursor = new Date(d);
    while (cursor < next && cursor <= today) {
      sum += byDate.get(toKey(cursor)) ?? 0;
      days++;
      cursor.setDate(cursor.getDate() + 1);
    }
    out.push({
      value: days > 0 ? Math.round(sum / days) : 0,
      label: d.toLocaleString('en', { month: 'short' }),
    });
  }
  return out;
}

function buildWeightSeries(
  log: WeightEntry[],
  range: Range,
  startDate: Date
): { value: number; label: string }[] {
  if (log.length === 0) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byDate = new Map<string, number>();
  for (const e of log) byDate.set(e.date, e.weight);

  const lastKnown = (upTo: Date): number | null => {
    let latest: { date: string; weight: number } | null = null;
    for (const e of log) {
      if (new Date(e.date + 'T00:00:00') <= upTo) {
        if (!latest || e.date > latest.date) latest = e;
      }
    }
    return latest?.weight ?? null;
  };

  if (range === 'daily') {
    const earliestWindow = addDays(today, -6);
    const start = startDate > earliestWindow ? startDate : earliestWindow;
    const days = Math.max(
      1,
      Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1
    );
    const out: { value: number; label: string }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const w = byDate.get(toKey(d)) ?? lastKnown(d);
      if (w == null) continue;
      out.push({ value: w, label: `${d.getMonth() + 1}/${d.getDate()}` });
    }
    return out;
  }

  if (range === 'weekly') {
    const out: { value: number; label: string }[] = [];
    const thisWeek = startOfWeek(today);
    for (let i = 7; i >= 0; i--) {
      const weekStart = addDays(thisWeek, -i * 7);
      const weekEnd = addDays(weekStart, 6);
      const cap = weekEnd > today ? today : weekEnd;
      const w = lastKnown(cap) ?? 0;
      out.push({ value: w, label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}` });
    }
    return out;
  }

  const out: { value: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
    const cap = d > today ? today : d;
    const first = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const w = lastKnown(cap) ?? 0;
    out.push({ value: w, label: first.toLocaleString('en', { month: 'short' }) });
  }
  return out;
}

export default function ProgressScreen() {
  const { t } = useTranslation();
  const meals = useMeals();
  const profile = useProfileStore((s) => s.profile);
  const weightLog = profile.weightLog;
  const [calRange, setCalRange] = useState<Range>('daily');
  const [weightRange, setWeightRange] = useState<Range>('weekly');
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const startingWeight = weightLog[0]?.weight ?? profile.weight;
  const currentWeight = weightLog[weightLog.length - 1]?.weight ?? profile.weight;
  const goalWeight = profile.goalWeight;
  const delta = currentWeight - startingWeight;

  const startDate = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const candidates: Date[] = [];
    if (profile.onboardedAt) candidates.push(new Date(profile.onboardedAt + 'T00:00:00'));
    for (const e of weightLog) candidates.push(new Date(e.date + 'T00:00:00'));
    for (const m of meals) {
      if (m.status === 'done') candidates.push(new Date(m.date + 'T00:00:00'));
    }
    if (candidates.length === 0) return today;
    const earliest = candidates.reduce((a, b) => (a < b ? a : b));
    return earliest > today ? today : earliest;
  })();

  const calorieSeries = buildCalorieSeries(meals, calRange, startDate);
  const weightSeries = buildWeightSeries(weightLog, weightRange, startDate);

  const weightValues = weightSeries.map((s) => s.value).filter((v) => v > 0);
  const weightMin = weightValues.length ? Math.min(...weightValues, goalWeight) : 0;
  const weightMax = weightValues.length ? Math.max(...weightValues, goalWeight) : 0;
  const weightYMin = Math.max(0, Math.floor(weightMin - 2));
  const weightYRange = Math.max(1, Math.ceil(weightMax + 2) - weightYMin);

  const mealDates = new Set(meals.filter((m) => m.status === 'done').map((m) => m.date));
  const achievements = [
    {
      icon: 'military-tech' as const,
      title: t('ach_first_kg'),
      sub: t('ach_first_kg_sub'),
      unlocked: startingWeight - currentWeight >= 1,
    },
    {
      icon: 'event-available' as const,
      title: t('ach_consistent'),
      sub: t('ach_consistent_sub'),
      unlocked: hasSevenDayStreak(mealDates),
    },
    {
      icon: 'photo-camera' as const,
      title: t('ach_first_photo'),
      sub: t('ach_first_photo_sub'),
      unlocked: meals.some((m) => m.status === 'done'),
    },
    {
      icon: 'lock' as const,
      title: t('ach_10kg'),
      sub: t('ach_10kg_sub'),
      unlocked: startingWeight - currentWeight >= 10,
    },
  ];

  function onPageScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const p = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    if (p !== page) setPage(p);
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-xs text-muted uppercase tracking-widest"
          >
            {t('progress_your')}
          </Text>
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-5xl text-charcoal tracking-tight mt-1"
          >
            {t('progress_title')}
          </Text>
        </View>

        {/* Weight bento */}
        <View className="flex-row gap-3 px-5">
          <View className="flex-1 bg-cream border border-cream-border rounded-2xl p-4 gap-2">
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-[10px] text-muted uppercase tracking-widest"
            >
              {t('starting_weight')}
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className="text-2xl text-charcoal tracking-tight"
              >
                {startingWeight.toFixed(1)}
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-xs text-muted"
              >
                {t('kg')}
              </Text>
            </View>
          </View>
          <View className="flex-1 bg-charcoal rounded-2xl p-4 gap-2">
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-[10px] text-off-white/60 uppercase tracking-widest"
            >
              {t('current_weight')}
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className="text-3xl text-off-white tracking-tight"
              >
                {currentWeight.toFixed(1)}
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-xs text-off-white/60"
              >
                {t('kg')}
              </Text>
            </View>
            {delta < 0 && (
              <View className="flex-row items-center gap-1 pt-1">
                <MaterialIcons name="trending-down" size={12} color="#fcfbf8" />
                <Text
                  style={{ fontFamily: 'DMSans_600SemiBold' }}
                  className="text-[10px] text-off-white"
                >
                  {Math.abs(delta).toFixed(1)}{t('kg_lost')}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-1 bg-cream border border-cream-border rounded-2xl p-4 gap-2">
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-[10px] text-muted uppercase tracking-widest"
            >
              {t('goal_weight')}
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className="text-2xl text-charcoal tracking-tight"
              >
                {goalWeight.toFixed(1)}
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-xs text-muted"
              >
                {t('kg')}
              </Text>
            </View>
          </View>
        </View>

        {/* Swipeable charts */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 12}
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: 20 }}
          onScroll={onPageScroll}
          scrollEventThrottle={16}
          className="mt-5"
        >
          {/* Card 1: calories */}
          <View
            style={{ width: CARD_WIDTH, marginRight: 12 }}
            className="bg-cream border border-cream-border rounded-2xl p-5"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className="text-base text-charcoal"
              >
                {t('calories_intake')}
              </Text>
              <RangeToggle value={calRange} onChange={setCalRange} />
            </View>
            <LineChart
              data={calorieSeries}
              width={CHART_WIDTH}
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
              showReferenceLine1
              referenceLine1Position={profile.calorieGoal}
              referenceLine1Config={{
                color: '#b22200',
                dashWidth: 4,
                dashGap: 4,
                labelText: `${profile.calorieGoal}`,
                labelTextStyle: { fontFamily: 'DMSans_400Regular', fontSize: 9, color: '#b22200' },
              }}
            />
          </View>

          {/* Card 2: weight */}
          <View
            style={{ width: CARD_WIDTH }}
            className="bg-cream border border-cream-border rounded-2xl p-5"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className="text-base text-charcoal"
              >
                {t('weight_progress')}
              </Text>
              <RangeToggle value={weightRange} onChange={setWeightRange} />
            </View>
            {weightValues.length > 0 ? (
              <BarChart
                data={weightSeries.map((s) => ({
                  value: s.value,
                  label: s.label,
                  frontColor:
                    Math.abs(s.value - goalWeight) < 0.1 ? '#1c1c1c' : '#d9d4c7',
                }))}
                width={CHART_WIDTH}
                height={160}
                barWidth={18}
                barBorderRadius={6}
                noOfSections={4}
                yAxisOffset={weightYMin}
                maxValue={weightYRange}
                hideRules
                yAxisTextStyle={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#5f5f5d' }}
                xAxisLabelTextStyle={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#5f5f5d' }}
                backgroundColor="#f7f4ed"
                showReferenceLine1
                referenceLine1Position={goalWeight - weightYMin}
                referenceLine1Config={{
                  color: '#b22200',
                  dashWidth: 4,
                  dashGap: 4,
                  labelText: `${goalWeight}${t('kg')}`,
                  labelTextStyle: { fontFamily: 'DMSans_400Regular', fontSize: 9, color: '#b22200' },
                }}
              />
            ) : (
              <View className="h-40 items-center justify-center">
                <Text
                  style={{ fontFamily: 'DMSans_400Regular' }}
                  className="text-muted text-sm text-center"
                >
                  {t('no_weight_data')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Page dots */}
        <View className="flex-row justify-center gap-1.5 mt-3">
          {[0, 1].map((i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${
                page === i ? 'w-6 bg-charcoal' : 'w-1.5 bg-cream-border'
              }`}
            />
          ))}
        </View>

        {/* Achievements */}
        <View className="px-5 mt-8">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-xl text-charcoal mb-3"
          >
            {t('achievements')}
          </Text>
          <View className="flex-row flex-wrap -mx-1.5">
            {achievements.map((a, i) => (
              <View key={i} className="w-1/2 px-1.5 mb-3">
                <View
                  className={`bg-cream border border-cream-border rounded-2xl p-5 items-center gap-3 ${
                    a.unlocked ? '' : 'opacity-50'
                  }`}
                >
                  <View className="w-14 h-14 rounded-full bg-cream border border-cream-border items-center justify-center">
                    <MaterialIcons
                      name={a.icon}
                      size={26}
                      color={a.unlocked ? '#1c1c1c' : '#5f5f5d'}
                    />
                  </View>
                  <View className="items-center">
                    <Text
                      style={{ fontFamily: 'DMSans_600SemiBold' }}
                      className="text-sm text-charcoal text-center"
                    >
                      {a.title}
                    </Text>
                    <Text
                      style={{ fontFamily: 'DMSans_400Regular' }}
                      className="text-[10px] text-muted uppercase tracking-widest mt-1 text-center"
                    >
                      {a.sub}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RangeToggle({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const { t } = useTranslation();
  const options: Range[] = ['daily', 'weekly', 'monthly'];
  return (
    <View className="flex-row bg-cream border border-cream-border rounded-full p-1">
      {options.map((r) => {
        const active = value === r;
        return (
          <Pressable
            key={r}
            onPress={() => onChange(r)}
            className={`px-3 py-1 rounded-full active:opacity-80 ${active ? 'bg-charcoal' : ''}`}
          >
            <Text
              style={{ fontFamily: 'DMSans_600SemiBold' }}
              className={`text-[10px] uppercase tracking-widest ${
                active ? 'text-off-white' : 'text-muted'
              }`}
            >
              {t(r)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function hasSevenDayStreak(dates: Set<string>): boolean {
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const key = d.toISOString().split('T')[0];
    if (!dates.has(key)) return false;
    d.setDate(d.getDate() - 1);
  }
  return true;
}
