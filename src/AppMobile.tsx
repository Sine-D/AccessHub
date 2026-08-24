import React, { useState, useEffect, useMemo } from 'react';
import { ReviewForm } from './components/reviews/ReviewForm';
import { MobileCheckoutModal } from './components/MobileCheckoutModal';
import { addReview, getReviewsForLocation } from './mock/reviews';

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';

import {
  SafeAreaView,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import {
  mockCurrentUser,
  mockProducts,
  mockServices,
  mockJobs,
  mockDonations,
  mockMapPins,
  mockMessages,
  mockNotifications,
} from './mock/data';
import { saveRating } from './services/ratingsService';
import { CreateAccountScreen } from './features/auth';
import { supabase } from './core/supabase';
import { JobPosting } from './core/types';

type MobileTab =
  | 'splash'
  | 'onboarding'
  | 'auth'
  | 'register'
  | 'home'
  | 'marketplace'
  | 'services'
  | 'jobs'
  | 'map'
  | 'profile';

export default function AppMobile() {
  const [activeTab, setActiveTab] = useState<MobileTab>('splash');

  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState<'md' | 'lg' | 'xl'>('md');
  const [ttsActive, setTtsActive] = useState(false);

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceQuery, setVoiceQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);
  const [isCheckoutModalVisible, setCheckoutModalVisible] = useState(false);

  const [reviewModalLocationId, setReviewModalLocationId] =
    useState<string | null>(null);

  const [dbJobs, setDbJobs] = useState<JobPosting[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [jobCategory, setJobCategory] = useState('All Jobs');
  const [jobFilter, setJobFilter] = useState({ wheelchair: false, deaf: false, blind: false });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isListeningJobs, setIsListeningJobs] = useState(false);

  const startVoiceSearch = () => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListeningJobs(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setJobSearch(transcript);
          setIsListeningJobs(false);
        };
        recognition.onerror = () => {
          setIsListeningJobs(false);
          Alert.alert('Voice Search Error', 'Could not recognize voice. Please try again.');
        };
        recognition.onend = () => setIsListeningJobs(false);

        recognition.start();
      } else {
        Alert.alert('Not Supported', 'Voice search is not supported in this browser.');
      }
    } else {
      Alert.alert('Not Supported', 'Voice search is currently available on the web version.');
    }
  };

  useEffect(() => {
    if (activeTab === 'jobs') {
      const fetchJobs = async () => {
        setLoadingJobs(true);
        try {
          const { data, error } = await supabase.from('jobs').select('*');
          if (error) throw error;
          if (data && data.length > 0) {
            const formattedJobs: JobPosting[] = data.map((job: any) => ({
              id: job.id,
              title: job.title,
              company: job.company || 'Partner Company',
              companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
              salary: job.salary || 'Negotiable',
              location: job.location || 'Sri Lanka / Remote',
              accessibilityBadges: job.category ? [job.category] : [],
              eligible_for_wheelchair: job.eligible_for_wheelchair,
              eligible_for_deaf: job.eligible_for_deaf,
              eligible_for_blind: job.eligible_for_blind,
              description: job.description || `Job category: ${job.category || 'N/A'}.`,
              postedDate: job.updated_at ? new Date(job.updated_at).toLocaleDateString() : new Date().toLocaleDateString(),
              applicantCount: 0
            }));
            setDbJobs(formattedJobs);
          } else {
            setDbJobs([]);
          }
        } catch (err) {
          console.error('Error fetching jobs:', err);
        } finally {
          setLoadingJobs(false);
        }
      };
      fetchJobs();
    }
  }, [activeTab]);

  const filteredJobs = useMemo(() => {
    let result = dbJobs.filter((job) => {
      const matchText = (job.title + ' ' + (job.category || '')).toLowerCase();
      const matchesSearch = matchText.includes(jobSearch.toLowerCase());
      const matchesCategory = jobCategory === 'All Jobs' || job.accessibilityBadges.includes(jobCategory) || job.category === jobCategory;

      let matchesFilter = true;
      if (jobFilter.wheelchair && !job.eligible_for_wheelchair) matchesFilter = false;
      if (jobFilter.deaf && !job.eligible_for_deaf) matchesFilter = false;
      if (jobFilter.blind && !job.eligible_for_blind) matchesFilter = false;

      return matchesSearch && matchesCategory && matchesFilter;
    });

    const onlyWheelchair = jobFilter.wheelchair && !jobFilter.deaf && !jobFilter.blind;

    if (onlyWheelchair) {
      result.sort((a, b) => {
        const getPriority = (job: any) => {
          if (!job.eligible_for_deaf && !job.eligible_for_blind) return 1;
          if (job.eligible_for_deaf && !job.eligible_for_blind) return 2;
          if (!job.eligible_for_deaf && job.eligible_for_blind) return 3;
          if (job.eligible_for_deaf && job.eligible_for_blind) return 4;
          return 5;
        };
        return getPriority(a) - getPriority(b);
      });
    }

    return result;
  }, [dbJobs, jobSearch, jobCategory, jobFilter]);

  // Auto transition from Splash to Onboarding after 2.5 seconds
  useEffect(() => {
    if (activeTab === 'splash') {
      const timer = setTimeout(() => {
        setActiveTab('onboarding');
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const speakText = (text: string) => {
    if (ttsActive) {
      Alert.alert('🔊 Voice Reader', text);
    }
  };

  // Font scale multiplier
  const fontSizeMultiplier =
    fontScale === 'xl' ? 1.3 : fontScale === 'lg' ? 1.15 : 1.0;

  const dynamicText = (baseSize: number) => ({
    fontSize: Math.round(baseSize * fontSizeMultiplier),
  });

  const handleAiAsk = () => {
    if (!voiceQuery.trim()) return;

    setAiResponse(
      `AccessLink AI: Searching accessibility resources for "${voiceQuery}"... Found 3 wheelchair-accessible locations and 2 assistive tech products in Colombo.`,
    );
  };

  const themeBg = highContrast ? '#000000' : '#0f172a';
  const cardBg = highContrast ? '#111111' : '#1e293b';
  const textColor = highContrast ? '#ffff00' : '#f8fafc';
  const subTextColor = highContrast ? '#ffffff' : '#94a3b8';
  const accentColor = highContrast ? '#ffff00' : '#38bdf8';
  const primaryButtonBg = highContrast ? '#ffff00' : '#2563eb';
  const primaryButtonText = highContrast ? '#000000' : '#ffffff';

  if (activeTab === 'splash') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => setActiveTab('onboarding')}
            style={{
              flex: 1,
              backgroundColor: '#ffffff',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
            }}
          >
            <Image
              source={require('./assets/images/access_hub_logo.png')}
              style={{ width: 320, height: 320, resizeMode: 'contain' }}
            />
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (activeTab === 'onboarding') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <View
            style={{
              flex: 1,
              backgroundColor: '#ffffff',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 40,
            }}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <Image
                source={require('./assets/images/Onboarding.png')}
                style={{ width: 280, height: 280, resizeMode: 'contain', marginBottom: 24 }}
              />
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0d9488', backgroundColor: '#ccfbf1', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 12 }}>
                DISABLED SELLERS & CREATORS
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>
                Inclusive Local Marketplace
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, maxWidth: 300 }}>
                Empowering persons with disabilities to showcase handcrafted goods, adaptive products, and offer freelance professional services across Sri Lanka.
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#0d9488',
                paddingVertical: 16,
                borderRadius: 20,
                width: '90%',
                alignItems: 'center',
                shadowColor: '#0d9488',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => setActiveTab('auth')}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>
                🚀 Get Started Now
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (activeTab === 'auth') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 }}>
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Image
                source={require('./assets/images/signup_login.jpg')}
                style={{ width: 280, height: 260, resizeMode: 'contain', marginBottom: 20 }}
              />
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>
                Welcome to AccessHub
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 300 }}>
                Sign up or log in to explore accessible products, jobs, and services.
              </Text>

              {/* Create Account Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#0d9488',
                  paddingVertical: 16,
                  borderRadius: 20,
                  width: '90%',
                  alignItems: 'center',
                  marginBottom: 12,
                  shadowColor: '#0d9488',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={() => setActiveTab('register')}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>
                  Create Account
                </Text>
              </TouchableOpacity>

              {/* Log In Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#0f172a',
                  paddingVertical: 16,
                  borderRadius: 20,
                  width: '90%',
                  alignItems: 'center',
                  marginBottom: 12,
                  shadowColor: '#0f172a',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                onPress={() => setActiveTab('home')}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (activeTab === 'register') {
    return (
      <CreateAccountScreen
        onCancel={() => setActiveTab('auth')}
        onSuccess={() => setActiveTab('home')}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeBg }]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={themeBg}
        />

        {/* Top Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: highContrast
                ? '#000'
                : '#1e293b',
            },
          ]}
        >
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>A</Text>
            </View>

            <View>
              <Text
                style={[
                  styles.brandTitle,
                  dynamicText(18),
                  { color: textColor },
                ]}
              >
                AccessLink
              </Text>

              <Text
                style={[
                  styles.brandSub,
                  dynamicText(10),
                  { color: subTextColor },
                ]}
              >
                Inclusive Mobile Ecosystem
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.aiButton,
              {
                backgroundColor: highContrast
                  ? '#ffff00'
                  : '#0d9488',
              },
            ]}
            onPress={() => setAiModalVisible(true)}
          >
            <Text
              style={[
                styles.aiButtonText,
                {
                  color: highContrast ? '#000' : '#fff',
                },
              ]}
            >
              ✨ AI Hub
            </Text>
          </TouchableOpacity>
        </View>

        {/* Accessibility Control Toolbar */}
        <View
          style={[
            styles.a11yBar,
            {
              backgroundColor: highContrast
                ? '#222'
                : '#334155',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.a11yChip,
              ttsActive && styles.a11yChipActive,
            ]}
            onPress={() => {
              setTtsActive(!ttsActive);

              Alert.alert(
                'Screen Reader Simulator',
                !ttsActive
                  ? 'TTS Activated. Tap elements to read aloud.'
                  : 'TTS Deactivated.',
              );
            }}
          >
            <Text style={styles.a11yChipText}>
              🔊 {ttsActive ? 'TTS ON' : 'TTS'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.a11yChip,
              highContrast && styles.a11yChipActive,
            ]}
            onPress={() => setHighContrast(!highContrast)}
          >
            <Text style={styles.a11yChipText}>
              👁️ {highContrast ? 'Contrast ON' : 'Contrast'}
            </Text>
          </TouchableOpacity>

          <View style={styles.scaleGroup}>
            {(['md', 'lg', 'xl'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.scaleBtn,
                  fontScale === s && styles.scaleBtnActive,
                ]}
                onPress={() => setFontScale(s)}
              >
                <Text style={styles.scaleBtnText}>
                  {s.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main Content Area */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollContent}
        >

          {/* HOME */}
          {activeTab === 'home' && (
            <View>
              <View
                style={[
                  styles.heroCard,
                  { backgroundColor: cardBg },
                ]}
              >
                <Text
                  style={[
                    styles.heroBadge,
                    { color: accentColor },
                  ]}
                >
                  WELCOME BACK 👋
                </Text>

                <Text
                  style={[
                    styles.heroTitle,
                    dynamicText(20),
                    { color: textColor },
                  ]}
                >
                  {mockCurrentUser.name}
                </Text>

                <Text
                  style={[
                    styles.heroSub,
                    dynamicText(12),
                    { color: subTextColor },
                  ]}
                >
                  Empowering disabled entrepreneurs and barrier-free
                  digital commerce across Sri Lanka.
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text
                      style={[
                        styles.statValue,
                        { color: accentColor },
                      ]}
                    >
                      LKR{' '}
                      {(
                        (mockCurrentUser.totalEarnings ?? 0) /
                        1000
                      ).toFixed(0)}
                      k
                    </Text>

                    <Text
                      style={[
                        styles.statLabel,
                        { color: subTextColor },
                      ]}
                    >
                      Earnings
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text
                      style={[
                        styles.statValue,
                        { color: accentColor },
                      ]}
                    >
                      {mockCurrentUser.totalOrders ?? 0}
                    </Text>

                    <Text
                      style={[
                        styles.statLabel,
                        { color: subTextColor },
                      ]}
                    >
                      Orders
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text
                      style={[
                        styles.statValue,
                        { color: accentColor },
                      ]}
                    >
                      ⭐ {mockCurrentUser.rating}
                    </Text>

                    <Text
                      style={[
                        styles.statLabel,
                        { color: subTextColor },
                      ]}
                    >
                      Rating
                    </Text>
                  </View>
                </View>
              </View>

              <Text
                style={[
                  styles.sectionTitle,
                  dynamicText(16),
                  { color: textColor },
                ]}
              >
                🚀 Inclusive Suite
              </Text>

              <View style={styles.quickGrid}>
                <TouchableOpacity
                  style={[
                    styles.quickCard,
                    { backgroundColor: cardBg },
                  ]}
                  onPress={() => setActiveTab('marketplace')}
                >
                  <Text style={styles.quickIcon}>🛒</Text>
                  <Text
                    style={[
                      styles.quickText,
                      dynamicText(12),
                      { color: textColor },
                    ]}
                  >
                    Marketplace
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickCard,
                    { backgroundColor: cardBg },
                  ]}
                  onPress={() => setActiveTab('services')}
                >
                  <Text style={styles.quickIcon}>🤝</Text>
                  <Text
                    style={[
                      styles.quickText,
                      dynamicText(12),
                      { color: textColor },
                    ]}
                  >
                    Services
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickCard,
                    { backgroundColor: cardBg },
                  ]}
                  onPress={() => setActiveTab('jobs')}
                >
                  <Text style={styles.quickIcon}>💼</Text>
                  <Text
                    style={[
                      styles.quickText,
                      dynamicText(12),
                      { color: textColor },
                    ]}
                  >
                    Jobs
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickCard,
                    { backgroundColor: cardBg },
                  ]}
                  onPress={() => setActiveTab('map')}
                >
                  <Text style={styles.quickIcon}>🗺️</Text>
                  <Text
                    style={[
                      styles.quickText,
                      dynamicText(12),
                      { color: textColor },
                    ]}
                  >
                    Map Pins
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.sectionTitle,
                  dynamicText(16),
                  { color: textColor },
                ]}
              >
                ✨ Featured Assistive Tech
              </Text>

              {mockProducts.slice(0, 2).map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.productCard,
                    { backgroundColor: cardBg },
                  ]}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.productImg}
                  />

                  <View style={styles.productBody}>
                    <Text
                      style={[
                        styles.badgeTag,
                        { color: accentColor },
                      ]}
                    >
                      ♿ {item.disabilityBadge}
                    </Text>

                    <Text
                      style={[
                        styles.productTitle,
                        dynamicText(14),
                        { color: textColor },
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={[
                        styles.productPrice,
                        dynamicText(15),
                        { color: accentColor },
                      ]}
                    >
                      LKR {item.price.toLocaleString()}
                    </Text>

                    <Text
                      style={[
                        styles.sellerName,
                        dynamicText(11),
                        { color: subTextColor },
                      ]}
                    >
                      By {item.sellerName}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  dynamicText(18),
                  { color: textColor },
                ]}
              >
                🛒 Assistive Marketplace
              </Text>

              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: cardBg,
                    color: textColor,
                  },
                ]}
                placeholder="Search adaptive items, Braille clocks..."
                placeholderTextColor={subTextColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {mockProducts.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.productCard,
                    { backgroundColor: cardBg },
                  ]}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.productImg}
                  />

                  <View style={styles.productBody}>
                    <Text
                      style={[
                        styles.badgeTag,
                        { color: accentColor },
                      ]}
                    >
                      ♿ {item.disabilityBadge}
                    </Text>

                    <Text
                      style={[
                        styles.productTitle,
                        dynamicText(14),
                        { color: textColor },
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={[
                        styles.productPrice,
                        dynamicText(15),
                        { color: accentColor },
                      ]}
                    >
                      LKR {item.price.toLocaleString()}
                    </Text>

                    <Text
                      style={[
                        styles.sellerName,
                        dynamicText(11),
                        { color: subTextColor },
                      ]}
                    >
                      Seller: {item.sellerName} (⭐{' '}
                      {item.sellerRating})
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.buyBtn,
                        { backgroundColor: primaryButtonBg },
                      ]}
                      onPress={() => {
                        setCheckoutProduct(item);
                        setCheckoutModalVisible(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.buyBtnText,
                          { color: primaryButtonText },
                        ]}
                      >
                        Order Now
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* SERVICES */}
          {activeTab === 'services' && (
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  dynamicText(18),
                  { color: textColor },
                ]}
              >
                🤝 Inclusive Services
              </Text>

              {mockServices.map((srv) => (
                <View
                  key={srv.id}
                  style={[
                    styles.serviceCard,
                    { backgroundColor: cardBg },
                  ]}
                >
                  <View style={styles.rowAlign}>
                    <Image
                      source={{ uri: srv.providerAvatar }}
                      style={styles.avatarMini}
                    />

                    <View
                      style={{
                        flex: 1,
                        marginLeft: 10,
                      }}
                    >
                      <Text
                        style={[
                          styles.providerName,
                          dynamicText(14),
                          { color: textColor },
                        ]}
                      >
                        {srv.providerName}
                      </Text>

                      <Text
                        style={[
                          styles.badgeTag,
                          { color: accentColor },
                        ]}
                      >
                        ♿ {srv.disabilityBadge}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.serviceTitle,
                      dynamicText(13),
                      {
                        color: textColor,
                        marginTop: 8,
                      },
                    ]}
                  >
                    {srv.title}
                  </Text>

                  <Text
                    style={[
                      styles.serviceRate,
                      dynamicText(14),
                      {
                        color: accentColor,
                        marginTop: 4,
                      },
                    ]}
                  >
                    LKR {srv.hourlyRate.toLocaleString()} / hour
                  </Text>

                  <Text
                    style={[
                      styles.serviceDesc,
                      dynamicText(11),
                      {
                        color: subTextColor,
                        marginTop: 6,
                      },
                    ]}
                  >
                    {srv.description}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.buyBtn,
                      {
                        backgroundColor: primaryButtonBg,
                        marginTop: 10,
                      },
                    ]}
                    onPress={() =>
                      Alert.alert(
                        'Booked',
                        `Service request sent to ${srv.providerName}!`,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.buyBtnText,
                        { color: primaryButtonText },
                      ]}
                    >
                      Book Provider
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}


          {/* JOBS */}
          {activeTab === 'jobs' && (
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  dynamicText(18),
                  { color: textColor },
                ]}
              >
                💼 Disability-Confident Jobs
              </Text>

              {/* SEARCH BAR AND DROPDOWN */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: 8, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' }}>
                  <TextInput
                    style={[
                      styles.searchInput,
                      { flex: 1, color: textColor, marginBottom: 0, borderWidth: 0 },
                    ]}
                    placeholder="Search remote jobs..."
                    placeholderTextColor={subTextColor}
                    value={jobSearch}
                    onChangeText={setJobSearch}
                    accessibilityRole="search"
                    accessibilityLabel="Search jobs input"
                    accessibilityHint="Type to filter jobs by title or category"
                  />
                  <TouchableOpacity
                    onPress={startVoiceSearch}
                    style={{ padding: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Voice search"
                    accessibilityHint="Double tap to dictate your search query"
                  >
                    <Text style={{ fontSize: 18, color: isListeningJobs ? '#ef4444' : subTextColor }}>
                      {isListeningJobs ? '🔴' : '🎤'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={{ marginLeft: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: cardBg, borderRadius: 8, justifyContent: 'center', borderWidth: 1, borderColor: '#334155' }}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  accessibilityRole="button"
                  accessibilityLabel={`Job category selector. Current category is ${jobCategory}`}
                  accessibilityHint="Double tap to open or close the job category dropdown"
                  accessibilityState={{ expanded: showCategoryDropdown }}
                >
                  <Text style={{ color: textColor, fontWeight: 'bold' }}>{jobCategory} ▼</Text>
                </TouchableOpacity>
              </View>

              {showCategoryDropdown && (
                <View 
                  style={{ backgroundColor: cardBg, borderRadius: 8, marginBottom: 12, padding: 8, borderWidth: 1, borderColor: '#334155' }}
                  accessibilityRole="menu"
                >
                  {['All Jobs', 'Handcraft Items', 'Computer Designing', 'Software', 'Marketing', 'Support'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => {
                        setJobCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      style={{ paddingVertical: 10, borderBottomWidth: cat !== 'Support' ? 1 : 0, borderBottomColor: '#1e293b' }}
                      accessibilityRole="menuitem"
                      accessibilityLabel={cat}
                      accessibilityHint={`Double tap to filter jobs by ${cat}`}
                      accessibilityState={{ selected: jobCategory === cat }}
                    >
                      <Text style={{ color: jobCategory === cat ? accentColor : textColor }}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* FILTER BUBBLES */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={{ marginBottom: 16 }}
                accessibilityLabel="Accessibility filters"
              >
                {[
                  { label: 'Wheelchair Persons', key: 'wheelchair' },
                  { label: 'Deaf Persons', key: 'deaf' },
                  { label: 'Blind Persons', key: 'blind' }
                ].map(f => {
                  const isActive = jobFilter[f.key as keyof typeof jobFilter];
                  return (
                    <TouchableOpacity
                      key={f.label}
                      onPress={() => setJobFilter(prev => ({ ...prev, [f.key]: !prev[f.key as keyof typeof prev] }))}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isActive ? accentColor : subTextColor,
                        backgroundColor: isActive ? accentColor : 'transparent',
                        marginRight: 8,
                      }}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isActive }}
                      accessibilityLabel={f.label}
                      accessibilityHint={`Double tap to toggle ${f.label} filter`}
                    >
                      <Text style={{ color: isActive ? '#fff' : subTextColor, fontSize: 12 }}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {loadingJobs ? (
                <Text style={{ color: subTextColor, textAlign: 'center', marginTop: 20 }}>Loading inclusive jobs...</Text>
              ) : filteredJobs.length === 0 ? (
                <Text style={{ color: subTextColor, textAlign: 'center', marginTop: 20 }}>No jobs found.</Text>
              ) : (
                filteredJobs.map((job) => (
                  <View
                    key={job.id}
                    style={[
                      styles.jobCard,
                      { backgroundColor: cardBg },
                    ]}
                  >
                    <View style={styles.rowAlign}>
                      <Image
                        source={{ uri: job.companyLogo }}
                        style={styles.avatarMini}
                      />

                      <View
                        style={{
                          flex: 1,
                          marginLeft: 10,
                        }}
                      >
                        <Text
                          style={[
                            styles.jobTitle,
                            dynamicText(14),
                            { color: textColor },
                          ]}
                        >
                          {job.title}
                        </Text>

                        <Text
                          style={[
                            styles.companyName,
                            dynamicText(12),
                            { color: subTextColor },
                          ]}
                        >
                          {job.company} • {job.location}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.salaryText,
                        dynamicText(13),
                        {
                          color: accentColor,
                          marginTop: 8,
                        },
                      ]}
                    >
                      {job.salary}
                    </Text>

                    <View style={styles.badgeContainer}>
                      {job.accessibilityBadges.map(
                        (b: string, idx: number) => (
                          <Text
                            key={idx}
                            style={[
                              styles.jobBadge,
                              {
                                color: textColor,
                                backgroundColor: '#334155',
                              },
                            ]}
                          >
                            ✓ {b}
                          </Text>
                        ),
                      )}
                      {job.eligible_for_wheelchair && (
                        <Text style={[styles.jobBadge, { color: '#fff', backgroundColor: '#2563eb' }]}>♿ Wheelchair</Text>
                      )}
                      {job.eligible_for_deaf && (
                        <Text style={[styles.jobBadge, { color: '#fff', backgroundColor: '#9333ea' }]}>🧏 Deaf</Text>
                      )}
                      {job.eligible_for_blind && (
                        <Text style={[styles.jobBadge, { color: '#fff', backgroundColor: '#d97706' }]}>🦯 Blind</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.buyBtn,
                        {
                          backgroundColor: primaryButtonBg,
                          marginTop: 10,
                        },
                      ]}
                      onPress={() =>
                        Alert.alert(
                          'Applied!',
                          `Application submitted for ${job.title}`,
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Apply for ${job.title} at ${job.company}`}
                      accessibilityHint="Double tap to submit your application"
                    >
                      <Text
                        style={[
                          styles.buyBtnText,
                          { color: primaryButtonText },
                        ]}
                      >
                        Apply Now
                      </Text>
                    </TouchableOpacity>
                  </View>
                )))}
            </View>
          )}
          <Modal
            visible={reviewModalLocationId !== null}
            animationType="slide"
            transparent
            onRequestClose={() => setReviewModalLocationId(null)}
          >
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                {reviewModalLocationId && (
                  <ReviewForm
                    locationId={reviewModalLocationId}
                    onSubmit={async (data) => {
                      const newReview = addReview(data);
                      try {
                        await saveRating(data.locationId, data.criteriaRatings);
                      } catch (err) {
                        console.error('Failed to save rating to Supabase:', err);
                        Alert.alert('Warning', 'Review saved locally, but the accessibility rating could not be saved to the database.');
                      }
                      setReviewModalLocationId(null);
                      Alert.alert('Thank you!', 'Your accessibility review was submitted.');
                    }}
                  />
                )}
              </View>
            </View>
          </Modal>

          {/* MAP */}
          {activeTab === 'map' && (
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  dynamicText(18),
                  { color: textColor },
                ]}
              >
                🗺️ Accessible Map Locations
              </Text>

              {mockMapPins.map((pin) => {
                // AC-81:
                // Get only reviews belonging to this specific location
                // and count reviews that contain a photo.
                const photoCount = getReviewsForLocation(pin.id).filter(
                  (review) => Boolean(review.photoUri),
                ).length;

                return (
                  <View
                    key={pin.id}
                    style={[
                      styles.mapCard,
                      { backgroundColor: cardBg },
                    ]}
                  >
                    <Image
                      source={{ uri: pin.image }}
                      style={styles.mapImg}
                    />

                    <View style={{ padding: 12 }}>
                      <Text
                        style={[
                          styles.mapPinTitle,
                          dynamicText(15),
                          { color: textColor },
                        ]}
                      >
                        {pin.title}
                      </Text>

                      <Text
                        style={[
                          styles.mapAddress,
                          dynamicText(11),
                          {
                            color: subTextColor,
                            marginTop: 2,
                          },
                        ]}
                      >
                        📍 {pin.address} ({pin.distance})
                      </Text>

                      <Text
                        style={[
                          styles.badgeTag,
                          {
                            color: accentColor,
                            marginTop: 6,
                          },
                        ]}
                      >
                        ♿ {pin.badge}
                      </Text>

                      {/* AC-81 PHOTO COUNT */}
                      {photoCount > 0 && (
                        <Text
                          style={[
                            styles.photoCountText,
                            {
                              color: accentColor,
                            },
                          ]}
                        >
                          📷 {photoCount} photo
                          {photoCount === 1 ? '' : 's'} submitted
                        </Text>
                      )}

                      <TouchableOpacity
                        onPress={() =>
                          setReviewModalLocationId(pin.id)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Write a review for ${pin.title}`}
                        style={{ marginTop: 10 }}
                      >
                        <Text
                          style={{
                            color: accentColor,
                            fontWeight: '600',
                          }}
                        >
                          Write a Review
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {/* Review Modal */}
              <Modal
                visible={reviewModalLocationId !== null}
                animationType="slide"
                transparent
                onRequestClose={() =>
                  setReviewModalLocationId(null)
                }
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: cardBg,
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    {reviewModalLocationId && (
                      <ReviewForm
                        locationId={reviewModalLocationId}
                        onSubmit={async (data) => {
                          const newReview = addReview(data);

                          try {
                            // @ts-ignore (saveRating might need to be imported if it's missing)
                            await saveRating(data.locationId, data.criteriaRatings);
                          } catch (err) {
                            console.error('Failed to save rating to Supabase:', err);
                            Alert.alert('Warning', 'Review saved locally, but the accessibility rating could not be saved to the database.');
                          }

                          console.log(
                            'Stored review with photo:',
                            newReview,
                          );

                          setReviewModalLocationId(null);

                          Alert.alert(
                            'Thank you!',
                            'Your accessibility review was submitted.',
                          );
                        }}
                      />
                    )}
                  </View>
                </View>
              </Modal>
            </View>
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <View>
              <View
                style={[
                  styles.profileCard,
                  { backgroundColor: cardBg },
                ]}
              >
                <Image
                  source={{ uri: mockCurrentUser.avatar }}
                  style={styles.profileAvatar}
                />

                <Text
                  style={[
                    styles.profileName,
                    dynamicText(18),
                    {
                      color: textColor,
                      marginTop: 8,
                    },
                  ]}
                >
                  {mockCurrentUser.name}
                </Text>

                <Text
                  style={[
                    styles.badgeTag,
                    {
                      color: accentColor,
                      marginTop: 4,
                    },
                  ]}
                >
                  ♿ {mockCurrentUser.disabilityBadge}
                </Text>

                <Text
                  style={[
                    styles.profileBio,
                    dynamicText(11),
                    {
                      color: subTextColor,
                      marginTop: 8,
                    },
                  ]}
                >
                  {mockCurrentUser.bio}
                </Text>
              </View>

              <Text
                style={[
                  styles.sectionTitle,
                  dynamicText(16),
                  {
                    color: textColor,
                    marginTop: 16,
                  },
                ]}
              >
                🔔 Recent Notifications
              </Text>

              {mockNotifications.map((n) => (
                <View
                  key={n.id}
                  style={[
                    styles.notifCard,
                    { backgroundColor: cardBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.notifTitle,
                      dynamicText(13),
                      { color: textColor },
                    ]}
                  >
                    {n.title}
                  </Text>

                  <Text
                    style={[
                      styles.notifDesc,
                      dynamicText(11),
                      {
                        color: subTextColor,
                        marginTop: 2,
                      },
                    ]}
                  >
                    {n.description}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* AI Voice Hub Modal */}
        <Modal
          visible={aiModalVisible}
          animationType="slide"
          transparent
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: cardBg },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  dynamicText(16),
                  { color: textColor },
                ]}
              >
                🤖 AccessLink AI Voice Hub
              </Text>

              <Text
                style={[
                  styles.modalSub,
                  dynamicText(11),
                  {
                    color: subTextColor,
                    marginTop: 4,
                  },
                ]}
              >
                Speak or type accessibility commands (e.g.
                "Find ramp entrance near me").
              </Text>

              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: themeBg,
                    color: textColor,
                  },
                ]}
                placeholder="Ask AI Voice Assistant..."
                placeholderTextColor={subTextColor}
                value={voiceQuery}
                onChangeText={setVoiceQuery}
              />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 10,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.modalAskBtn,
                    {
                      backgroundColor: primaryButtonBg,
                      flex: 1,
                      marginRight: 8,
                    },
                  ]}
                  onPress={handleAiAsk}
                >
                  <Text
                    style={[
                      styles.buyBtnText,
                      { color: primaryButtonText },
                    ]}
                  >
                    Submit Question
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalAskBtn,
                    {
                      backgroundColor: '#e11d48',
                      width: 80,
                    },
                  ]}
                  onPress={() => setAiModalVisible(false)}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>

              {aiResponse ? (
                <View style={styles.aiResBox}>
                  <Text
                    style={[
                      styles.aiResText,
                      dynamicText(12),
                      { color: accentColor },
                    ]}
                  >
                    {aiResponse}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Modal>

        {/* Bottom Tab Bar */}
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: highContrast
                ? '#000'
                : '#1e293b',
            },
          ]}
        >
          {(
            [
              'home',
              'marketplace',
              'services',
              'jobs',
              'map',
              'profile',
            ] as const
          ).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={styles.tabIcon}>
                {tab === 'home'
                  ? '🏠'
                  : tab === 'marketplace'
                    ? '🛒'
                    : tab === 'services'
                      ? '🤝'
                      : tab === 'jobs'
                        ? '💼'
                        : tab === 'map'
                          ? '🗺️'
                          : '👤'}
              </Text>

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      activeTab === tab
                        ? accentColor
                        : subTextColor,
                    fontWeight:
                      activeTab === tab ? 'bold' : 'normal',
                  },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Checkout Modal */}
        <MobileCheckoutModal
          visible={isCheckoutModalVisible}
          onClose={() => setCheckoutModalVisible(false)}
          product={checkoutProduct}
          themeBg={themeBg}
          cardBg={cardBg}
          textColor={textColor}
          subTextColor={subTextColor}
          accentColor={accentColor}
          primaryButtonBg={primaryButtonBg}
          primaryButtonText={primaryButtonText}
          speakText={speakText}
          highContrast={highContrast}
          setHighContrast={setHighContrast}
          ttsActive={ttsActive}
          setTtsActive={setTtsActive}
          fontScale={fontScale}
          setFontScale={setFontScale}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },

  brandTitle: {
    fontWeight: 'bold',
  },

  brandSub: {
    fontSize: 10,
  },

  aiButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  aiButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
  },

  a11yBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  a11yChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 9,
    fontWeight: 'bold',
  },

  contentScroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 14,
    paddingBottom: 24,
  },

  heroCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },

  heroBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  heroTitle: {
    fontWeight: 'bold',
    marginTop: 4,
  },

  heroSub: {
    marginTop: 4,
    lineHeight: 16,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },

  statBox: {
    alignItems: 'center',
  },

  statValue: {
    fontWeight: 'bold',
    fontSize: 15,
  },

  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },

  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 6,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  quickCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  quickIcon: {
    fontSize: 24,
    marginBottom: 4,
  },

  quickText: {
    fontWeight: 'bold',
  },

  productCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },

  productImg: {
    width: 100,
    height: 110,
  },

  productBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },

  badgeTag: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  productTitle: {
    fontWeight: 'bold',
    marginTop: 2,
  },

  productPrice: {
    fontWeight: 'bold',
    marginTop: 2,
  },

  sellerName: {
    fontSize: 10,
  },

  buyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  buyBtnText: {
    fontWeight: 'bold',
    fontSize: 11,
  },

  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 13,
  },

  serviceCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  providerName: {
    fontWeight: 'bold',
  },

  serviceTitle: {
    fontWeight: 'bold',
  },

  serviceRate: {
    fontWeight: 'bold',
  },

  serviceDesc: {
    lineHeight: 15,
  },

  jobCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  jobTitle: {
    fontWeight: 'bold',
  },

  companyName: {
    marginTop: 2,
  },

  salaryText: {
    fontWeight: 'bold',
  },

  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },

  jobBadge: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  mapCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },

  mapImg: {
    width: '100%',
    height: 120,
  },

  mapPinTitle: {
    fontWeight: 'bold',
  },

  mapAddress: {
    fontSize: 11,
  },

  // AC-81
  // Displays the number of photo reviews
  // belonging specifically to each location.
  photoCountText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },

  profileCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  profileName: {
    fontWeight: 'bold',
  },

  profileBio: {
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  notifCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },

  notifTitle: {
    fontWeight: 'bold',
  },

  notifDesc: {
    fontSize: 11,
  },

  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingVertical: 6,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },

  tabIcon: {
    fontSize: 18,
  },

  tabLabel: {
    fontSize: 9,
    marginTop: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },

  modalContent: {
    borderRadius: 16,
    padding: 16,
  },

  modalTitle: {
    fontWeight: 'bold',
  },

  modalSub: {
    fontSize: 11,
  },

  modalInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    fontSize: 13,
  },

  modalAskBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiResBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },

  aiResText: {
    fontWeight: '500',
    lineHeight: 16,
  },

  splashContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },

  splashBadgeRow: {
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0d9488',
    marginBottom: 20,
  },

  splashBadgeText: {
    color: '#2dd4bf',
    fontSize: 10,
    fontWeight: 'bold',
  },

  splashLogoCard: {
    width: 140,
    height: 140,
    borderRadius: 28,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 20,
  },

  splashLogoImg: {
    width: '100%',
    height: '100%',
  },

  splashBadgeTag: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#0d9488',
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  splashTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },

  splashSub: {
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  splashFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },

  splashFeatureChip: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },

  splashChipText: {
    fontWeight: 'bold',
  },

  splashStartBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  splashStartBtnText: {
    fontWeight: 'bold',
    fontSize: 13,
  },

  splashSkipText: {
    fontWeight: 'bold',
  },

  cleanSplashSafeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  cleanSplashContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  cleanSplashLogoWrapper: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cleanSplashLogoImg: {
    width: '100%',
    height: '100%',
  },

  cleanOnboardingSafeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  onboardingTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  onboardingStepBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0d9488',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },

  onboardingSkipBtn: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },

  onboardingCenterContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  onboardingImageWrapper: {
    width: Dimensions.get('window').width * 0.85,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  onboardingImg: {
    width: '100%',
    height: '100%',
  },

  onboardingTextGroup: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 0,
  },

  onboardingCategoryBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0d9488',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },

  onboardingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },

  onboardingSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },

  onboardingDesc: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  onboardingFooter: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  onboardingStartBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  onboardingStartBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  onboardingStartBtnInline: {
    width: '82%',
    alignSelf: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 18,
  },

  cleanAuthSafeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  authTopBadgeWrapper: {
    alignItems: 'center',
    paddingTop: 12,
  },

  authTopBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0d9488',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },

  authCenterContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  authImageWrapper: {
    width: Dimensions.get('window').width * 0.85,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  authImg: {
    width: '100%',
    height: '100%',
  },

  authTextGroup: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  authTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },

  authDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  authFooter: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    gap: 10,
  },

  authPrimaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  authPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  authInlineButtonsStack: {
    width: 200,
    alignSelf: 'center',
    marginTop: 18,
    gap: 12,
  },

  authPrimaryBtnInline: {
    width: 200,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});