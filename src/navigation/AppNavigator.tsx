import React from 'react';
import { useAppState } from '../hooks/useAppState';

// Auth Screens
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';

// Main Screens
import { HomeScreen } from '../screens/main/HomeScreen';
import { MarketplaceScreen } from '../screens/main/MarketplaceScreen';
import { ProductDetailScreen } from '../screens/main/ProductDetailScreen';
import { ServicesScreen } from '../screens/main/ServicesScreen';
import { JobsScreen } from '../screens/main/JobsScreen';
import { DonationScreen } from '../screens/main/DonationScreen';
import { MapScreen } from '../screens/main/MapScreen';
import { ChatScreen } from '../screens/main/ChatScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

// Order Screens
import { OrderTrackingScreen } from '../screens/order/OrderTrackingScreen';
import { PaymentScreen } from '../screens/order/PaymentScreen';

// Settings Screens
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AccessibilitySettingsScreen } from '../screens/settings/AccessibilitySettingsScreen';

// Admin & Notification Screens
import { AdminScreen } from '../screens/admin/AdminScreen';
import { NotificationsScreen } from '../screens/admin/NotificationsScreen';

export const AppNavigator: React.FC = () => {
  const { activeScreen } = useAppState();

  switch (activeScreen) {
    case 'splash':
      return <SplashScreen />;
    case 'onboarding':
      return <OnboardingScreen />;
    case 'auth':
      return <AuthScreen />;
    case 'home':
      return <HomeScreen />;
    case 'marketplace':
      return <MarketplaceScreen />;
    case 'product_detail':
      return <ProductDetailScreen />;
    case 'services':
      return <ServicesScreen />;
    case 'jobs':
      return <JobsScreen />;
    case 'donations':
      return <DonationScreen />;
    case 'map':
      return <MapScreen />;
    case 'chat':
      return <ChatScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'a11y_settings':
      return <AccessibilitySettingsScreen />;
    case 'order_tracking':
      return <OrderTrackingScreen />;
    case 'payment':
      return <PaymentScreen />;
    case 'notifications':
      return <NotificationsScreen />;
    case 'admin':
      return <AdminScreen />;
    default:
      return <HomeScreen />;
  }
};
