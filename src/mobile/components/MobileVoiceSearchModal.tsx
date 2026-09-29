import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { SearchQuery } from '../../core/search/contracts';
import { interpretMobileQuery } from '../services/mobileQueryService';
import { useMobileSpeechRecognition } from '../hooks/useMobileSpeechRecognition';

const languages = [
  { locale: 'en-LK', short: 'EN', label: 'English' },
  { locale: 'si-LK', short: 'සිං', label: 'සිංහල' },
  { locale: 'ta-LK', short: 'த', label: 'தமிழ்' },
] as const;

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
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>🤖 AccessLink AI Voice Hub</Text>
              <Text style={[styles.subtitle, { color: theme.subText }]}>Speak or type an accessibility request, then review the transcript before searching.</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close AI Voice Hub" onPress={close} style={styles.closeButton}>
              <Text style={{ color: theme.text, fontWeight: '900' }}>Close</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: theme.text }]}>Speech language</Text>
          <View style={styles.languageRow} accessibilityRole="radiogroup" accessibilityLabel="Speech language">
            {languages.map((item) => {
              const selected = language === item.locale;
              return (
                <TouchableOpacity
                  key={item.locale}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item.label}
                  onPress={() => setLanguage(item.locale)}
                  style={[styles.languageButton, { borderColor: selected ? theme.accent : '#64748b', backgroundColor: selected ? `${theme.accent}22` : theme.background }]}
                >
                  <Text style={{ color: selected ? theme.accent : theme.text, fontWeight: '900' }}>{item.short} · {item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { color: theme.text }]}>Editable transcript</Text>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              accessibilityLabel="AI voice search transcript"
              accessibilityHint="You can edit recognized speech before searching"
              multiline
              value={speech.transcript}
              onChangeText={speech.setTranscript}
              placeholder="Example: Find wheelchair ramp places near Colombo"
              placeholderTextColor={theme.subText}
              style={[styles.input, { backgroundColor: theme.background, borderColor: speech.isListening ? theme.accent : '#64748b', color: theme.text }]}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={speech.isListening ? 'Stop microphone' : 'Start AI microphone'}
              accessibilityState={{ busy: speech.isListening }}
              onPress={handleMicrophone}
              style={[styles.micButton, { backgroundColor: speech.isListening ? '#dc2626' : '#059669' }]}
            >
              <Text style={styles.micIcon}>{speech.isListening ? '■' : '🎤'}</Text>
              <Text style={styles.micText}>{speech.isListening ? 'Stop' : 'Speak'}</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS !== 'web' && (
            <Text style={[styles.help, { color: theme.subText }]}>Expo Go: tapping Speak focuses this field. Use the microphone on the phone keyboard for free speech-to-text.</Text>
          )}
          {(speech.message || searchMessage) && (
            <Text accessibilityLiveRegion={searchMessage && searchMessage !== 'Interpreting your request…' ? 'assertive' : 'polite'} style={[styles.status, { color: searchMessage?.includes('failed') ? '#fecaca' : theme.accent }]}>
              {searchMessage ?? speech.message}
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear voice search transcript" onPress={speech.clearTranscript} style={[styles.secondaryButton, { borderColor: '#64748b' }]}>
              <Text style={{ color: theme.text, fontWeight: '900' }}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Search using transcript"
              accessibilityState={{ disabled: isSearching }}
              disabled={isSearching}
              onPress={submit}
              style={[styles.searchButton, { backgroundColor: theme.primaryButton, opacity: isSearching ? 0.65 : 1 }]}
            >
              {isSearching ? <ActivityIndicator color={theme.primaryButtonText} /> : <Text style={{ color: theme.primaryButtonText, fontWeight: '900' }}>Search AccessHub</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.72)', padding: 16 },
  card: { borderRadius: 22, borderWidth: 1, borderColor: '#475569', padding: 18, maxHeight: '92%' },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: 20, fontWeight: '900' },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  closeButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
  label: { fontSize: 13, fontWeight: '900', marginTop: 16, marginBottom: 7 },
  languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  languageButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderRadius: 999 },
  inputRow: { flexDirection: 'row', alignItems: 'stretch', gap: 9 },
  input: { flex: 1, minHeight: 92, maxHeight: 150, borderWidth: 2, borderRadius: 14, padding: 12, textAlignVertical: 'top' },
  micButton: { width: 68, minHeight: 92, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 3 },
  micIcon: { color: '#fff', fontSize: 23, fontWeight: '900' },
  micText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  help: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  status: { fontSize: 13, lineHeight: 19, marginTop: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 9, marginTop: 16 },
  secondaryButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderRadius: 13 },
  searchButton: { flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 13 },
});
