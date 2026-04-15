import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, PanResponder } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated2, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MealRow } from '@/db/schema';
import { findModel } from '@/lib/providers/models';

interface MealCardProps {
  meal: MealRow;
  onDelete?: () => void;
}

const DELETE_WIDTH = 72;
const DELETE_THRESHOLD = -48;

function AnalyzingShimmer() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View className="flex-1 gap-2 justify-center">
      <Animated2.View style={[style, { height: 12, width: 120, borderRadius: 6, backgroundColor: '#eceae4' }]} />
      <Animated2.View style={[style, { height: 10, width: 80, borderRadius: 6, backgroundColor: '#eceae4' }]} />
    </View>
  );
}

export function MealCard({ meal, onDelete }: MealCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        translateX.setValue(Math.min(0, Math.max(-DELETE_WIDTH, g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        Animated.spring(translateX, {
          toValue: g.dx < DELETE_THRESHOLD ? -DELETE_WIDTH : 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const isAnalyzing = meal.status === 'analyzing';
  const isError = meal.status === 'error';

  return (
    <View className="mb-3 rounded-xl overflow-hidden">
      {/* Delete button behind */}
      <View
        className="absolute right-0 top-0 bottom-0 bg-red-500 items-center justify-center rounded-xl"
        style={{ width: DELETE_WIDTH }}
      >
        <Pressable onPress={onDelete} className="w-full h-full items-center justify-center">
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-white text-sm">✕</Text>
        </Pressable>
      </View>

      {/* Card content */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={() => router.push(`/log/${meal.id}`)}
          className="flex-row items-center bg-cream border border-cream-border rounded-xl p-3 gap-3 active:opacity-80"
        >
          {/* Thumbnail */}
          {meal.photoUri ? (
            <Image
              source={{ uri: meal.photoUri }}
              style={{ width: 56, height: 56, borderRadius: 8 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-14 h-14 rounded-lg bg-cream-border items-center justify-center">
              <Text style={{ fontSize: 24 }}>🍽️</Text>
            </View>
          )}

          {/* Info */}
          {isAnalyzing ? (
            <AnalyzingShimmer />
          ) : isError ? (
            <View className="flex-1 flex-row items-center gap-2">
              <Text style={{ fontSize: 18 }}>⚠️</Text>
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted text-sm">
                {t('error_analysis')}
              </Text>
            </View>
          ) : (
            <View className="flex-1">
              <Text
                style={{ fontFamily: 'DMSans_600SemiBold' }}
                className="text-base text-charcoal"
                numberOfLines={1}
              >
                {meal.name}
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-muted mt-0.5">
                {t('protein')} {meal.protein}{t('g')} · {t('carbs')} {meal.carbs}{t('g')} · {t('fat')} {meal.fat}{t('g')}
              </Text>
              {meal.model && (
                <View className="self-start mt-1 px-1.5 py-0.5 rounded bg-charcoal/5 border border-cream-border">
                  <Text
                    style={{ fontFamily: 'DMSans_400Regular' }}
                    className="text-[10px] text-muted"
                  >
                    {findModel(meal.model).label}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Calories */}
          {!isAnalyzing && (
            <View className="items-end">
              <Text style={{ fontFamily: 'DMSans_600SemiBold' }} className="text-xl text-charcoal">
                {isError ? '—' : meal.calories}
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-muted">
                {t('kcal')}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}
