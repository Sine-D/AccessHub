export type UserRole = 
  | 'seller' 
  | 'service_provider' 
  | 'buyer' 
  | 'job_seeker' 
  | 'ngo' 
  | 'admin'
  | 'disabled_seller'
  | 'disabled_service'
  | 'customer'
  | 'company'
  | 'delivery';

export interface User {
  id: string;
  name: string;
  avatar: string;
  coverImage?: string;
  role: UserRole;
  disabilityBadge?: string;
  rating: number;
  reviewsCount: number;
  bio: string;
  location: string;
  verified: boolean;
  totalEarnings?: number;
  totalOrders?: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  gallery?: string[];
  sellerId?: string;
  sellerName: string;
  sellerAvatar: string;
  sellerRating: number;
  reviewsCount: number;
  disabilityBadge?: string;
  accessibilityFeatures: string[];
  specifications: Record<string, string>;
  distanceKm: number;
  isPopular?: boolean;
  isWishlisted?: boolean;
  inStock?: boolean;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  hourlyRate: number;
  category: string;
  providerId?: string;
  providerName: string;
  providerAvatar: string;
  rating: number;
  reviewsCount: number;
  disabilityBadge: string;
  skills: string[];
  portfolioImages: string[];
  availability?: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  salary: string;
  description: string;
  accessibilityBadges: string[];
  postedDate: string;
  applicantCount: number;
  isSaved?: boolean;
}

export interface DonationItem {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  category: string;
  image: string;
  requesterName: string;
  requesterAvatar: string;
  ngoVerified: boolean;
}

export interface MapPinItem {
  id: string;
  title: string;
  address: string;
  type: 'seller' | 'ngo' | 'company';
  badge: string;
  distance: string;
  image: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isMine: boolean;
  isVoice?: boolean;
  voiceDuration?: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  type: 'order' | 'job' | 'donation' | 'service';
}

export interface CartItem {
  product: Product;
  quantity: number;
}
