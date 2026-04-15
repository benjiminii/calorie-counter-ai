import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieRingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0–1
  label: string;
  sublabel: string;
  color?: string;
  trackColor?: string;
}

export function CalorieRing({
  size,
  strokeWidth,
  progress,
  label,
  sublabel,
  color = '#1c1c1c',
  trackColor = '#eceae4',
}: CalorieRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(clampedProgress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const center = size / 2;

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center},${center}`}>
          {/* Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Fill */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      {/* Center label */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'DMSans_600SemiBold',
            fontSize: size * 0.22,
            color: '#1c1c1c',
            lineHeight: size * 0.26,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: size * 0.14,
            color: '#5f5f5d',
          }}
        >
          {sublabel}
        </Text>
      </View>
    </View>
  );
}
