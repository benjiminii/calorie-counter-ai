import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

type FieldProps = {
  label: string;
  children: ReactNode;
};

export function Field({ label, children }: FieldProps) {
  return (
    <View className="mb-4">
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-[10px] text-muted uppercase tracking-widest mb-2"
      >
        {label}
      </Text>
      {children}
    </View>
  );
}
