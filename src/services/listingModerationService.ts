import { Product, ListingModerationStatus } from '../core/types/models';
import { mockProducts } from '../mock/data';
import { supabase } from '../core/supabase';

// In-memory store initialized with mockProducts copy for resilient offline/fallback operation
let memoryProducts: Product[] = [...mockProducts];

/**
 * Fetches all marketplace listings with optional status filtering (AC-57, AC-58).
 * Checks Supabase `products` table first, falls back to in-memory store.
 */
export async function fetchMarketplaceListings(
  statusFilter?: ListingModerationStatus
): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const formatted: Product[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        price: Number(item.price),
        originalPrice: item.original_price ? Number(item.original_price) : undefined,
        category: item.category || 'General',
        image: item.image || item.image_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
        gallery: item.gallery || [],
        sellerName: item.seller_name || 'Artisan Seller',
        sellerPhone: item.seller_phone,
        sellerAvatar: item.seller_avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
        disabilityBadge: item.disability_badge,
        sellerRating: Number(item.seller_rating || 5.0),
        reviewsCount: Number(item.reviews_count || 0),
        distanceKm: Number(item.distance_km || 2.5),
        isWishlisted: Boolean(item.is_wishlisted),
        description: item.description || '',
        specifications: item.specifications || {},
        accessibilityFeatures: item.accessibility_features || [],
        inStock: item.in_stock !== false,
        moderationStatus: (item.moderation_status as ListingModerationStatus) || 'pending',
        rejectionReason: item.rejection_reason,
        submittedAt: item.created_at || item.submitted_at || new Date().toISOString(),
        reviewedAt: item.reviewed_at,
        reviewedBy: item.reviewed_by,
        altText: item.alt_text,
      }));

      if (statusFilter) {
        return formatted.filter((p) => (p.moderationStatus || 'pending') === statusFilter);
      }
      return formatted;
    }
  } catch (err) {
    console.warn('Supabase fetch notice (products fallback to memory):', err);
  }

  // Memory fallback
  if (statusFilter) {
    return memoryProducts.filter((p) => (p.moderationStatus || 'pending') === statusFilter);
  }
  return [...memoryProducts];
}

/**
 * Approves a marketplace listing (AC-59, AC-62).
 * Persists status in Supabase and in-memory store.
 */
export async function approveListing(
  id: string,
  reviewer: string = 'Admin'
): Promise<boolean> {
  const now = new Date().toISOString();

  // Update in-memory store
  memoryProducts = memoryProducts.map((p) =>
    p.id === id
      ? {
          ...p,
          moderationStatus: 'approved',
          reviewedAt: now,
          reviewedBy: reviewer,
          rejectionReason: undefined,
        }
      : p
  );

  try {
    await supabase
      .from('products')
      .update({
        moderation_status: 'approved',
        reviewed_at: now,
        reviewed_by: reviewer,
        rejection_reason: null,
      })
      .eq('id', id);
  } catch (err) {
    console.warn('Supabase approveListing notice:', err);
  }

  return true;
}

/**
 * Rejects a marketplace listing with optional structured reason (AC-60, AC-61, AC-62).
 * Persists status in Supabase and in-memory store.
 */
export async function rejectListing(
  id: string,
  reason: string = 'Listing does not comply with accessibility guidelines.',
  reviewer: string = 'Admin'
): Promise<boolean> {
  const now = new Date().toISOString();

  // Update in-memory store
  memoryProducts = memoryProducts.map((p) =>
    p.id === id
      ? {
          ...p,
          moderationStatus: 'rejected',
          rejectionReason: reason,
          reviewedAt: now,
          reviewedBy: reviewer,
        }
      : p
  );

  try {
    await supabase
      .from('products')
      .update({
        moderation_status: 'rejected',
        rejection_reason: reason,
        reviewed_at: now,
        reviewed_by: reviewer,
      })
      .eq('id', id);
  } catch (err) {
    console.warn('Supabase rejectListing notice:', err);
  }

  return true;
}

/**
 * General status update function (AC-62).
 */
export async function updateListingModerationStatus(
  id: string,
  status: ListingModerationStatus,
  reason?: string,
  reviewer: string = 'Admin'
): Promise<boolean> {
  if (status === 'approved') {
    return approveListing(id, reviewer);
  }
  return rejectListing(id, reason, reviewer);
}

/**
 * Creates and submits a new marketplace listing in 'pending' moderation status.
 */
export async function createMarketplaceListing(
  productData: Omit<Product, 'id' | 'moderationStatus' | 'submittedAt'>
): Promise<Product> {
  const newId = `p-${Date.now()}`;
  const now = new Date().toISOString();

  const newProduct: Product = {
    ...productData,
    id: newId,
    moderationStatus: 'pending',
    submittedAt: now,
  };

  memoryProducts = [newProduct, ...memoryProducts];

  try {
    await supabase.from('products').insert([
      {
        id: newId,
        title: newProduct.title,
        price: newProduct.price,
        original_price: newProduct.originalPrice,
        category: newProduct.category,
        image: newProduct.image,
        seller_name: newProduct.sellerName,
        seller_phone: newProduct.sellerPhone,
        seller_avatar: newProduct.sellerAvatar,
        disability_badge: newProduct.disabilityBadge,
        description: newProduct.description,
        specifications: newProduct.specifications,
        accessibility_features: newProduct.accessibilityFeatures,
        in_stock: newProduct.inStock,
        moderation_status: 'pending',
        alt_text: newProduct.altText,
        created_at: now,
      },
    ]);
  } catch (err) {
    console.warn('Supabase createMarketplaceListing notice:', err);
  }

  return newProduct;
}

/**
 * Returns memory products copy (useful for tests and verification).
 */
export function getMemoryMarketplaceListings(): Product[] {
  return [...memoryProducts];
}

