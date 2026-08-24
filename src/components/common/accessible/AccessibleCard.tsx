import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useAccessibilityStore } from '../../../features/auth/store/useAccessibilityStore';

export interface AccessibleCardProps {
  title: string;
  description: string;
  badge?: string;
  icon?: string;
  selected: boolean;
  onSelect: () => void;
  type?: 'radio' | 'checkbox';
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: ViewStyle;
}

export const AccessibleCard: React.FC<AccessibleCardProps> = ({
  title,
  description,
  badge,
  icon,
  selected,
  onSelect,
  type = 'radio',
  accessibilityLabel,
  accessibilityHint,
  style,
}) => {
  const { highContrast, fontScale, announceText } = useAccessibilityStore();

  const titleFontSize = Math.round(16 * fontScale);
  const descFontSize = Math.round(12 * fontScale);

  const handlePress = () => {
    announceText(`${title}. ${selected ? 'Deselected' : 'Selected'}`);
    onSelect();
  };

  const getBorderColor = (): string => {
    if (selected) return highContrast ? '#ffff00' : '#0d9488';
    return highContrast ? '#ffffff' : '#e2e8f0';
  };

  const getBackgroundColor = (): string => {
    if (selected) return highContrast ? '#222222' : '#f0fdfa';
    return highContrast ? '#111111' : '#ffffff';
  };

  const getTitleColor = (): string => {
    if (selected && highContrast) return '#ffff00';
    return highContrast ? '#ffffff' : '#0f172a';
  };

  const getDescColor = (): string => {
    return highContrast ? '#cccccc' : '#64748b';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      accessibilityRole={type === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[
        styles.card,
        {
          borderColor: getBorderColor(),
          backgroundColor: getBackgroundColor(),
          borderWidth: selected || highContrast ? 2 : 1,
        },
        style,
      ]}
    >
      {/* Indicator Circle/Box */}
      <View
        style={[
          type === 'radio' ? styles.radioOuter : styles.checkboxOuter,
          {
            borderColor: selected
              ? highContrast
                ? '#ffff00'
                : '#0d9488'
              : highContrast
              ? '#ffffff'
              : '#94a3b8',
            backgroundColor: selected
              ? highContrast
                ? '#ffff00'
                : '#0d9488'
              : 'transparent',
          },
        ]}
      >
        {selected && (
          <Text style={styles.checkMark}>
            {type === 'radio' ? '•' : '✓'}
          </Text>
        )}
      </View>

      {/* Main Text Content */}
      <View style={styles.content}>
        {Boolean(badge) && (
          <Text
            style={[
              styles.badge,
              {
                color: highContrast ? '#ffff00' : '#0d9488',
                backgroundColor: highContrast ? '#000000' : '#ccfbf1',
              },
            ]}
          >
            {badge}
          </Text>
        )}
        <Text style={[styles.title, { fontSize: titleFontSize, color: getTitleColor() }]}>
          {icon ? `${icon} ` : ''}{title}
        </Text>
        <Text style={[styles.description, { fontSize: descFontSize, color: getDescColor() }]}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 64,
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 6,
    width: '100%',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOuter: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 14,
  },
  content: {
    flex: 1,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontWeight: '800',
  },
  description: {
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 18,
  },
});
