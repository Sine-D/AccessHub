import { supabase } from '../core/supabase.ts';
import type {
  SalesTransaction,
  MonthlySalesData,
  AnalyticsSummary,
  AnalyticsFilter,
  SalesAnalyticsResponse,
} from '../types/salesAnalytics.ts';

// Initial realistic sales transactions dataset (Source of Truth for offline / fallback mode)
const initialTransactions: SalesTransaction[] = [
  {
    id: 'tx-101',
    orderId: 'ord-8801',
    vendorId: 'u-chamara',
    vendorName: 'Chamara Perera (Handcrafted Decor)',
    category: 'Handcrafted Decor',
    district: 'Colombo',
    productTitle: 'Ergonomic Bamboo Desk Organizer',
    amount: 14500,
    commission: 1450,
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'tx-102',
    orderId: 'ord-8802',
    vendorId: 'u-kasun',
    vendorName: 'Kasun Kalhara Handicrafts',
    category: 'Wood & Wooden Crafts',
    district: 'Galle',
    productTitle: 'Carved Wooden Elephant Sculpture',
    amount: 28000,
    commission: 2800,
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'tx-103',
    orderId: 'ord-8803',
    vendorId: 'u-sunethra',
    vendorName: 'Sunethra Weaving Collective',
    category: 'Textiles & Handloom',
    district: 'Kandy',
    productTitle: 'Handwoven Tactile Throw Blanket',
    amount: 18500,
    commission: 1850,
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: 'tx-104',
    orderId: 'ord-8804',
    vendorId: 'u-hope-ngo',
    vendorName: 'Hope Lanka NGO Store',
    category: 'Assistive Devices',
    district: 'Colombo',
    productTitle: 'Folding Mobility Walking Stick',
    amount: 12000,
    commission: 1200,
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: 'tx-105',
    orderId: 'ord-8805',
    vendorId: 'u-chamara',
    vendorName: 'Chamara Perera (Handcrafted Decor)',
    category: 'Handcrafted Decor',
    district: 'Colombo',
    productTitle: 'Custom Wooden Coaster Set',
    amount: 9500,
    commission: 950,
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: 'tx-106',
    orderId: 'ord-8806',
    vendorId: 'u-nimal',
    vendorName: 'Nimal Braille Crafts',
    category: 'Braille & Tactile Goods',
    district: 'Jaffna',
    productTitle: 'Tactile Learning Alphabet Board',
    amount: 22000,
    commission: 2200,
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
  },
  {
    id: 'tx-107',
    orderId: 'ord-8807',
    vendorId: 'u-kasun',
    vendorName: 'Kasun Kalhara Handicrafts',
    category: 'Wood & Wooden Crafts',
    district: 'Galle',
    productTitle: 'Custom Wooden Name Plaque',
    amount: 16000,
    commission: 1600,
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
  },
  {
    id: 'tx-108',
    orderId: 'ord-8808',
    vendorId: 'u-sunethra',
    vendorName: 'Sunethra Weaving Collective',
    category: 'Textiles & Handloom',
    district: 'Kandy',
    productTitle: 'Inclusive Cotton Table Runner',
    amount: 11000,
    commission: 1100,
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 150).toISOString(),
  },
];

let memoryTransactions: SalesTransaction[] = [...initialTransactions];

/**
 * Filter transactions based on dateRange, category, and district (AC-67).
 */
export function filterSalesTransactions(
  transactions: SalesTransaction[],
  filter: AnalyticsFilter
): SalesTransaction[] {
  const now = new Date();

  return transactions.filter((t) => {
    const txDate = new Date(t.createdAt);

    // 1. Date Range Filter
    if (filter.dateRange === 'last_30_days') {
      const thirtyDaysAgo = new Date(now.getTime() - 86400000 * 30);
      if (txDate < thirtyDaysAgo) return false;
    } else if (filter.dateRange === 'last_6_months') {
      const sixMonthsAgo = new Date(now.getTime() - 86400000 * 180);
      if (txDate < sixMonthsAgo) return false;
    } else if (filter.dateRange === 'this_year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      if (txDate < startOfYear) return false;
    }

    // 2. Category Filter
    if (filter.category !== 'All' && t.category !== filter.category) {
      return false;
    }

    // 3. District Filter
    if (filter.district !== 'All' && t.district !== filter.district) {
      return false;
    }

    return true;
  });
}

