import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAccessibilityStore, UserRoleType } from '../store/useAccessibilityStore';
import { AccessibleCard } from '../../../components/common/accessible/AccessibleCard';
import { AccessibleButton } from '../../../components/common/accessible/AccessibleButton';

interface RoleOption {
  id: UserRoleType;
  title: string;
  badge: string;
  description: string;
  icon: string;
}

const roles: RoleOption[] = [
  {
    id: 'buyer',
    title: 'Conscious Buyer',
    badge: 'COMMUNITY SHOPPER',
    description: 'Shop accessible goods, hire artisans, and support local PWD creators.',
    icon: '🛒',
  },
  {
    id: 'artisan',
    title: 'PWD Artisan / Seller',
    badge: 'DISABLED CREATOR',
    description: 'Showcase handcrafted products, manage storefront inventory & sales.',
    icon: '🎨',
  },
  {
    id: 'freelancer',
    title: 'PWD Freelancer',
    badge: 'DIGITAL MICRO-SERVICES',
    description: 'Offer Sign Language interpretation, WCAG audit, translation & design.',
    icon: '💻',
  },
  {
    id: 'volunteer',
    title: 'Community Volunteer',
    badge: 'VERIFIER & ADVOCATE',
    description: 'Audit wheelchair ramps, review location accessibility & support PWDs.',
    icon: '🤝',
  },
];

export const Step3RoleSelection: React.FC = () => {
  const {
    highContrast,
    fontScale,
    formData,
    updateFormData,
    toggleAccommodation,
    nextStep,
    prevStep,
    announceText,
  } = useAccessibilityStore();

  const titleFontSize = Math.round(22 * fontScale);
  const subtitleFontSize = Math.round(13 * fontScale);
  const sectionTitleFontSize = Math.round(16 * fontScale);

  const handleNext = () => {
    announceText(`Selected role: ${formData.role}. Proceeding to Step 4 Verification.`);
    nextStep();
  };

  const isPwdUser = formData.role === 'artisan' || formData.role === 'freelancer';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.badge, { color: highContrast ? '#ffff00' : '#0d9488' }]}>
          STEP 3 OF 4
        </Text>
        <Text style={[styles.title, { fontSize: titleFontSize, color: highContrast ? '#ffffff' : '#0f172a' }]}>
          🎯 Role & Accommodations
        </Text>
        <Text style={[styles.subtitle, { fontSize: subtitleFontSize, color: highContrast ? '#cccccc' : '#64748b' }]}>
          Select your primary account role and customize your accessibility accommodation presets.
        </Text>
      </View>

      {/* Role Selection Group */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: sectionTitleFontSize, color: highContrast ? '#ffff00' : '#0f172a' }]}>
          Select Account Role:
        </Text>

        {roles.map((role) => (
          <AccessibleCard
            key={role.id}
            title={role.title}
            badge={role.badge}
            description={role.description}
            icon={role.icon}
            type="radio"
            selected={formData.role === role.id}
            onSelect={() => updateFormData({ role: role.id })}
            accessibilityLabel={`Select role: ${role.title}`}
            accessibilityHint={role.description}
          />
        ))}
      </View>

      {/* Conditional Sub-section: Accessibility Accommodation Presets */}
      <View style={[styles.accommodationBox, { borderColor: highContrast ? '#ffff00' : '#0d9488' }]}>
        <Text style={[styles.sectionTitle, { fontSize: sectionTitleFontSize, color: highContrast ? '#ffff00' : '#0d9488' }]}>
          ♿ Accessibility Accommodations {isPwdUser ? '(Recommended for PWD)' : '(Optional)'}:
        </Text>
        <Text style={styles.sectionDesc}>
          Enable specific accommodation flags so sellers, clients, and system features tailor your experience.
        </Text>

        <AccessibleCard
          title="Visual Accommodation"
          description="Screen reader priority, large text scaling, audio cues for UI elements."
          icon="👁️"
          type="checkbox"
          selected={formData.accommodations.visual}
          onSelect={() => toggleAccommodation('visual')}
          accessibilityLabel="Toggle Visual Accommodation preset"
        />

        <AccessibleCard
          title="Motor & Mobility Accommodation"
          description="Extra large touch targets (>=56px), single-tap shortcuts, voice action mode."
          icon="♿"
          type="checkbox"
          selected={formData.accommodations.motor}
          onSelect={() => toggleAccommodation('motor')}
          accessibilityLabel="Toggle Motor and Mobility Accommodation preset"
        />

        <AccessibleCard
          title="Hearing Accommodation"
          description="Visual alert notifications, captions for audio, Sign Language support badges."
          icon="🧏"
          type="checkbox"
          selected={formData.accommodations.hearing}
          onSelect={() => toggleAccommodation('hearing')}
          accessibilityLabel="Toggle Hearing Accommodation preset"
        />

        <AccessibleCard
          title="Cognitive & Focus Accommodation"
          description="Simplified clean screens, reduced animations, step-by-step guidance."
          icon="🧠"
          type="checkbox"
          selected={formData.accommodations.cognitive}
          onSelect={() => toggleAccommodation('cognitive')}
          accessibilityLabel="Toggle Cognitive Accommodation preset"
        />
      </View>

      {/* Navigation Buttons */}
      <View style={styles.btnRow}>
        <AccessibleButton
          title="⇦ Back"
          variant="outline"
          onPress={prevStep}
          accessibilityLabel="Go back to Step 2: User Credentials"
          style={styles.halfBtn}
        />
        <AccessibleButton
          title="Next: Verify ➔"
          variant="primary"
          onPress={handleNext}
          accessibilityLabel="Continue to Step 4: OTP Verification"
          style={styles.halfBtn}
        />
      </View>
    </ScrollView>
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
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 16,
  },
  accommodationBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'rgba(13, 148, 136, 0.05)',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  halfBtn: {
    flex: 1,
  },
});
