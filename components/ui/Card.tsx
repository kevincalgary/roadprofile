import React from 'react';
import { View, ViewProps } from 'react-native';

export function Card({ className, children, ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={['rounded-2xl bg-white dark:bg-dark-card border border-black/5 dark:border-dark-border', className ?? ''].join(' ')}
      {...rest}
    >
      {children}
    </View>
  );
}