/**
 * Aggregates summary KPIs: Total Sales (AC-64), Total Vendors (AC-65), platform commissions.
 */
export function calculateAnalyticsSummary(transactions: SalesTransaction[]): AnalyticsSummary {
  if (transactions.length === 0) {
    return {
      totalSales: 0,
      platformCommission: 0,
      totalVendors: 0,
      totalOrders: 0,
      averageOrderValue: 0,
    };
  }

  const totalSales = transactions.reduce((sum, t) => sum + t.amount, 0);
  const platformCommission = Math.round(totalSales * 0.1); // 10% commission
  const uniqueVendors = new Set(transactions.map((t) => t.vendorId)).size;
  const totalOrders = transactions.length;
  const averageOrderValue = Math.round(totalSales / totalOrders);

  return {
    totalSales,
    platformCommission,
    totalVendors: uniqueVendors,
    totalOrders,
    averageOrderValue,
  };
}

/**
 * Aggregates monthly sales graph data (AC-66) for past 6-12 months.
 */
export function generateMonthlySalesGraph(transactions: SalesTransaction[]): MonthlySalesData[] {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap = new Map<string, { salesAmount: number; orderCount: number; commission: number; year: number }>();

  // Initialize past 6 months to guarantee continuous graph visualization
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlyMap.set(monthKey, { salesAmount: 0, orderCount: 0, commission: 0, year: d.getFullYear() });
  }

  transactions.forEach((t) => {
    const d = new Date(t.createdAt);
    const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    const existing = monthlyMap.get(monthKey);

    if (existing) {
      existing.salesAmount += t.amount;
      existing.orderCount += 1;
      existing.commission += t.commission;
    } else {
      monthlyMap.set(monthKey, {
        salesAmount: t.amount,
        orderCount: 1,
        commission: t.commission,
        year: d.getFullYear(),
      });
    }
  });

  const monthlyList: MonthlySalesData[] = [];
  monthlyMap.forEach((val, key) => {
    const monthName = key.split(' ')[0];
    monthlyList.push({
      month: monthName,
      year: val.year,
      salesAmount: val.salesAmount,
      orderCount: val.orderCount,
      commission: val.commission,
    });
  });

  return monthlyList;
}

/**
 * Main service endpoint for fetching Sales Analytics (AC-63 to AC-67).
 * Connects to Supabase `sales_transactions` table with memory fallback.
 */
export async function fetchSalesAnalytics(
  filter: AnalyticsFilter = { dateRange: 'all', category: 'All', district: 'All' }
): Promise<SalesAnalyticsResponse> {
  let allTransactions = [...memoryTransactions];

  try {
    const { data, error } = await supabase
      .from('sales_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      allTransactions = data.map((item: any) => ({
        id: item.id,
        orderId: item.order_id || `ord-${item.id}`,
        vendorId: item.vendor_id || item.seller_id || 'u-unknown',
        vendorName: item.vendor_name || 'Verified Vendor',
        category: item.category || 'Handcrafted Decor',
        district: item.district || 'Colombo',
        productTitle: item.product_title || 'Inclusive Product Order',
        amount: Number(item.amount || 0),
        commission: Number(item.commission || item.amount * 0.1),
        status: item.status || 'completed',
        createdAt: item.created_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn('Notice querying Supabase sales_transactions table (using fallback):', err);
  }

  // Extract distinct categories & districts available for filter dropdowns
  const categories = ['All', ...Array.from(new Set(allTransactions.map((t) => t.category)))];
  const districts = ['All', ...Array.from(new Set(allTransactions.map((t) => t.district)))];

  // Apply filters (AC-67)
  const filteredTransactions = filterSalesTransactions(allTransactions, filter);

  // Compute total sales (AC-64), total vendors (AC-65), and monthly graph (AC-66)
  const summary = calculateAnalyticsSummary(filteredTransactions);
  const monthlySales = generateMonthlySalesGraph(filteredTransactions);

  return {
    summary,
    monthlySales,
    transactions: filteredTransactions,
    categories,
    districts,
    filter,
  };
}

