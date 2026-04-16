import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MealRow } from '@/db/schema';
import { getMealsByDate } from '@/db/queries';

interface WeekCalendarProps {
  selectedDate: string; // "YYYY-MM-DD"
  onDayPress: (date: string) => void;
  meals: MealRow[];
}

function getMondayOfWeek(dateStr: string): Date {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function WeekCalendar({ selectedDate, onDayPress, meals }: WeekCalendarProps) {
  const { t } = useTranslation();
  const today = formatDate(new Date());
  const daysShort = t('days_short', { returnObjects: true }) as string[];

  const monday = getMondayOfWeek(selectedDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDate(d);
    return {
      date: dateStr,
      label: daysShort[i] ?? '',
      num: d.getDate(),
      isToday: dateStr === today,
      isSelected: dateStr === selectedDate,
      hasLog: getMealsByDate(meals, dateStr).length > 0,
    };
  });

  return (
    <View className="px-5 pt-2 pb-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {days.map((day) => {
          const selected = day.isSelected;
          return (
            <Pressable
              key={day.date}
              onPress={() => onDayPress(day.date)}
              className={`items-center py-3 rounded-2xl border active:opacity-80 ${
                selected
                  ? 'bg-charcoal border-charcoal'
                  : day.isToday
                  ? 'bg-cream border-charcoal/30'
                  : 'bg-cream border-cream-border'
              }`}
              style={{ width: 52 }}
            >
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className={`text-[10px] uppercase tracking-widest ${
                  selected ? 'text-off-white' : 'text-muted'
                }`}
              >
                {day.label}
              </Text>
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className={`text-sm mt-1 ${selected ? 'text-off-white' : 'text-charcoal'}`}
              >
                {day.num}
              </Text>
              <View
                className={`w-1 h-1 rounded-full mt-1 ${
                  day.hasLog
                    ? selected
                      ? 'bg-off-white'
                      : 'bg-charcoal'
                    : 'bg-transparent'
                }`}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
