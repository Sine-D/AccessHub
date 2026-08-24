import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAccessibilityStore } from '../store/useAccessibilityStore';
import { AccessibleInput } from '../../../components/common/accessible/AccessibleInput';
import { AccessibleButton } from '../../../components/common/accessible/AccessibleButton';
import { supabase } from '../../../services/supabaseClient';
import { signInWithGoogle } from '../../../services/authService';

const googleLogoImage = require('../../../../public/images/google.jpg');

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
  const [googleLoading, setGoogleLoading] = useState(false);

  const titleFontSize = Math.round(22 * fontScale);
  const subtitleFontSize = Math.round(13 * fontScale);

  // Strong Password Strength Calculator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Enter password', color: '#cbd5e1' };

    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { score: 1, label: 'Weak ⚠️ (Min 8 chars, A-Z, 0-9, symbol)', color: highContrast ? '#ff3333' : '#ef4444' };
    }
    if (score === 3) {
      return { score: 2, label: 'Medium 🟡 (Add a special symbol e.g. @,#,$)', color: highContrast ? '#ffff00' : '#f59e0b' };
    }
    return { score: 3, label: 'Strong 🔒', color: highContrast ? '#ffff00' : '#10b981' };
  };

  const strength = getPasswordStrength(formData.password);

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

    // Strong Password Policy Validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter (A-Z)';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number (0-9)';
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character (!@#$%^&*)';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      announceText(`Validation error: ${firstError}`);
      return false;
    }

    return true;
  };

  // Google OAuth Social Sign-In Handler (Real — Web + Expo Go)
  const handleGoogleSignIn = async () => {
    announceText('Initiating Google Authentication...');
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();

      if (!result.success) {
        // Show error to user
        Alert.alert(
          '❌ Google Sign-In Failed',
          result.error || 'Could not connect to Google. Please try again.'
        );
        return;
      }

      // On Web: signInWithOAuth triggers a redirect — this code won't be reached
      // On Expo Go: if we get here, OAuth succeeded
      announceText('Successfully authenticated with Google!');
      Alert.alert(
        '🌐 Google Sign-In Successful',
        'Your Google account was verified. Proceeding to Step 3.'
      );
      nextStep();
    } catch (err: any) {
      Alert.alert('❌ Error', err?.message || 'An unexpected error occurred.');
    } finally {
      setGoogleLoading(false);
    }
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
          👤 User Credentials & Auth
        </Text>
        <Text style={[styles.subtitle, { fontSize: subtitleFontSize, color: highContrast ? '#cccccc' : '#64748b' }]}>
          Sign in instantly with Google or enter strong credentials.
        </Text>
      </View>

      {/* Google OAuth Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={googleLoading}
        onPress={handleGoogleSignIn}
        accessibilityRole="button"
        accessibilityLabel="Sign in or register using Google Account"
        accessibilityHint="Autofills your name and email using verified Google OAuth"
        accessibilityState={{ disabled: googleLoading }}
        style={[
          styles.googleBtn,
          {
            borderColor: highContrast ? '#ffff00' : '#dadce0',
            borderWidth: highContrast ? 2 : 1,
            opacity: googleLoading ? 0.7 : 1,
          },
        ]}
      >
        {googleLoading ? (
          <ActivityIndicator size="small" color="#1a73e8" style={{ marginRight: 10 }} />
        ) : (
          <Image
            source={googleLogoImage}
            style={styles.googleLogoImg}
            resizeMode="contain"
          />
        )}
        <Text style={[styles.googleBtnText, { color: highContrast ? '#000000' : '#1a73e8' }]}>
          {googleLoading ? 'Connecting Google...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: highContrast ? '#ffffff' : '#e2e8f0' }]} />
        <Text style={[styles.dividerText, { color: highContrast ? '#ffff00' : '#64748b' }]}>
          OR MANUAL REGISTRATION
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: highContrast ? '#ffffff' : '#e2e8f0' }]} />
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

      {/* Input 3: Strong Password */}
      <AccessibleInput
        label="Strong Password *"
        placeholder="Min 8 chars, 1 Uppercase, 1 Number, 1 Symbol"
        secureTextEntry={!showPassword}
        value={formData.password}
        onChangeText={(password) => updateFormData({ password })}
        error={errors.password}
        accessibilityLabel="Strong Password input field"
        accessibilityHint="Requires at least 8 characters with 1 uppercase letter, 1 number, and 1 special symbol"
        rightIcon={
          <Text style={{ fontSize: 18 }}>
            {showPassword ? '👁️' : '🙈'}
          </Text>
        }
        onRightIconPress={() => {
          const nextState = !showPassword;
          setShowPassword(nextState);
          announceText(nextState ? 'Password visible' : 'Password hidden');
        }}
        rightIconAccessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
      />

      {/* Password Strength Indicator Bar */}
      {Boolean(formData.password) && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthTrack}>
            <View
              style={[
                styles.strengthFill,
                {
                  width: `${(strength.score / 3) * 100}%`,
                  backgroundColor: strength.color,
                },
              ]}
            />
          </View>
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.strengthLabel, { color: strength.color }]}
          >
            {strength.label}
          </Text>
        </View>
      )}

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
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dadce0',
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    minHeight: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  googleLogoImg: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleBtnText: {
    color: '#1a73e8',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  strengthContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  strengthTrack: {
    height: 6,
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  halfBtn: {
    flex: 1,
  },
});
