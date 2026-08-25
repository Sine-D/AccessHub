import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAccessibilityStore } from '../../../features/auth/store/useAccessibilityStore';

export interface AccessibleButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: React.ReactNode;
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  variant = 'primary',
  icon,
  accessibilityLabel,
  accessibilityHint,
  disabled,
  onPress,
  style,
  textStyle,
  ...props
}) => {
  const { highContrast, fontScale, announceText } = useAccessibilityStore();

  const handlePress = (e: any) => {
    if (disabled) return;
    announceText(title);
    if (onPress) onPress(e);
  };

  // Base font size scaled by dynamic fontScale (1.0x to 2.0x)
  const baseFontSize = 16;
  const scaledFontSize = Math.round(baseFontSize * fontScale);

  // Variant color mapping with WCAG 2.1 AAA High Contrast support
  const getBackgroundColor = (): string => {
    if (disabled) return highContrast ? '#333333' : '#cbd5e1';
    if (highContrast) {
      if (variant === 'primary') return '#ffff00'; // Yellow
      if (variant === 'secondary') return '#ffffff';
      if (variant === 'danger') return '#ff3333';
      return '#000000'; // Outline
    }
    if (variant === 'primary') return '#0d9488'; // Teal 600
    if (variant === 'secondary') return '#0f172a'; // Slate 900
    if (variant === 'danger') return '#dc2626'; // Red 600
    return 'transparent'; // Outline
  };

  const getTextColor = (): string => {
    if (disabled) return highContrast ? '#888888' : '#64748b';
    if (highContrast) {
      if (variant === 'outline') return '#ffff00';
      return '#000000';
    }
    if (variant === 'outline') return '#0d9488';
    return '#ffffff';
  };

  const getBorderColor = (): string => {
    if (highContrast) return '#ffff00';
    if (variant === 'outline') return '#0d9488';
    return 'transparent';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' || highContrast ? 2 : 0,
        },
        style,
      ]}
      {...props}
    >
      {icon && icon}
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: scaledFontSize,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    // WCAG AAA: Strict Minimum 48x48px touch target
    minHeight: 48,
    minWidth: 48,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 6,
  },
  text: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
