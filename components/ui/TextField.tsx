import React, { forwardRef } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helperText, required, className, ...rest },
  ref
) {
  return (
    <View className="w-full">
      {label && (
        <Text className="text-sm font-medium text-charcoal dark:text-dark-text mb-1.5">
          {label}
          {required ? ' *' : ''}
        </Text>
      )}
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor="#8A919B"
        className={[
          'h-12 px-4 rounded-xl bg-cardgray dark:bg-dark-card text-charcoal dark:text-dark-text text-base',
          error ? 'border border-danger' : 'border border-transparent',
          className ?? '',
        ].join(' ')}
        {...rest}
      />
      {error ? (
        <Text className="text-xs text-danger mt-1" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-1">{helperText}</Text>
      ) : null}
    </View>
  );
});
