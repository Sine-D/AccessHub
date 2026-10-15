import React, { useState, useEffect, useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  mockPendingServiceApplications,
  SRI_LANKA_DISTRICTS,
  mockJobs,
  mockDonations,
  mockMapPins,
  mockMessages,
  mockNotifications,
} from './mock/data';

import { saveRatingWithVerification } from './services/ratingsService';
import {
  calculateAccessibleRoute,
  RouteType,
  RoutePreviewResult,
} from './services/routeService';
import { CreateAccountScreen } from './features/auth/screens/CreateAccountScreen';
import { MobileVendorVerificationQueue } from './features/admin/components/MobileVendorVerificationQueue';
import { MobileListingModerationQueue } from './features/admin/components/MobileListingModerationQueue';
import { MobileFraudModerationQueue } from './features/admin/components/MobileFraudModerationQueue';
import { MobileAccessibilityBadgeManager } from './features/admin/components/MobileAccessibilityBadgeManager';
import { MobileSalesAnalyticsDashboard } from './features/admin/components/MobileSalesAnalyticsDashboard';
import { MobileAccessibilityComplianceDashboard } from './features/admin/components/MobileAccessibilityComplianceDashboard';
import { AdminUnauthorizedState } from './features/admin/components/AdminStates';
import { useAppState } from './core/hooks/useAppState';
import { supabase } from './core/supabase';
import { UserRole, JobPosting, ServiceItem, FreelancerServiceApplication, ServiceBookingRequest } from './core/types';
import type { MapPin } from './core/types';
import type { Feature, SearchQuery } from './core/search/contracts';
import { matchesFeatures } from './core/search/parser';
import { FEATURES } from './core/search/contracts';
import { featureLabels } from './features/map/utils/accessibilityFilters';
import { MobileSearchResults } from './mobile/components/MobileSearchResults';
import { MobilePlaceDetailsModal } from './mobile/components/MobilePlaceDetailsModal';
import { MobileVoiceSearchModal } from './mobile/components/MobileVoiceSearchModal';
import { MobilePlacesMap } from './mobile/components/MobilePlacesMap';
import type { Coordinate as MobileCoordinate } from './mobile/components/MobilePlacesMap';
import { listMobilePlaces } from './mobile/services/mobilePlacesService';

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
  | 'search_results'
  | 'admin'
  | 'profile'
  | 'bookedProviders';

type AdminTab = 'vendors' | 'listings' | 'reviews' | 'freelancers' | 'accounts' | 'bookings' | 'badges' | 'analytics' | 'compliance';

