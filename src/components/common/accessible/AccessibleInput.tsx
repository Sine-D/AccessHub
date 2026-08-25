import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useAccessibilityStore } from '../../../features/auth/store/useAccessibilityStore';

export interface AccessibleInputProps extends TextInputProps {
  label: string;
  error?: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  containerStyle?: ViewStyle;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  accessibilityLabel,
  accessibilityHint,
  containerStyle,
  onFocus,
  onBlur,
  secureTextEntry,
  value,
  onChangeText,
  placeholder,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,
  ...props
}) => {
  const { highContrast, fontScale } = useAccessibilityStore();
  const [isFocused, setIsFocused] = useState(false);

  const labelFontSize = Math.round(14 * fontScale);
  const inputFontSize = Math.round(16 * fontScale);
  const errorFontSize = Math.round(12 * fontScale);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // High contrast & focus palette calculation
  const getBorderColor = (): string => {
    if (error) return highContrast ? '#ff3333' : '#ef4444';
    if (isFocused) return highContrast ? '#ffff00' : '#0d9488';
    return highContrast ? '#ffffff' : '#cbd5e1';
  };

  const getBackgroundColor = (): string => {
    return highContrast ? '#111111' : '#f8fafc';
  };

  const getTextColor = (): string => {
    return highContrast ? '#ffffff' : '#0f172a';
  };

  const getLabelColor = (): string => {
    if (error) return highContrast ? '#ff3333' : '#dc2626';
    return highContrast ? '#ffff00' : '#334155';
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Field Label */}
      <Text style={[styles.label, { fontSize: labelFontSize, color: getLabelColor() }]}>
        {label}
      </Text>

      {/* Input Box Wrapper */}
      <View
        style={[
          styles.inputWrapper,
          {
            minHeight: 48,
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: isFocused || highContrast || error ? 2 : 1,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={highContrast ? '#888888' : '#94a3b8'}
          secureTextEntry={secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          style={[
            styles.input,
            {
              fontSize: inputFontSize,
              color: getTextColor(),
            },
          ]}
          {...props}
        />

        {/* Right Icon / Eye Button (Inside Input Box) */}
        {Boolean(rightIcon) && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRightIconPress}
            accessibilityRole="button"
            accessibilityLabel={rightIconAccessibilityLabel || 'Toggle input option'}
            style={styles.iconButton}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {/* Screen Reader Live Error Region */}
      {Boolean(error) && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={[
            styles.errorText,
            {
              fontSize: errorFontSize,
              color: highContrast ? '#ff3333' : '#dc2626',
            },
          ]}
        >
          ⚠️ {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  label: {
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 8,
  },
  iconButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  errorText: {
    fontWeight: '700',
    marginTop: 4,
  },
});
