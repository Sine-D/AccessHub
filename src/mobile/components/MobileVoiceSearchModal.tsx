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
  const [language, setLanguage] = useState('en-LK');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
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
          <LinearGradient colors={['#172554', '#1d4ed8', '#0f766e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
            <View style={styles.brandIcon}><Ionicons name="mic" size={26} color="#fff" /></View>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={styles.title}>AccessHub Voice</Text>
              <Text style={styles.subtitle}>Speak naturally. Search accessibly.</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close AI Assistant" onPress={close} style={styles.closeButton}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
              <View>
                <View style={styles.voiceBadge}>
                  <View style={styles.voiceBadgeDot} />
                  <Text style={styles.voiceBadgeText}>{Platform.OS === 'web' ? 'WEB SPEECH' : 'NATIVE SPEECH RECOGNITION'}</Text>
                </View>
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

                <View style={styles.exampleBox}>
                  <View style={styles.exampleIcon}><Ionicons name="chatbubble-ellipses" size={18} color="#2563eb" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exampleLabel}>TRY SAYING</Text>
                    <Text style={styles.exampleText}>{examples[language]}</Text>
                  </View>
                </View>

                <View style={styles.micArea}>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel={speech.isListening ? 'Stop microphone' : 'Start AI microphone'} accessibilityState={{ busy: speech.isListening }} onPress={handleMicrophone} style={styles.micShadow}>
                    <LinearGradient colors={speech.isListening ? ['#ef4444', '#dc2626'] : ['#2563eb', '#17b6b0']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.micButton}>
                      <Ionicons name={speech.isListening ? 'stop' : 'mic'} size={54} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  <Text style={[styles.micState, speech.isListening && styles.listening]}>{speech.isListening ? 'Listening… tap to stop' : 'Tap to speak'}</Text>
                  <Text style={styles.micHint}>{speech.isListening ? 'Speak clearly in the selected language' : 'Your speech will appear below'}</Text>
                </View>

                <View style={styles.transcriptHeading}>
                  <Text style={styles.sectionTitle}>Voice search transcript</Text>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear voice search transcript" accessibilityState={{ disabled: !speech.transcript }} disabled={!speech.transcript} onPress={speech.clearTranscript} style={styles.clearButton}>
                    <Ionicons name="trash-outline" size={20} color={speech.transcript ? '#64748b' : '#cbd5e1'} />
                    <Text style={[styles.clearText, !speech.transcript && styles.disabledText]}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <TextInput ref={inputRef} accessibilityLabel="AI voice search transcript" accessibilityHint="You can edit recognized speech before searching" multiline value={speech.transcript} onChangeText={speech.setTranscript} placeholder="Your speech appears here. You can also type or correct the text." placeholderTextColor="#94a3b8" style={[styles.input, speech.isListening && styles.listeningInput]} />

                {Platform.OS !== 'web' && <Text style={styles.help}>Development build: tap the large microphone for live speech-to-text. Expo Go fallback: use the microphone on your phone keyboard.</Text>}
                {(speech.message || searchMessage) && <Text accessibilityLiveRegion={searchMessage && searchMessage !== 'Interpreting your request…' ? 'assertive' : 'polite'} style={[styles.status, searchMessage?.includes('failed') && styles.errorStatus]}>{searchMessage ?? speech.message}</Text>}

                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Search using transcript" accessibilityState={{ disabled: isSearching || !speech.transcript.trim() }} disabled={isSearching || !speech.transcript.trim()} onPress={submit} style={[styles.searchButton, (isSearching || !speech.transcript.trim()) && styles.disabledSearch]}>
                  {isSearching ? <ActivityIndicator color="#fff" /> : <><Ionicons name="sparkles" size={21} color="#fff" /><Text style={styles.searchText}>Search with AI</Text><Ionicons name="arrow-forward" size={20} color="#fff" /></>}
                </TouchableOpacity>
              </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(2,6,23,0.92)', padding: 10 },
  card: { width: '100%', maxWidth: 680, height: '95%', maxHeight: 900, overflow: 'hidden', borderRadius: 28, borderWidth: 1, borderColor: '#334155', backgroundColor: '#f8fafc' },
  header: { minHeight: 104, paddingHorizontal: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', gap: 13 },
  brandIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  headerCopy: { flex: 1 },
  title: { color: '#fff', fontSize: 23, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { color: '#bfdbfe', fontSize: 13, marginTop: 2 },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)' },
  body: { flex: 1, backgroundColor: '#f8fafc' },
  bodyContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34 },
  voiceBadge: { alignSelf: 'flex-start', minHeight: 30, paddingHorizontal: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#99f6e4', marginBottom: 16 },
  voiceBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#14b8a6' },
  voiceBadgeText: { color: '#0f766e', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  sectionTitle: { color: '#0f172a', fontSize: 17, fontWeight: '900' },
  sectionDescription: { color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 14 },
  languageRow: { flexDirection: 'row', gap: 8 },
  languageButton: { flex: 1, minWidth: 82, minHeight: 70, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 16, backgroundColor: '#fff' },
  languageButtonSelected: { borderColor: '#2563eb', backgroundColor: '#2563eb', shadowColor: '#2563eb', shadowOpacity: 0.18, shadowRadius: 8, elevation: 3 },
  languageNative: { color: '#1e293b', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  languageEnglish: { color: '#64748b', fontSize: 11, fontWeight: '700', marginTop: 3 },
  selectedText: { color: '#fff' },
  exampleBox: { marginTop: 12, borderRadius: 16, backgroundColor: '#fff', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: '#e2e8f0' },
  exampleIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff' },
  exampleLabel: { color: '#64748b', fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 3 },
  exampleText: { color: '#334155', fontSize: 13, fontWeight: '700', lineHeight: 19 },
  micArea: { minHeight: 205, alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  micShadow: { width: 118, height: 118, borderRadius: 59, padding: 7, backgroundColor: '#dbeafe', shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  micButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 52 },
  micState: { color: '#0f172a', fontSize: 15, fontWeight: '900', marginTop: 13 },
  micHint: { color: '#64748b', fontSize: 11, marginTop: 3 },
  listening: { color: '#dc2626' },
  transcriptHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  clearButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  clearText: { color: '#64748b', fontSize: 13, fontWeight: '800' },
  disabledText: { color: '#cbd5e1' },
  input: { minHeight: 112, maxHeight: 180, marginTop: 8, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 16, padding: 15, color: '#0f172a', backgroundColor: '#fff', fontSize: 16, lineHeight: 23, textAlignVertical: 'top' },
  listeningInput: { borderWidth: 2, borderColor: '#2563eb' },
  help: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 9 },
  status: { color: '#2563eb', fontSize: 13, lineHeight: 19, marginTop: 9, fontWeight: '700' },
  errorStatus: { color: '#dc2626' },
  searchButton: { minHeight: 56, marginTop: 18, borderRadius: 16, backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#2563eb', shadowOpacity: 0.22, shadowRadius: 10, elevation: 4 },
  disabledSearch: { backgroundColor: '#94a3b8' },
  searchText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
