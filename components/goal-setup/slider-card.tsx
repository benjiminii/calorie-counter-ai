import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

type SliderCardProps = {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
};

export function SliderCard({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: SliderCardProps) {
  const isDecimal = step < 1;
  const formatted = isDecimal ? value.toFixed(1) : String(Math.round(value));
  const [text, setText] = useState(formatted);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatted);
  }, [formatted, focused]);

  function commit() {
    const parsed = parseFloat(text.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      const snapped = isDecimal ? Math.round(clamped * 2) / 2 : Math.round(clamped);
      onChange(snapped);
      setText(isDecimal ? snapped.toFixed(1) : String(snapped));
    } else {
      setText(formatted);
    }
    setFocused(false);
  }

  return (
    <View className="bg-cream border border-cream-border rounded-2xl p-4 mb-3">
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-[10px] text-muted uppercase tracking-widest mb-2"
      >
        {label}
      </Text>
      <View className="flex-row items-baseline gap-1">
        <TextInput
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused(true)}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="decimal-pad"
          returnKeyType="done"
          selectTextOnFocus
          style={{ fontFamily: 'DMSans_600SemiBold', padding: 0, minWidth: 60 }}
          className="text-2xl text-charcoal tracking-tight"
        />
        {unit && (
          <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-xs text-muted">
            {unit}
          </Text>
        )}
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        minimumTrackTintColor="#1c1c1c"
        maximumTrackTintColor="#eceae4"
        thumbTintColor="#1c1c1c"
        onValueChange={(v) => {
          onChange(v)
        }}
      />
    </View>
  );
}