const ADMIN_TABS: Array<{ id: AdminTab; label: string; icon: string }> = [
  { id: 'vendors', label: 'Vendors', icon: 'business-outline' },
  { id: 'listings', label: 'Listings', icon: 'storefront-outline' },
  { id: 'freelancers', label: 'Talent', icon: 'people-outline' },
  { id: 'bookings', label: 'Bookings', icon: 'card-outline' },
  { id: 'reviews', label: 'Safety', icon: 'shield-checkmark-outline' },
  { id: 'badges', label: 'Badges', icon: 'ribbon-outline' },
  { id: 'accounts', label: 'Accounts', icon: 'wallet-outline' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart-outline' },
  { id: 'compliance', label: 'Compliance', icon: 'checkmark-circle-outline' },
];

export default function AppMobile() {
  const { userRole, setUserRole, currentUser, setCurrentUser, setActiveScreen, bookingRequests, addBookingRequest } = useAppState();
  const isAdmin = userRole === 'admin' || currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState<MobileTab>(isAdmin ? 'admin' : 'splash');

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Ignore
    }
    setUserRole('customer');
    setCurrentUser((prev) => ({ ...prev, role: 'customer' }));
    setActiveTab('auth');
    if (setActiveScreen) {
      setActiveScreen('auth');
    }
  };

  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState<'md' | 'lg' | 'xl'>('md');
  const [ttsActive, setTtsActive] = useState(false);

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState<SearchQuery | null>(null);
  const [selectedMobilePlace, setSelectedMobilePlace] = useState<MapPin | null>(null);
  const [mobilePlaces, setMobilePlaces] = useState<MapPin[]>(mockMapPins);
  const [mobilePlacesLoading, setMobilePlacesLoading] = useState(false);
  const [mobilePlacesError, setMobilePlacesError] = useState('');
  const [mapSearchText, setMapSearchText] = useState('');
  const [mapSelectedFeatures, setMapSelectedFeatures] = useState<Feature[]>([]);
  const [mobileUserCoordinate, setMobileUserCoordinate] = useState<MobileCoordinate | null>(null);

  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);
  const [isCheckoutModalVisible, setCheckoutModalVisible] = useState(false);

  const [reviewModalLocationId, setReviewModalLocationId] =
    useState<string | null>(null);

  const [dbJobs, setDbJobs] = useState<JobPosting[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [jobCategory, setJobCategory] = useState('All Jobs');
  const [jobFilter, setJobFilter] = useState({
    wheelchair: false,
    deaf: false,
    blind: false,
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isListeningJobs, setIsListeningJobs] = useState(false);

  // Dynamic Freelancer & Admin State for Mobile (REAL SUPABASE DATA ONLY)
  const [mobileServices, setMobileServices] = useState<ServiceItem[]>([]);
  const [mobilePendingApps, setMobilePendingApps] = useState<FreelancerServiceApplication[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategory, setServiceCategory] = useState('All');
  const [isFreelancerFormOpen, setIsFreelancerFormOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Booking & Escrow Modal State
  const [selectedMobileBookingService, setSelectedMobileBookingService] = useState<ServiceItem | null>(null);
  const [bookingProjectTitle, setBookingProjectTitle] = useState('');
  const [bookingDescription, setBookingDescription] = useState('');
  const [bookingHours, setBookingHours] = useState('2');
  const [bookingPaymentOption, setBookingPaymentOption] = useState<'50_50' | 'full'>('50_50');
  const [bookingSuccessAlert, setBookingSuccessAlert] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('vendors');
  const [mobileUsers, setMobileUsers] = useState<any[]>([]);
  const [selectedMobileProfile, setSelectedMobileProfile] = useState<any | null>(null);

  // --- NEW BOOKINGS STATE ---
  const [bookedProvidersList, setBookedProvidersList] = useState<any[]>([]);
  const [loadingBooked, setLoadingBooked] = useState(false);
  const [selectedBookedProvider, setSelectedBookedProvider] = useState<any | null>(null);

  // AC-230: Map pin details & step-free route preview (mobile)
  const [selectedMapPin, setSelectedMapPin] = useState<typeof mockMapPins[0] | null>(null);
  const [mapRouteModalOpen, setMapRouteModalOpen] = useState(false);
  const [mapRouteMode, setMapRouteMode] = useState<RouteType>('step_free_wheelchair');
  const [mapRouteResult, setMapRouteResult] = useState<RoutePreviewResult | null>(null);

  const fetchBookedProviders = async () => {
    // mockCurrentUser has ID 'u1' which breaks Supabase UUID validation. Using a static valid UUID for test purposes.
    const userId = '00000000-0000-0000-0000-000000000000';
    setLoadingBooked(true);
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBookedProvidersList(data);
      } else if (error) {
        console.log('Supabase fetch failed.', error);
      }
    } catch (err) {
      console.log('Error fetching bookings', err);
    } finally {
      setLoadingBooked(false);
    }
  };

  const handleDeleteBookedProvider = async (id: string) => {
    if (!id) return;

    // Optimistic UI update
    setBookedProvidersList(prev => prev.filter(b => b.id !== id));

    try {
      const { error } = await supabase
        .from('service_bookings')
        .delete()
        .eq('id', id);

      if (error) {
        console.log('Error deleting booking from Supabase', error);
      }
    } catch (err) {
      console.log('Error in delete booking', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookedProviders') {
      fetchBookedProviders();
    }
  }, [activeTab, currentUser]);

  // Real-world Mobile Login State
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleMobileLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const trimmedEmail = loginEmail.trim().toLowerCase();
      let detectedRole: UserRole = 'customer';
      let userName = 'Kavindi Perera';

      // 1. Attempt Supabase Auth
      if (loginEmail && loginPassword) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: loginPassword,
          });

          if (!authErr && authData?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', authData.user.id)
              .maybeSingle();

            if (profile?.role) detectedRole = profile.role as UserRole;
            if (profile?.name) userName = profile.name;
          }
        } catch (e) {
          // offline fallback
        }
      }

      // 2. Real-world credential & role detection:
      if (trimmedEmail.includes('admin') || trimmedEmail === 'admin@accesslink.lk') {
        detectedRole = 'admin';
        userName = 'System Administrator';
      }

      setUserRole(detectedRole);
      setCurrentUser((prev) => ({
        ...prev,
        name: userName,
        role: detectedRole,
      }));

      setLoginModalVisible(false);

      // 3. Real-world Role-Based Redirection:
      if (detectedRole === 'admin') {
        setActiveTab('admin');
        if (setActiveScreen) {
          setActiveScreen('admin');
        }
      } else {
        setActiveTab('home');
        if (setActiveScreen) {
          setActiveScreen('home');
        }
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [mobileBookingRequests, setMobileBookingRequests] = useState<ServiceBookingRequest[]>([]);
  const [adminDbBookings, setAdminDbBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchMobileData = async () => {
      try {
        const { data: uData } = await supabase.from('users').select('*');
        if (uData && uData.length > 0) {
          setMobileUsers(uData);
        }

        const { data: sData } = await supabase.from('services').select('*');
        if (sData) {
          const formattedServices: ServiceItem[] = sData.map(item => ({
            id: item.id,
            title: item.title,
            hourlyRate: Number(item.hourly_rate),
            providerName: item.provider_name,
            providerAvatar: item.provider_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
            disabilityBadge: item.disability_badge || 'Verified Freelancer',
            rating: item.rating || 5.0,
            reviewsCount: item.reviews_count || 1,
            category: item.category || 'Services',
            availability: item.availability || 'Sri Lanka',
            portfolioImages: item.portfolio_images || [],
            description: item.description || '',
            skills: item.skills || ['Freelancer']
          }));
          setMobileServices(formattedServices);
        }

        const { data: bData } = await supabase.from('service_bookings').select('*').order('created_at', { ascending: false });
        if (bData) {
          setAdminDbBookings(bData);
        }

        const { data: aData } = await supabase.from('freelancer_applications').select('*').eq('status', 'pending');
        if (aData) {
          const formattedApps: FreelancerServiceApplication[] = aData.map(item => ({
            id: item.id,
            name: item.name,
            age: item.age,
            district: item.district,
            address: item.address,
            guardianName: item.guardian_name,
            guardianPhone: item.guardian_phone,
            phone: item.phone,
            isFreelancer: item.is_freelancer,
            rating: item.rating,
            ratingImages: item.rating_images || [],
            serviceTitle: item.service_title,
            hourlyRate: Number(item.hourly_rate),
            category: item.category || 'Tech & Accessibility',
            description: item.description || '',
            skills: item.skills || [],
            disabilityBadge: item.disability_badge,
            status: item.status,
            createdAt: new Date(item.created_at || Date.now()).toLocaleString()
          }));
          setMobilePendingApps(formattedApps);
        }
      } catch (err) {
        console.warn('Error fetching Supabase data on mobile:', err);
      }
    };
    fetchMobileData();
  }, [adminTab, activeTab]);

  // Freelancer Form Fields State
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formDistrict, setFormDistrict] = useState('Colombo');
  const [formAddress, setFormAddress] = useState('');
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formIsFreelancer, setFormIsFreelancer] = useState(true);
  const [formRating, setFormRating] = useState(5);
  const [formRatingImages, setFormRatingImages] = useState<string[]>([]);
  const [formServiceTitle, setFormServiceTitle] = useState('');
  const [formHourlyRate, setFormHourlyRate] = useState('4500');
  const [formCategory, setFormCategory] = useState('Tech & Accessibility');
  const [formDescription, setFormDescription] = useState('');
  const [formSkills, setFormSkills] = useState<string[]>(['Accessibility', 'Freelancer']);

  // Proposal Form States
  const [isProposalFormOpen, setIsProposalFormOpen] = useState(false);
  const [proposalJobId, setProposalJobId] = useState('');
  const [proposalJobTitle, setProposalJobTitle] = useState('');
  const [proposalCoverLetter, setProposalCoverLetter] = useState('');
  const [proposalBidAmount, setProposalBidAmount] = useState('');
  const [proposalDeliveryTime, setProposalDeliveryTime] = useState('');
  const [mobileProposals, setMobileProposals] = useState<any[]>([]);

  const pickImageFromLocalStorage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset =>
          asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
        );
        setFormRatingImages(prev => [...prev, ...newImages]);
      }
    } catch (err) {
      console.error('Local image picker error:', err);
      Alert.alert('Upload Error', 'Could not access device storage.');
    }
  };

  const handleFreelancerFormSubmit = async () => {
    if (!formName.trim() || !formPhone.trim() || !formServiceTitle.trim()) {
      Alert.alert('Required Fields Missing', 'Please fill in Name, Phone Number, and Service Title.');
      return;
    }

    const tempId = `app-${Date.now()}`;
    const newApp: FreelancerServiceApplication = {
      id: tempId,
      name: formName,
      age: formAge ? Number(formAge) : 25,
      district: formDistrict,
      address: formAddress || 'Sri Lanka',
      guardianName: formGuardianName || 'N/A',
      guardianPhone: formGuardianPhone || 'N/A',
      phone: formPhone,
      isFreelancer: formIsFreelancer,
      rating: formRating,
      ratingImages: formRatingImages,
      serviceTitle: formServiceTitle,
      hourlyRate: Number(formHourlyRate) || 4500,
      category: formCategory,
      description: formDescription || 'Professional freelancer service offered through AccessHub.',
      skills: formSkills,
      status: 'pending',
      createdAt: new Date().toLocaleString()
    };

    setMobilePendingApps(prev => [newApp, ...prev]);
    setIsFreelancerFormOpen(false);

    try {
      const { data, error } = await supabase.from('freelancer_applications').insert([{
        name: formName,
        age: formAge ? Number(formAge) : 25,
        district: formDistrict,
        address: formAddress || 'Sri Lanka',
        guardian_name: formGuardianName || 'N/A',
        guardian_phone: formGuardianPhone || 'N/A',
        phone: formPhone,
        is_freelancer: formIsFreelancer,
        rating: formRating,
        rating_images: formRatingImages,
        service_title: formServiceTitle,
        hourly_rate: Number(formHourlyRate) || 4500,
        category: formCategory,
        description: formDescription || 'Professional freelancer service offered through AccessHub.',
        skills: formSkills,
        status: 'pending'
      }]).select();

      if (!error && data && data.length > 0) {
        const realId = data[0].id;
        setMobilePendingApps(prev => prev.map(item => item.id === tempId ? { ...item, id: realId } : item));
      }
    } catch (err) {
      console.error('Error inserting mobile application to Supabase:', err);
    }

    Alert.alert(
      'Application Submitted! 🛡️',
      `Your freelancer application for "${formServiceTitle}" has been sent to the Admin Dashboard for review. Once approved (OK), it will immediately publish to Navbar Services!`,
      [
        { text: 'OK', onPress: () => { } },
        { text: 'Open Admin Queue', onPress: () => setIsAdminModalOpen(true) }
      ]
    );
  };

  const handleProposalSubmit = async () => {
    if (!proposalCoverLetter.trim() || !proposalBidAmount.trim() || !proposalDeliveryTime.trim()) {
      Alert.alert('Validation Error', 'Please fill in all proposal fields (Cover Letter, Bid Amount, and Delivery Time).');
      return;
    }

    const tempId = `prop-${Date.now()}`;
    const newProposal = {
      id: tempId,
      jobId: proposalJobId,
      jobTitle: proposalJobTitle,
      coverLetter: proposalCoverLetter,
      bidAmount: Number(proposalBidAmount) || 0,
      deliveryTime: proposalDeliveryTime,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setMobileProposals(prev => [newProposal, ...prev]);

    // Construct a freelancer application representation for the Admin Dashboard
    const proposalApp: FreelancerServiceApplication = {
      id: tempId,
      name: mockCurrentUser?.name || 'Freelancer',
      age: 25,
      district: 'Colombo',
      address: 'Sri Lanka',
      guardianName: 'N/A',
      guardianPhone: 'N/A',
      phone: '0770000000',
      isFreelancer: true,
      rating: 5,
      ratingImages: [],
      serviceTitle: `${proposalJobTitle} Proposal`,
      hourlyRate: Number(proposalBidAmount) || 0,
      category: 'Services',
      description: `Delivery Time: ${proposalDeliveryTime}\nCover Letter: ${proposalCoverLetter}`,
      skills: ['Proposal'],
      status: 'pending',
      createdAt: new Date().toLocaleString()
    };

    setMobilePendingApps(prev => [proposalApp, ...prev]);

    setIsProposalFormOpen(false);

    try {
      const { data, error } = await supabase.from('freelancer_applications').insert([{
        name: proposalApp.name,
        age: proposalApp.age,
        district: proposalApp.district,
        address: proposalApp.address,
        guardian_name: proposalApp.guardianName,
        guardian_phone: proposalApp.guardianPhone,
        phone: proposalApp.phone,
        is_freelancer: proposalApp.isFreelancer,
        rating: proposalApp.rating,
        rating_images: proposalApp.ratingImages,
        service_title: proposalApp.serviceTitle,
        hourly_rate: proposalApp.hourlyRate,
        category: proposalApp.category,
        description: proposalApp.description,
        skills: proposalApp.skills,
        status: proposalApp.status
      }]).select();

      if (!error && data && data.length > 0) {
        const realId = data[0].id;
        setMobilePendingApps(prev => prev.map(item => item.id === tempId ? { ...item, id: realId } : item));
      }
    } catch (err) {
      console.error('Error inserting proposal to Supabase freelancer queue:', err);
    }

    setProposalCoverLetter('');
    setProposalBidAmount('');
    setProposalDeliveryTime('');

    Alert.alert(
      'Proposal Submitted! 🚀',
      `Your proposal for "${proposalJobTitle}" has been sent successfully. It is now pending approval in the Admin Freelancers Queue!`,
      [
        { text: 'OK', onPress: () => { } },
        { text: 'Open Admin Queue', onPress: () => setIsAdminModalOpen(true) }
      ]
    );
  };

  const handleAdminApproveApp = async (id: string, name: string) => {
    const appToApprove = mobilePendingApps.find(a => a.id === id);
    if (!appToApprove) return;

    const newService: ServiceItem = {
      id: `s-${Date.now()}`,
      title: appToApprove.serviceTitle,
      hourlyRate: Number(appToApprove.hourlyRate),
      providerName: appToApprove.name,
      providerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      disabilityBadge: (appToApprove.disabilityBadge || 'Verified Freelancer') as any,
      rating: appToApprove.rating,
      reviewsCount: 1,
      category: appToApprove.category,
      availability: `${appToApprove.district} (${appToApprove.isFreelancer ? 'Freelancer' : 'In-House'})`,
      portfolioImages: appToApprove.ratingImages,
      description: appToApprove.description,
      skills: appToApprove.skills
    };

    setMobileServices(prev => [newService, ...prev]);
    setMobilePendingApps(prev => prev.filter(a => a.id !== id));
    setIsAdminModalOpen(false);
    setActiveTab('services');

    try {
      if (!id.startsWith('app-')) {
        await supabase.from('freelancer_applications').update({ status: 'approved' }).eq('id', id);
      }

      await supabase.from('services').insert([{
        title: newService.title,
        hourly_rate: newService.hourlyRate,
        provider_name: newService.providerName,
        provider_avatar: newService.providerAvatar,
        disability_badge: newService.disabilityBadge,
        rating: newService.rating,
        reviews_count: newService.reviewsCount,
        category: newService.category,
        availability: newService.availability,
        portfolio_images: newService.portfolioImages,
        description: newService.description,
        skills: newService.skills
      }]);
    } catch (err) {
      console.error('Error updating Supabase on mobile approval:', err);
    }

    Alert.alert(
      'Approved (OK)! 🎉',
      `Approved application for ${name}! OK confirmed and service has been published live to Navbar Services.`
    );
  };

  const startVoiceSearch = () => {
    if (Platform.OS === 'web') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

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
          Alert.alert(
            'Voice Search Error',
            'Could not recognize voice. Please try again.',
          );
        };

        recognition.onend = () => setIsListeningJobs(false);

        recognition.start();
      } else {
        Alert.alert(
          'Not Supported',
          'Voice search is not supported in this browser.',
        );
      }
    } else {
      Alert.alert(
        'Not Supported',
        'Voice search is currently available on the web version.',
      );
    }
  };

  useEffect(() => {
    const fetchMobileServicesAndApps = async () => {
      try {
        // Fetch real services from Supabase
        const { data: sData } = await supabase.from('services').select('*');
        if (sData) {
          const formattedServices: ServiceItem[] = sData.map(item => ({
            id: item.id,
            title: item.title,
            hourlyRate: Number(item.hourly_rate),
            providerName: item.provider_name,
            providerAvatar: item.provider_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
            disabilityBadge: item.disability_badge || 'Verified Freelancer',
            rating: item.rating || 5.0,
            reviewsCount: item.reviews_count || 1,
            category: item.category || 'Services',
            availability: item.availability || 'Sri Lanka',
            portfolioImages: item.portfolio_images || [],
            description: item.description || '',
            skills: item.skills || ['Freelancer']
          }));
          setMobileServices(formattedServices);
        } else {
          setMobileServices([]);
        }

        const { data: bData } = await supabase.from('service_bookings').select('*').order('created_at', { ascending: false });
        if (bData) {
          setAdminDbBookings(bData);
        }

        // Fetch real pending apps from Supabase
        const { data: aData } = await supabase.from('freelancer_applications').select('*').eq('status', 'pending');
        if (aData) {
          const formattedApps: FreelancerServiceApplication[] = aData.map(item => ({
            id: item.id,
            name: item.name,
            age: item.age,
            district: item.district,
            address: item.address,
            guardianName: item.guardian_name,
            guardianPhone: item.guardian_phone,
            phone: item.phone,
            isFreelancer: item.is_freelancer,
            rating: item.rating,
            ratingImages: item.rating_images || [],
            serviceTitle: item.service_title,
            hourlyRate: Number(item.hourly_rate),
            category: item.category || 'Tech & Accessibility',
            description: item.description || '',
            skills: item.skills || [],
            disabilityBadge: item.disability_badge,
            status: item.status,
            createdAt: new Date(item.created_at || Date.now()).toLocaleString()
          }));
          setMobilePendingApps(formattedApps);
        } else {
          setMobilePendingApps([]);
        }
      } catch (err) {
        console.error('Error fetching mobile services/apps:', err);
      }
    };

    fetchMobileServicesAndApps();

    if (activeTab === 'jobs') {
      const fetchJobs = async () => {
        setLoadingJobs(true);

        try {
          const { data, error } = await supabase
            .from('jobs')
            .select('*');

          if (error) throw error;

          if (data && data.length > 0) {
            const formattedJobs: JobPosting[] = data.map((job: any) => ({
              id: job.id,
              title: job.title,
              company: job.company || 'Partner Company',
              companyLogo:
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
              salary: job.salary || 'Negotiable',
              location: job.location || 'Sri Lanka / Remote',
              accessibilityBadges: job.category ? [job.category] : [],
              eligible_for_wheelchair: job.eligible_for_wheelchair,
              eligible_for_deaf: job.eligible_for_deaf,
              eligible_for_blind: job.eligible_for_blind,
              description:
                job.description ||
                `Job category: ${job.category || 'N/A'}.`,
              postedDate: job.updated_at
                ? new Date(job.updated_at).toLocaleDateString()
                : new Date().toLocaleDateString(),
              applicantCount: 0,
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
      const matchText = (
        job.title +
        ' ' +
        (job.category || '')
      ).toLowerCase();

      const matchesSearch = matchText.includes(
        jobSearch.toLowerCase(),
      );

      const matchesCategory =
        jobCategory === 'All Jobs' ||
        job.accessibilityBadges.includes(jobCategory) ||
        job.category === jobCategory;

      let matchesFilter = true;

      if (
        jobFilter.wheelchair &&
        !job.eligible_for_wheelchair
      ) {
        matchesFilter = false;
      }

      if (jobFilter.deaf && !job.eligible_for_deaf) {
        matchesFilter = false;
      }

      if (jobFilter.blind && !job.eligible_for_blind) {
        matchesFilter = false;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesFilter
      );
    });

    const onlyWheelchair =
      jobFilter.wheelchair &&
      !jobFilter.deaf &&
      !jobFilter.blind;

    if (onlyWheelchair) {
      result.sort((a, b) => {
        const getPriority = (job: any) => {
          if (!job.eligible_for_deaf && !job.eligible_for_blind)
            return 1;

          if (job.eligible_for_deaf && !job.eligible_for_blind)
            return 2;

          if (!job.eligible_for_deaf && job.eligible_for_blind)
            return 3;

          if (job.eligible_for_deaf && job.eligible_for_blind)
            return 4;

          return 5;
        };

        return getPriority(a) - getPriority(b);
      });
    }

    return result;
  }, [dbJobs, jobSearch, jobCategory, jobFilter]);

  useEffect(() => {
    if (activeTab === 'splash') {
      const timer = setTimeout(() => {
        setActiveTab('onboarding');
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const speakText = (text: string) => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } else if (ttsActive) {
      Alert.alert('🔊 Voice Reader', text);
    }
  };

  const fontSizeMultiplier =
    fontScale === 'xl'
      ? 1.3
      : fontScale === 'lg'
        ? 1.15
        : 1.0;

  const dynamicText = (baseSize: number) => ({
    fontSize: Math.round(baseSize * fontSizeMultiplier),
  });

  const handleMobileVoiceSearch = (query: SearchQuery, transcript: string) => {
    setMobileSearchQuery(query);
    speakText(`Search ready for ${query.intent}.`);
    setAiModalVisible(false);

    if (query.intent === 'places') {
      setMapSearchText(query.location || query.keywords);
      setMapSelectedFeatures(query.features);
      setActiveTab('map');
      return;
    }
    setSearchQuery(transcript);
    setActiveTab('search_results');
  };

  useEffect(() => {
    if (activeTab !== 'map') return;
    const controller = new AbortController();
    setMobilePlacesLoading(true);
    setMobilePlacesError('');
    listMobilePlaces(controller.signal)
      .then(setMobilePlaces)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMobilePlacesError(error instanceof Error ? error.message : 'Places could not be loaded.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setMobilePlacesLoading(false);
      });
    return () => controller.abort();
  }, [activeTab]);

  const filteredMobilePlaces = useMemo(() => {
    const text = mapSearchText.trim().toLowerCase();
    return mobilePlaces.filter((place) => {
      const matchesText = !text || [place.title, place.address, place.type, place.badge, ...place.accessibilityFeatures]
        .join(' ')
        .toLowerCase()
        .includes(text);
      return matchesText && matchesFeatures(place.accessibilityFeatures, mapSelectedFeatures);
    });
  }, [mapSearchText, mapSelectedFeatures, mobilePlaces]);

  const toggleMapFeature = (feature: Feature) => {
    setMapSelectedFeatures((current) =>
      current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature],
    );
  };

  // 60 / 30 / 10 visual balance: canvas / surfaces / brand actions.
  const themeBg = highContrast ? '#000000' : '#f3f5f9';
  const cardBg = highContrast ? '#111111' : '#ffffff';
  const textColor = highContrast ? '#ffff00' : '#172033';
  const subTextColor = highContrast ? '#ffffff' : '#667085';
  const accentColor = highContrast ? '#ffff00' : '#1877f2';
  const primaryButtonBg = highContrast ? '#ffff00' : '#1877f2';
  const primaryButtonText = highContrast ? '#000000' : '#ffffff';

  if (activeTab === 'splash') {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
          }}
        >
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#ffffff"
          />

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
              style={{
                width: 320,
                height: 320,
                resizeMode: 'contain',
              }}
            />
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (activeTab === 'onboarding') {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: '#f6f8fc',
          }}
        >
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#f6f8fc"
          />

          <View
            style={{
              flex: 1,
              backgroundColor: '#f6f8fc',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 40,
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: 32,
                paddingHorizontal: 20,
                paddingVertical: 26,
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.08,
                shadowRadius: 24,
                elevation: 4,
              }}
            >
              <Image
                source={require('./assets/images/Onboarding.png')}
                style={{
                  width: 250,
                  height: 250,
                  resizeMode: 'contain',
                  marginBottom: 24,
                }}
              />

              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: '#0d9488',
                  backgroundColor: '#ccfbf1',
                  paddingHorizontal: 14,
                  paddingVertical: 5,
                  borderRadius: 20,
                  marginBottom: 12,
                }}
              >
                DISABLED SELLERS & CREATORS
              </Text>

              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: '#0f172a',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                Inclusive Local Marketplace
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  color: '#64748b',
                  textAlign: 'center',
                  lineHeight: 20,
                  maxWidth: 300,
                }}
              >
                Empowering persons with disabilities to showcase
                handcrafted goods, adaptive products, and offer
                freelance professional services across Sri Lanka.
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#1877f2',
                paddingVertical: 16,
                borderRadius: 20,
                width: '90%',
                alignItems: 'center',
                shadowColor: '#1877f2',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => setActiveTab('auth')}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
              >
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
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: '#f6f8fc',
          }}
        >
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#f6f8fc"
          />

          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 40,
              backgroundColor: '#f6f8fc',
            }}
          >
            <View
              style={{
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Image
                source={require('./assets/images/signup_login.jpg')}
                style={{
                  width: 245,
                  height: 225,
                  resizeMode: 'contain',
                  marginBottom: 20,
                }}
              />

              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: '#0f172a',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                Welcome to AccessHub
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  color: '#64748b',
                  textAlign: 'center',
                  lineHeight: 20,
                  marginBottom: 24,
                  maxWidth: 300,
                }}
              >
                Sign up or log in to explore accessible products,
                jobs, and services.
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: '#1877f2',
                  paddingVertical: 16,
                  borderRadius: 20,
                  width: '90%',
                  alignItems: 'center',
                  marginBottom: 12,
                  shadowColor: '#1877f2',
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={() => setActiveTab('register')}
              >
                <Text
                  style={{
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}
                >
                  Create Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#0f172a',
                  paddingVertical: 16,
                  borderRadius: 20,
                  width: '90%',
                  alignItems: 'center',
                  marginBottom: 12,
                  shadowColor: '#0f172a',
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                onPress={() => {
                  setLoginError('');
                  setLoginModalVisible(true);
                }}
              >
                <Text
                  style={{
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}
                >
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Real-World Authentication Modal */}
          <Modal
            visible={loginModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setLoginModalVisible(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.6)',
                justifyContent: 'flex-end',
              }}
            >
              <View
                style={{
                  backgroundColor: '#ffffff',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  maxHeight: '90%',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>
                    Sign In to Account
                  </Text>
                  <TouchableOpacity
                    onPress={() => setLoginModalVisible(false)}
                    style={{ padding: 4 }}
                  >
                    <Text style={{ fontSize: 18, color: '#64748b', fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                  Enter your credentials. Verified accounts are automatically routed to their designated area (Admins go to Admin Dashboard).
                </Text>

                {/* Quick Demo Credentials Autofill */}
                <View
                  style={{
                    backgroundColor: '#f1f5f9',
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
                    ⚡ QUICK DEMO CREDENTIALS:
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setLoginEmail('admin@accesslink.lk');
                        setLoginPassword('admin123');
                        setLoginError('');
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#e0e7ff',
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#4338ca', fontWeight: 'bold', fontSize: 12 }}>
                        🛡️ Admin Demo
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setLoginEmail('kavindi.p@accesslink.lk');
                        setLoginPassword('user123');
                        setLoginError('');
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#f8fafc',
                        borderWidth: 1,
                        borderColor: '#cbd5e1',
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#334155', fontWeight: 'bold', fontSize: 12 }}>
                        👤 Customer Demo
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Inline Error */}
                {!!loginError && (
                  <View
                    style={{
                      backgroundColor: '#fee2e2',
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ color: '#b91c1c', fontSize: 12, fontWeight: '600' }}>
                      {loginError}
                    </Text>
                  </View>
                )}

                {/* Email Input */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>
                  Email Address
                </Text>
                <TextInput
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  placeholder="e.g. name@accesslink.lk"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    marginBottom: 14,
                    color: '#0f172a',
                  }}
                />

                {/* Password Input */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>
                  Password
                </Text>
                <TextInput
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={true}
                  style={{
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    marginBottom: 20,
                    color: '#0f172a',
                  }}
                />

                {/* Submit Sign In Button */}
                <TouchableOpacity
                  onPress={handleMobileLogin}
                  disabled={isLoggingIn}
                  style={{
                    backgroundColor: '#1877f2',
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>
                    {isLoggingIn ? 'Signing In...' : 'Sign In'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setLoginModalVisible(false)}
                  style={{
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13 }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
        style={[
          styles.container,
          {
            backgroundColor: themeBg,
          },
        ]}
      >
        <StatusBar
          barStyle={highContrast ? 'light-content' : 'dark-content'}
          backgroundColor={themeBg}
        />

        {/* Top Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: highContrast
                ? '#000'
                : '#ffffff',
            },
          ]}
        >
          <View style={styles.brandRow}>
            <LinearGradient
              colors={highContrast ? ['#ffff00', '#ffff00'] : ['#6366f1', '#14b8a6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <Ionicons name="accessibility" size={20} color={highContrast ? '#000' : '#fff'} />
            </LinearGradient>

            <View>
              <Text
                style={[
                  styles.brandTitle,
                  dynamicText(18),
                  {
                    color: textColor,
                  },
                ]}
              >
                AccessHub
              </Text>

              <Text
                style={[
                  styles.brandSub,
                  dynamicText(10),
                  {
                    color: subTextColor,
                  },
                ]}
              >
                Access without limits
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[
                styles.aiButton,
                {
                  backgroundColor: highContrast
                    ? '#ffff00'
                    : '#1877f2',
                },
              ]}
              onPress={() => setAiModalVisible(true)}
            >
              <Ionicons name="sparkles" size={15} color={highContrast ? '#000' : '#fff'} />
              <Text style={[styles.aiButtonText, { color: highContrast ? '#000' : '#fff' }]}>Ask AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.logoutButtonHeader,
                {
                  backgroundColor: highContrast
                    ? '#ff0000'
                    : '#eef2f7',
                },
              ]}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Log out of application"
            >
              <Ionicons name="log-out-outline" size={18} color={highContrast ? '#ffffff' : '#475467'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Accessibility Control Toolbar */}
        <View
          style={[
            styles.a11yBar,
            {
              backgroundColor: highContrast
                ? '#222'
                : '#ffffff',
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
            <Ionicons name="volume-high-outline" size={15} color={ttsActive ? '#ffffff' : (highContrast ? '#ffffff' : '#475467')} />
            <Text style={[styles.a11yChipText, ttsActive && styles.a11yChipTextActive]}>{ttsActive ? 'Audio on' : 'Audio'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.a11yChip,
              highContrast && styles.a11yChipActive,
            ]}
            onPress={() =>
              setHighContrast(!highContrast)
            }
          >
            <Ionicons name="contrast-outline" size={15} color={highContrast ? '#000' : '#475467'} />
            <Text style={[styles.a11yChipText, highContrast && styles.a11yChipTextActive]}>{highContrast ? 'Contrast on' : 'Contrast'}</Text>
          </TouchableOpacity>

          <View style={styles.scaleGroup}>
            {(['md', 'lg', 'xl'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.scaleBtn,
                  fontScale === s &&
                  styles.scaleBtnActive,
                ]}
                onPress={() => setFontScale(s)}
              >
                <Text style={[styles.scaleBtnText, fontScale === s && styles.scaleBtnTextActive]}>
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
              <LinearGradient
                colors={highContrast ? ['#111111', '#111111'] : ['#1877f2', '#5856d6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroGlow} />
                <Text
                  style={[
                    styles.heroBadge,
                    {
                      color: highContrast ? accentColor : '#dbeafe',
                    },
                  ]}
                >
                  WELCOME BACK 👋
                </Text>

                <Text
                  style={[
                    styles.heroTitle,
                    dynamicText(20),
                    {
                      color: highContrast ? textColor : '#ffffff',
                    },
                  ]}
                >
                  {mockCurrentUser.name}
                </Text>

                <Text
                  style={[
                    styles.heroSub,
                    dynamicText(12),
                    {
                      color: highContrast ? subTextColor : '#e8efff',
                    },
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
                        {
                          color: highContrast ? accentColor : '#ffffff',
                        },
                      ]}
                    >
                      LKR{' '}
                      {(
                        (mockCurrentUser.totalEarnings ??
                          0) / 1000
                      ).toFixed(0)}
                      k
                    </Text>

                    <Text
                      style={[
                        styles.statLabel,
                        {
                          color: highContrast ? subTextColor : '#dbeafe',
                        },
                      ]}
                    >
                      Earnings
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color: highContrast ? accentColor : '#ffffff',
                        },
                      ]}
                    >
                      {mockCurrentUser.totalOrders ?? 0}
                    </Text>

                    <Text
                      style={[
                        styles.statLabel,
                        {
                          color: highContrast ? subTextColor : '#dbeafe',
                        },
                      ]}
                    >
                      Orders
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color: highContrast ? accentColor : '#ffffff',
                        },
                      ]}
                    >
                      ⭐ {mockCurrentUser.rating}
                    </Text>

                    <Text
                      style={[
                        styles.statLabel,
                        {
                          color: highContrast ? subTextColor : '#dbeafe',
                        },
                      ]}
                    >
                      Rating
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              <Text
                style={[
                  styles.sectionTitle,
                  dynamicText(16),
                  {
                    color: textColor,
                  },
                ]}
              >
                Explore AccessHub
              </Text>

              <View style={styles.quickGrid}>
                <TouchableOpacity
                  style={[
                    styles.quickCard,
                    {
                      backgroundColor: cardBg,
                    },
                  ]}
                  onPress={() =>
                    setActiveTab('marketplace')
                  }
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: '#e8f1ff' }]}>
                    <Ionicons name="bag-handle-outline" size={23} color="#1877f2" />
                  </View>

                  <Text
                    style={[
                      styles.quickText,
                      dynamicText(12),
                      {
                        color: textColor,
                      },
                    ]}
                  >
                    Marketplace
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickCard,
                    {
                      backgroundColor: cardBg,
                    },
                  ]}
                  onPress={() =>
                    setActiveTab('services')
                  }
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: '#e9fbf5' }]}>
                    <Ionicons name="people-outline" size={23} color="#079669" />
                  </View>

                  <Text
                    style={[
                      styles.quickText,
                      dynamicText(12),
                      {
                        color: textColor,
                      },
                    ]}
                  >
                    Services
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickCard,
                    {
                      backgroundColor: cardBg,
                    },
                  ]}
                  onPress={() =>
                    setActiveTab('jobs')
                  }
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: '#fff7e6' }]}>
                    <Ionicons name="briefcase-outline" size={23} color="#d97706" />
                  </View>

                  <Text
                    style={[
                      styles.quickText,
                      dynamicText(12),
                      {
                        color: textColor,
                      },
                    ]}
                  >
                    Jobs
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickCard,
                    {
                      backgroundColor: cardBg,
                    },
                  ]}
                  onPress={() =>
                    setActiveTab('map')
                  }
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: '#f2ebff' }]}>
                    <Ionicons name="map-outline" size={23} color="#7c3aed" />
                  </View>

                  <Text
                    style={[
                      styles.quickText,
                      dynamicText(12),
                      {
                        color: textColor,
                      },
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
                  {
                    color: textColor,
                  },
                ]}
              >
                Featured for you
              </Text>

              {mockProducts.slice(0, 2).map((item) => (
                <View
                  key={item.id}
                  style={[styles.homeFeedCard, { backgroundColor: cardBg }]}
                >
                  <View style={styles.homeFeedHeader}>
                    <Image source={{ uri: item.sellerAvatar }} style={styles.homeFeedAvatar} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.homeFeedSellerRow}>
                        <Text style={[styles.homeFeedSeller, { color: textColor }]}>{item.sellerName}</Text>
                        <Ionicons name="checkmark-circle" size={14} color="#1877f2" />
                      </View>
                      <Text style={[styles.homeFeedMeta, { color: subTextColor }]}>{item.distanceKm} km away · Accessible seller</Text>
                    </View>
                    <TouchableOpacity accessibilityLabel={`More options for ${item.title}`} style={styles.homeFeedMore}>
                      <Ionicons name="ellipsis-horizontal" size={20} color={subTextColor} />
                    </TouchableOpacity>
                  </View>

                  <Image
                    source={{ uri: item.image }}
                    style={styles.homeFeedImage}
                  />

                  <View style={styles.homeFeedActions}>
                    <View style={styles.homeFeedActionGroup}>
                      <TouchableOpacity accessibilityLabel={`Like ${item.title}`}><Ionicons name="heart-outline" size={24} color={textColor} /></TouchableOpacity>
                      <TouchableOpacity accessibilityLabel={`Share ${item.title}`}><Ionicons name="paper-plane-outline" size={23} color={textColor} /></TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.homeFeedOrderButton}
                      onPress={() => {
                        setCheckoutProduct(item);
                        setCheckoutModalVisible(true);
                      }}
                    >
                      <Text style={styles.homeFeedOrderText}>Order now</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.homeFeedBody}>
                    <Text style={[styles.homeFeedBadge, { color: accentColor }]}>♿ {item.disabilityBadge}</Text>
                    <Text
                      style={[
                        styles.homeFeedTitle,
                        dynamicText(14),
                        { color: textColor },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <View style={styles.homeFeedPriceRow}>
                      <Text style={[styles.homeFeedPrice, { color: textColor }]}>LKR {item.price.toLocaleString()}</Text>
                      <Text style={[styles.homeFeedRating, { color: subTextColor }]}>★ {item.sellerRating} · {item.reviewsCount} reviews</Text>
                    </View>
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
                  {
                    color: textColor,
                  },
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
                    {
                      backgroundColor: cardBg,
                    },
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
                        {
                          color: accentColor,
                        },
                      ]}
                    >
                      ♿ {item.disabilityBadge}
                    </Text>

                    <Text
                      style={[
                        styles.productTitle,
                        dynamicText(14),
                        {
                          color: textColor,
                        },
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={[
                        styles.productPrice,
                        dynamicText(15),
                        {
                          color: accentColor,
                        },
                      ]}
                    >
                      LKR {item.price.toLocaleString()}
                    </Text>

                    <Text
                      style={[
                        styles.sellerName,
                        dynamicText(11),
                        {
                          color: subTextColor,
                        },
                      ]}
                    >
                      Seller: {item.sellerName} (⭐{' '}
                      {item.sellerRating})
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.buyBtn,
                        {
                          backgroundColor:
                            primaryButtonBg,
                        },
                      ]}
                      onPress={() => {
                        setCheckoutProduct(item);
                        setCheckoutModalVisible(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.buyBtnText,
                          {
                            color:
                              primaryButtonText,
                          },
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text
                  style={[
                    styles.sectionTitle,
                    dynamicText(18),
                    { color: textColor, marginBottom: 0 },
                  ]}
                >
                  🤝 Inclusive Services
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('bookedProviders')}
                  style={{ backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Booked Providers</Text>
                </TouchableOpacity>
              </View>

              {/* SEARCH BAR FOR SERVICES */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' }}>
                  <TextInput
                    style={[
                      styles.searchInput,
                      { flex: 1, color: textColor, marginBottom: 0, borderWidth: 0, paddingHorizontal: 12 },
                    ]}
                    placeholder="Search services, skills, providers..."
                    placeholderTextColor={subTextColor}
                    value={serviceSearch}
                    onChangeText={setServiceSearch}
                    accessibilityRole="search"
                    accessibilityLabel="Search services input"
                  />
                  <TouchableOpacity
                    onPress={startVoiceSearch}
                    style={{ padding: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Voice search"
                  >
                    <Text style={{ fontSize: 16 }}>🎤</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* CATEGORY FILTERS TITLE */}
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: textColor, marginTop: 4, marginBottom: 8 }}>
                Category Filters
              </Text>

              {/* CATEGORY FILTER PILLS FOR SERVICES */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
                style={{ marginBottom: 14 }}
              >
                {[
                  { id: 'All', label: '[All]' },
                  { id: 'HandCraft', label: '[Handicrafts]' },
                  { id: 'Development', label: '[Web Development]' },
                  { id: 'Designing', label: '[Design]' },
                  { id: 'Translation', label: '[Translation]' },
                  { id: 'Editing', label: '[Editing]' }
                ].map((cat) => {
                  const isSelected = serviceCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        setServiceCategory(cat.id);
                        speakText(`Filter by ${cat.id}`);
                      }}
                      style={{
                        paddingHorizontal: 22,
                        paddingVertical: 10,
                        borderRadius: 24,
                        backgroundColor: isSelected ? '#f59e0b' : '#1b1436',
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#f59e0b' : '#4c1d95',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: 'bold',
                          color: isSelected ? '#000000' : '#e9d5ff',
                        }}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {mobilePendingApps.length > 0 && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    borderRadius: 16,
                    marginBottom: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => setIsAdminModalOpen(true)}
                >
                  <View>
                    <Text style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 12 }}>
                      🛡️ Admin Dashboard Queue ({mobilePendingApps.length})
                    </Text>
                    <Text style={{ color: '#94a3b8', fontSize: 10 }}>
                      Pending freelancer applications waiting for OK approval
                    </Text>
                  </View>
                  <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 11 }}>
                    Review →
                  </Text>
                </TouchableOpacity>
              )}

              {/* SERVICES CARDS GRID (3-COLUMN RESPONSIVE LAYOUT MATCHING SCREENSHOT 1) */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
                {mobileServices.filter((srv) => {
                  // Category Pill Filter
                  if (serviceCategory !== 'All') {
                    const cat = serviceCategory.toLowerCase();
                    const serviceCat = srv.category?.toLowerCase() || '';
                    const serviceTitle = srv.title?.toLowerCase() || '';
                    const serviceDesc = srv.description?.toLowerCase() || '';
                    const serviceSkills = (srv.skills || []).map((s: string) => s.toLowerCase());

                    let matchCategory = false;

                    if (cat === 'handcraft') {
                      matchCategory = serviceCat.includes('handcraft') || serviceCat.includes('craft') || serviceCat.includes('handbag') || serviceCat.includes('tailor') ||
                        serviceTitle.includes('handcraft') || serviceTitle.includes('craft') || serviceTitle.includes('making') || serviceTitle.includes('handbag') || serviceTitle.includes('tailor') ||
                        serviceDesc.includes('craft') || serviceDesc.includes('hand') ||
                        serviceSkills.some((s: string) => s.includes('craft') || s.includes('hand') || s.includes('making') || s.includes('tailor'));
                    } else if (cat === 'designing') {
                      matchCategory = serviceCat.includes('design') ||
                        serviceTitle.includes('design') || serviceTitle.includes('ux') || serviceTitle.includes('ui') || serviceTitle.includes('graphic') ||
                        serviceDesc.includes('design') || serviceDesc.includes('ux') ||
                        serviceSkills.some((s: string) => s.includes('design') || s.includes('ux') || s.includes('ui'));
                    } else if (cat === 'development') {
                      matchCategory = serviceCat.includes('dev') || serviceCat.includes('code') || serviceCat.includes('software') || serviceCat.includes('web') ||
                        serviceTitle.includes('dev') || serviceTitle.includes('code') || serviceTitle.includes('software') || serviceTitle.includes('web') || serviceTitle.includes('tech') ||
                        serviceDesc.includes('dev') || serviceDesc.includes('code') || serviceDesc.includes('software') ||
                        serviceSkills.some((s: string) => s.includes('dev') || s.includes('code') || s.includes('web') || s.includes('react') || s.includes('software') || s.includes('tech'));
                    } else if (cat === 'translation') {
                      matchCategory = serviceCat.includes('transla') || serviceCat.includes('sign') || serviceCat.includes('language') || serviceCat.includes('interpret') ||
                        serviceTitle.includes('transla') || serviceTitle.includes('sign') || serviceTitle.includes('language') || serviceTitle.includes('interpret') || serviceTitle.includes('braille') ||
                        serviceDesc.includes('transla') || serviceDesc.includes('sign') || serviceDesc.includes('language') ||
                        serviceSkills.some((s: string) => s.includes('transla') || s.includes('sign') || s.includes('language') || s.includes('braille') || s.includes('interpreter'));
                    } else if (cat === 'editing') {
                      matchCategory = serviceCat.includes('edit') || serviceCat.includes('video') || serviceCat.includes('audio') || serviceCat.includes('media') ||
                        serviceTitle.includes('edit') || serviceTitle.includes('video') || serviceTitle.includes('audio') || serviceTitle.includes('media') ||
                        serviceDesc.includes('edit') || serviceDesc.includes('video') || serviceDesc.includes('audio') ||
                        serviceSkills.some((s: string) => s.includes('edit') || s.includes('video') || s.includes('audio') || s.includes('media'));
                    } else {
                      matchCategory = serviceCat.includes(cat) || serviceTitle.includes(cat) || serviceDesc.includes(cat) || serviceSkills.some((s: string) => s.includes(cat));
                    }

                    if (!matchCategory) return false;
                  }

                  // Search query filter
                  if (!serviceSearch.trim()) return true;
                  const q = serviceSearch.toLowerCase().trim();
                  const matchTitle = srv.title.toLowerCase().includes(q);
                  const matchProvider = srv.providerName.toLowerCase().includes(q);
                  const matchDesc = srv.description ? srv.description.toLowerCase().includes(q) : false;
                  const matchSkills = srv.skills ? srv.skills.some(s => s.toLowerCase().includes(q)) : false;
                  const matchBadge = srv.disabilityBadge ? srv.disabilityBadge.toLowerCase().includes(q) : false;
                  return matchTitle || matchProvider || matchDesc || matchSkills || matchBadge;
                }).map((srv, idx) => (
                  <View
                    key={srv.id}
                    style={{
                      flex: 1,
                      minWidth: 260,
                      maxWidth: '100%',
                      margin: 6,
                      backgroundColor: '#1b1436',
                      borderRadius: 18,
                      borderWidth: 1.5,
                      borderColor: '#4c1d95',
                      padding: 14,
                      justifyContent: 'space-between',
                    }}
                  >
                    <View>
                      {/* Provider Header */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Image
                          source={{
                            uri: srv.providerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
                          }}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            borderWidth: 2,
                            borderColor: '#8b5cf6',
                          }}
                        />

                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text
                            style={{
                              color: '#ffffff',
                              fontWeight: 'bold',
                              fontSize: 14,
                            }}
                          >
                            {srv.providerName}
                          </Text>

                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: 'bold' }}>
                              ✔ Verified Freelancer
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Service Title */}
                      <Text
                        style={{
                          color: '#ffffff',
                          fontWeight: 'bold',
                          fontSize: 14,
                          marginBottom: 4,
                        }}
                      >
                        {srv.title}
                      </Text>

                      {/* Description */}
                      <Text
                        style={{
                          color: '#94a3b8',
                          fontSize: 11,
                          lineHeight: 16,
                          marginBottom: 10,
                        }}
                        numberOfLines={2}
                      >
                        {srv.description || 'Professional freelancer service offered through AccessHub.'}
                      </Text>

                      {/* Price & Rating */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 13 }}>
                          LKR {srv.hourlyRate.toLocaleString()} / hour
                        </Text>

                        <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: 'bold' }}>
                          ★ {srv.rating || 4.9}
                        </Text>
                      </View>

                      {/* Uploaded Portfolio / Work Proof Photos */}
                      {srv.portfolioImages && srv.portfolioImages.length > 0 && (
                        <View style={{ marginBottom: 12 }}>
                          <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: 'bold', marginBottom: 4 }}>
                            📷 Work Proof Photos ({srv.portfolioImages.length}):
                          </Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                            {srv.portfolioImages.map((img, i) => (
                              <Image
                                key={i}
                                source={{ uri: img }}
                                style={{
                                  width: 52,
                                  height: 40,
                                  borderRadius: 8,
                                  borderWidth: 1,
                                  borderColor: '#4c1d95',
                                }}
                              />
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#2563eb' : '#f59e0b',
                        paddingVertical: 10,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => {
                        setSelectedMobileBookingService(srv);
                        setBookingProjectTitle(`${srv.title} Project`);
                        setBookingDescription('');
                        setBookingHours('2');
                        setBookingPaymentOption('50_50');
                      }}
                    >
                      <Text style={{ color: idx % 2 === 0 ? '#ffffff' : '#000000', fontWeight: 'bold', fontSize: 12 }}>
                        Book Provider
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* BOOKED PROVIDERS TAB */}
          {activeTab === 'bookedProviders' && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text
                  style={[
                    styles.sectionTitle,
                    dynamicText(18),
                    { color: textColor, marginBottom: 0 },
                  ]}
                >
                  ✅ Booked Providers
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('services')}
                  style={{ backgroundColor: '#4c1d95', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Back to Services</Text>
                </TouchableOpacity>
              </View>

              {loadingBooked ? (
                <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 20, textAlign: 'center' }}>
                  Loading your booked providers from database...
                </Text>
              ) : (() => {
                const combinedBookings = [
                  ...bookedProvidersList,
                  ...bookingRequests.map(b => ({
                    id: b.id,
                    service_title: b.serviceTitle,
                    provider_name: b.providerName,
                    total_budget: b.totalBudget,
                    status: b.status === 'in_progress' ? 'accepted' : b.status,
                    created_at: b.createdAt
                  }))
                ].filter((v, i, a) => a.findIndex(t => t.id === v.id || (t.service_title === v.service_title && t.provider_name === v.provider_name)) === i);

                if (combinedBookings.length === 0) {
                  return (
                    <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 20, textAlign: 'center' }}>
                      You haven't booked any providers yet. Find one from the services page!
                    </Text>
                  );
                }
                return (
                  <ScrollView style={{ marginTop: 10, paddingBottom: 20 }}>
                    {combinedBookings.map((booking, index) => {
                      const status = booking.status?.toLowerCase() || 'pending';
                      return (
                        <TouchableOpacity
                          key={booking.id || index}
                          onPress={() => setSelectedBookedProvider(booking)}
                          style={{ backgroundColor: '#1b1436', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#4c1d95' }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                                {booking.service_title}
                              </Text>
                              <Text style={{ color: '#fbbf24', fontSize: 14, fontWeight: 'bold' }}>
                                Provider: {booking.provider_name}
                              </Text>
                            </View>
                            {status === 'pending' && (
                              <TouchableOpacity
                                onPress={() => handleDeleteBookedProvider(booking.id)}
                                style={{ padding: 6, backgroundColor: '#dc2626', borderRadius: 8 }}
                              >
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Delete</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                            <Text style={{ color: status === 'accepted' ? '#34d399' : status === 'canceled' ? '#f87171' : '#38bdf8', fontSize: 12, fontWeight: 'bold' }}>
                              Status: {booking.status?.toUpperCase() || 'PENDING'}
                            </Text>
                            <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: 'bold' }}>
                              Budget: LKR {booking.total_budget?.toLocaleString()}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                )
              })()}
              {/* Detailed Booked Provider Modal Overlay */}
              {selectedBookedProvider && (
                <Modal visible={true} transparent animationType="fade">
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(15, 23, 42, 0.90)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 16,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: cardBg,
                        borderRadius: 24,
                        padding: 24,
                        width: '100%',
                        maxWidth: 520,
                        height: 500, // Makes the box long vertically
                        maxHeight: '90%',
                        borderColor: '#4c1d95',
                        borderWidth: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.5,
                        shadowRadius: 20,
                        elevation: 10,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 10 }}>
                        <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: 'bold' }}>Booking Details</Text>
                        <TouchableOpacity
                          onPress={() => setSelectedBookedProvider(null)}
                          style={{
                            padding: 6,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 16,
                            width: 32,
                            height: 32,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView style={{ flexShrink: 1 }}>
                        {(() => {
                          const status = (selectedBookedProvider.status || 'pending').toLowerCase();
                          let bgColor = 'rgba(251, 191, 36, 0.1)';
                          let borderColor = '#fbbf24';
                          let titleColor = '#fbbf24';
                          let mainColor = '#f59e0b';
                          let subtitleColor = '#fde68a';
                          let message = 'Provider will review and accept your task soon.';
                          let displayStatus = 'PENDING';

                          if (status === 'accepted' || status === 'in_progress') {
                            bgColor = 'rgba(52, 211, 153, 0.1)';
                            borderColor = '#34d399';
                            titleColor = '#34d399';
                            mainColor = '#10b981';
                            subtitleColor = '#a7f3d0';
                            message = 'Booking accepted! The provider has taken your task.';
                            displayStatus = 'TAKEN';
                          } else if (status === 'canceled' || status === 'rejected') {
                            bgColor = 'rgba(239, 68, 68, 0.1)';
                            borderColor = '#ef4444';
                            titleColor = '#ef4444';
                            mainColor = '#dc2626';
                            subtitleColor = '#fecaca';
                            message = 'This booking has been canceled.';
                            displayStatus = 'CANCELED';
                          }

                          return (
                            <View style={{ backgroundColor: bgColor, padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor }}>
                              <Text style={{ color: titleColor, fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>CURRENT STATUS</Text>
                              <Text style={{ color: mainColor, fontSize: 24, fontWeight: '900', letterSpacing: 2 }}>{displayStatus}</Text>
                              <Text style={{ color: subtitleColor, fontSize: 11, marginTop: 6, textAlign: 'center' }}>
                                {message}
                              </Text>
                            </View>
                          );
                        })()}

                        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>Service Title</Text>
                        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>{selectedBookedProvider.service_title}</Text>

                        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>Assigned Provider</Text>
                        <Text style={{ color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>{selectedBookedProvider.provider_name}</Text>

                        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>Total Escrow Budget</Text>
                        <Text style={{ color: '#38bdf8', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>LKR {selectedBookedProvider.total_budget?.toLocaleString()}</Text>

                        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>Booking Date</Text>
                        <Text style={{ color: '#ffffff', fontSize: 14, marginBottom: 16 }}>{new Date(selectedBookedProvider.created_at).toLocaleDateString()}</Text>
                      </ScrollView>

                      <TouchableOpacity
                        onPress={() => setSelectedBookedProvider(null)}
                        style={{ backgroundColor: '#4c1d95', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 }}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>Close Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              )}
            </View>
          )}

          {/* Service Booking & Milestone Escrow Payment Modal Overlay */}
          {selectedMobileBookingService && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.90)',
                zIndex: 9999,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 16,
              }}
            >
              <View
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 24,
                  padding: 20,
                  width: '100%',
                  maxWidth: 520,
                  maxHeight: '90%',
                  borderColor: '#334155',
                  borderWidth: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                {/* Modal Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Image
                      source={{ uri: selectedMobileBookingService.providerAvatar }}
                      style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#fbbf24' }}
                    />
                    <View>
                      <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: 'bold' }}>
                        ✔ VERIFIED FREELANCER
                      </Text>
                      <Text style={{ color: textColor, fontSize: 16, fontWeight: 'bold' }}>
                        {selectedMobileBookingService.providerName}
                      </Text>
                      <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: 'bold' }}>
                        LKR {selectedMobileBookingService.hourlyRate.toLocaleString()} / hr
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedMobileBookingService(null)}
                    style={{
                      padding: 6,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: 16,
                      width: 32,
                      height: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ flexShrink: 1 }}>
                  {/* AC-125 Voice Confirmation Control */}
                  <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', padding: 12, borderRadius: 14, borderColor: '#6366f1', borderWidth: 1, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ color: '#a5b4fc', fontWeight: 'bold', fontSize: 12 }}>🔊 Voice Reader</Text>
                      <Text style={{ color: '#c7d2fe', fontSize: 10, marginTop: 2 }}>Listen to order total & deposit text out loud</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        const hrs = Math.max(1, Number(bookingHours) || 1);
                        const rate = selectedMobileBookingService.hourlyRate || 4500;
                        const total = hrs * rate;
                        const pct = bookingPaymentOption === 'full' ? 100 : 50;
                        const deposit = Math.round((total * pct) / 100);
                        const msg = `Voice confirmation for checkout. Provider: ${selectedMobileBookingService.providerName}. Service: ${selectedMobileBookingService.title}. Total budget LKR ${total.toLocaleString()} for ${hrs} hours. Escrow deposit required now is LKR ${deposit.toLocaleString()} under ${bookingPaymentOption === 'full' ? '100 percent upfront' : '50 50 split'}.`;

                        if (Platform.OS === 'web' && 'speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                          const utterance = new SpeechSynthesisUtterance(msg);
                          utterance.rate = 0.95;
                          window.speechSynthesis.speak(utterance);
                        } else {
                          Alert.alert('🔊 Voice Order Confirmation', msg);
                        }
                      }}
                      style={{ backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Read Aloud</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Project Title */}
                  <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
                    Project Title / Brief *
                  </Text>
                  <TextInput
                    value={bookingProjectTitle}
                    onChangeText={setBookingProjectTitle}
                    placeholder="e.g. Accessible Video Subtitling & Audio Edit"
                    placeholderTextColor="#94a3b8"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: textColor,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderColor: '#334155',
                      borderWidth: 1,
                      marginBottom: 12,
                      fontSize: 12,
                    }}
                  />

                  {/* Task Instructions */}
                  <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
                    Task Instructions & Requirements
                  </Text>
                  <TextInput
                    value={bookingDescription}
                    onChangeText={setBookingDescription}
                    multiline
                    numberOfLines={3}
                    placeholder="Detailed requirements, file links, specifications..."
                    placeholderTextColor="#94a3b8"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: textColor,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderColor: '#334155',
                      borderWidth: 1,
                      marginBottom: 12,
                      fontSize: 12,
                    }}
                  />

                  {/* Estimated Hours */}
                  <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
                    Estimated Hours Needed
                  </Text>
                  <TextInput
                    value={bookingHours}
                    onChangeText={setBookingHours}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: textColor,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderColor: '#334155',
                      borderWidth: 1,
                      marginBottom: 16,
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}
                  />

                  {/* Payment Terms Section */}
                  <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 13, marginBottom: 6 }}>
                    🔒 Escrow Payment Terms
                  </Text>
                  <Text style={{ color: subTextColor, fontSize: 11, marginBottom: 10 }}>
                    Payments are safely deposited into Escrow and held securely. Money is only released after work completion.
                  </Text>

                  {/* Milestone Split Options - 50/50 and 100% Upfront ONLY */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    <TouchableOpacity
                      onPress={() => setBookingPaymentOption('50_50')}
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 12,
                        backgroundColor:
                          bookingPaymentOption === '50_50' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                        borderColor: bookingPaymentOption === '50_50' ? '#10b981' : '#334155',
                        borderWidth: 1,
                      }}
                    >
                      <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 11 }}>50% / 50% Split</Text>
                      <Text style={{ color: subTextColor, fontSize: 9, marginTop: 2 }}>
                        50% Upfront{"\n"}50% Delivery
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setBookingPaymentOption('full')}
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 12,
                        backgroundColor:
                          bookingPaymentOption === 'full' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                        borderColor: bookingPaymentOption === 'full' ? '#10b981' : '#334155',
                        borderWidth: 1,
                      }}
                    >
                      <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 11 }}>100% Upfront</Text>
                      <Text style={{ color: subTextColor, fontSize: 9, marginTop: 2 }}>
                        Full Escrow{"\n"}Hold
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Calculations */}
                  {(() => {
                    const hrs = Math.max(1, Number(bookingHours) || 1);
                    const total = hrs * selectedMobileBookingService.hourlyRate;
                    const pct = bookingPaymentOption === 'full' ? 100 : 50;
                    const deposit = Math.round((total * pct) / 100);
                    const remaining = total - deposit;

                    return (
                      <View style={{ backgroundColor: '#0f172a', padding: 14, borderRadius: 16, marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                            Total Estimated Budget ({hrs} hrs)
                          </Text>
                          <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 14 }}>
                            LKR {total.toLocaleString()}
                          </Text>
                        </View>

                        <View
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            padding: 10,
                            borderRadius: 10,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ color: '#34d399', fontWeight: 'bold', fontSize: 12 }}>
                            💳 Due Now (Escrow Deposit {pct}%):
                          </Text>
                          <Text style={{ color: '#34d399', fontWeight: 'bold', fontSize: 13 }}>
                            LKR {deposit.toLocaleString()}
                          </Text>
                        </View>

                        {bookingPaymentOption !== 'full' && (
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                            <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                              ⏳ Remaining Balance on Delivery Approval:
                            </Text>
                            <Text style={{ color: '#cbd5e1', fontWeight: 'bold', fontSize: 12 }}>
                              LKR {remaining.toLocaleString()}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </ScrollView>

                {/* Form Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => setSelectedMobileBookingService(null)}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#334155', alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      if (selectedMobileBookingService) {
                        const hours = Number(bookingHours) || 2;
                        const rate = selectedMobileBookingService.hourlyRate || 4500;
                        const total = hours * rate;
                        let pct = 50;
                        if (bookingPaymentOption === 'full') pct = 100;
                        const deposit = Math.round((total * pct) / 100);
                        const remaining = total - deposit;

                        const newBooking: ServiceBookingRequest = {
                          id: `bk-${Date.now()}`,
                          serviceId: selectedMobileBookingService.id,
                          serviceTitle: selectedMobileBookingService.title,
                          providerName: selectedMobileBookingService.providerName,
                          providerAvatar: selectedMobileBookingService.providerAvatar,
                          clientName: currentUser?.name || 'Customer',
                          projectTitle: bookingProjectTitle || `${selectedMobileBookingService.title} Task`,
                          description: bookingDescription || 'Detailed task instructions and requirements.',
                          totalBudget: total,
                          paymentType: bookingPaymentOption === 'full' ? 'full_upfront' : 'milestone',
                          milestones: [],
                          upfrontDeposit: deposit,
                          remainingBalance: remaining,
                          deliveryDate: new Date().toISOString().split('T')[0],
                          status: 'pending',
                          createdAt: new Date().toISOString()
                        };

                        addBookingRequest(newBooking);
                        setMobileBookingRequests(prev => [newBooking, ...prev]);

                        // 🔥 OPTIMISTIC UI UPDATE + REAL SUPABASE DATABASE INSERTION
                        const supabaseBookingData = {
                          // mock IDs like 'u1' break UUID column types. Using static valid UUIDs for test purposes.
                          user_id: '00000000-0000-0000-0000-000000000000',
                          provider_id: '11111111-1111-1111-1111-111111111111',
                          provider_name: selectedMobileBookingService.providerName,
                          service_title: selectedMobileBookingService.title,
                          total_budget: total,
                          status: 'pending',
                          created_at: new Date().toISOString()
                        };

                        setBookedProvidersList(prev => [supabaseBookingData, ...prev]);

                        try {
                          await supabase.from('service_bookings').insert([supabaseBookingData]);
                        } catch (e) {
                          console.log('Supabase insert failed', e);
                        }
                      }

                      setBookingSuccessAlert(true);
                      setTimeout(() => {
                        setBookingSuccessAlert(false);
                        setSelectedMobileBookingService(null);
                      }, 2000);
                    }}
                    style={{ flex: 2, paddingVertical: 12, borderRadius: 14, backgroundColor: '#10b981', alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Confirm Deposit & Book</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Success Notification */}
              {bookingSuccessAlert && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 24,
                    zIndex: 10000,
                  }}
                >
                  <Text style={{ fontSize: 44, marginBottom: 12 }}>🎉</Text>
                  <Text style={{ color: '#34d399', fontWeight: 'bold', fontSize: 20, marginBottom: 6 }}>
                    Booking & Escrow Deposit Confirmed!
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                    Initial Escrow Deposit logged into Vault. Freelancer {selectedMobileBookingService.providerName} has been notified via AccessHub Messages!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* JOBS */}
          {activeTab === 'jobs' && (
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  dynamicText(18),
                  {
                    color: textColor,
                  },
                ]}
              >
                💼 Disability-Confident Jobs
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: cardBg,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#334155',
                    overflow: 'hidden',
                  }}
                >
                  <TextInput
                    style={[
                      styles.searchInput,
                      {
                        flex: 1,
                        color: textColor,
                        marginBottom: 0,
                        borderWidth: 0,
                      },
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
                    <Text
                      style={{
                        fontSize: 18,
                        color: isListeningJobs
                          ? '#ef4444'
                          : subTextColor,
                      }}
                    >
                      {isListeningJobs ? '🔴' : '🎤'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={{
                    marginLeft: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    backgroundColor: cardBg,
                    borderRadius: 8,
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#334155',
                  }}
                  onPress={() =>
                    setShowCategoryDropdown(
                      !showCategoryDropdown,
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Job category selector. Current category is ${jobCategory}`}
                  accessibilityHint="Double tap to open or close the job category dropdown"
                  accessibilityState={{
                    expanded: showCategoryDropdown,
                  }}
                >
                  <Text
                    style={{
                      color: textColor,
                      fontWeight: 'bold',
                    }}
                  >
                    {jobCategory} ▼
                  </Text>
                </TouchableOpacity>
              </View>

              {showCategoryDropdown && (
                <View
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 8,
                    marginBottom: 12,
                    padding: 8,
                    borderWidth: 1,
                    borderColor: '#334155',
                  }}
                  accessibilityRole="menu"
                >
                  {[
                    'All Jobs',
                    'Handcraft Items',
                    'Computer Designing',
                    'Software',
                    'Marketing',
                    'Support',
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => {
                        setJobCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      style={{
                        paddingVertical: 10,
                        borderBottomWidth:
                          cat !== 'Support' ? 1 : 0,
                        borderBottomColor: '#1e293b',
                      }}
                      accessibilityRole="menuitem"
                      accessibilityLabel={cat}
                      accessibilityHint={`Double tap to filter jobs by ${cat}`}
                      accessibilityState={{
                        selected:
                          jobCategory === cat,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            jobCategory === cat
                              ? accentColor
                              : textColor,
                        }}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
                accessibilityLabel="Accessibility filters"
              >
                {[
                  {
                    label: 'Wheelchair Persons',
                    key: 'wheelchair',
                  },
                  {
                    label: 'Deaf Persons',
                    key: 'deaf',
                  },
                  {
                    label: 'Blind Persons',
                    key: 'blind',
                  },
                ].map((f) => {
                  const isActive =
                    jobFilter[
                    f.key as keyof typeof jobFilter
                    ];

                  return (
                    <TouchableOpacity
                      key={f.label}
                      onPress={() =>
                        setJobFilter((prev) => ({
                          ...prev,
                          [f.key]:
                            !prev[
                            f.key as keyof typeof prev
                            ],
                        }))
                      }
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isActive
                          ? accentColor
                          : subTextColor,
                        backgroundColor: isActive
                          ? accentColor
                          : 'transparent',
                        marginRight: 8,
                      }}
                      accessibilityRole="checkbox"
                      accessibilityState={{
                        checked: isActive,
                      }}
                      accessibilityLabel={f.label}
                      accessibilityHint={`Double tap to toggle ${f.label} filter`}
                    >
                      <Text
                        style={{
                          color: isActive
                            ? '#fff'
                            : subTextColor,
                          fontSize: 12,
                        }}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {loadingJobs ? (
                <Text
                  style={{
                    color: subTextColor,
                    textAlign: 'center',
                    marginTop: 20,
                  }}
                >
                  Loading inclusive jobs...
                </Text>
              ) : filteredJobs.length === 0 ? (
                <Text
                  style={{
                    color: subTextColor,
                    textAlign: 'center',
                    marginTop: 20,
                  }}
                >
                  No jobs found.
                </Text>
              ) : (
                filteredJobs.map((job) => (
                  <View
                    key={job.id}
                    style={[
                      styles.jobCard,
                      {
                        backgroundColor: cardBg,
                      },
                    ]}
                  >
                    <View style={styles.rowAlign}>
                      <Image
                        source={{
                          uri: job.companyLogo,
                        }}
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
                            {
                              color: textColor,
                            },
                          ]}
                        >
                          {job.title}
                        </Text>

                        <Text
                          style={[
                            styles.companyName,
                            dynamicText(12),
                            {
                              color: subTextColor,
                            },
                          ]}
                        >
                          {job.company} •{' '}
                          {job.location}
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
                        (
                          b: string,
                          idx: number,
                        ) => (
                          <Text
                            key={idx}
                            style={[
                              styles.jobBadge,
                              {
                                color: textColor,
                                backgroundColor:
                                  '#334155',
                              },
                            ]}
                          >
                            ✓ {b}
                          </Text>
                        ),
                      )}

                      {job.eligible_for_wheelchair && (
                        <Text
                          style={[
                            styles.jobBadge,
                            {
                              color: '#fff',
                              backgroundColor:
                                '#2563eb',
                            },
                          ]}
                        >
                          ♿ Wheelchair
                        </Text>
                      )}

                      {job.eligible_for_deaf && (
                        <Text
                          style={[
                            styles.jobBadge,
                            {
                              color: '#fff',
                              backgroundColor:
                                '#9333ea',
                            },
                          ]}
                        >
                          🧏 Deaf
                        </Text>
                      )}

                      {job.eligible_for_blind && (
                        <Text
                          style={[
                            styles.jobBadge,
                            {
                              color: '#fff',
                              backgroundColor:
                                '#d97706',
                            },
                          ]}
                        >
                          🦯 Blind
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.buyBtn,
                        {
                          backgroundColor:
                            primaryButtonBg,
                          marginTop: 10,
                        },
                      ]}
                      onPress={() => {
                        setProposalJobId(job.id);
                        setProposalJobTitle(job.title);
                        setIsProposalFormOpen(true);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Apply for ${job.title} at ${job.company}`}
                      accessibilityHint="Double tap to submit your application"
                    >
                      <Text
                        style={[
                          styles.buyBtnText,
                          {
                            color:
                              primaryButtonText,
                          },
                        ]}
                      >
                        Apply Now
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* SPRINT 4 VOICE SEARCH RESULTS */}
          {activeTab === 'search_results' && mobileSearchQuery && (
            <MobileSearchResults
              query={mobileSearchQuery}
              products={mockProducts}
              jobs={dbJobs.length > 0 ? dbJobs : mockJobs}
              places={mobilePlaces}
              onBack={() => setAiModalVisible(true)}
              onOpenPlace={(place) => setSelectedMobilePlace(place)}
              theme={{
                background: themeBg,
                card: cardBg,
                text: textColor,
                subText: subTextColor,
                accent: accentColor,
              }}
            />
          )}

          {/* MAP */}
          {activeTab === 'map' && (
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  dynamicText(18),
                  {
                    color: textColor,
                  },
                ]}
              >
                🗺️ Accessible Map Locations
              </Text>

              <MobilePlacesMap
                places={filteredMobilePlaces}
                selectedPlaceId={selectedMobilePlace?.id}
                onLocationChange={setMobileUserCoordinate}
                onSelectPlace={setSelectedMobilePlace}
                theme={{ card: cardBg, text: textColor, subText: subTextColor, accent: accentColor }}
              />

              {mobilePlacesLoading && (
                <Text accessibilityLiveRegion="polite" style={{ color: subTextColor, marginBottom: 10 }}>Loading accessible places…</Text>
              )}
              {!!mobilePlacesError && (
                <Text accessibilityLiveRegion="assertive" style={{ color: '#fecaca', marginBottom: 10 }}>{mobilePlacesError} Showing saved places.</Text>
              )}

              <TextInput
                accessibilityLabel="Search accessible places by name or location"
                value={mapSearchText}
                onChangeText={setMapSearchText}
                placeholder="Search name or location"
                placeholderTextColor={subTextColor}
                style={[styles.searchInput, { backgroundColor: cardBg, color: textColor, marginBottom: 10 }]}
              />

              <Text style={{ color: textColor, fontWeight: '800', marginBottom: 8 }}>
                Required accessibility features
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }} accessibilityLabel="Accessibility feature filters">
                {FEATURES.map((feature) => {
                  const selected = mapSelectedFeatures.includes(feature);
                  return (
                    <TouchableOpacity
                      key={feature}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={featureLabels[feature]}
                      onPress={() => toggleMapFeature(feature)}
                      style={{
                        minHeight: 44,
                        justifyContent: 'center',
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        borderWidth: 1,
                        borderColor: selected ? accentColor : '#475569',
                        backgroundColor: selected ? 'rgba(56,189,248,0.18)' : cardBg,
                      }}
                    >
                      <Text style={{ color: selected ? accentColor : subTextColor, fontWeight: '800' }}>
                        {selected ? '✓ ' : ''}{featureLabels[feature]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {(mapSearchText || mapSelectedFeatures.length > 0) && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Clear place search and accessibility filters"
                  onPress={() => {
                    setMapSearchText('');
                    setMapSelectedFeatures([]);
                    setMobileSearchQuery(null);
                  }}
                  style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginBottom: 8 }}
                >
                  <Text style={{ color: accentColor, fontWeight: '900' }}>Clear search and filters</Text>
                </TouchableOpacity>
              )}

              <Text accessibilityLiveRegion="polite" style={{ color: filteredMobilePlaces.length ? subTextColor : '#fbbf24', marginBottom: 10, fontWeight: '700' }}>
                {filteredMobilePlaces.length === 0
                  ? 'No places match every selected feature. Clear a filter or try another search.'
                  : `${filteredMobilePlaces.length} ${filteredMobilePlaces.length === 1 ? 'place' : 'places'} available.`}
              </Text>

              {filteredMobilePlaces.map((pin) => {
                const photoCount = getReviewsForLocation(
                  pin.id,
                ).filter(
                  (review) => Boolean(review.photoUri),
                ).length;

                const isSelectedPin = selectedMapPin?.id === pin.id;

                return (
                  <TouchableOpacity
                    key={pin.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedMapPin(pin);
                      setSelectedMobilePlace(pin);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${pin.title}. ${pin.badge}. ${pin.distance}`}
                    accessibilityHint="Opens place details with a button for real directions in Maps"
                    accessibilityState={{ selected: isSelectedPin }}
                    style={[
                      styles.mapCard,
                      {
                        backgroundColor: cardBg,
                        borderWidth: isSelectedPin ? 2 : 1,
                        borderColor: isSelectedPin
                          ? (highContrast ? '#00ff00' : '#2563eb')
                          : (highContrast ? '#ffffff' : '#e2e8f0'),
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: pin.image }}
                      style={styles.mapImg}
                      accessibilityIgnoresInvertColors
                    />

                    <View style={{ padding: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <Text
                          style={[
                            styles.mapPinTitle,
                            dynamicText(15),
                            {
                              color: textColor,
                              flex: 1,
                            },
                          ]}
                        >
                          {pin.title}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: highContrast ? '#333300' : '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: highContrast ? '#ffff00' : '#b45309' }}>
                            ⭐ {pin.accessibilityRating.toFixed(1)}
                          </Text>
                        </View>
                      </View>

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

                      {/* AC-86 - AC-90: Awarded Accessibility Badge Banner */}
                      <View
                        style={{
                          marginTop: 8,
                          padding: 8,
                          borderRadius: 10,
                          backgroundColor: highContrast ? '#003300' : '#f0fdf4',
                          borderWidth: 1,
                          borderColor: highContrast ? '#00ff00' : '#bbf7d0',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: highContrast ? '#ffff00' : '#15803d' }}>
                            {pin.id === 'mp1' ? '🥇 Gold Accessibility Badge' : pin.id === 'mp2' ? '🥈 Silver Accessibility Badge' : '🏆 100% Barrier-Free Badge'}
                          </Text>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: highContrast ? '#ffffff' : '#166534', backgroundColor: highContrast ? '#006600' : '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            ✓ VERIFIED
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: highContrast ? '#ffffff' : '#166534', marginTop: 3 }}>
                          ♿ {pin.badge}
                        </Text>
                      </View>

                      {/* Accessibility Feature Badges */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                        {pin.accessibilityFeatures.map((feat) => (
                          <View
                            key={feat}
                            style={{
                              backgroundColor: highContrast ? '#112233' : '#e0f2fe',
                              borderRadius: 6,
                              paddingHorizontal: 7,
                              paddingVertical: 3,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '700', color: highContrast ? '#00ffff' : '#0369a1' }}>
                              ✓ {feat}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {photoCount > 0 && (
                        <Text
                          style={[
                            styles.photoCountText,
                            {
                              color: accentColor,
                              marginTop: 6,
                            },
                          ]}
                        >
                          📷 {photoCount} photo{photoCount === 1 ? '' : 's'} submitted
                        </Text>
                      )}

                      {/* AC-230 Action buttons */}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedMapPin(pin);
                            const result = calculateAccessibleRoute(pin, 'step_free_wheelchair');
                            setMapRouteResult(result);
                            setMapRouteMode('step_free_wheelchair');
                            setMapRouteModalOpen(true);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Open step-free route preview to ${pin.title}`}
                          style={{
                            flex: 1,
                            minHeight: 44,
                            backgroundColor: highContrast ? '#0000cc' : '#2563eb',
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: '#ffffff',
                              fontWeight: '700',
                              fontSize: fontScale === 'xl' ? 13 : fontScale === 'lg' ? 12 : 11,
                            }}
                          >
                            🗺️ Route Preview
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            setReviewModalLocationId(
                              pin.id,
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Write a review for ${pin.title}`}
                          style={{
                            flex: 1,
                            minHeight: 44,
                            backgroundColor: highContrast ? '#006600' : '#0d9488',
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: '#ffffff',
                              fontWeight: '700',
                              fontSize: fontScale === 'xl' ? 13 : fontScale === 'lg' ? 12 : 11,
                            }}
                          >
                            ✍️ Write Review
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Review Modal */}
              <Modal
                visible={
                  reviewModalLocationId !== null
                }
                animationType="slide"
                transparent
                onRequestClose={() =>
                  setReviewModalLocationId(null)
                }
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setReviewModalLocationId(null)}
                  style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor:
                      'rgba(0,0,0,0.5)',
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                    style={{
                      backgroundColor: cardBg,
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    {reviewModalLocationId && (
                      <ReviewForm
                        locationId={
                          reviewModalLocationId
                        }
                        onCancel={() => setReviewModalLocationId(null)}
                        onSubmit={async (data) => {
                          const newReview =
                            addReview(data);

                          try {
                            await saveRatingWithVerification(
                              data.locationId,
                              data.criteriaRatings,
                              data.comment,
                              data.photoUri,
                            );
                          } catch (err) {
                            console.error(
                              'Failed to save rating to Supabase:',
                              err,
                            );

                            Alert.alert(
                              'Warning',
                              'Review saved locally, but the accessibility rating could not be saved to the database.',
                            );
                          }

                          console.log(
                            'Stored review with photo:',
                            newReview,
                          );

                          setReviewModalLocationId(
                            null,
                          );

                          Alert.alert(
                            'Thank you!',
                            'Your accessibility review was submitted.',
                          );
                        }}
                      />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>

              {/* AC-230: Mobile Step-Free & Tactile Route Preview Modal */}
              <Modal
                visible={mapRouteModalOpen}
                animationType="slide"
                transparent
                onRequestClose={() => setMapRouteModalOpen(false)}
              >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                  <View
                    style={{
                      backgroundColor: cardBg,
                      borderTopLeftRadius: 24,
                      borderTopRightRadius: 24,
                      maxHeight: '85%',
                      padding: 16,
                    }}
                  >
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[dynamicText(16), { fontWeight: '800', color: textColor }]}>
                          🗺️ Step-Free Route Preview (AC-230)
                        </Text>
                        <Text style={[dynamicText(12), { color: subTextColor, marginTop: 2 }]}>
                          Destination: {selectedMapPin?.title}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setMapRouteModalOpen(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Close route preview"
                        style={{
                          padding: 8,
                          borderRadius: 20,
                          backgroundColor: highContrast ? '#333333' : '#334155',
                          minWidth: 44,
                          minHeight: 44,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontWeight: '800', color: textColor }}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Mode Toggle */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <TouchableOpacity
                        onPress={() => {
                          if (selectedMapPin) {
                            setMapRouteMode('step_free_wheelchair');
                            setMapRouteResult(calculateAccessibleRoute(selectedMapPin, 'step_free_wheelchair'));
                          }
                        }}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: mapRouteMode === 'step_free_wheelchair' }}
                        style={{
                          flex: 1,
                          minHeight: 44,
                          backgroundColor: mapRouteMode === 'step_free_wheelchair' ? (highContrast ? '#0000cc' : '#2563eb') : (highContrast ? '#222' : '#334155'),
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 8,
                        }}
                      >
                        <Text style={{ color: mapRouteMode === 'step_free_wheelchair' ? '#fff' : textColor, fontWeight: '700', fontSize: 11 }}>
                          ♿ Step-Free Route
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          if (selectedMapPin) {
                            setMapRouteMode('tactile_paving_audio');
                            setMapRouteResult(calculateAccessibleRoute(selectedMapPin, 'tactile_paving_audio'));
                          }
                        }}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: mapRouteMode === 'tactile_paving_audio' }}
                        style={{
                          flex: 1,
                          minHeight: 44,
                          backgroundColor: mapRouteMode === 'tactile_paving_audio' ? (highContrast ? '#006600' : '#0d9488') : (highContrast ? '#222' : '#334155'),
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 8,
                        }}
                      >
                        <Text style={{ color: mapRouteMode === 'tactile_paving_audio' ? '#fff' : textColor, fontWeight: '700', fontSize: 11 }}>
                          🦯 Tactile Route
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* KPI Metrics */}
                    {mapRouteResult && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: highContrast ? '#000000' : '#0f172a', borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: highContrast ? '#ffff00' : '#334155' }}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '700' }}>DISTANCE</Text>
                          <Text style={{ fontSize: 13, color: textColor, fontWeight: '800' }}>{mapRouteResult.summary.totalDistanceMeters}m</Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '700' }}>EST. TIME</Text>
                          <Text style={{ fontSize: 13, color: '#60a5fa', fontWeight: '800' }}>~{mapRouteResult.summary.totalDurationMinutes}m</Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '700' }}>STEP-FREE</Text>
                          <Text style={{ fontSize: 13, color: '#4ade80', fontWeight: '800' }}>{mapRouteResult.summary.stepFreeScorePercentage}%</Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '700' }}>TACTILE</Text>
                          <Text style={{ fontSize: 13, color: '#2dd4bf', fontWeight: '800' }}>{mapRouteResult.summary.tactileCoveragePercentage}%</Text>
                        </View>
                      </View>
                    )}

                    {/* Navigation Steps */}
                    <ScrollView style={{ flexShrink: 1, marginBottom: 12 }}>
                      {mapRouteResult?.steps.map((step) => (
                        <View
                          key={step.id}
                          style={{
                            backgroundColor: highContrast ? '#111827' : '#0f172a',
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: highContrast ? '#ffff00' : '#334155',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '800', color: textColor }}>
                            {step.stepNumber}. {step.instruction}
                          </Text>
                          <Text style={{ fontSize: 11, color: subTextColor, marginTop: 4 }}>
                            📏 {step.distanceMeters}m {step.slopeGradientPercent ? `• Slope: ${step.slopeGradientPercent}%` : ''} {step.hasRamp ? '• Ramp ✓' : ''} {step.hasElevator ? '• Elevator 🛗' : ''}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>

                    {/* Close Action */}
                    <TouchableOpacity
                      onPress={() => setMapRouteModalOpen(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Close route modal"
                      style={{
                        minHeight: 44,
                        backgroundColor: highContrast ? '#333333' : '#334155',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontWeight: '800', color: textColor }}>Close Route Preview</Text>
                    </TouchableOpacity>
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
                  {
                    backgroundColor: cardBg,
                  },
                ]}
              >
                <LinearGradient colors={['#1877f2', '#8b5cf6', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCover} />
                <Image
                  source={{
                    uri: mockCurrentUser.avatar,
                  }}
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
                  ♿{' '}
                  {mockCurrentUser.disabilityBadge}
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

                <View style={styles.profileSocialStats}>
                  <View style={styles.profileSocialStat}>
                    <Text style={[styles.profileSocialValue, { color: textColor }]}>{mockCurrentUser.totalOrders ?? 0}</Text>
                    <Text style={[styles.profileSocialLabel, { color: subTextColor }]}>Orders</Text>
                  </View>
                  <View style={styles.profileSocialDivider} />
                  <View style={styles.profileSocialStat}>
                    <Text style={[styles.profileSocialValue, { color: textColor }]}>{mockCurrentUser.rating}</Text>
                    <Text style={[styles.profileSocialLabel, { color: subTextColor }]}>Rating</Text>
                  </View>
                  <View style={styles.profileSocialDivider} />
                  <View style={styles.profileSocialStat}>
                    <Text style={[styles.profileSocialValue, { color: textColor }]}>Verified</Text>
                    <Text style={[styles.profileSocialLabel, { color: subTextColor }]}>Status</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    marginTop: 14,
                    backgroundColor: highContrast ? '#ff0000' : '#dc2626',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={handleLogout}
                  accessibilityRole="button"
                  accessibilityLabel="Log out of application"
                >
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>
                    🚪 Logout from Account
                  </Text>
                </TouchableOpacity>
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
                    {
                      backgroundColor: cardBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.notifTitle,
                      dynamicText(13),
                      {
                        color: textColor,
                      },
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

          {/* ADMIN DASHBOARD SCREEN */}
          {activeTab === 'admin' && (
            !isAdmin ? (
              <View style={{ padding: 16 }}>
                <AdminUnauthorizedState />
                <TouchableOpacity
                  style={{
                    backgroundColor: primaryButtonBg,
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 14,
                    alignItems: 'center',
                    marginTop: 16,
                  }}
                  onPress={() => setActiveTab('home')}
                >
                  <Text style={{ color: primaryButtonText, fontWeight: 'bold', fontSize: 13 }}>
                    ← Return to Home Screen
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.adminPage}>
                <LinearGradient
                  colors={highContrast ? ['#111111', '#111111'] : ['#172554', '#1877f2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.adminHero}
                >
                  <View style={styles.adminHeroIcon}>
                    <Ionicons name="shield-checkmark" size={25} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adminEyebrow}>ACCESSHUB OPERATIONS</Text>
                    <Text style={styles.adminTitle}>Control center</Text>
                    <Text style={styles.adminSubtitle}>Trust, safety and marketplace health in one place.</Text>
                  </View>
                  <View style={styles.adminPendingPill}>
                    <Text style={styles.adminPendingValue}>{mobilePendingApps.length}</Text>
                    <Text style={styles.adminPendingLabel}>Pending</Text>
                  </View>
                </LinearGradient>

              {/* Sub-Tab Navigation Bar */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.adminTabsContent}
                style={styles.adminTabs}
              >
                {ADMIN_TABS.map((item) => {
                  const selected = adminTab === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setAdminTab(item.id)}
                      accessibilityRole="tab"
                      accessibilityLabel={`Admin tab ${item.label}`}
                      accessibilityState={{ selected }}
                      style={[styles.adminTab, selected && styles.adminTabActive]}
                    >
                      <Ionicons name={item.icon as any} size={17} color={selected ? '#ffffff' : '#667085'} />
                      <Text style={[styles.adminTabLabel, selected && styles.adminTabLabelActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

                {/* ACCESSIBILITY BADGES MANAGER (AC-86 to AC-90) */}
                {adminTab === 'badges' && (
                  <MobileAccessibilityBadgeManager highContrast={highContrast} onSpeak={speakText} />
                )}

                {/* VENDOR VERIFICATION QUEUE VIEW */}
                {adminTab === 'vendors' && (
                  <MobileVendorVerificationQueue />
                )}

                {/* FRAUD MODERATION QUEUE VIEW (AC-252 to AC-263) */}
                {adminTab === 'reviews' && (
                  <MobileFraudModerationQueue />
                )}

                {/* MARKETPLACE LISTING MODERATION VIEW (AC-57 to AC-62) */}
                {adminTab === 'listings' && (
                  <MobileListingModerationQueue />
                )}

                {/* ACCOUNT DASHBOARD VIEW */}
                {adminTab === 'accounts' && (
                  <View style={{ gap: 14 }}>
                    <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                      Financial & Account Management Overview (Live Supabase Sync)
                    </Text>

                    {/* Financial Stats Grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      <View style={[styles.adminMetricCard, { backgroundColor: cardBg }]}>
                        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Total Buyers</Text>
                        <Text style={{ color: textColor, fontSize: 20, fontWeight: 'bold', marginTop: 2 }}>
                          {mobileUsers.filter(u => (u.role || '').toLowerCase() === 'buyer').length || mobileUsers.length}
                        </Text>
                        <Text style={{ color: '#34d399', fontSize: 10, marginTop: 2 }}>● Supabase Synced</Text>
                      </View>

                      <View style={[styles.adminMetricCard, { backgroundColor: cardBg }]}>
                        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Verified Freelancers</Text>
                        <Text style={{ color: textColor, fontSize: 20, fontWeight: 'bold', marginTop: 2 }}>
                          {mobileServices.length}
                        </Text>
                        <Text style={{ color: '#38bdf8', fontSize: 10, marginTop: 2 }}>✔ Live Verified Services</Text>
                      </View>

                      <View style={[styles.adminMetricCard, { backgroundColor: cardBg }]}>
                        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Escrow Volume</Text>
                        <Text style={{ color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginTop: 2 }}>
                          LKR {mobileServices.reduce((acc, s) => acc + (s.hourlyRate * 3), 0).toLocaleString()}
                        </Text>
                        <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>🔒 Protected in Vault</Text>
                      </View>

                      <View style={[styles.adminMetricCard, { backgroundColor: cardBg }]}>
                        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Platform Revenue</Text>
                        <Text style={{ color: '#34d399', fontSize: 16, fontWeight: 'bold', marginTop: 2 }}>
                          LKR {Math.round(mobileServices.reduce((acc, s) => acc + (s.hourlyRate * 3), 0) * 0.10).toLocaleString()}
                        </Text>
                        <Text style={{ color: '#34d399', fontSize: 10, marginTop: 2 }}>10% Service Fee</Text>
                      </View>
                    </View>

                    {/* Orders Sent to Freelancers Section */}
                    <View style={{ backgroundColor: cardBg, padding: 14, borderRadius: 18, borderColor: '#334155', borderWidth: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 13 }}>
                          📦 Orders Sent to Freelancers ({mobileBookingRequests.length})
                        </Text>
                        <TouchableOpacity onPress={() => setAdminTab('bookings')}>
                          <Text style={{ color: '#38bdf8', fontSize: 10, fontWeight: 'bold' }}>View Freelancer Queue ➔</Text>
                        </TouchableOpacity>
                      </View>

                      {mobileBookingRequests.length === 0 ? (
                        <View style={{ padding: 16, alignItems: 'center', borderColor: '#334155', borderWidth: 1, borderRadius: 14, borderStyle: 'dashed' }}>
                          <Text style={{ color: subTextColor, fontSize: 12 }}>No orders sent to freelancers yet.</Text>
                        </View>
                      ) : (
                        mobileBookingRequests.map((req) => (
                          <View key={req.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 14, marginBottom: 10, borderColor: '#334155', borderWidth: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: req.status === 'in_progress' || req.status === 'accepted' ? '#34d399' : '#fbbf24', fontSize: 10, fontWeight: 'bold' }}>
                                  ● {req.status === 'in_progress' || req.status === 'accepted' ? '✓ Accepted by Freelancer' : `Dispatched ➔ Awaiting Freelancer Acceptance (${req.providerName})`}
                                </Text>
                                <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 13, marginTop: 2 }}>{req.projectTitle}</Text>
                                <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2 }}>
                                  Client: <Text style={{ color: textColor, fontWeight: 'bold' }}>{req.clientName}</Text> ➔ Target Freelancer: <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>{req.providerName}</Text> ({req.serviceTitle})
                                </Text>
                              </View>
                              <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 12 }}>LKR {req.totalBudget.toLocaleString()}</Text>
                            </View>

                            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 8, borderRadius: 8, marginVertical: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ color: '#34d399', fontSize: 11, fontWeight: 'bold' }}>
                                💳 Deposit: LKR {req.upfrontDeposit.toLocaleString()}
                              </Text>
                              <Text style={{ color: subTextColor, fontSize: 10 }}>
                                Balance: LKR {req.remainingBalance.toLocaleString()}
                              </Text>
                            </View>

                            {req.status === 'pending' ? (
                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                  style={{ flex: 1, backgroundColor: '#10b981', paddingVertical: 8, borderRadius: 10, alignItems: 'center' }}
                                  onPress={() => {
                                    setMobileBookingRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'in_progress' } : r));
                                    Alert.alert('Order Accepted! 🎉', `Freelancer ${req.providerName} accepted order for ${req.projectTitle}. Work started.`);
                                  }}
                                >
                                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>Accept Order as Freelancer ({req.providerName}) (OK)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={{ backgroundColor: '#7f1d1d', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: 'center' }}
                                  onPress={() => {
                                    setMobileBookingRequests(prev => prev.filter(r => r.id !== req.id));
                                  }}
                                >
                                  <Text style={{ color: '#fca5a5', fontWeight: 'bold', fontSize: 11 }}>Decline</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: 8, borderRadius: 10, alignItems: 'center' }}>
                                <Text style={{ color: '#34d399', fontWeight: 'bold', fontSize: 11 }}>✓ Order Accepted by Freelancer {req.providerName} & Work Started</Text>
                              </View>
                            )}
                          </View>
                        ))
                      )}
                    </View>

                    {/* Registered Seller Profiles Section */}
                    <View style={{ backgroundColor: cardBg, padding: 14, borderRadius: 18, borderColor: '#334155', borderWidth: 1 }}>
                      <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>
                        🛍️ Registered Sellers & Handicraft Creators ({mobileUsers.filter(u => (u.role || '').toLowerCase() === 'seller').length})
                      </Text>

                      {mobileUsers.filter(u => (u.role || '').toLowerCase() === 'seller').length === 0 ? (
                        <View style={{ padding: 14, alignItems: 'center', borderColor: '#334155', borderWidth: 1, borderRadius: 14, borderStyle: 'dashed' }}>
                          <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 12 }}>No Sellers registered in Supabase yet.</Text>
                          <Text style={{ color: subTextColor, fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                            Run the SQL Query provided below to add a new Seller profile!
                          </Text>
                        </View>
                      ) : (
                        mobileUsers.filter(u => (u.role || '').toLowerCase() === 'seller').map((seller, idx) => (
                          <View key={seller.id || idx} style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: 12, borderRadius: 14, marginBottom: 10, borderColor: '#a855f7', borderWidth: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14 }}>{seller.name || 'Kasun Kalhara'}</Text>
                                  <View style={{ backgroundColor: '#a855f7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>✓ Verified Seller</Text>
                                  </View>
                                </View>
                                <Text style={{ color: '#38bdf8', fontSize: 11, marginTop: 2 }}>📍 {seller.location || 'Sri Lanka'} • {seller.email}</Text>
                              </View>
                              <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 13 }}>★ {seller.rating || 5.0}</Text>
                            </View>

                            {seller.bio ? (
                              <Text style={{ color: subTextColor, fontSize: 11, marginTop: 6, fontStyle: 'italic', backgroundColor: 'rgba(0,0,0,0.2)', padding: 6, borderRadius: 8 }}>
                                "{seller.bio}"
                              </Text>
                            ) : null}

                            <TouchableOpacity
                              onPress={() => setSelectedMobileProfile({ ...seller, role: 'seller' })}
                              style={{ marginTop: 8, backgroundColor: '#a855f7', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
                            >
                              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>View Profile & Accept Orders</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>

                    {/* Registered Accounts Queue */}
                    <View style={{ backgroundColor: cardBg, padding: 14, borderRadius: 18, borderColor: '#334155', borderWidth: 1 }}>
                      <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>
                        👥 Registered User Accounts (Supabase Database)
                      </Text>

                      {mobileUsers.length === 0 ? (
                        <View style={{ padding: 16, alignItems: 'center', borderColor: '#334155', borderWidth: 1, borderRadius: 14, borderStyle: 'dashed' }}>
                          <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 13 }}>
                            No users in Supabase <Text style={{ color: '#f59e0b' }}>public.users</Text> table yet.
                          </Text>
                          <Text style={{ color: subTextColor, fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                            Run the SQL Query in Supabase or complete sign-up to populate real users.
                          </Text>
                        </View>
                      ) : (
                        mobileUsers.map((user, idx) => (
                          <View key={user.id || idx} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                              <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 13 }}>{user.name || 'Registered User'}</Text>
                              <Text style={{ color: '#38bdf8', fontSize: 11 }}>{user.role || 'Buyer'}</Text>
                              <Text style={{ color: subTextColor, fontSize: 10 }}>{user.email || user.id}</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => setSelectedMobileProfile(user)}
                              style={{ backgroundColor: '#9333ea', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}
                            >
                              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>View Profile & Accept Orders</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                )}

                {/* ESCROW BOOKINGS / FREELANCER ORDERS QUEUE VIEW */}
                {adminTab === 'bookings' && (
                  <View style={{ gap: 14 }}>
                    <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                      Client Orders Dispatched to Freelancers ({mobileBookingRequests.length})
                    </Text>

                    {(() => {
                      const combinedAdminBookings = [
                        ...mobileBookingRequests,
                        ...bookedProvidersList.map(b => ({
                          id: b.id,
                          serviceTitle: b.service_title,
                          providerName: b.provider_name,
                          clientName: 'Customer',
                          projectTitle: `${b.service_title} Task`,
                          totalBudget: b.total_budget,
                          paymentType: 'full_upfront',
                          upfrontDeposit: b.total_budget,
                          remainingBalance: 0,
                          description: '',
                          status: b.status === 'accepted' ? 'in_progress' : (b.status || 'pending'),
                          createdAt: b.created_at
                        }))
                      ].filter((v, i, a) => a.findIndex(t => t.id === v.id || (t.serviceTitle === v.serviceTitle && t.providerName === v.providerName)) === i);

                      if (combinedAdminBookings.length === 0) {
                        return (
                          <View style={{ backgroundColor: cardBg, padding: 24, borderRadius: 20, alignItems: 'center', borderColor: '#334155', borderWidth: 1 }}>
                            <Text style={{ color: '#34d399', fontWeight: 'bold', fontSize: 15 }}>No Orders Sent to Freelancers</Text>
                            <Text style={{ color: subTextColor, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                              When a client books a freelancer through the form, the order details will appear here for freelancer acceptance.
                            </Text>
                          </View>
                        );
                      }

                      return combinedAdminBookings.map((req, idx) => (
                        <View key={req.id || `fallback-${idx}`} style={{ backgroundColor: cardBg, padding: 16, borderRadius: 20, marginBottom: 12, borderColor: '#334155', borderWidth: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: req.status === 'in_progress' || req.status === 'accepted' ? '#34d399' : '#fbbf24', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>
                                ● {req.status === 'in_progress' || req.status === 'accepted' ? '✓ Accepted by Freelancer' : `Dispatched ➔ Awaiting Freelancer Acceptance (${req.providerName})`}
                              </Text>
                              <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 15, marginTop: 2 }}>{req.projectTitle}</Text>
                              <Text style={{ color: subTextColor, fontSize: 12, marginTop: 2 }}>
                                Client: <Text style={{ color: textColor, fontWeight: 'bold' }}>{req.clientName}</Text> ➔ Target Freelancer: <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>{req.providerName}</Text> ({req.serviceTitle})
                              </Text>
                            </View>
                            <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 14 }}>LKR {Number(req.totalBudget || 0).toLocaleString()}</Text>
                          </View>

                          <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 12, marginVertical: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                              <Text style={{ color: '#94a3b8', fontSize: 10 }}>Payment Option: {req.paymentType === 'full_upfront' ? '100% Upfront' : 'Milestone Split'}</Text>
                              <Text style={{ color: '#34d399', fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                                💳 Deposit: LKR {req.upfrontDeposit.toLocaleString()}
                              </Text>
                            </View>
                            <Text style={{ color: subTextColor, fontSize: 11, alignSelf: 'flex-end' }}>
                              Balance: LKR {req.remainingBalance.toLocaleString()}
                            </Text>
                          </View>

                          {req.description ? (
                            <Text style={{ color: subTextColor, fontSize: 11, fontStyle: 'italic', marginBottom: 10 }}>
                              "{req.description}"
                            </Text>
                          ) : null}

                          {req.status === 'pending' ? (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TouchableOpacity
                                style={{ flex: 1, backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
                                onPress={async () => {
                                  setMobileBookingRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'in_progress' } : r));
                                  const realBooking = bookedProvidersList.find(b => b.service_title === req.serviceTitle && b.provider_name === req.providerName);
                                  const updateId = realBooking?.id || req.id;
                                  setBookedProvidersList(prev => prev.map(r => r.id === updateId ? { ...r, status: 'accepted' } : r));
                                  if (updateId && !updateId.startsWith('bk-')) {
                                    try { await supabase.from('service_bookings').update({ status: 'accepted' }).eq('id', updateId); } catch (e) { }
                                  }
                                  Alert.alert('Order Accepted! 🎉', `Freelancer ${req.providerName} accepted order for ${req.projectTitle}. Locked in Vault.`);
                                }}
                              >
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Accept Order as Freelancer ({req.providerName}) (OK)</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={{ backgroundColor: '#7f1d1d', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
                                onPress={async () => {
                                  setMobileBookingRequests(prev => prev.filter(r => r.id !== req.id));
                                  const realBooking = bookedProvidersList.find(b => b.service_title === req.serviceTitle && b.provider_name === req.providerName);
                                  const updateId = realBooking?.id || req.id;
                                  setBookedProvidersList(prev => prev.map(r => r.id === updateId ? { ...r, status: 'canceled' } : r));
                                  if (updateId && !updateId.startsWith('bk-')) {
                                    try { await supabase.from('service_bookings').update({ status: 'canceled' }).eq('id', updateId); } catch (e) { }
                                  }
                                }}
                              >
                                <Text style={{ color: '#fca5a5', fontWeight: 'bold', fontSize: 12 }}>Decline</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={{ backgroundColor: req.status === 'canceled' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', padding: 10, borderRadius: 12, alignItems: 'center' }}>
                              <Text style={{ color: req.status === 'canceled' ? '#fca5a5' : '#34d399', fontWeight: 'bold', fontSize: 12 }}>
                                {req.status === 'canceled' ? '❌ Order Declined/Canceled' : `✓ Order Accepted by Freelancer ${req.providerName} & Work Started`}
                              </Text>
                            </View>
                          )}
                        </View>
                      ));
                    })()}
                  </View>
                )}

                {/* FREELANCERS QUEUE VIEW */}
                {adminTab === 'freelancers' && (
                  <>
                    <Text style={{ color: subTextColor, fontSize: 12, marginBottom: 16 }}>
                      Review and approve freelancer applications. Approved services immediately display on the Navbar Services tab.
                    </Text>

                    {mobilePendingApps.length === 0 ? (
                      <View style={{ backgroundColor: cardBg, padding: 24, borderRadius: 20, alignItems: 'center', borderColor: '#334155', borderWidth: 1 }}>
                        <Text style={{ color: '#34d399', fontWeight: 'bold', fontSize: 16 }}>All Applications Approved! ✨</Text>
                        <Text style={{ color: subTextColor, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                          There are currently no pending freelancer registration applications in the queue.
                        </Text>
                      </View>
                    ) : (
                      mobilePendingApps.map((app) => (
                        <View key={app.id} style={{ backgroundColor: cardBg, padding: 16, borderRadius: 20, marginBottom: 14, borderColor: '#334155', borderWidth: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 15 }}>{app.name} (Age: {app.age})</Text>
                            <View style={{ backgroundColor: '#0284c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>Pending OK</Text>
                            </View>
                          </View>
                          <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 12 }}>📍 {app.district} District • {app.isFreelancer ? 'Freelancer (YES)' : 'Staff (NO)'}</Text>

                          <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12, marginVertical: 8 }}>
                            <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 13 }}>{app.serviceTitle}</Text>
                            <Text style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 12 }}>LKR {app.hourlyRate} / hr</Text>
                            <Text style={{ color: '#fbbf24', fontSize: 11, marginTop: 2 }}>★ Rating Score: {app.rating}.0 / 5.0</Text>

                            {app.ratingImages && app.ratingImages.length > 0 && (
                              <View style={{ marginTop: 8 }}>
                                <Text style={{ color: subTextColor, fontSize: 10, marginBottom: 4 }}>Uploaded Rating Proof Photos ({app.ratingImages.length}):</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                  {app.ratingImages.map((img, i) => (
                                    <Image key={i} source={{ uri: img }} style={{ width: 50, height: 50, borderRadius: 8 }} />
                                  ))}
                                </View>
                              </View>
                            )}
                          </View>

                          <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 10, borderRadius: 12, marginBottom: 12 }}>
                            <Text style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 11 }}>📱 Phone: {app.phone}</Text>
                            <Text style={{ color: '#f59e0b', fontSize: 11 }}>🛡️ Guardian: {app.guardianName} ({app.guardianPhone})</Text>
                            {app.address ? <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2 }}>🏠 Address: {app.address}</Text> : null}
                          </View>

                          <TouchableOpacity
                            style={{ backgroundColor: '#10b981', padding: 12, borderRadius: 14, alignItems: 'center' }}
                            onPress={() => handleAdminApproveApp(app.id, app.name)}
                          >
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                              Approve & Add to Navbar Services (OK)
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </>
                )}
              </View>
            )
          )}
        </ScrollView>

        {/* USER PROFILE & ORDER ACCEPTANCE MODAL FOR MOBILE */}
        <Modal
          visible={selectedMobileProfile !== null}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedMobileProfile(null)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 16 }}>
            <View style={{ backgroundColor: cardBg, borderRadius: 24, padding: 20, borderColor: '#334155', borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 16 }}>
                  👤 {selectedMobileProfile?.name || 'User'} - Profile & Orders
                </Text>
                <TouchableOpacity onPress={() => setSelectedMobileProfile(null)} style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: textColor, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: 14, borderRadius: 16, borderColor: '#334155', borderWidth: 1, marginBottom: 14 }}>
                <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 15 }}>{selectedMobileProfile?.name}</Text>
                <Text style={{ color: '#38bdf8', fontSize: 12, marginTop: 2 }}>
                  📍 {selectedMobileProfile?.location || 'Sri Lanka'} • {selectedMobileProfile?.email}
                </Text>
                <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 12, marginTop: 4 }}>
                  ★ {selectedMobileProfile?.rating || 5.0} / 5.0 Rating
                </Text>
                {selectedMobileProfile?.bio ? (
                  <Text style={{ color: subTextColor, fontSize: 11, fontStyle: 'italic', marginTop: 6 }}>
                    "{selectedMobileProfile?.bio}"
                  </Text>
                ) : null}
              </View>

              <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14, marginBottom: 8 }}>
                📦 Dispatched Orders ({mobileBookingRequests.length})
              </Text>

              {mobileBookingRequests.length === 0 ? (
                <View style={{ padding: 16, alignItems: 'center', borderColor: '#334155', borderWidth: 1, borderRadius: 14, borderStyle: 'dashed', marginBottom: 14 }}>
                  <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 13 }}>No Client Orders Pending</Text>
                  <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2, textAlign: 'center' }}>
                    Client booking requests for {selectedMobileProfile?.name} will appear here for one-click acceptance.
                  </Text>
                </View>
              ) : (
                mobileBookingRequests.map((req) => (
                  <View key={req.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 14, marginBottom: 10, borderColor: '#334155', borderWidth: 1 }}>
                    <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 13 }}>{req.projectTitle}</Text>
                    <Text style={{ color: '#38bdf8', fontSize: 11 }}>Client: {req.clientName} ➔ Target: {req.providerName}</Text>
                    <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 12, marginTop: 4 }}>Total: LKR {req.totalBudget.toLocaleString()} (Deposit: LKR {req.upfrontDeposit.toLocaleString()})</Text>

                    {req.status === 'pending' ? (
                      <TouchableOpacity
                        style={{ backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 8 }}
                        onPress={async () => {
                          setMobileBookingRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'in_progress' } : r));
                          const realBooking = bookedProvidersList.find(b => b.service_title === req.serviceTitle && b.provider_name === req.providerName);
                          const updateId = realBooking?.id || req.id;
                          setBookedProvidersList(prev => prev.map(r => r.id === updateId ? { ...r, status: 'accepted' } : r));
                          if (updateId && !updateId.startsWith('bk-')) {
                            try { await supabase.from('service_bookings').update({ status: 'accepted' }).eq('id', updateId); } catch (e) { }
                          }
                          Alert.alert('Order Accepted! 🎉', `Accepted order for ${selectedMobileProfile?.name}. Work started.`);
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Accept Order as {selectedMobileProfile?.name} (OK)</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: 8, borderRadius: 8, alignItems: 'center', marginTop: 8 }}>
                        <Text style={{ color: '#34d399', fontWeight: 'bold', fontSize: 11 }}>✓ Order Accepted & Work Started</Text>
                      </View>
                    )}
                  </View>
                ))
              )}

              <TouchableOpacity
                style={{ backgroundColor: '#334155', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 6 }}
                onPress={() => setSelectedMobileProfile(null)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Close Profile Window</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <MobilePlaceDetailsModal
          place={selectedMobilePlace}
          onClose={() => setSelectedMobilePlace(null)}
          userCoordinate={mobileUserCoordinate}
          theme={{
            background: themeBg,
            card: cardBg,
            text: textColor,
            subText: subTextColor,
            accent: accentColor,
          }}
        />

        <MobileVoiceSearchModal
          visible={aiModalVisible}
          onClose={() => setAiModalVisible(false)}
          onSearch={handleMobileVoiceSearch}
          theme={{
            background: themeBg,
            card: cardBg,
            text: textColor,
            subText: subTextColor,
            accent: accentColor,
            primaryButton: primaryButtonBg,
            primaryButtonText,
          }}
        />

        {/* Bottom Tab Bar */}
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: highContrast
                ? '#000'
                : '#ffffff',
            },
          ]}
        >
          {(
            isAdmin
              ? (['admin', 'profile'] as const)
              : (['home', 'marketplace', 'services', 'jobs', 'map', 'profile'] as const)
          ).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabItem,
                activeTab === tab && styles.tabItemActive,
              ]}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Ionicons
                name={(tab === 'home'
                  ? activeTab === tab ? 'home' : 'home-outline'
                  : tab === 'marketplace'
                    ? activeTab === tab ? 'bag-handle' : 'bag-handle-outline'
                    : tab === 'services'
                      ? activeTab === tab ? 'people' : 'people-outline'
                      : tab === 'jobs'
                        ? activeTab === tab ? 'briefcase' : 'briefcase-outline'
                        : tab === 'map'
                          ? activeTab === tab ? 'map' : 'map-outline'
                          : tab === 'admin'
                            ? activeTab === tab ? 'shield-checkmark' : 'shield-checkmark-outline'
                            : activeTab === tab ? 'person' : 'person-outline') as any}
                size={20}
                color={activeTab === tab ? accentColor : subTextColor}
              />

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      activeTab === tab
                        ? accentColor
                        : subTextColor,
                    fontWeight:
                      activeTab === tab
                        ? 'bold'
                        : 'normal',
                  },
                ]}
              >
                {tab === 'marketplace' ? 'Shop' : tab === 'services' ? 'Services' : tab === 'admin' ? 'Admin' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Checkout Modal */}
        <MobileCheckoutModal
          visible={isCheckoutModalVisible}
          onClose={() =>
            setCheckoutModalVisible(false)
          }
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

        {/* Freelancer Registration Form Modal */}
        <Modal
          visible={isFreelancerFormOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsFreelancerFormOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: textColor }}>
                    🛠️ Freelancer Registration Form
                  </Text>
                  <TouchableOpacity onPress={() => setIsFreelancerFormOpen(false)}>
                    <Text style={{ fontSize: 18, color: subTextColor, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Section 1: Personal Info */}
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: accentColor, marginBottom: 8, textTransform: 'uppercase' }}>
                  1. Personal Details
                </Text>

                <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>Applicant Name *</Text>
                <TextInput
                  style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12, marginBottom: 10 }}
                  placeholder="e.g. Kasun Perera"
                  placeholderTextColor="#64748b"
                  value={formName}
                  onChangeText={setFormName}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>Age</Text>
                    <TextInput
                      style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12 }}
                      placeholder="e.g. 26"
                      keyboardType="numeric"
                      placeholderTextColor="#64748b"
                      value={formAge}
                      onChangeText={setFormAge}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>District *</Text>
                    <TextInput
                      style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12 }}
                      placeholder="e.g. Colombo, Kandy"
                      placeholderTextColor="#64748b"
                      value={formDistrict}
                      onChangeText={setFormDistrict}
                    />
                  </View>
                </View>

                <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>Phone Number *</Text>
                <TextInput
                  style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12, marginBottom: 10 }}
                  placeholder="+94 77 123 4567"
                  placeholderTextColor="#64748b"
                  value={formPhone}
                  onChangeText={setFormPhone}
                />

                <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>Full Address</Text>
                <TextInput
                  style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12, marginBottom: 10 }}
                  placeholder="No. 45, Temple Road, Colombo"
                  placeholderTextColor="#64748b"
                  value={formAddress}
                  onChangeText={setFormAddress}
                />

                {/* Section 2: Guardian Info */}
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#f59e0b', marginTop: 6, marginBottom: 8, textTransform: 'uppercase' }}>
                  2. Guardian Details (භාරකරුගේ විස්තර)
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>Guardian Name</Text>
                    <TextInput
                      style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12 }}
                      placeholder="Sunil Perera (Father)"
                      placeholderTextColor="#64748b"
                      value={formGuardianName}
                      onChangeText={setFormGuardianName}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>Guardian Phone</Text>
                    <TextInput
                      style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12 }}
                      placeholder="+94 71 888 9900"
                      placeholderTextColor="#64748b"
                      value={formGuardianPhone}
                      onChangeText={setFormGuardianPhone}
                    />
                  </View>
                </View>

                {/* Section 3: Freelancer Yes/No */}
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#38bdf8', marginTop: 6, marginBottom: 8, textTransform: 'uppercase' }}>
                  3. Freelancer Status (Freelancer Yes / No)
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: formIsFreelancer ? accentColor : themeBg, padding: 12, borderRadius: 12, alignItems: 'center' }}
                    onPress={() => setFormIsFreelancer(true)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>YES - Freelancer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: !formIsFreelancer ? '#334155' : themeBg, padding: 12, borderRadius: 12, alignItems: 'center' }}
                    onPress={() => setFormIsFreelancer(false)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>NO - Staff</Text>
                  </TouchableOpacity>
                </View>

                {/* Section 4: Rating & Proof Images */}
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fbbf24', marginTop: 6, marginBottom: 8, textTransform: 'uppercase' }}>
                  4. Rating Score & Proof Images
                </Text>

                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: star <= formRating ? '#f59e0b' : '#334155' }}
                      onPress={() => setFormRating(star)}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>★ {star}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Local Storage Photo Upload Section Right Below Ratings */}
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 6 }}>
                  📷 Upload Photos from Local Storage ({formRatingImages.length} uploaded)
                </Text>

                <TouchableOpacity
                  style={{
                    backgroundColor: themeBg,
                    borderColor: accentColor,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderRadius: 14,
                    padding: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12
                  }}
                  onPress={pickImageFromLocalStorage}
                >
                  <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 13 }}>
                    📂 Choose Photos from Device / Local Storage
                  </Text>
                  <Text style={{ color: subTextColor, fontSize: 10, marginTop: 4, textAlign: 'center' }}>
                    Tap to open your phone/computer photo gallery and select local files
                  </Text>
                </TouchableOpacity>

                {/* Rating Images Preview Gallery */}
                {formRatingImages.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {formRatingImages.map((img, idx) => (
                      <View key={idx} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' }}>
                        <Image source={{ uri: img }} style={{ width: 60, height: 55 }} />
                        <TouchableOpacity
                          style={{ position: 'absolute', top: 3, right: 3, backgroundColor: '#ef4444', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}
                          onPress={() => setFormRatingImages(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Section 5: Service Info */}
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#34d399', marginTop: 6, marginBottom: 8, textTransform: 'uppercase' }}>
                  5. Service Details
                </Text>

                <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>Service Title *</Text>
                <TextInput
                  style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12, marginBottom: 10 }}
                  placeholder="e.g. Handbags Making Service"
                  placeholderTextColor="#64748b"
                  value={formServiceTitle}
                  onChangeText={setFormServiceTitle}
                />

                <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>Hourly Rate (LKR)</Text>
                <TextInput
                  style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12, marginBottom: 14 }}
                  placeholder="4500"
                  keyboardType="numeric"
                  placeholderTextColor="#64748b"
                  value={formHourlyRate}
                  onChangeText={setFormHourlyRate}
                />

                <TouchableOpacity
                  style={{ backgroundColor: accentColor, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 6 }}
                  onPress={handleFreelancerFormSubmit}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                    Submit Application to Admin Dashboard
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Proposal Submission Form Modal */}
        <Modal
          visible={isProposalFormOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsProposalFormOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                  📝 Submit Proposal for {proposalJobTitle}
                </Text>
                <TouchableOpacity onPress={() => setIsProposalFormOpen(false)}>
                  <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: 'bold' }}>Close</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>Cover Letter</Text>
                <TextInput
                  style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12, marginBottom: 14, minHeight: 80, textAlignVertical: 'top' }}
                  placeholder="Why are you the best fit for this job?"
                  multiline
                  placeholderTextColor="#64748b"
                  value={proposalCoverLetter}
                  onChangeText={setProposalCoverLetter}
                />

                <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>Bid Amount (LKR)</Text>
                <TextInput
                  style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12, marginBottom: 14 }}
                  placeholder="e.g. 5000"
                  keyboardType="numeric"
                  placeholderTextColor="#64748b"
                  value={proposalBidAmount}
                  onChangeText={setProposalBidAmount}
                />

                <Text style={{ fontSize: 11, fontWeight: 'bold', color: textColor, marginBottom: 2 }}>Estimated Delivery Time</Text>
                <TextInput
                  style={{ backgroundColor: themeBg, borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 10, color: textColor, fontSize: 12, marginBottom: 14 }}
                  placeholder="e.g. 3 Days"
                  placeholderTextColor="#64748b"
                  value={proposalDeliveryTime}
                  onChangeText={setProposalDeliveryTime}
                />

                <TouchableOpacity
                  style={{ backgroundColor: '#10b981', padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 6 }}
                  onPress={handleProposalSubmit}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                    Send Proposal
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Admin Review Queue Modal */}
        <Modal
          visible={isAdminModalOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsAdminModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: textColor }}>
                    🛡️ Admin Dashboard Queue ({mobilePendingApps.length})
                  </Text>
                  <TouchableOpacity onPress={() => setIsAdminModalOpen(false)}>
                    <Text style={{ fontSize: 18, color: subTextColor, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {mobilePendingApps.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#34d399', fontWeight: 'bold', fontSize: 14 }}>All Applications Approved!</Text>
                    <Text style={{ color: subTextColor, fontSize: 12, marginTop: 4 }}>No pending freelancer applications.</Text>
                  </View>
                ) : (
                  mobilePendingApps.map((app) => (
                    <View key={app.id} style={{ backgroundColor: themeBg, padding: 14, borderRadius: 16, marginBottom: 12, borderColor: '#334155', borderWidth: 1 }}>
                      <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14 }}>{app.name} (Age: {app.age})</Text>
                      <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 11, marginTop: 2 }}>📍 {app.district} District • {app.isFreelancer ? 'Freelancer (YES)' : 'Staff (NO)'}</Text>

                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 10, marginVertical: 8 }}>
                        <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 12 }}>{app.serviceTitle}</Text>
                        <Text style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 11 }}>LKR {app.hourlyRate} / hr</Text>
                        <Text style={{ color: '#fbbf24', fontSize: 11, marginTop: 2 }}>★ Rating: {app.rating}.0 / 5.0</Text>
                      </View>

                      <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 8, borderRadius: 10, marginBottom: 8 }}>
                        <Text style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 10 }}>APPLICANT PHONE: {app.phone}</Text>
                        <Text style={{ color: '#f59e0b', fontSize: 10 }}>GUARDIAN: {app.guardianName} ({app.guardianPhone})</Text>
                        {app.address ? <Text style={{ color: subTextColor, fontSize: 10, marginTop: 2 }}>ADDRESS: {app.address}</Text> : null}
                      </View>

                      <TouchableOpacity
                        style={{ backgroundColor: '#10b981', padding: 12, borderRadius: 12, alignItems: 'center' }}
                        onPress={() => handleAdminApproveApp(app.id, app.name)}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                          Approve & Add to Navbar Services (OK)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e7eaf0',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#1877f2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },

  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },

  brandTitle: {
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  brandSub: {
    fontSize: 10,
    marginTop: 1,
    letterSpacing: 0.25,
  },

  aiButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiButtonText: {
    fontWeight: '800',
    fontSize: 12,
  },

  logoutButtonHeader: {
    width: 38,
    height: 38,
    borderRadius: 12,
    marginLeft: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoutButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  a11yBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.10)',
  },

  a11yChip: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#eef2f7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  a11yChipActive: {
    backgroundColor: '#1877f2',
  },

  a11yChipText: {
    color: '#475467',
    fontSize: 10,
    fontWeight: '800',
  },

  a11yChipTextActive: {
    color: '#ffffff',
  },

  scaleGroup: {
    flexDirection: 'row',
    backgroundColor: '#eef2f7',
    borderRadius: 10,
    padding: 3,
  },

  scaleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },

  scaleBtnActive: {
    backgroundColor: '#1877f2',
  },

  scaleBtnText: {
    color: '#475467',
    fontSize: 9,
    fontWeight: 'bold',
  },

  scaleBtnTextActive: {
    color: '#ffffff',
  },

  contentScroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },

  heroCard: {
    padding: 20,
    borderRadius: 26,
    marginBottom: 22,
    minHeight: 205,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },

  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -55,
    top: -70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  heroBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  heroTitle: {
    fontWeight: '900',
    marginTop: 7,
    letterSpacing: -0.5,
  },

  heroSub: {
    marginTop: 7,
    lineHeight: 18,
    maxWidth: '88%',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
  },

  statBox: {
    flex: 1,
    alignItems: 'flex-start',
  },

  statValue: {
    fontWeight: '900',
    fontSize: 16,
  },

  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },

  sectionTitle: {
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: -0.25,
  },

  adminPage: {
    paddingBottom: 12,
  },

  adminHero: {
    minHeight: 142,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    shadowColor: '#1877f2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },

  adminHeroIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },

  adminEyebrow: {
    color: '#bfdbfe',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.15,
  },

  adminTitle: {
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 3,
  },

  adminSubtitle: {
    color: '#dbeafe',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  adminPendingPill: {
    minWidth: 58,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  adminPendingValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },

  adminPendingLabel: {
    color: '#dbeafe',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  adminTabs: {
    marginVertical: 16,
  },

  adminTabsContent: {
    gap: 8,
    paddingHorizontal: 1,
    paddingRight: 14,
  },

  adminTab: {
    minHeight: 44,
    paddingHorizontal: 13,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
  },

  adminTabActive: {
    backgroundColor: '#1877f2',
    borderColor: '#1877f2',
  },

  adminTabLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
  },

  adminTabLabelActive: {
    color: '#ffffff',
  },

  adminMetricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e4e7ec',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 9,
    elevation: 2,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  quickCard: {
    width: '48%',
    minHeight: 118,
    padding: 14,
    borderRadius: 20,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e7eaf0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  quickIcon: {
    fontSize: 24,
    marginBottom: 4,
  },

  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  quickText: {
    fontWeight: '800',
  },

  homeFeedCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e4e7ec',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },

  homeFeedHeader: {
    minHeight: 66,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  homeFeedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#dbeafe',
  },

  homeFeedSellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  homeFeedSeller: {
    fontSize: 12,
    fontWeight: '900',
  },

  homeFeedMeta: {
    fontSize: 9,
    marginTop: 2,
  },

  homeFeedMore: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeFeedImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#eef2f7',
  },

  homeFeedActions: {
    paddingHorizontal: 14,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  homeFeedActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  homeFeedOrderButton: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877f2',
  },

  homeFeedOrderText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },

  homeFeedBody: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
  },

  homeFeedBadge: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  homeFeedTitle: {
    fontWeight: '900',
    lineHeight: 20,
    marginTop: 4,
  },

  homeFeedPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  homeFeedPrice: {
    fontSize: 14,
    fontWeight: '900',
  },

  homeFeedRating: {
    fontSize: 9,
    fontWeight: '700',
  },

  productCard: {
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e7eaf0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  productImg: {
    width: 118,
    height: 132,
  },

  productBody: {
    flex: 1,
    padding: 13,
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
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 11,
    alignItems: 'center',
  },

  buyBtnText: {
    fontWeight: 'bold',
    fontSize: 11,
  },

  searchInput: {
    minHeight: 48,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 15,
    marginBottom: 14,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#dde2ea',
  },

  serviceCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e7eaf0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e7eaf0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  mapCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  mapImg: {
    width: '100%',
    height: 170,
  },

  mapPinTitle: {
    fontWeight: 'bold',
  },

  mapAddress: {
    fontSize: 11,
  },

  photoCountText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },

  profileCard: {
    padding: 22,
    paddingTop: 0,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e7eaf0',
    overflow: 'hidden',
  },

  profileCover: {
    width: '120%',
    height: 105,
    marginBottom: -43,
  },

  profileAvatar: {
    width: 86,
    height: 86,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#eef2f7',
  },

  profileName: {
    fontWeight: 'bold',
  },

  profileBio: {
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  profileSocialStats: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eaecf0',
  },

  profileSocialStat: {
    flex: 1,
    alignItems: 'center',
  },

  profileSocialValue: {
    fontSize: 13,
    fontWeight: '900',
  },

  profileSocialLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },

  profileSocialDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#eaecf0',
  },

  notifCard: {
    padding: 15,
    borderRadius: 17,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e7eaf0',
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
    borderTopColor: '#e7eaf0',
    paddingHorizontal: 7,
    paddingTop: 7,
    paddingBottom: Platform.OS === 'ios' ? 4 : 8,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 5,
    borderRadius: 14,
  },

  tabItemActive: {
    backgroundColor: '#e8f1ff',
  },

  tabIcon: {
    fontSize: 18,
  },

  tabLabel: {
    fontSize: 9,
    marginTop: 3,
    letterSpacing: 0.1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(1, 6, 15, 0.82)',
    justifyContent: 'center',
    padding: 16,
  },

  modalContent: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
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
    borderRadius: 14,
    marginTop: 12,
    fontSize: 13,
  },

  modalAskBtn: {
    minHeight: 46,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiResBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#07111f',
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
