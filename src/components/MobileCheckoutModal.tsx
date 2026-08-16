import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  AccessibilityInfo,
  ScrollView,
  Alert,
  TextInput,
  Platform
} from 'react-native';

export interface MobileCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  product: any;
  themeBg: string;
  cardBg: string;
  textColor: string;
  subTextColor: string;
  accentColor: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  speakText: (text: string) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  ttsActive: boolean;
  setTtsActive: (val: boolean) => void;
  fontScale: 'md' | 'lg' | 'xl';
  setFontScale: (val: 'md' | 'lg' | 'xl') => void;
}

type CheckoutState = 'review' | 'processing' | 'success';
type PaymentMethod = 'saved_card' | 'cod';

export const MobileCheckoutModal: React.FC<MobileCheckoutModalProps> = ({
  visible,
  onClose,
  product,
  themeBg,
  cardBg,
  textColor,
  subTextColor,
  accentColor,
  primaryButtonBg,
  primaryButtonText,
  speakText,
  highContrast,
  setHighContrast,
  ttsActive,
  setTtsActive,
  fontScale,
  setFontScale
}) => {
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('review');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('saved_card');
  const [address, setAddress] = useState('42 Access Way, Colombo 03');
  const [isListening, setIsListening] = useState(false);

  const startVoiceTyping = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not Supported', 'Voice typing is currently only supported on the web version.');
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Alert.alert('Not Supported', 'Voice recognition is not supported in this browser.');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      console.error('Speech recognition error', e.error);
      setIsListening(false);
    };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setAddress(transcript);
    };

    recognition.start();
  };

  const price = product?.price || 0;
  const tax = price * 0.1;
  const discount = 22; // static for demo
  const total = price + tax - discount;
  const formattedTotal = total.toLocaleString(undefined, { maximumFractionDigits: 0 });

  useEffect(() => {
    if (visible && product) {
      setCheckoutState('review');
      setPaymentMethod('saved_card');
      const msg = `Checkout opened. Review your order for ${product.title}`;
      speakText(msg);
      if (AccessibilityInfo?.announceForAccessibility) {
        AccessibilityInfo.announceForAccessibility(msg);
      }
    }
  }, [visible, product]);

  const processPayment = () => {
    setCheckoutState('processing');
    const msg = `Processing payment of LKR ${formattedTotal}.`;
    speakText(msg);
    if (AccessibilityInfo?.announceForAccessibility) {
      AccessibilityInfo.announceForAccessibility(msg);
    }

    setTimeout(() => {
      setCheckoutState('success');
      const successMsg = 'Order placed successfully. Confirmation number AC-8821.';
      speakText(successMsg);
      if (AccessibilityInfo?.announceForAccessibility) {
        AccessibilityInfo.announceForAccessibility(successMsg);
      }
    }, 1200);
  };

  const handleConfirmClick = () => {
    processPayment();
  };

  if (!product) return null;

  const fontSizeMultiplier = fontScale === 'xl' ? 1.3 : fontScale === 'lg' ? 1.15 : 1.0;
  const dynamicText = (baseSize: number) => ({
    fontSize: Math.round(baseSize * fontSizeMultiplier),
  });

  const AccessibilityToolbar = () => (
    <View style={[styles.a11yBar, { backgroundColor: highContrast ? '#222' : '#334155' }]}>
      <TouchableOpacity
        style={[styles.a11yChip, ttsActive && styles.a11yChipActive]}
        onPress={() => {
          setTtsActive(!ttsActive);
          Alert.alert(
            'Screen Reader Simulator',
            !ttsActive ? 'TTS Activated. Tap elements to read aloud.' : 'TTS Deactivated.'
          );
        }}
      >
        <Text style={styles.a11yChipText}>🔊 {ttsActive ? 'TTS ON' : 'TTS'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.a11yChip, highContrast && styles.a11yChipActive]}
        onPress={() => setHighContrast(!highContrast)}
      >
        <Text style={styles.a11yChipText}>👁️ {highContrast ? 'Contrast ON' : 'Contrast'}</Text>
      </TouchableOpacity>

      <View style={styles.scaleGroup}>
        {(['md', 'lg', 'xl'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.scaleBtn, fontScale === s && styles.scaleBtnActive]}
            onPress={() => setFontScale(s)}
          >
            <Text style={styles.scaleBtnText}>{s.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.fullScreenOverlay, { backgroundColor: themeBg }]}>
        <AccessibilityToolbar />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {checkoutState === 'review' && (
            <View>
              <View style={styles.headerBar}>
                <TouchableOpacity onPress={onClose} style={styles.backBtn} accessibilityLabel="Go back">
                  <Text style={[styles.backArrow, { color: textColor }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, dynamicText(18), { color: textColor }]}>Complete Accessible Checkout</Text>
                <View style={{ width: 24 }} />
              </View>

              <View style={styles.sectionContainer}>
                {/* Order Summary Breakdown */}
                <View style={[styles.breakdownBox, { backgroundColor: cardBg, borderColor: subTextColor }]}>
                  <Text style={[styles.sectionTitle, dynamicText(12), { color: subTextColor }]}>Order Summary</Text>
                  
                  <View style={styles.breakdownRow}>
                    <Text style={[dynamicText(14), { color: textColor }]}>{product.title}</Text>
                    <Text style={[dynamicText(14), { color: textColor, fontWeight: '600' }]}>LKR {price.toLocaleString()}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={[dynamicText(14), { color: subTextColor }]}>Tax (10%)</Text>
                    <Text style={[dynamicText(14), { color: textColor, fontWeight: '600' }]}>LKR {tax.toLocaleString()}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={[dynamicText(14), { color: '#16a34a' }]}>Discount</Text>
                    <Text style={[dynamicText(14), { color: '#16a34a', fontWeight: '600' }]}>- LKR {discount.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.breakdownDivider, { borderColor: subTextColor }]} />
                  <View style={styles.breakdownRow}>
                    <Text style={[dynamicText(16), { color: textColor, fontWeight: 'bold' }]}>Total</Text>
                    <Text style={[dynamicText(18), { color: accentColor, fontWeight: 'bold' }]}>LKR {formattedTotal}</Text>
                  </View>
                </View>

                {/* Delivery Address */}
                <View style={styles.section}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[styles.sectionTitle, dynamicText(12), { color: subTextColor, marginBottom: 0 }]}>Delivery Address</Text>
                    <TouchableOpacity 
                      onPress={startVoiceTyping}
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        backgroundColor: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12
                      }}
                      accessibilityLabel="Voice Type Address"
                    >
                      <Text style={{ fontSize: 12, marginRight: 4 }}>🎤</Text>
                      <Text style={[dynamicText(10), { 
                        color: isListening ? '#ef4444' : subTextColor,
                        fontWeight: 'bold' 
                      }]}>
                        {isListening ? 'Listening...' : 'Voice Type'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    style={[styles.infoBox, dynamicText(14), { backgroundColor: cardBg, borderColor: subTextColor, color: textColor, fontWeight: '500' }]}
                    accessibilityLabel="Delivery Address Input"
                  />
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, dynamicText(12), { color: subTextColor }]}>Payment Method</Text>
                  
                  {/* Option A: Saved Card */}
                  <TouchableOpacity
                    accessibilityRole="radio"
                    accessibilityState={{ checked: paymentMethod === 'saved_card' }}
                    style={[
                      styles.paymentOption,
                      { borderColor: paymentMethod === 'saved_card' ? accentColor : subTextColor, backgroundColor: cardBg }
                    ]}
                    onPress={() => setPaymentMethod('saved_card')}
                  >
                    <View style={[styles.radioOuter, { borderColor: paymentMethod === 'saved_card' ? accentColor : subTextColor }]}>
                      {paymentMethod === 'saved_card' && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>VISA</Text>
                      </View>
                      <Text style={[dynamicText(14), { color: textColor, fontWeight: 'bold' }]}>Saved Card (•••• 4242)</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Option B: Cash on Delivery */}
                  <TouchableOpacity
                    accessibilityRole="radio"
                    accessibilityState={{ checked: paymentMethod === 'cod' }}
                    style={[
                      styles.paymentOption,
                      { borderColor: paymentMethod === 'cod' ? accentColor : subTextColor, backgroundColor: cardBg }
                    ]}
                    onPress={() => setPaymentMethod('cod')}
                  >
                    <View style={[styles.radioOuter, { borderColor: paymentMethod === 'cod' ? accentColor : subTextColor }]}>
                      {paymentMethod === 'cod' && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
                    </View>
                    <Text style={[dynamicText(14), { color: textColor, fontWeight: 'bold' }]}>Cash on Delivery</Text>
                  </TouchableOpacity>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[styles.orangeBtn, { marginTop: 24 }]}
                  onPress={handleConfirmClick}
                >
                  <Text style={[styles.orangeBtnText, dynamicText(14)]}>CONFIRM ORDER</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {checkoutState === 'processing' && (
            <View style={styles.centerContentFullScreen}>
              <ActivityIndicator size="large" color="#f97316" />
              <Text style={[dynamicText(16), { color: textColor, marginTop: 24, fontWeight: 'bold' }]}>
                Processing Payment...
              </Text>
            </View>
          )}

          {checkoutState === 'success' && (
            <View style={styles.centerContentFullScreen}>
              <View style={styles.successCircle}>
                <Text style={{ fontSize: 60, color: '#22c55e' }}>✓</Text>
              </View>
              <Text style={[styles.successText, dynamicText(24), { color: textColor }]}>Order placed successfully!</Text>
              <Text style={[dynamicText(16), { color: subTextColor, textAlign: 'center', marginBottom: 40, fontWeight: '600' }]}>
                Order #AC-8821
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                style={[styles.blackBtn, { backgroundColor: highContrast ? '#fff' : '#1f2937' }]}
                onPress={onClose}
              >
                <Text style={[dynamicText(16), { color: highContrast ? '#000' : '#ffffff', fontWeight: 'bold', textAlign: 'center' }]}>
                  Done / Back to Marketplace
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: {
    padding: 4,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionContainer: {
    gap: 16
  },
  section: {
    marginTop: 10
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 10,
    minHeight: 56
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  orangeBtn: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orangeBtnText: {
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  blackBtn: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
    elevation: 2,
    minHeight: 56,
    justifyContent: 'center',
    marginTop: 20
  },
  breakdownBox: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownDivider: {
    borderBottomWidth: 1,
    marginVertical: 10,
    opacity: 0.2
  },
  centerContentFullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  a11yBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  a11yChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  a11yChipActive: {
    backgroundColor: '#eab308',
  },
  a11yChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scaleGroup: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 6,
    padding: 2,
  },
  scaleBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scaleBtnActive: {
    backgroundColor: '#2563eb',
  },
  scaleBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
