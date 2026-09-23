import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Product, User, ServiceItem, FreelancerServiceApplication, ServiceBookingRequest } from '../types';
import { mockCurrentUser, mockProducts, mockServices, mockPendingServiceApplications } from '../../mock/data';
import { supabase } from '../supabase';
import type { SearchQuery } from '../search/contracts.ts';

export type ScreenView = 
  | 'cart'
  | 'search_results'
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
  marketplaceCategory: string;
  setMarketplaceCategory: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: SearchQuery | null;
  setSearchQuery: React.Dispatch<React.SetStateAction<SearchQuery | null>>;
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
  bookingRequests: ServiceBookingRequest[];
  addBookingRequest: (req: ServiceBookingRequest) => void;
  approveBookingEscrow: (id: string) => void;
  acceptBookingByFreelancer: (id: string) => void;
  rejectBookingEscrow: (id: string) => void;
  unreadNotifications: number;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [marketplaceCategory, setMarketplaceCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState<SearchQuery | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenView>('splash');
  const [currentUser, setCurrentUser] = useState<User>(mockCurrentUser);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(mockProducts[0]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([
    { product: mockProducts[0], quantity: 1 }
  ]);
  const [wishlist, setWishlist] = useState<string[]>(['p1', 'p3']);
  const [deviceFrame, setDeviceFrame] = useState<'iphone' | 'android' | 'fullscreen'>('iphone');
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [freelancerModalOpen, setFreelancerModalOpen] = useState(false);
  
  // Dynamic Services & Approvals Queue State (REAL SUPABASE DATA ONLY)
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [pendingServiceApplications, setPendingServiceApplications] = useState<FreelancerServiceApplication[]>([]);
  const [bookingRequests, setBookingRequests] = useState<ServiceBookingRequest[]>([]);

  const addBookingRequest = (req: ServiceBookingRequest) => {
    setBookingRequests(prev => [req, ...prev]);
  };

  const approveBookingEscrow = (id: string) => {
    setBookingRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'in_progress' } : r)
    );
  };

  const acceptBookingByFreelancer = (id: string) => {
    setBookingRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'accepted' } : r)
    );
  };

  const rejectBookingEscrow = (id: string) => {
    setBookingRequests(prev => prev.filter(r => r.id !== id));
  };

  const unreadNotifications = 2;

  // Fetch initial services & pending applications strictly from Supabase
  useEffect(() => {
    const fetchSupabaseServicesAndApps = async () => {
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
          setServicesList(formattedServices);
        } else {
          setServicesList([]);
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
          setPendingServiceApplications(formattedApps);
        } else {
          setPendingServiceApplications([]);
        }
      } catch (err) {
        console.error('Supabase fetch error:', err);
      }
    };

    fetchSupabaseServicesAndApps();
  }, []);

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

  const addFreelancerServiceApplication = async (appData: Omit<FreelancerServiceApplication, 'id' | 'status' | 'createdAt'>) => {
    const tempId = `app-${Date.now()}`;
    const newApp: FreelancerServiceApplication = {
      ...appData,
      id: tempId,
      status: 'pending',
      createdAt: new Date().toLocaleString()
    };
    setPendingServiceApplications(prev => [newApp, ...prev]);

    try {
      const { data, error } = await supabase.from('freelancer_applications').insert([{
        name: appData.name,
        age: appData.age ? Number(appData.age) : null,
        district: appData.district,
        address: appData.address,
        guardian_name: appData.guardianName,
        guardian_phone: appData.guardianPhone,
        phone: appData.phone,
        is_freelancer: appData.isFreelancer,
        rating: appData.rating,
        rating_images: appData.ratingImages,
        service_title: appData.serviceTitle,
        hourly_rate: Number(appData.hourlyRate),
        category: appData.category,
        description: appData.description,
        skills: appData.skills,
        disability_badge: appData.disabilityBadge,
        status: 'pending'
      }]).select();

      if (!error && data && data.length > 0) {
        const realId = data[0].id;
        setPendingServiceApplications(prev => prev.map(item => item.id === tempId ? { ...item, id: realId } : item));
      }
    } catch (err) {
      console.error('Error inserting freelancer application to Supabase:', err);
    }
  };

  const approveServiceApplication = async (id: string) => {
    const appToApprove = pendingServiceApplications.find(a => a.id === id);
    if (!appToApprove) return;

    // Convert approved application to a published ServiceItem
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

    try {
      // Update application status to approved in Supabase
      if (!id.startsWith('app-')) {
        await supabase.from('freelancer_applications').update({ status: 'approved' }).eq('id', id);
      }

      // Insert published service to Supabase services table
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
      console.error('Error updating Supabase on approval:', err);
    }
  };

  const rejectServiceApplication = (id: string) => {
    setPendingServiceApplications(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AppStateContext.Provider
      value={{
        marketplaceCategory,
        setMarketplaceCategory,
        searchQuery,
        setSearchQuery,
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
        bookingRequests,
        addBookingRequest,
        approveBookingEscrow,
        acceptBookingByFreelancer,
        rejectBookingEscrow,
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


