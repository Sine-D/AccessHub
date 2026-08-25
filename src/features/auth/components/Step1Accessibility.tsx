import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useAccessibilityStore } from '../store/useAccessibilityStore';
import { AccessibleButton } from '../../../components/common/accessible/AccessibleButton';

export const Step1Accessibility: React.FC = () => {
  const {
    highContrast,
    fontScale,
    audioGuidance,
    setHighContrast,
    setFontScale,
    setAudioGuidance,
    nextStep,
  } = useAccessibilityStore();

  const titleFontSize = Math.round(22 * fontScale);
  const subtitleFontSize = Math.round(13 * fontScale);
  const labelFontSize = Math.round(16 * fontScale);

  const fontScales = [1.0, 1.25, 1.5, 2.0];

  return (
    <View style={styles.container}>
      {/* Step Header */}
      <View style={styles.header}>
        <Text style={[styles.badge, { color: highContrast ? '#ffff00' : '#0d9488' }]}>
          STEP 1 OF 4
        </Text>
        <Text style={[styles.title, { fontSize: titleFontSize, color: highContrast ? '#ffffff' : '#0f172a' }]}>
          ♿ Accessibility Setup
        </Text>
        <Text style={[styles.subtitle, { fontSize: subtitleFontSize, color: highContrast ? '#cccccc' : '#64748b' }]}>
          Customize your visual, font size, and screen reader preferences before registering.
        </Text>
      </View>

      {/* Option 1: High Contrast Mode */}
      <View style={[styles.rowCard, { borderColor: highContrast ? '#ffff00' : '#e2e8f0' }]}>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { fontSize: labelFontSize, color: highContrast ? '#ffff00' : '#0f172a' }]}>
            👁️ High Contrast Theme
          </Text>
          <Text style={styles.rowDesc}>
            High-contrast Black, Yellow, and White palette for maximum visibility.
          </Text>
        </View>
        <Switch
          value={highContrast}
          onValueChange={setHighContrast}
          trackColor={{ false: '#cbd5e1', true: '#0d9488' }}
          thumbColor={highContrast ? '#ffff00' : '#ffffff'}
          accessibilityLabel="Toggle High Contrast Theme"
          accessibilityHint="Switches between normal dark theme and high contrast yellow-and-black theme"
        />
      </View>

      {/* Option 2: Dynamic Font Scaling (1.0x to 2.0x) */}
      <View style={[styles.columnCard, { borderColor: highContrast ? '#ffff00' : '#e2e8f0' }]}>
        <Text style={[styles.rowTitle, { fontSize: labelFontSize, color: highContrast ? '#ffff00' : '#0f172a' }]}>
          🔍 Dynamic Text Scaling (1.0x - 2.0x)
        </Text>
        <Text style={styles.rowDesc}>
          Select font scale multiplier for text across the entire application.
        </Text>
        <View style={styles.scaleButtonGroup}>
          {fontScales.map((scale) => {
            const isSelected = fontScale === scale;
            return (
              <AccessibleButton
                key={scale}
                title={`${scale.toFixed(2).replace('.00', '')}x`}
                variant={isSelected ? 'primary' : 'outline'}
                onPress={() => setFontScale(scale)}
                accessibilityLabel={`Set Text Scale to ${scale} times normal`}
                style={styles.scaleBtn}
              />
            );
          })}
        </View>
      </View>

      {/* Option 3: Audio Guidance / Screen Reader Toggle */}
      <View style={[styles.rowCard, { borderColor: highContrast ? '#ffff00' : '#e2e8f0' }]}>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { fontSize: labelFontSize, color: highContrast ? '#ffff00' : '#0f172a' }]}>
            🔊 Audio & Voice Guidance
          </Text>
          <Text style={styles.rowDesc}>
            Spoken feedback for buttons, steps, and verification codes.
          </Text>
        </View>
        <Switch
          value={audioGuidance}
          onValueChange={setAudioGuidance}
          trackColor={{ false: '#cbd5e1', true: '#0d9488' }}
          thumbColor={audioGuidance ? '#ffff00' : '#ffffff'}
          accessibilityLabel="Toggle Audio & Voice Guidance"
          accessibilityHint="Enables or disables screen reader audio announcements"
        />
      </View>

      {/* Action Button */}
      <View style={styles.footer}>
        <AccessibleButton
          title="Continue to Credentials ➔"
          variant="primary"
          onPress={nextStep}
          accessibilityLabel="Continue to Step 2: User Credentials"
          accessibilityHint="Saves accessibility setup and moves to registration credentials"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    width: '100%',
  },
  header: {
    marginBottom: 20,
  },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 1,
  },
  title: {
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    lineHeight: 20,
  },
  rowCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  columnCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  rowDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  scaleButtonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  scaleBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  footer: {
    marginTop: 24,
  },
});
