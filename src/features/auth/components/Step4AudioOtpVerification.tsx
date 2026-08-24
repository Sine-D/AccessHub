import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAccessibilityStore } from '../store/useAccessibilityStore';
import { AccessibleInput } from '../../../components/common/accessible/AccessibleInput';
import { AccessibleButton } from '../../../components/common/accessible/AccessibleButton';
import { signUpWithEmail } from '../../../services/authService';

export interface Step4Props {
  onComplete: () => void;
}

export const Step4AudioOtpVerification: React.FC<Step4Props> = ({ onComplete }) => {
  const {
    highContrast,
    fontScale,
    formData,
    updateFormData,
    prevStep,
    announceText,
  } = useAccessibilityStore();

  const [generatedOtp, setGeneratedOtp] = useState<string>('849201');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const titleFontSize = Math.round(22 * fontScale);
  const subtitleFontSize = Math.round(13 * fontScale);
  const codeFontSize = Math.round(24 * fontScale);

  useEffect(() => {
    // Generate a simulated 6-digit verification OTP code on mount
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    updateFormData({ otpCode: code });

    announceText(
      `Step 4: Verification. A 6-digit verification code has been sent to ${formData.email}. Use the Audio Playback button if you need audio assistance.`
    );
  }, []);

  const handleAudioPlayback = () => {
    // Speak OTP code digit by digit for visual impairment (e.g. "8 . 4 . 9 . 2 . 0 . 1")
    const spacedDigits = generatedOtp.split('').join(' . ');
    announceText(`Your 6-digit verification code is: ${spacedDigits}`);
  };

  const handleVerify = async () => {
    if (!formData.otpCode || formData.otpCode.trim() !== generatedOtp) {
      const err = 'Invalid verification code. Please enter the correct 6-digit OTP code.';
      setError(err);
      announceText(err);
      return;
    }

    setLoading(true);
    setError('');
    announceText('Creating your AccessHub account...');

    try {
      // ── Real Supabase Sign-Up ─────────────────────────────────────────────
      const result = await signUpWithEmail(formData);

      if (!result.success) {
        // Show the real error (e.g. "User already registered", "Password too short", etc.)
        setError(result.error || 'Registration failed.');
        announceText(`Registration error: ${result.error}`);
        Alert.alert('❌ Registration Failed', result.error || 'Please try again.');
        return; // Do NOT proceed to onComplete
      }

      // ── Success ───────────────────────────────────────────────────────────
      announceText(`Account created successfully for ${formData.fullName}! Welcome to AccessHub.`);
      Alert.alert(
        '🎉 Account Activated!',
        `Welcome to AccessHub, ${formData.fullName}!\n\nCheck your email (${formData.email}) to confirm your account.`
      );
      onComplete();

    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred.';
      setError(msg);
      Alert.alert('❌ Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.badge, { color: highContrast ? '#ffff00' : '#0d9488' }]}>
          STEP 4 OF 4
        </Text>
        <Text style={[styles.title, { fontSize: titleFontSize, color: highContrast ? '#ffffff' : '#0f172a' }]}>
          🔒 Email & Audio Verification
        </Text>
        <Text style={[styles.subtitle, { fontSize: subtitleFontSize, color: highContrast ? '#cccccc' : '#64748b' }]}>
          A 6-digit OTP verification code was sent to <Text style={styles.emailHighlight}>{formData.email}</Text>.
        </Text>
      </View>

      {/* Audio Assistance Card */}
      <View style={[styles.audioBox, { borderColor: highContrast ? '#ffff00' : '#0d9488' }]}>
        <Text style={[styles.audioTitle, { color: highContrast ? '#ffff00' : '#0d9488' }]}>
          🔊 Audio Assistance Mode
        </Text>
        <Text style={styles.audioDesc}>
          Press the button below to listen to your 6-digit code read aloud digit-by-digit.
        </Text>

        <AccessibleButton
          title="🔊 Play Code Aloud"
          variant="outline"
          onPress={handleAudioPlayback}
          accessibilityLabel="Play 6-digit OTP code aloud"
          accessibilityHint="Speaks the verification code digit by digit using voice synthesis"
          style={styles.audioBtn}
        />
      </View>

      {/* Simulated Code Banner */}
      <View style={[styles.demoBanner, { backgroundColor: highContrast ? '#222222' : '#f1f5f9' }]}>
        <Text style={styles.demoLabel}>VERIFICATION CODE (SIMULATED):</Text>
        <Text style={[styles.demoCode, { fontSize: codeFontSize, color: highContrast ? '#ffff00' : '#0d9488' }]}>
          {generatedOtp}
        </Text>
      </View>

      {/* 6-Digit OTP Code Input */}
      <AccessibleInput
        label="Enter 6-Digit OTP Code *"
        placeholder="e.g. 849201"
        keyboardType="number-pad"
        maxLength={6}
        value={formData.otpCode}
        onChangeText={(otpCode) => updateFormData({ otpCode })}
        error={error}
        accessibilityLabel="6 digit verification code input"
        accessibilityHint="Type or paste the 6 digit OTP sent to your email"
      />

      {/* Navigation & Submission */}
      <View style={styles.btnRow}>
        <AccessibleButton
          title="⇦ Back"
          variant="outline"
          onPress={prevStep}
          accessibilityLabel="Go back to Step 3: Role and Accommodations"
          style={styles.halfBtn}
        />
        <AccessibleButton
          title={loading ? 'Activating...' : 'Verify & Activate 🚀'}
          variant="primary"
          disabled={loading}
          onPress={handleVerify}
          accessibilityLabel="Verify code and activate AccessHub account"
          style={styles.halfBtn}
        />
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color={highContrast ? '#ffff00' : '#0d9488'}
          style={{ marginTop: 16 }}
        />
      )}
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
  emailHighlight: {
    fontWeight: 'bold',
  },
  audioBox: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: 'rgba(13, 148, 136, 0.06)',
    marginVertical: 12,
  },
  audioTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  audioDesc: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 16,
  },
  audioBtn: {
    minHeight: 48,
  },
  demoBanner: {
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 8,
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  demoCode: {
    fontWeight: '900',
    letterSpacing: 6,
    marginTop: 4,
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
