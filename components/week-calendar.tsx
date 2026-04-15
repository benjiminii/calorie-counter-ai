import React from 'react';
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
    <View className="px-5 py-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 4 }}
      >
        {days.map((day) => (
          <Pressable
            key={day.date}
            onPress={() => onDayPress(day.date)}
            className="items-center py-1"
            style={{ width: 40 }}
          >
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className={`text-xs mb-1 ${day.isSelected ? 'text-off-white' : 'text-muted'}`}
            >
              {day.label}
            </Text>
            <View
              className={`w-10 h-10 rounded-full items-center justify-center ${
                day.isSelected ? 'bg-charcoal' : day.isToday ? 'bg-cream-border' : 'bg-transparent'
              }`}
            >
              <Text
                style={{
                  fontFamily: day.isToday || day.isSelected ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                }}
                className={`text-sm ${day.isSelected ? 'text-off-white' : 'text-charcoal'}`}
              >
                {day.num}
              </Text>
            </View>
            <View className="w-1 h-1 mt-1">
              {day.hasLog && !day.isSelected && (
                <View className="w-1 h-1 rounded-full bg-charcoal/40" />
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
