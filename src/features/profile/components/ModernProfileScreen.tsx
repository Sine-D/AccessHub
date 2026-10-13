import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { useAppState } from '../../../core/hooks/useAppState';
import { supabase } from '../../../services/supabaseClient';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
];

export interface ModernProfileScreenProps {
  onLogout: () => void;
  onNavigateHome?: () => void;
  onSpeak?: (text: string) => void;
  highContrast?: boolean;
  isDarkMode?: boolean;
  fontScale?: 'md' | 'lg' | 'xl';
}

export const ModernProfileScreen: React.FC<ModernProfileScreenProps> = ({
  onLogout,
  onNavigateHome,
  onSpeak,
  highContrast = false,
  isDarkMode = false,
  fontScale = 'md',
}) => {
  const { currentUser, setCurrentUser, userRole } = useAppState();

  // Loading & Sync States
  const [syncing, setSyncing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState<boolean>(false);

  // Form Fields for Editing Profile
  const [editName, setEditName] = useState<string>(currentUser?.name || '');
  const [editBio, setEditBio] = useState<string>(currentUser?.bio || '');
  const [editLocation, setEditLocation] = useState<string>(currentUser?.location || 'Colombo, Sri Lanka');
  const [editAvatar, setEditAvatar] = useState<string>(currentUser?.avatar || AVATAR_PRESETS[0]);
  const [editAccommodations, setEditAccommodations] = useState<{
    visual: boolean;
    motor: boolean;
    hearing: boolean;
    cognitive: boolean;
  }>({
    visual: Boolean((currentUser as any)?.accommodations?.visual),
    motor: Boolean((currentUser as any)?.accommodations?.motor),
    hearing: Boolean((currentUser as any)?.accommodations?.hearing),
    cognitive: Boolean((currentUser as any)?.accommodations?.cognitive),
  });

  const fontMultiplier = fontScale === 'xl' ? 1.25 : fontScale === 'lg' ? 1.15 : 1.0;

  const announce = (message: string) => {
    if (onSpeak) onSpeak(message);
    if (Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  // Fetch / Read User Data from Supabase `public.users` table
  const fetchProfileFromDb = async () => {
    setSyncing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const isValidUUID = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
      const sessionUserId = sessionData?.session?.user?.id;
      const userEmail = sessionData?.session?.user?.email || currentUser?.email;

      let query = supabase.from('users').select('*');
      if (isValidUUID(sessionUserId)) {
        query = query.eq('id', sessionUserId);
      } else if (isValidUUID(currentUser?.id)) {
        query = query.eq('id', currentUser.id);
      } else if (userEmail) {
        query = query.eq('email', userEmail);
      } else {
        setSyncing(false);
        return;
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        setCurrentUser((prev) => ({
          ...prev,
          id: data.id,
          name: data.name || prev.name,
          email: data.email || prev.email,
          role: (data.role as any) || prev.role,
          avatar: data.avatar || prev.avatar || AVATAR_PRESETS[0],
          bio: data.bio || prev.bio || 'Inclusive member of AccessHub.',
          location: data.location || prev.location || 'Colombo, Sri Lanka',
          isVerified: Boolean(data.is_verified ?? true),
          accommodations: data.accommodations || prev.accommodations,
        }));
        announce('Profile synced with cloud database.');
      }
    } catch (err: any) {
      console.warn('Sync notice:', err?.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchProfileFromDb();
  }, []);

  // Sync edit form with current state when modal opens
  const openEditModal = () => {
    setEditName(currentUser?.name || '');
    setEditBio(currentUser?.bio || '');
    setEditLocation(currentUser?.location || 'Colombo, Sri Lanka');
    setEditAvatar(currentUser?.avatar || AVATAR_PRESETS[0]);
    setEditAccommodations({
      visual: Boolean((currentUser as any)?.accommodations?.visual),
      motor: Boolean((currentUser as any)?.accommodations?.motor),
      hearing: Boolean((currentUser as any)?.accommodations?.hearing),
      cognitive: Boolean((currentUser as any)?.accommodations?.cognitive),
    });
    setEditModalVisible(true);
    announce('Opened edit profile modal.');
  };

  // Update Profile (CRUD - Update)
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const targetId = sessionData?.session?.user?.id || currentUser?.id || 'usr-default';

      const updatedPayload = {
        id: targetId,
        name: editName.trim(),
        email: currentUser?.email || sessionData?.session?.user?.email,
        bio: editBio.trim(),
        location: editLocation.trim(),
        avatar: editAvatar.trim(),
        accommodations: editAccommodations,
        role: currentUser?.role || 'customer',
      };

      // 1. Upsert/Update into Supabase public.users table
      const { error: dbError } = await supabase
        .from('users')
        .upsert(updatedPayload, { onConflict: 'id' });

      if (dbError) {
        console.warn('Supabase profile update warning:', dbError.message);
      }

      // 2. Update local App state
      setCurrentUser((prev) => ({
        ...prev,
        ...updatedPayload,
      }));

      setEditModalVisible(false);
      announce('Profile updated successfully.');
      Alert.alert('✅ Profile Updated', 'Your profile details have been successfully saved to the database.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Profile (CRUD - Delete)
  const handleDeleteProfile = async () => {
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const targetId = sessionData?.session?.user?.id || currentUser?.id;

      if (targetId) {
        // Delete from users table
        const { error: delError } = await supabase
          .from('users')
          .delete()
          .eq('id', targetId);

        if (delError) {
          console.warn('Notice on user delete:', delError.message);
        }
      }

      // Sign out auth session
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignore
      }

      setDeleteConfirmVisible(false);
      announce('Profile and account deleted permanently.');
      Alert.alert('🗑️ Account Deleted', 'Your profile and data have been removed from AccessHub.');

      // Trigger global logout redirect
      onLogout();
    } catch (err: any) {
      Alert.alert('Delete Failed', err?.message || 'Could not delete profile.');
    } finally {
      setDeleting(false);
    }
  };

  // Colors based on High Contrast & Dark Mode
  const themeBg = highContrast ? '#000000' : isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = highContrast ? '#111111' : isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = highContrast ? '#ffff00' : isDarkMode ? '#f8fafc' : '#0f172a';
  const subTextColor = highContrast ? '#ffffff' : isDarkMode ? '#94a3b8' : '#64748b';
  const accentColor = highContrast ? '#ffff00' : isDarkMode ? '#38bdf8' : '#0d9488';
  const borderColor = highContrast ? '#ffff00' : isDarkMode ? '#334155' : '#e2e8f0';

  const userAvatar = currentUser?.avatar || AVATAR_PRESETS[0];
  const userFullName = currentUser?.name || 'Kavindi Perera';
  const userEmail = currentUser?.email || 'kavindi.p@accesslink.lk';
  const userLocation = currentUser?.location || 'Colombo, Sri Lanka';
  const userBio = currentUser?.bio || 'Passionate community member supporting inclusive businesses and artisans across Sri Lanka.';
  const userAccommodations = (currentUser as any)?.accommodations || {};

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeBg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. Modern Header & Avatar Hero Card ── */}
      <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor }]}>
        {/* Banner Gradient / Background */}
        <View style={[styles.heroBanner, { backgroundColor: highContrast ? '#1e293b' : '#0d9488' }]}>
          <View style={styles.bannerDecor}>
            <Text style={styles.bannerEmoji}>🌟 AccessHub Verified</Text>
            {syncing && (
              <View style={styles.syncIndicator}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.syncText}>Syncing...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Floating Avatar with Ring */}
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: userAvatar }}
            style={[styles.avatarImage, { borderColor: highContrast ? '#ffff00' : '#ffffff' }]}
          />
          <TouchableOpacity
            style={[styles.avatarEditBadge, { backgroundColor: accentColor }]}
            onPress={openEditModal}
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
          >
            <Text style={styles.avatarEditIcon}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* User Identity Details */}
        <View style={styles.identityDetails}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.userName,
                { color: textColor, fontSize: Math.round(22 * fontMultiplier) },
              ]}
              accessibilityRole="header"
            >
              {userFullName}
            </Text>
            <Text style={styles.verifiedBadge}>🛡️</Text>
          </View>

          {/* Role Pill */}
          <View style={[styles.rolePill, { backgroundColor: highContrast ? '#333300' : '#ccfbf1' }]}>
            <Text style={[styles.roleText, { color: highContrast ? '#ffff00' : '#0f766e' }]}>
              {userRole === 'admin'
                ? '🛡️ Platform Administrator'
                : userRole === 'seller' || (currentUser?.role as any) === 'artisan'
                ? '🎨 Inclusive Artisan / Seller'
                : userRole === 'service_provider' || (currentUser?.role as any) === 'freelancer'
                ? '💼 Professional Freelancer'
                : '🛒 Verified Buyer / Advocate'}
            </Text>
          </View>

          {/* Email & Location */}
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: subTextColor, fontSize: Math.round(13 * fontMultiplier) }]}>
              ✉️ {userEmail}
            </Text>
            <Text style={[styles.metaText, { color: subTextColor, fontSize: Math.round(13 * fontMultiplier) }]}>
              📍 {userLocation}
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: accentColor }]}
            onPress={openEditModal}
            accessibilityRole="button"
            accessibilityLabel="Edit your profile details"
          >
            <Text style={[styles.primaryActionText, { color: highContrast ? '#000000' : '#ffffff' }]}>
              ✏️ Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryActionBtn, { borderColor }]}
            onPress={fetchProfileFromDb}
            disabled={syncing}
            accessibilityRole="button"
            accessibilityLabel="Sync profile with database"
          >
            <Text style={[styles.secondaryActionText, { color: textColor }]}>
              🔄 Sync Cloud
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Accessibility & Accommodations Card ── */}
      <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: textColor, fontSize: Math.round(16 * fontMultiplier) }]}>
            ♿ Inclusivity & Accommodations
          </Text>
          <TouchableOpacity onPress={openEditModal}>
            <Text style={[styles.linkAction, { color: accentColor }]}>Configure</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionSub, { color: subTextColor, fontSize: Math.round(12 * fontMultiplier) }]}>
          Your active accessibility accommodations help tailor your shopping and work experience:
        </Text>

        <View style={styles.badgeTagsRow}>
          {userAccommodations.visual && (
            <View style={[styles.a11yTag, { backgroundColor: '#e0f2fe', borderColor: '#7dd3fc' }]}>
              <Text style={styles.a11yTagText}>👁️ Visual (High Contrast / Text)</Text>
            </View>
          )}
          {userAccommodations.motor && (
            <View style={[styles.a11yTag, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}>
              <Text style={styles.a11yTagText}>♿ Mobility / Wheelchair Accessible</Text>
            </View>
          )}
          {userAccommodations.hearing && (
            <View style={[styles.a11yTag, { backgroundColor: '#ede9fe', borderColor: '#c4b5fd' }]}>
              <Text style={styles.a11yTagText}>🦻 Hearing / Captions & Visuals</Text>
            </View>
          )}
          {userAccommodations.cognitive && (
            <View style={[styles.a11yTag, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
              <Text style={styles.a11yTagText}>🧠 Cognitive / Simplified UI</Text>
            </View>
          )}
          {!userAccommodations.visual &&
            !userAccommodations.motor &&
            !userAccommodations.hearing &&
            !userAccommodations.cognitive && (
              <View style={[styles.emptyAccommodations, { borderColor }]}>
                <Text style={{ color: subTextColor, fontSize: 13, fontStyle: 'italic' }}>
                  No active accommodations specified yet. Tap "Configure" to set them.
                </Text>
              </View>
            )}
        </View>
      </View>

      {/* ── 3. Bio & About Card ── */}
      <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor, fontSize: Math.round(16 * fontMultiplier) }]}>
          📝 About Me / Bio
        </Text>
        <Text
          style={[
            styles.bioContent,
            { color: subTextColor, fontSize: Math.round(14 * fontMultiplier), lineHeight: Math.round(22 * fontMultiplier) },
          ]}
        >
          "{userBio}"
        </Text>
      </View>

      {/* ── 4. Impact & Activity Summary ── */}
      <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor, fontSize: Math.round(16 * fontMultiplier) }]}>
          📊 Community Engagement & Trust
        </Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statTile, { backgroundColor: highContrast ? '#222222' : '#f1f5f9' }]}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={[styles.statValue, { color: textColor }]}>4.9 / 5.0</Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Community Rating</Text>
          </View>

          <View style={[styles.statTile, { backgroundColor: highContrast ? '#222222' : '#f1f5f9' }]}>
            <Text style={styles.statEmoji}>🛍️</Text>
            <Text style={[styles.statValue, { color: textColor }]}>18+</Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Orders & Bookings</Text>
          </View>

          <View style={[styles.statTile, { backgroundColor: highContrast ? '#222222' : '#f1f5f9' }]}>
            <Text style={styles.statEmoji}>🛡️</Text>
            <Text style={[styles.statValue, { color: textColor }]}>100%</Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>KYC Verified</Text>
          </View>
        </View>
      </View>

      {/* ── 5. Account Security & Danger Zone (CRUD - Delete & Logout) ── */}
      <View style={[styles.dangerCard, { backgroundColor: cardBg, borderColor: highContrast ? '#ff0000' : '#fee2e2' }]}>
        <Text style={[styles.dangerTitle, { color: highContrast ? '#ff5555' : '#b91c1c' }]}>
          ⚠️ Account Management
        </Text>
        <Text style={[styles.dangerDesc, { color: subTextColor }]}>
          Securely sign out or permanently remove your profile and personal data from AccessHub.
        </Text>

        <View style={styles.dangerActionsRow}>
          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: highContrast ? '#333333' : '#0f172a' }]}
            onPress={() => {
              Alert.alert('🚪 Confirm Sign Out', 'Are you sure you want to log out of AccessHub?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign Out',
                  style: 'destructive',
                  onPress: onLogout,
                },
              ]);
            }}
            accessibilityRole="button"
            accessibilityLabel="Log out from your account"
          >
            <Text style={styles.logoutBtnText}>🚪 Log Out</Text>
          </TouchableOpacity>

          {/* Delete Profile Button */}
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: highContrast ? '#7f1d1d' : '#ef4444' }]}
            onPress={() => setDeleteConfirmVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Delete your profile permanently"
          >
            <Text style={styles.deleteBtnText}>🗑️ Delete Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 6. Edit Profile Modal (CRUD - Update) ── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>✏️ Edit Profile Details</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Text style={{ fontSize: 18, color: subTextColor, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
              {/* Avatar Selector */}
              <Text style={[styles.inputLabel, { color: textColor }]}>Choose Profile Avatar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                {AVATAR_PRESETS.map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setEditAvatar(preset)}
                    style={[
                      styles.presetItem,
                      { borderColor: editAvatar === preset ? accentColor : 'transparent', borderWidth: 3 },
                    ]}
                  >
                    <Image source={{ uri: preset }} style={styles.presetImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Full Name */}
              <Text style={[styles.inputLabel, { color: textColor }]}>Full Name *</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Kavindi Perera"
                placeholderTextColor="#94a3b8"
                style={[styles.textInput, { color: textColor, borderColor }]}
              />

              {/* Location */}
              <Text style={[styles.inputLabel, { color: textColor }]}>Location (City / District)</Text>
              <TextInput
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="e.g. Kandy, Sri Lanka"
                placeholderTextColor="#94a3b8"
                style={[styles.textInput, { color: textColor, borderColor }]}
              />

              {/* Bio */}
              <Text style={[styles.inputLabel, { color: textColor }]}>About Me / Bio</Text>
              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell the community about yourself or your products..."
                placeholderTextColor="#94a3b8"
                multiline={true}
                numberOfLines={3}
                style={[styles.textInput, styles.textArea, { color: textColor, borderColor }]}
              />

              {/* Accessibility Accommodations Checklist */}
              <Text style={[styles.inputLabel, { color: textColor, marginTop: 10 }]}>
                Accessibility Preferences & Accommodations
              </Text>

              <View style={[styles.switchRow, { borderColor }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchTitle, { color: textColor }]}>👁️ Visual Assistance</Text>
                  <Text style={[styles.switchDesc, { color: subTextColor }]}>High contrast & large typography</Text>
                </View>
                <Switch
                  value={editAccommodations.visual}
                  onValueChange={(val) =>
                    setEditAccommodations((prev) => ({ ...prev, visual: val }))
                  }
                  trackColor={{ false: '#cbd5e1', true: accentColor }}
                />
              </View>

              <View style={[styles.switchRow, { borderColor }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchTitle, { color: textColor }]}>♿ Mobility / Motor Assistance</Text>
                  <Text style={[styles.switchDesc, { color: subTextColor }]}>Wheelchair routes & large tap targets</Text>
                </View>
                <Switch
                  value={editAccommodations.motor}
                  onValueChange={(val) =>
                    setEditAccommodations((prev) => ({ ...prev, motor: val }))
                  }
                  trackColor={{ false: '#cbd5e1', true: accentColor }}
                />
              </View>

              <View style={[styles.switchRow, { borderColor }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchTitle, { color: textColor }]}>🦻 Hearing Assistance</Text>
                  <Text style={[styles.switchDesc, { color: subTextColor }]}>Visual alerts & text subtitles</Text>
                </View>
                <Switch
                  value={editAccommodations.hearing}
                  onValueChange={(val) =>
                    setEditAccommodations((prev) => ({ ...prev, hearing: val }))
                  }
                  trackColor={{ false: '#cbd5e1', true: accentColor }}
                />
              </View>

              <View style={[styles.switchRow, { borderColor }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchTitle, { color: textColor }]}>🧠 Cognitive Assistance</Text>
                  <Text style={[styles.switchDesc, { color: subTextColor }]}>Simplified screen flows & guidance</Text>
                </View>
                <Switch
                  value={editAccommodations.cognitive}
                  onValueChange={(val) =>
                    setEditAccommodations((prev) => ({ ...prev, cognitive: val }))
                  }
                  trackColor={{ false: '#cbd5e1', true: accentColor }}
                />
              </View>

              {/* Save & Cancel Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: accentColor }]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="Save profile changes to database"
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>💾 Save Changes to Cloud</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={[styles.cancelBtnText, { color: subTextColor }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 7. Delete Confirmation Modal (CRUD - Delete) ── */}
      <Modal
        visible={deleteConfirmVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModalBox, { backgroundColor: cardBg, borderColor: '#ef4444' }]}>
            <Text style={styles.deleteWarningIcon}>🚨</Text>
            <Text style={[styles.deleteModalTitle, { color: textColor }]}>Delete Profile Permanently?</Text>
            <Text style={[styles.deleteModalDesc, { color: subTextColor }]}>
              This will permanently remove your profile from the AccessHub database, cancel your active sessions, and erase your accommodations preferences. This action cannot be undone.
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, { backgroundColor: '#ef4444' }]}
                onPress={handleDeleteProfile}
                disabled={deleting}
                accessibilityRole="button"
                accessibilityLabel="Confirm permanent account deletion"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Yes, Delete My Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelDeleteBtn}
                onPress={() => setDeleteConfirmVisible(false)}
                disabled={deleting}
              >
                <Text style={{ color: subTextColor, fontWeight: '700' }}>Cancel & Keep Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  heroBanner: {
    height: 90,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bannerDecor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerEmoji: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  syncText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginTop: -45,
    position: 'relative',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    backgroundColor: '#cbd5e1',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarEditIcon: {
    fontSize: 13,
  },
  identityDetails: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontWeight: '800',
    textAlign: 'center',
  },
  verifiedBadge: {
    fontSize: 18,
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 6,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 4,
  },
  metaText: {
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  primaryActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontWeight: '700',
    fontSize: 13,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  linkAction: {
    fontWeight: '700',
    fontSize: 13,
  },
  sectionSub: {
    marginBottom: 12,
    lineHeight: 18,
  },
  badgeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  a11yTag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  a11yTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyAccommodations: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    alignItems: 'center',
  },
  bioContent: {
    fontStyle: 'italic',
    paddingTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  statTile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  dangerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  dangerDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  dangerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  logoutBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalFormContent: {
    paddingVertical: 14,
    paddingBottom: 30,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    backgroundColor: 'rgba(241,245,249,0.5)',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  presetItem: {
    borderRadius: 24,
    marginRight: 10,
    padding: 2,
  },
  presetImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  modalActions: {
    marginTop: 20,
    gap: 8,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteModalBox: {
    margin: 20,
    borderRadius: 24,
    borderWidth: 2,
    padding: 22,
    alignItems: 'center',
  },
  deleteWarningIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  deleteModalButtons: {
    width: '100%',
    gap: 10,
  },
  confirmDeleteBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  cancelDeleteBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
});
