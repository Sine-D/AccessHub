export type ScreenView = 
  | 'splash'
  | 'onboarding'
  | 'auth'
  | 'home'
  | 'marketplace'
  | 'product_detail'
  | 'services'
  | 'jobs'
  | 'donations'
  | 'map'
  | 'chat'
  | 'profile'
  | 'settings'
  | 'a11y_settings'
  | 'order_tracking'
  | 'payment'
  | 'notifications'
  | 'admin';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  MainTabs: undefined;
  ProductDetail: { productId: string };
  ServiceDetail: { serviceId: string };
  JobDetail: { jobId: string };
  DonationDetail: { donationId: string };
  OrderTracking: { orderId: string };
  Payment: undefined;
  Settings: undefined;
  AccessibilitySettings: undefined;
  Notifications: undefined;
  Admin: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  MarketplaceTab: undefined;
  JobsTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};
