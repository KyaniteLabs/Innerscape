import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

/**
 * @fileoverview Shared Button component for mobile apps
 * @module components/Button
 */

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'soma' | 'mind' | 'flow' | 'pulse' | 'hub';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const VARIANT_COLORS: Record<string, string> = {
  primary: '#4F46E5',
  secondary: '#6B7280',
  ghost: 'transparent',
  soma: '#8B5CF6',
  mind: '#4F46E5',
  flow: '#F59E0B',
  pulse: '#22C55E',
  hub: '#3B82F6',
};

export function Button({ 
  label, 
  onPress, 
  variant = 'primary', 
  isLoading = false, 
  disabled = false,
  style,
  labelStyle
}: ButtonProps) {
  const backgroundColor = variant === 'ghost' ? 'transparent' : VARIANT_COLORS[variant];
  const textColor = variant === 'ghost' ? '#4B5563' : '#FFFFFF';

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor }, 
        disabled && styles.disabled,
        style
      ]} 
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }, labelStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
