import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0–1
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}

export function MacroRing({
  size = 56,
  strokeWidth = 4,
  progress,
  icon,
  label,
  value,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);

  const animated = useSharedValue(0);
  useEffect(() => {
    animated.value = withTiming(clamped, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  const center = size / 2;

  return (
    <View className="flex-1 bg-cream border border-cream-border rounded-2xl p-4 items-center gap-2">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center},${center}`}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#eceae4"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <AnimatedCircle
              cx={center}
              cy={center}
              r={radius}
              stroke="#1c1c1c"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animatedProps={animatedProps}
            />
          </G>
        </Svg>
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
          <MaterialCommunityIcons name={icon} size={20} color="#5f5f5d" />
        </View>
      </View>
      <View className="items-center">
        <Text
          style={{ fontFamily: 'DMSans_400Regular' }}
          className="text-[10px] text-muted uppercase tracking-wider"
        >
          {label}
        </Text>
        <Text
          style={{ fontFamily: 'DMSans_600SemiBold' }}
          className="text-base text-charcoal"
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
