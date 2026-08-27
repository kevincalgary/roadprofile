import React from 'react';
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-mint active:bg-mint-500',
  secondary: 'bg-charcoal dark:bg-dark-card active:opacity-90',
  outline: 'bg-transparent border border-asphalt/40 dark:border-dark-border active:bg-black/5 dark:active:bg-white/5',
  ghost: 'bg-transparent active:bg-black/5 dark:active:bg-white/5',
  destructive: 'bg-danger active:opacity-90',
};

const VARIANT_TEXT_CLASSES: Record<Variant, string> = {
  primary: 'text-mint-900',
  secondary: 'text-white',
  outline: 'text-charcoal dark:text-dark-text',
  ghost: 'text-charcoal dark:text-dark-text',
  destructive: 'text-white',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-9 px-4',
  md: 'h-11 px-5',
  lg: 'h-[52px] px-6',
};

const SIZE_TEXT_CLASSES: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  fullWidth,
  disabled,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      className={[
        'flex-row items-center justify-center rounded-pill',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50' : '',
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#0F2518' : '#fff'} />
      ) : (
        <>
          {icon}
          <Text className={['font-semibold', VARIANT_TEXT_CLASSES[variant], SIZE_TEXT_CLASSES[size], icon ? 'ml-2' : ''].join(' ')}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
