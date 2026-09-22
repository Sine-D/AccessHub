import { ReactNode } from 'react';
import { UserRole } from '../../../core/types';

export type AdminTab =
  | 'overview'
  | 'vendor_verification'
  | 'listing_moderation'
  | 'review_moderation'
  | 'compliance'
  | 'badges'
  | 'analytics'
  | 'freelancers'
  | 'accounts'
  | 'bookings';

export interface AdminFeature {
  id: AdminTab;
  title: string;
  description: string;
  iconName: string;
  badgeCount?: number;
  badgeText?: string;
  status: 'ready' | 'pending_module' | 'active';
  acReference: string;
}

export interface AdminState {
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  activeTab: AdminTab;
}

export interface AdminLayoutProps {
  children?: ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  requiredRole?: UserRole;
  title?: string;
  subtitle?: string;
}

