import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { SearchQuery } from '../../core/search/contracts';
import { interpretMobileQuery } from '../services/mobileQueryService';
import { useMobileSpeechRecognition } from '../hooks/useMobileSpeechRecognition';

const languages = [
  { locale: 'en-LK', native: 'English', label: 'English' },
  { locale: 'si-LK', native: 'සිංහල', label: 'Sinhala' },
  { locale: 'ta-LK', native: 'தமிழ்', label: 'Tamil' },
] as const;

const examples: Record<string, string> = {
  'en-LK': 'English example: “Find wheelchair ramp places near Colombo”',
  'si-LK': 'සිංහල example: “කොළඹ රෝද පුටු ප්‍රවේශය ඇති ස්ථාන සොයන්න”',
  'ta-LK': 'தமிழ் example: “கொழும்பில் சக்கர நாற்காலி அணுகல் இடங்களைக் கண்டறியவும்”',
};

interface Props {
  onClose: () => void;
  onSearch: (query: SearchQuery, transcript: string) => void;
  theme: {
    background: string;
    card: string;
    text: string;
    subText: string;
    accent: string;
    primaryButton: string;
    primaryButtonText: string;
  };
  visible: boolean;
}

export function MobileVoiceSearchModal({ onClose, onSearch, theme, visible }: Props) {
  const [activeTab, setActiveTab] = useState<'voice' | 'scanner' | 'fraud'>('voice');
  const [language, setLanguage] = useState('en-LK');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState('');
  const inputRef = useRef<TextInput>(null);
  const requestRef = useRef<AbortController | null>(null);
  const speech = useMobileSpeechRecognition(language);

  useEffect(() => () => requestRef.current?.abort(), []);

  const handleMicrophone = () => {
    if (speech.isListening) {
      speech.stopListening();
      return;
    }
    const started = speech.startListening();
    if (!started) {
      inputRef.current?.focus();
      if (Platform.OS !== 'web') {
        AccessibilityInfo.announceForAccessibility(
          'Text field focused. Use the microphone on your phone keyboard, or type your request.',
        );
      }
    }
  };

  const submit = async () => {
    const text = speech.transcript.trim();
    if (!text) {
      setSearchMessage('Speak or type a search request first.');
      inputRef.current?.focus();
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setIsSearching(true);
    setSearchMessage('Interpreting your request…');
    try {
      const result = await interpretMobileQuery(text, language, controller.signal);
      if (result.query.needsClarification) {
        setSearchMessage(result.query.clarification ?? 'Please clarify what you want to search for.');
        return;
      }
      AccessibilityInfo.announceForAccessibility(`Search ready for ${result.query.intent}.`);
      setSearchMessage(null);
      onSearch(result.query, text);
    } catch (error) {
      if (!controller.signal.aborted) {
        setSearchMessage(error instanceof Error ? error.message : 'Search failed. Please try again.');
      }
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  };

  const close = () => {
    requestRef.current?.abort();
    if (speech.isListening) speech.stopListening();
    setSearchMessage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay} accessibilityViewIsModal>
        <View style={styles.card}>
          <LinearGradient colors={['#2563eb', '#119da4', '#4f46e5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
            <View style={styles.brandIcon}><Ionicons name="sparkles" size={30} color="#fde047" /></View>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={styles.title}>AccessLink AI Assistant</Text>
              <Text style={styles.subtitle}>Smart Voice & Vision Accessibility Engine</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close AI Assistant" onPress={close} style={styles.closeButton}>
              <Ionicons name="close" size={34} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent} accessibilityRole="tablist">
            {[
              { id: 'voice' as const, label: 'Voice Assistant', icon: 'mic-outline' as const },
              { id: 'scanner' as const, label: 'AI Scanner', icon: 'camera-outline' as const },
              { id: 'fraud' as const, label: 'AI Fraud Shield', icon: 'shield-checkmark-outline' as const },
            ].map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <TouchableOpacity key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setActiveTab(tab.id)} style={[styles.tab, selected && styles.activeTab]}>
                  <Ionicons name={tab.icon} size={24} color={selected ? '#2563eb' : '#64748b'} />
                  <Text style={[styles.tabText, selected && styles.activeTabText]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
            {activeTab === 'voice' && (
              <View>
                <Text style={styles.sectionTitle}>Spoken language</Text>
                <Text style={styles.sectionDescription}>Choose the language before starting the microphone.</Text>
                <View style={styles.languageRow} accessibilityRole="radiogroup" accessibilityLabel="Speech language">
                  {languages.map((item) => {
                    const selected = language === item.locale;
                    return (
                      <TouchableOpacity key={item.locale} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={item.label} onPress={() => setLanguage(item.locale)} style={[styles.languageButton, selected && styles.languageButtonSelected]}>
                        <Text style={[styles.languageNative, selected && styles.selectedText]}>{item.native}</Text>
                        {item.native !== item.label && <Text style={[styles.languageEnglish, selected && styles.selectedText]}>{item.label}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.exampleBox}><Text style={styles.exampleText}>{examples[language]}</Text></View>

                <View style={styles.micArea}>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel={speech.isListening ? 'Stop microphone' : 'Start AI microphone'} accessibilityState={{ busy: speech.isListening }} onPress={handleMicrophone} style={styles.micShadow}>
                    <LinearGradient colors={speech.isListening ? ['#ef4444', '#dc2626'] : ['#2563eb', '#17b6b0']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.micButton}>
                      <Ionicons name={speech.isListening ? 'stop' : 'mic'} size={54} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  {speech.isListening && <Text style={styles.listening}>LISTENING…</Text>}
                </View>

                <View style={styles.transcriptHeading}>
                  <Text style={styles.sectionTitle}>Voice search transcript</Text>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear voice search transcript" accessibilityState={{ disabled: !speech.transcript }} disabled={!speech.transcript} onPress={speech.clearTranscript} style={styles.clearButton}>
                    <Ionicons name="trash-outline" size={20} color={speech.transcript ? '#64748b' : '#cbd5e1'} />
                    <Text style={[styles.clearText, !speech.transcript && styles.disabledText]}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <TextInput ref={inputRef} accessibilityLabel="AI voice search transcript" accessibilityHint="You can edit recognized speech before searching" multiline value={speech.transcript} onChangeText={speech.setTranscript} placeholder="Your speech appears here. You can also type or correct the text." placeholderTextColor="#94a3b8" style={[styles.input, speech.isListening && styles.listeningInput]} />

                {Platform.OS !== 'web' && <Text style={styles.help}>Expo Go: tap the large microphone, then use the microphone on your phone keyboard for free speech-to-text.</Text>}
                {(speech.message || searchMessage) && <Text accessibilityLiveRegion={searchMessage && searchMessage !== 'Interpreting your request…' ? 'assertive' : 'polite'} style={[styles.status, searchMessage?.includes('failed') && styles.errorStatus]}>{searchMessage ?? speech.message}</Text>}

                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Search using transcript" accessibilityState={{ disabled: isSearching || !speech.transcript.trim() }} disabled={isSearching || !speech.transcript.trim()} onPress={submit} style={[styles.searchButton, (isSearching || !speech.transcript.trim()) && styles.disabledSearch]}>
                  {isSearching ? <ActivityIndicator color="#fff" /> : <><Ionicons name="search" size={21} color="#fff" /><Text style={styles.searchText}>Use transcript</Text></>}
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'scanner' && (
              <View>
                <View style={styles.scannerFrame}><Ionicons name="camera-outline" size={58} color="#14b8a6" /><Text style={styles.scannerText}>Point your camera at a physical product, barcode, document, or Braille label.</Text></View>
                <TouchableOpacity onPress={() => setScanResult('Accessible product label detected. Text and product details are ready for review.')} style={styles.tealButton}><Ionicons name="scan" size={21} color="#fff" /><Text style={styles.searchText}>Simulate Camera Scan</Text></TouchableOpacity>
                {!!scanResult && <View style={styles.resultBox}><Ionicons name="checkmark-circle" size={22} color="#059669" /><Text style={styles.resultText}>{scanResult}</Text></View>}
              </View>
            )}

            {activeTab === 'fraud' && (
              <View>
                <View style={styles.shieldCard}><Ionicons name="shield-checkmark" size={62} color="#059669" /><Text style={styles.shieldTitle}>AccessLink AI Safety & Verification Shield</Text><Text style={styles.shieldText}>Seller certificates, NGO registrations, and job postings use automated verification checks.</Text></View>
                {['Disability Certificate Verification', 'NGO Registration & Escrow Protection'].map((label) => <View key={label} style={styles.verificationRow}><Text style={styles.verificationLabel}>{label}</Text><Text style={styles.verified}>✓ Active</Text></View>)}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(2,6,23,0.88)', padding: 14 },
  card: { width: '100%', maxWidth: 900, height: '92%', maxHeight: 920, overflow: 'hidden', borderRadius: 30, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  header: { minHeight: 138, paddingHorizontal: 32, paddingVertical: 24, flexDirection: 'row', alignItems: 'center', gap: 18 },
  brandIcon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)' },
  headerCopy: { flex: 1 },
  title: { color: '#fff', fontSize: 29, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: '#e0f2fe', fontSize: 20, marginTop: 2 },
  closeButton: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.14)' },
  tabs: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  tabsContent: { flexGrow: 1, minWidth: '100%', padding: 10, gap: 8 },
  tab: { flex: 1, minWidth: 175, minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 20 },
  activeTab: { backgroundColor: '#fff' },
  tabText: { color: '#64748b', fontSize: 18, fontWeight: '800' },
  activeTabText: { color: '#2563eb' },
  body: { flex: 1, backgroundColor: '#fff' },
  bodyContent: { paddingHorizontal: 32, paddingTop: 30, paddingBottom: 42 },
  sectionTitle: { color: '#334155', fontSize: 20, fontWeight: '900' },
  sectionDescription: { color: '#64748b', fontSize: 16, marginTop: 5, marginBottom: 18 },
  languageRow: { flexDirection: 'row', gap: 14 },
  languageButton: { flex: 1, minWidth: 88, minHeight: 86, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 19, backgroundColor: '#fff' },
  languageButtonSelected: { borderColor: '#2563eb', backgroundColor: '#2563eb' },
  languageNative: { color: '#334155', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  languageEnglish: { color: '#475569', fontSize: 14, fontWeight: '700', marginTop: 2 },
  selectedText: { color: '#fff' },
  exampleBox: { marginTop: 20, borderRadius: 18, backgroundColor: '#f1f5f9', paddingHorizontal: 20, paddingVertical: 16 },
  exampleText: { color: '#475569', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  micArea: { minHeight: 205, alignItems: 'center', justifyContent: 'center' },
  micShadow: { width: 142, height: 142, borderRadius: 71, shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 12 },
  micButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 71 },
  listening: { color: '#dc2626', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginTop: 12 },
  transcriptHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  clearButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  clearText: { color: '#64748b', fontSize: 16, fontWeight: '800' },
  disabledText: { color: '#cbd5e1' },
  input: { minHeight: 132, maxHeight: 190, marginTop: 8, borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 20, padding: 18, color: '#0f172a', backgroundColor: '#fff', fontSize: 18, lineHeight: 27, textAlignVertical: 'top' },
  listeningInput: { borderColor: '#2563eb' },
  help: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 9 },
  status: { color: '#2563eb', fontSize: 13, lineHeight: 19, marginTop: 9, fontWeight: '700' },
  errorStatus: { color: '#dc2626' },
  searchButton: { minHeight: 54, marginTop: 16, borderRadius: 16, backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  disabledSearch: { backgroundColor: '#94a3b8' },
  searchText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  scannerFrame: { height: 270, borderWidth: 2, borderStyle: 'dashed', borderColor: '#14b8a6', borderRadius: 24, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 30 },
  scannerText: { color: '#cbd5e1', fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 14 },
  tealButton: { minHeight: 54, marginTop: 18, borderRadius: 16, backgroundColor: '#0d9488', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  resultBox: { marginTop: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' },
  resultText: { flex: 1, color: '#065f46', fontSize: 14, fontWeight: '700', lineHeight: 21 },
  shieldCard: { alignItems: 'center', borderRadius: 24, borderWidth: 1, borderColor: '#a7f3d0', backgroundColor: '#ecfdf5', padding: 28 },
  shieldTitle: { color: '#064e3b', fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  shieldText: { color: '#475569', fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 8 },
  verificationRow: { minHeight: 64, marginTop: 12, borderRadius: 16, backgroundColor: '#f1f5f9', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  verificationLabel: { flex: 1, color: '#334155', fontSize: 14, fontWeight: '800' },
  verified: { color: '#059669', fontSize: 14, fontWeight: '900' },
});
