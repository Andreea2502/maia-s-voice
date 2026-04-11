import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';

interface RTLViewProps extends ViewProps {
  children: React.ReactNode;
}

export function RTLView({ style, children, ...props }: RTLViewProps) {
  const { rtl } = useLanguage();
  return (
    <View
      style={[rtl && styles.rtl, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rtl: {
    direction: 'rtl' as any,
  },
});
