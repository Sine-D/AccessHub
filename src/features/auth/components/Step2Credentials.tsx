import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAccessibilityStore } from '../store/useAccessibilityStore';
import { AccessibleInput } from '../../../components/common/accessible/AccessibleInput';
import { AccessibleButton } from '../../../components/common/accessible/AccessibleButton';

export const Step2Credentials: React.FC = () => {
  const {
    highContrast,
    fontScale,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    announceText,
  } = useAccessibilityStore();

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});

  const titleFontSize = Math.round(22 * fontScale);
  const subtitleFontSize = Math.round(13 * fontScale);

  const validate = (): boolean => {
    const newErrors: { fullName?: string; email?: string; password?: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. user@domain.com)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      announceText(`Validation error: ${firstError}`);
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validate()) {
      announceText('Credentials validated successfully. Moving to Step 3.');
      nextStep();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.badge, { color: highContrast ? '#ffff00' : '#0d9488' }]}>
          STEP 2 OF 4
        </Text>
        <Text style={[styles.title, { fontSize: titleFontSize, color: highContrast ? '#ffffff' : '#0f172a' }]}>
          👤 User Credentials
        </Text>
        <Text style={[styles.subtitle, { fontSize: subtitleFontSize, color: highContrast ? '#cccccc' : '#64748b' }]}>
          Enter your full name, email address for verification, and a secure password.
        </Text>
      </View>

      {/* Input 1: Full Name */}
      <AccessibleInput
        label="Full Name *"
        placeholder="e.g. Kavindi Perera"
        value={formData.fullName}
        onChangeText={(fullName) => updateFormData({ fullName })}
        error={errors.fullName}
        accessibilityLabel="Full Name input field"
        accessibilityHint="Type your official first and last name"
      />

      {/* Input 2: Email Address */}
      <AccessibleInput
        label="Email Address *"
        placeholder="e.g. user@domain.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(email) => updateFormData({ email })}
        error={errors.email}
        accessibilityLabel="Email address input field"
        accessibilityHint="Type your valid email address for Supabase verification code"
      />

      {/* Input 3: Password */}
      <AccessibleInput
        label="Password *"
        placeholder="Min. 6 characters"
        secureTextEntry={!showPassword}
        value={formData.password}
        onChangeText={(password) => updateFormData({ password })}
        error={errors.password}
        accessibilityLabel="Secure Password input field"
        accessibilityHint="Type a strong password with at least 6 characters"
      />

      {/* Toggle Password Visibility */}
      <AccessibleButton
        title={showPassword ? '🔒 Hide Password' : '👁️ Show Password'}
        variant="outline"
        onPress={() => setShowPassword(!showPassword)}
        accessibilityLabel={showPassword ? 'Hide password text' : 'Show password text'}
        style={styles.toggleBtn}
      />

      {/* Navigation Buttons */}
      <View style={styles.btnRow}>
        <AccessibleButton
          title="⇦ Back"
          variant="outline"
          onPress={prevStep}
          accessibilityLabel="Go back to Step 1: Accessibility Setup"
          style={styles.halfBtn}
        />
        <AccessibleButton
          title="Next: Role ➔"
          variant="primary"
          onPress={handleNext}
          accessibilityLabel="Continue to Step 3: Role and Accommodation Selection"
          style={styles.halfBtn}
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
    marginBottom: 16,
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
  toggleBtn: {
    alignSelf: 'flex-start',
    marginVertical: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  halfBtn: {
    flex: 1,
  },
});
