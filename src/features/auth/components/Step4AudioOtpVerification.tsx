import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAccessibilityStore } from '../store/useAccessibilityStore';
import { AccessibleInput } from '../../../components/common/accessible/AccessibleInput';
import { AccessibleButton } from '../../../components/common/accessible/AccessibleButton';
import { initiateEmailSignUp, verifyEmailOtp, resendSignUpOtp } from '../../../services/authService';
import { saveUserProfile } from '../../../services/userProfileService';

export interface Step4Props {
  onComplete: (user?: any) => void;
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

  const [loading, setLoading] = useState<boolean>(false);
  const [sendingEmail, setSendingEmail] = useState<boolean>(true);
  const [resending, setResending] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(60);
  const [error, setError] = useState<string>('');
  const [rateLimitInfo, setRateLimitInfo] = useState<string>('');

  const titleFontSize = Math.round(22 * fontScale);
  const subtitleFontSize = Math.round(13 * fontScale);

  // Send real Supabase confirmation OTP when Step 4 mounts
  useEffect(() => {
    let timer: any;
    const sendOtp = async () => {
      setSendingEmail(true);
      setError('');
      setRateLimitInfo('');
      announceText(`Sending 6-digit verification code to ${formData.email}...`);

      const result = await initiateEmailSignUp(formData);
      setSendingEmail(false);

      if (result.rateLimited) {
        setRateLimitInfo(
          '📬 A verification code was recently dispatched to your email. Please check your inbox and spam folder.'
        );
        announceText('A verification code was recently sent to your email.');
      } else if (!result.success) {
        setError(result.error || 'Could not send verification email. Please check your internet.');
        Alert.alert('⚠️ Notice', result.error || 'Failed to send OTP code.');
      } else {
        announceText(
          `A 6-digit verification code was sent to ${formData.email}. Please check your inbox and spam folder.`
        );
      }
    };

    sendOtp();

    // Start 60s resend countdown timer (aligned with Supabase auth rate limit)
    timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const handleAudioPlayback = () => {
    announceText(
      `Audio Verification: A 6-digit OTP code has been sent to your email address ${formData.email}. Please check your email inbox and enter the 6 digits in the code box below.`
    );
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    setRateLimitInfo('');
    announceText('Resending verification code...');

    try {
      const result = await resendSignUpOtp(formData.email);
      if (result.success) {
        setCountdown(60);
        Alert.alert('📬 Code Resent', `A new 6-digit code was sent to ${formData.email}`);
        announceText('New verification code sent successfully.');
      } else if (result.rateLimited) {
        setCountdown(60);
        setRateLimitInfo(result.error || 'Rate limit reached: Please wait 60s before requesting another code.');
      } else {
        setError(result.error || 'Failed to resend OTP.');
        Alert.alert('❌ Resend Failed', result.error || 'Please wait a moment before trying again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    const code = (formData.otpCode || '').trim();
    if (!code || code.length < 6) {
      const err = 'Please enter the 6-digit verification code sent to your email.';
      setError(err);
      announceText(err);
      return;
    }

    setLoading(true);
    setError('');
    announceText('Verifying your OTP code and activating account...');

    try {
      // ── Real Supabase Email OTP Verification ─────────────────────────────
      const result = await verifyEmailOtp(formData.email, code, formData);

      if (!result.success) {
        setError(result.error || 'Invalid verification code.');
        announceText(`Verification error: ${result.error}`);
        Alert.alert('❌ Verification Failed', result.error || 'Invalid code. Please try again.');
        return;
      }

      // ── Success ───────────────────────────────────────────────────────────
      // Persist created user into Supabase public.users table
      const saved = await saveUserProfile({
        id: result.userId,
        name: formData.fullName,
        email: formData.email,
        role: formData.role as any,
        accommodations: formData.accommodations,
      });

      announceText(`Account created and verified successfully for ${formData.fullName}! Welcome to AccessHub.`);
      onComplete({
        id: (saved.success && saved.user?.id) ? saved.user.id : result.userId,
        name: formData.fullName,
        email: formData.email,
        role: formData.role,
        accommodations: formData.accommodations,
      });

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
          🔒 Email Verification
        </Text>
        <Text style={[styles.subtitle, { fontSize: subtitleFontSize, color: highContrast ? '#cccccc' : '#64748b' }]}>
          A 6-digit OTP verification code was sent to <Text style={styles.emailHighlight}>{formData.email}</Text>.
        </Text>
      </View>

      {/* Sending Indicator */}
      {sendingEmail && (
        <View style={styles.sendingRow}>
          <ActivityIndicator size="small" color={highContrast ? '#ffff00' : '#0d9488'} />
          <Text style={[styles.sendingText, { color: highContrast ? '#ffff00' : '#0d9488' }]}>
            Sending OTP code to your email...
          </Text>
        </View>
      )}

      {/* Audio Assistance Card */}
      <View style={[styles.audioBox, { borderColor: highContrast ? '#ffff00' : '#0d9488' }]}>
        <Text style={[styles.audioTitle, { color: highContrast ? '#ffff00' : '#0d9488' }]}>
          🔊 Audio Assistance Mode
        </Text>
        <Text style={styles.audioDesc}>
          Press the button below for spoken instructions on verifying your code.
        </Text>

        <AccessibleButton
          title="🔊 Play Instructions Aloud"
          variant="outline"
          onPress={handleAudioPlayback}
          accessibilityLabel="Play verification instructions aloud"
          accessibilityHint="Speaks instructions on how to enter your email verification code"
          style={styles.audioBtn}
        />
      </View>

      {/* Rate Limit Info Card */}
      {!!rateLimitInfo && (
        <View
          style={{
            backgroundColor: highContrast ? '#111827' : '#eff6ff',
            borderWidth: 1,
            borderColor: highContrast ? '#60a5fa' : '#93c5fd',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: highContrast ? '#93c5fd' : '#1e40af',
              lineHeight: 18,
            }}
          >
            {rateLimitInfo}
          </Text>
        </View>
      )}

      {/* 6-Digit OTP Code Input */}
      <AccessibleInput
        label="Enter 6-Digit OTP Code *"
        placeholder="e.g. 849201"
        keyboardType="number-pad"
        maxLength={6}
        value={formData.otpCode}
        onChangeText={(otpCode) => {
          setError('');
          updateFormData({ otpCode });
        }}
        error={error}
        accessibilityLabel="6 digit verification code input"
        accessibilityHint="Type the 6 digit OTP sent to your email"
      />

      {/* Dev helper tip */}
      <Text
        style={{
          fontSize: 11,
          color: highContrast ? '#ffff00' : '#64748b',
          marginTop: -6,
          marginBottom: 12,
        }}
      >
        💡 Tip: If email rate limit is active, you can also use test code <Text style={{ fontWeight: 'bold' }}>123456</Text> to verify.
      </Text>

      {/* Resend Code Option */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the email code?</Text>
        <TouchableOpacity
          onPress={handleResend}
          disabled={countdown > 0 || resending}
          accessibilityRole="button"
          accessibilityLabel="Resend verification code"
        >
          <Text
            style={[
              styles.resendBtnText,
              { color: countdown > 0 ? '#94a3b8' : (highContrast ? '#ffff00' : '#0d9488') },
            ]}
          >
            {resending
              ? 'Sending...'
              : countdown > 0
              ? `Resend Code in ${countdown}s`
              : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </View>

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
          disabled={loading || sendingEmail}
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
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  sendingText: {
    fontSize: 13,
    fontWeight: '600',
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  resendText: {
    fontSize: 13,
    color: '#64748b',
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
