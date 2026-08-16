import React from 'react';
import { useAppState } from '../hooks/useAppState';

// Feature Modules Imports (Feature-First Clean Architecture)
import { SplashScreen, OnboardingScreen, AuthScreen } from '../../features/auth';
import { HomeScreen } from '../../features/home';
import { MarketplaceScreen, ProductDetailScreen } from '../../features/marketplace';
import { ServicesScreen } from '../../features/services';
import { JobsScreen } from '../../features/jobs';
import { DonationScreen } from '../../features/donations';
import { MapScreen } from '../../features/map';
import { ChatScreen } from '../../features/chat';
import { PaymentScreen, OrderTrackingScreen } from '../../features/orders';
import { AdminScreen } from '../../features/admin';
import { ProfileScreen, SettingsScreen, AccessibilitySettingsScreen, NotificationsScreen } from '../../features/profile';

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
