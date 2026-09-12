import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, Product, User, ServiceItem, FreelancerServiceApplication } from '../types';
import { mockCurrentUser, mockProducts, mockServices, mockPendingServiceApplications } from '../../mock/data';

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

interface AppStateContextType {
  activeScreen: ScreenView;
  setActiveScreen: (screen: ScreenView) => void;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  cart: { product: Product; quantity: number }[];
  addToCart: (p: Product) => void;
  removeFromCart: (productId: string) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  deviceFrame: 'iphone' | 'android' | 'fullscreen';
  setDeviceFrame: (frame: 'iphone' | 'android' | 'fullscreen') => void;
  sellModalOpen: boolean;
  setSellModalOpen: (open: boolean) => void;
  freelancerModalOpen: boolean;
  setFreelancerModalOpen: (open: boolean) => void;
  servicesList: ServiceItem[];
  pendingServiceApplications: FreelancerServiceApplication[];
  addFreelancerServiceApplication: (appData: Omit<FreelancerServiceApplication, 'id' | 'status' | 'createdAt'>) => void;
  approveServiceApplication: (id: string) => void;
  rejectServiceApplication: (id: string) => void;
  unreadNotifications: number;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenView>('splash');
  const [currentUser, setCurrentUser] = useState<User>(mockCurrentUser);
  const [userRole, setUserRole] = useState<UserRole>('seller');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(mockProducts[0]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([
    { product: mockProducts[0], quantity: 1 }
  ]);
  const [wishlist, setWishlist] = useState<string[]>(['p1', 'p3']);
  const [deviceFrame, setDeviceFrame] = useState<'iphone' | 'android' | 'fullscreen'>('iphone');
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [freelancerModalOpen, setFreelancerModalOpen] = useState(false);
  
  // Dynamic Services & Approvals Queue State
  const [servicesList, setServicesList] = useState<ServiceItem[]>(mockServices);
  const [pendingServiceApplications, setPendingServiceApplications] = useState<FreelancerServiceApplication[]>(mockPendingServiceApplications);

  const unreadNotifications = 2;

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addFreelancerServiceApplication = (appData: Omit<FreelancerServiceApplication, 'id' | 'status' | 'createdAt'>) => {
    const newApp: FreelancerServiceApplication = {
      ...appData,
      id: `app-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toLocaleString()
    };
    setPendingServiceApplications(prev => [newApp, ...prev]);
  };

  const approveServiceApplication = (id: string) => {
    const appToApprove = pendingServiceApplications.find(a => a.id === id);
    if (!appToApprove) return;

    // Convert approved application to a published ServiceItem
    const newService: ServiceItem = {
      id: `s-${Date.now()}`,
      title: appToApprove.serviceTitle,
      hourlyRate: Number(appToApprove.hourlyRate),
      providerName: appToApprove.name,
      providerAvatar: appToApprove.ratingImages[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      disabilityBadge: (appToApprove.disabilityBadge || 'Verified Freelancer') as any,
      rating: appToApprove.rating,
      reviewsCount: 1,
      category: appToApprove.category,
      availability: `${appToApprove.district} (${appToApprove.isFreelancer ? 'Freelancer' : 'In-House'})`,
      portfolioImages: appToApprove.ratingImages.length > 0 ? appToApprove.ratingImages : [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600'
      ],
      description: appToApprove.description,
      skills: appToApprove.skills.length > 0 ? appToApprove.skills : ['Freelancer', appToApprove.district]
    };

    // Add to active published services list
    setServicesList(prev => [newService, ...prev]);

    // Remove from pending application queue
    setPendingServiceApplications(prev => prev.filter(a => a.id !== id));
  };

  const rejectServiceApplication = (id: string) => {
    setPendingServiceApplications(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AppStateContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        currentUser,
        setCurrentUser,
        userRole,
        setUserRole,
        selectedProduct,
        setSelectedProduct,
        cart,
        addToCart,
        removeFromCart,
        wishlist,
        toggleWishlist,
        deviceFrame,
        setDeviceFrame,
        sellModalOpen,
        setSellModalOpen,
        freelancerModalOpen,
        setFreelancerModalOpen,
        servicesList,
        pendingServiceApplications,
        addFreelancerServiceApplication,
        approveServiceApplication,
        rejectServiceApplication,
        unreadNotifications,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
