import { UserRole, DisabilityBadge } from './accessibility';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  coverImage?: string;
  bio: string;
  disabilityBadge?: DisabilityBadge;
  rating: number;
  reviewsCount: number;
  location: string;
  totalEarnings?: number;
  totalOrders?: number;
  isVerified: boolean;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  gallery?: string[];
  sellerName: string;
  sellerAvatar: string;
  disabilityBadge?: DisabilityBadge;
  sellerRating: number;
  reviewsCount: number;
  distanceKm: number;
  isWishlisted?: boolean;
  description: string;
  specifications: Record<string, string>;
  accessibilityFeatures: string[];
  inStock: boolean;
}

export interface Service {
  id: string;
  title: string;
  hourlyRate: number;
  providerName: string;
  providerAvatar: string;
  disabilityBadge?: DisabilityBadge;
  rating: number;
  reviewsCount: number;
  category: string;
  availability: string;
  portfolioImages: string[];
  description: string;
  skills: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  salary: string;
  location: string;
  isRemote: boolean;
  accessibilityBadges: string[];
  description: string;
  category: string;
  postedDate: string;
  applicantCount: number;
  isSaved?: boolean;
}

export interface DonationItem {
  id: string;
  title: string;
  category: 'Wheelchairs' | 'Hearing Aids' | 'Laptops' | 'Medical Equipment' | 'Education Support' | 'Food';
  targetAmount: number;
  raisedAmount: number;
  requesterName: string;
  requesterAvatar: string;
  requesterType: 'Individual' | 'NGO';
  ngoVerified: boolean;
  image: string;
  description: string;
  urgency: 'High' | 'Medium' | 'Normal';
}

export interface MapPin {
  id: string;
  title: string;
  type: 'seller' | 'ngo' | 'company' | 'delivery' | 'service' | 'event';
  lat: number;
  lng: number;
  address: string;
  badge?: string;
  accessibilityFeatures: string[];
  accessibilityRating: number;
  distance: string;
  image: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text?: string;
  timestamp: string;
  isVoice?: boolean;
  voiceDuration?: string;
  isImage?: boolean;
  imageUrl?: string;
  isMine: boolean;
  status: 'sent' | 'delivered' | 'read';
}

export interface AppNotification {
  id: string;
  type: 'order' | 'job' | 'donation' | 'message' | 'promo' | 'system';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  iconName?: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  status: 'Preparing' | 'Packed' | 'Picked Up' | 'On The Way' | 'Delivered';
  estimatedDelivery: string;
  driverName?: string;
  driverPhone?: string;
  driverAvatar?: string;
}
