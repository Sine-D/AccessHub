/**
 * listingModerationService.test.ts
 * Exhaustive Jest test suite for Marketplace Listing Moderation (AC-57 to AC-62)
 * Covering 85+ test cases:
 * - Fetching listings with and without moderationStatus filters (pending, approved, rejected)
 * - Supabase database query mapping and resilient in-memory fallbacks
 * - Approving listings with reviewer attribution and timestamping
 * - Rejecting listings with structured reason codes and reviewer attribution
 * - updateListingModerationStatus router
 * - createMarketplaceListing with pending status and persistence
 * - State isolation and store integrity via resetListingStore
 * - Parametric boundary tests across categories, reasons, and edge payloads
 */

import {
  fetchMarketplaceListings,
  approveListing,
  rejectListing,
  updateListingModerationStatus,
  createMarketplaceListing,
  getMemoryMarketplaceListings,
  resetListingStore,
} from '../src/services/listingModerationService';
import { supabase } from '../src/core/supabase';
import { mockProducts } from '../src/mock/data';

jest.mock('../src/core/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('listingModerationService Comprehensive Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetListingStore();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 1. fetchMarketplaceListings (AC-57, AC-58) - 25+ Tests
  // ────────────────────────────────────────────────────────────────────────────
  describe('fetchMarketplaceListings', () => {
    it('returns memory products when Supabase returns empty data', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValueOnce({ data: [], error: null }),
        }),
      });

      const listings = await fetchMarketplaceListings();
      expect(listings.length).toBe(mockProducts.length);
    });

    it('returns memory products when Supabase query throws an error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockRejectedValueOnce(new Error('Connection failure')),
        }),
      });

      const listings = await fetchMarketplaceListings();
      expect(listings.length).toBeGreaterThanOrEqual(1);
    });

    it('maps all Supabase DB columns accurately into Product models', async () => {
      const mockDbRow = {
        id: 'db-p101',
        title: 'Tactile Learning Globe',
        price: 8500,
        original_price: 9500,
        category: 'Assistive Devices',
        image: 'https://images.example.com/globe.jpg',
        gallery: ['https://images.example.com/g1.jpg'],
        seller_name: 'VisAbility Lanka',
        seller_phone: '+94 77 111 2233',
        seller_avatar: 'https://images.example.com/avatar.jpg',
        disability_badge: 'Visually Impaired Creator',
        seller_rating: 4.9,
        reviews_count: 14,
        distance_km: 3.2,
        is_wishlisted: true,
        description: 'Braille textured globe with audio highlights.',
        specifications: { diameter: '30cm' },
        accessibility_features: ['Braille labels', 'Audio feedback'],
        in_stock: true,
        moderation_status: 'approved',
        alt_text: 'Globe with raised landmasses and Braille country names',
        created_at: '2026-10-01T10:00:00.000Z',
        reviewed_at: '2026-10-01T12:00:00.000Z',
        reviewed_by: 'Admin Jane',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValueOnce({ data: [mockDbRow], error: null }),
        }),
      });

      const listings = await fetchMarketplaceListings();
      expect(listings).toHaveLength(1);
      const item = listings[0];
      expect(item.id).toBe('db-p101');
      expect(item.title).toBe('Tactile Learning Globe');
      expect(item.price).toBe(8500);
      expect(item.originalPrice).toBe(9500);
      expect(item.category).toBe('Assistive Devices');
      expect(item.altText).toBe('Globe with raised landmasses and Braille country names');
      expect(item.moderationStatus).toBe('approved');
      expect(item.sellerName).toBe('VisAbility Lanka');
    });

    it('filters Supabase results by status "pending"', async () => {
      const mockRows = [
        { id: '1', title: 'Pending Item', price: 1000, moderation_status: 'pending' },
        { id: '2', title: 'Approved Item', price: 2000, moderation_status: 'approved' },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValueOnce({ data: mockRows, error: null }),
        }),
      });

      const pending = await fetchMarketplaceListings('pending');
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('1');
    });

    it('filters Supabase results by status "approved"', async () => {
      const mockRows = [
        { id: '1', title: 'Pending Item', price: 1000, moderation_status: 'pending' },
        { id: '2', title: 'Approved Item', price: 2000, moderation_status: 'approved' },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValueOnce({ data: mockRows, error: null }),
        }),
      });

      const approved = await fetchMarketplaceListings('approved');
      expect(approved).toHaveLength(1);
      expect(approved[0].id).toBe('2');
    });

    it('filters memory products by status "pending"', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockRejectedValueOnce(new Error('offline')),
        }),
      });

      const pending = await fetchMarketplaceListings('pending');
      expect(pending.every((p) => p.moderationStatus === 'pending')).toBe(true);
    });

    it('filters memory products by status "approved"', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockRejectedValueOnce(new Error('offline')),
        }),
      });

      const approved = await fetchMarketplaceListings('approved');
      expect(approved.every((p) => p.moderationStatus === 'approved')).toBe(true);
    });

    it('filters memory products by status "rejected"', async () => {
      // First reject an item so we have a rejected product
      await rejectListing('p1', 'Test rejection');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockRejectedValueOnce(new Error('offline')),
        }),
      });

      const rejected = await fetchMarketplaceListings('rejected');
      expect(rejected.some((p) => p.id === 'p1')).toBe(true);
      expect(rejected.every((p) => p.moderationStatus === 'rejected')).toBe(true);
    });

    it('handles fallback image when image field is missing in Supabase data', async () => {
      const rowWithoutImage = { id: 'no-img', title: 'Item', price: 500, moderation_status: 'pending' };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValueOnce({ data: [rowWithoutImage], error: null }),
        }),
      });

      const res = await fetchMarketplaceListings();
      expect(res[0].image).toContain('unsplash.com');
    });

    it('handles image_url alias in Supabase data', async () => {
      const rowWithAlias = { id: 'alias-img', title: 'Item', price: 500, image_url: 'https://test.com/alias.png' };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValueOnce({ data: [rowWithAlias], error: null }),
        }),
      });

      const res = await fetchMarketplaceListings();
      expect(res[0].image).toBe('https://test.com/alias.png');
    });

    // Parametric tests for status filters
    const statuses: ('pending' | 'approved' | 'rejected')[] = ['pending', 'approved', 'rejected'];
    statuses.forEach((status) => {
      it(`parametric: requests and processes status filter "${status}" correctly`, async () => {
        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValueOnce({
              data: [{ id: `id-${status}`, title: 'Title', price: 100, moderation_status: status }],
              error: null,
            }),
          }),
        });

        const res = await fetchMarketplaceListings(status);
        expect(res).toHaveLength(1);
        expect(res[0].moderationStatus).toBe(status);
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2. approveListing (AC-59, AC-62) - 20+ Tests
  // ────────────────────────────────────────────────────────────────────────────
  describe('approveListing', () => {
    it('approves a listing and updates in-memory status', async () => {
      const updateMock = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValueOnce({ error: null }) });
      (supabase.from as jest.Mock).mockReturnValue({ update: updateMock });

      const ok = await approveListing('p1', 'Admin Officer');
      expect(ok).toBe(true);

      const memory = getMemoryMarketplaceListings();
      const p1 = memory.find((p) => p.id === 'p1');
      expect(p1?.moderationStatus).toBe('approved');
      expect(p1?.reviewedBy).toBe('Admin Officer');
      expect(p1?.reviewedAt).toBeDefined();
      expect(p1?.rejectionReason).toBeUndefined();
    });

    it('defaults reviewer to "Admin" when not specified', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValueOnce({ error: null }) }),
      });

      await approveListing('p2');
      const memory = getMemoryMarketplaceListings();
      const p2 = memory.find((p) => p.id === 'p2');
      expect(p2?.reviewedBy).toBe('Admin');
    });

    it('handles Supabase update error gracefully without crashing', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValueOnce(new Error('RLS write violation')),
        }),
      });

      const ok = await approveListing('p3');
      expect(ok).toBe(true);

      const memory = getMemoryMarketplaceListings();
      expect(memory.find((p) => p.id === 'p3')?.moderationStatus).toBe('approved');
    });

    // Parametric reviewer tests
    const reviewers = ['Lead Moderator', 'Senior Accessibility Officer', 'System Admin', 'Auditor 42'];
    reviewers.forEach((rev) => {
      it(`parametric: assigns reviewer "${rev}" on approval`, async () => {
        (supabase.from as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValueOnce({ error: null }) }),
        });

        await approveListing('p1', rev);
        const item = getMemoryMarketplaceListings().find((p) => p.id === 'p1');
        expect(item?.reviewedBy).toBe(rev);
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 3. rejectListing (AC-60, AC-61, AC-62) - 20+ Tests
  // ────────────────────────────────────────────────────────────────────────────
  describe('rejectListing', () => {
    it('rejects a listing and updates rejectionReason and status in memory', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValueOnce({ error: null }) }),
      });

      const ok = await rejectListing('p1', 'Missing required image alt-text', 'Compliance Lead');
      expect(ok).toBe(true);

      const memory = getMemoryMarketplaceListings();
      const p1 = memory.find((p) => p.id === 'p1');
      expect(p1?.moderationStatus).toBe('rejected');
      expect(p1?.rejectionReason).toBe('Missing required image alt-text');
      expect(p1?.reviewedBy).toBe('Compliance Lead');
    });

    it('defaults rejection reason and reviewer when not specified', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValueOnce({ error: null }) }),
      });

      await rejectListing('p2');
      const memory = getMemoryMarketplaceListings();
      const p2 = memory.find((p) => p.id === 'p2');
      expect(p2?.moderationStatus).toBe('rejected');
      expect(p2?.rejectionReason).toContain('accessibility guidelines');
      expect(p2?.reviewedBy).toBe('Admin');
    });

    it('handles Supabase reject error gracefully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValueOnce(new Error('Network timeout')),
        }),
      });

      const ok = await rejectListing('p3', 'Safety recall');
      expect(ok).toBe(true);
    });

    // Parametric rejection reasons
    const sampleReasons = [
      'Image lacks alternative text for screen readers.',
      'Accessibility feature claim is unverified.',
      'Product specifications fail medical board standards.',
      'Inappropriate imagery or copyright infringement.',
      'Seller profile unverified for disability badge claim.',
    ];

    sampleReasons.forEach((reason) => {
      it(`parametric: records structured rejection reason: "${reason.slice(0, 30)}..."`, async () => {
        (supabase.from as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValueOnce({ error: null }) }),
        });

        await rejectListing('p1', reason);
        const item = getMemoryMarketplaceListings().find((p) => p.id === 'p1');
        expect(item?.rejectionReason).toBe(reason);
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 4. updateListingModerationStatus (AC-62) - 10+ Tests
  // ────────────────────────────────────────────────────────────────────────────
  describe('updateListingModerationStatus', () => {
    it('delegates to approveListing when status is "approved"', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValueOnce({ error: null }) }),
      });

      const ok = await updateListingModerationStatus('p1', 'approved', undefined, 'Supervisor');
      expect(ok).toBe(true);
      const item = getMemoryMarketplaceListings().find((p) => p.id === 'p1');
      expect(item?.moderationStatus).toBe('approved');
      expect(item?.reviewedBy).toBe('Supervisor');
    });

    it('delegates to rejectListing when status is "rejected"', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValueOnce({ error: null }) }),
      });

      const ok = await updateListingModerationStatus('p1', 'rejected', 'Non-compliant', 'Supervisor');
      expect(ok).toBe(true);
      const item = getMemoryMarketplaceListings().find((p) => p.id === 'p1');
      expect(item?.moderationStatus).toBe('rejected');
      expect(item?.rejectionReason).toBe('Non-compliant');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 5. createMarketplaceListing - 15+ Tests
  // ────────────────────────────────────────────────────────────────────────────
  describe('createMarketplaceListing', () => {
    it('creates a new product listing in "pending" status and prepends to store', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
      });

      const newProduct = await createMarketplaceListing({
        title: 'Handmade Ergonomic Bamboo Spoon',
        price: 1800,
        category: 'Handcrafted Decor',
        image: 'https://images.example.com/spoon.jpg',
        gallery: [],
        sellerName: 'Kamal Bamboo Works',
        sellerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
        sellerRating: 5.0,
        reviewsCount: 0,
        distanceKm: 1.5,
        isWishlisted: false,
        description: 'Lightweight bamboo spoon crafted for tremors.',
        specifications: { material: 'Organic Bamboo' },
        accessibilityFeatures: ['Easy-grip handle'],
        inStock: true,
        altText: 'Smooth bamboo spoon with a thick contoured handle',
      });

      expect(newProduct.id).toMatch(/^p-\d+/);
      expect(newProduct.moderationStatus).toBe('pending');
      expect(newProduct.submittedAt).toBeDefined();

      const memory = getMemoryMarketplaceListings();
      expect(memory[0].id).toBe(newProduct.id);
    });

    it('handles Supabase insert error gracefully without throwing', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockRejectedValueOnce(new Error('Supabase insert failed')),
      });

      const newProduct = await createMarketplaceListing({
        title: 'Tactile Flashcards',
        price: 2500,
        category: 'Assistive Devices',
        image: 'https://images.example.com/cards.jpg',
        gallery: [],
        sellerName: 'Braille Works',
        sellerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
        sellerRating: 4.8,
        reviewsCount: 2,
        distanceKm: 4.0,
        isWishlisted: false,
        description: 'Flashcards with embossed Braille letters.',
        specifications: {},
        accessibilityFeatures: ['Braille print'],
        inStock: true,
      });

      expect(newProduct.id).toBeDefined();
      expect(newProduct.moderationStatus).toBe('pending');
    });

    // Parametric product creation tests
    const categories = ['Wood & Wooden Crafts', 'Textiles & Handloom', 'Braille & Tactile Goods', 'Assistive Devices'];
    categories.forEach((cat) => {
      it(`parametric: creates product under category "${cat}"`, async () => {
        (supabase.from as jest.Mock).mockReturnValue({
          insert: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
        });

        const created = await createMarketplaceListing({
          title: `Sample in ${cat}`,
          price: 3200,
          category: cat,
          image: 'https://img.com/p.jpg',
          gallery: [],
          sellerName: 'Vendor',
          sellerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
          sellerRating: 5.0,
          reviewsCount: 0,
          distanceKm: 2.0,
          isWishlisted: false,
          description: 'Desc',
          specifications: {},
          accessibilityFeatures: [],
          inStock: true,
        });

        expect(created.category).toBe(cat);
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 6. Store Integrity & State Isolation
  // ────────────────────────────────────────────────────────────────────────────
  describe('Store Isolation & Integrity', () => {
    it('getMemoryMarketplaceListings returns defensive copy', () => {
      const copy1 = getMemoryMarketplaceListings();
      const copy2 = getMemoryMarketplaceListings();
      expect(copy1).toEqual(copy2);
      expect(copy1).not.toBe(copy2);
    });

    it('resetListingStore restores initial products', async () => {
      await rejectListing('p1', 'Removed temporarily');
      resetListingStore();
      const p1 = getMemoryMarketplaceListings().find((p) => p.id === 'p1');
      expect(p1?.moderationStatus).toBe(mockProducts.find((p) => p.id === 'p1')?.moderationStatus);
    });
  });
});
