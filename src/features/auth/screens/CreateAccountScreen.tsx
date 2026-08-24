import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAccessibilityStore } from '../store/useAccessibilityStore';
import { Step1Accessibility } from '../components/Step1Accessibility';
import { Step2Credentials } from '../components/Step2Credentials';
import { Step3RoleSelection } from '../components/Step3RoleSelection';
import { Step4AudioOtpVerification } from '../components/Step4AudioOtpVerification';

export interface CreateAccountScreenProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({
  onCancel,
  onSuccess,
}) => {
  const {
    step,
    highContrast,
    fontScale,
    announceText,
    resetForm,
  } = useAccessibilityStore();

  useEffect(() => {
    announceText(`Entering Step ${step} of 4 for Registration Wizard.`);
  }, [step]);

  const handleCancel = () => {
    resetForm();
    if (onCancel) onCancel();
  };

  const handleSuccess = () => {
    resetForm();
    if (onSuccess) onSuccess();
  };

  const themeBg = highContrast ? '#000000' : '#ffffff';
  const textColor = highContrast ? '#ffff00' : '#0f172a';
  const subTextColor = highContrast ? '#ffffff' : '#64748b';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBg }]}>
        <StatusBar
          barStyle={highContrast ? 'light-content' : 'dark-content'}
          backgroundColor={themeBg}
        />

        {/* Top Header Bar */}
        <View style={[styles.topBar, { borderBottomColor: highContrast ? '#ffff00' : '#e2e8f0' }]}>
          <TouchableOpacity
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel registration and return to login"
            style={styles.backBtn}
          >
            <Text style={[styles.backText, { color: highContrast ? '#ffff00' : '#0d9488' }]}>
              ✕ Cancel
            </Text>
          </TouchableOpacity>

          <Text
            accessibilityRole="header"
            style={[styles.headerTitle, { color: textColor }]}
          >
            AccessHub Registration
          </Text>

          <Text style={[styles.stepBadge, { color: highContrast ? '#ffff00' : '#0d9488' }]}>
            {step}/4
          </Text>
        </View>

        {/* Progress Bar (WCAG AAA contrast) */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${(step / 4) * 100}%`,
                backgroundColor: highContrast ? '#ffff00' : '#0d9488',
              },
            ]}
          />
        </View>

        {/* Main Step Content Area */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && <Step1Accessibility />}
          {step === 2 && <Step2Credentials />}
          {step === 3 && <Step3RoleSelection />}
          {step === 4 && <Step4AudioOtpVerification onComplete={handleSuccess} />}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backText: {
    fontWeight: '800',
    fontSize: 14,
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 16,
  },
  stepBadge: {
    fontWeight: '900',
    fontSize: 14,
  },
  progressTrack: {
    height: 6,
    width: '100%',
    backgroundColor: '#e2e8f0',
  },
  progressBar: {
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
