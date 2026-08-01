import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, Product, Service, Job, UserProfile } from '../types';
import { mockCurrentUser, mockProducts } from '../mock/data';

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
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
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
  unreadNotifications: number;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenView>('splash');
  const [currentUser, setCurrentUser] = useState<UserProfile>(mockCurrentUser);
  const [userRole, setUserRole] = useState<UserRole>('disabled_seller');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(mockProducts[0]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([
    { product: mockProducts[0], quantity: 1 }
  ]);
  const [wishlist, setWishlist] = useState<string[]>(['p1', 'p3']);
  const [deviceFrame, setDeviceFrame] = useState<'iphone' | 'android' | 'fullscreen'>('iphone');
  const [sellModalOpen, setSellModalOpen] = useState(false);
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
