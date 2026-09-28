export type DateRangeFilter = 'all' | 'last_30_days' | 'last_6_months' | 'this_year';

export interface SalesTransaction {
  id: string;
  orderId: string;
  vendorId: string;
  vendorName: string;
  category: string;
  district: string;
  productTitle: string;
  amount: number;
  commission: number; // 10% platform commission
  status: 'completed' | 'processing' | 'refunded';
  createdAt: string;
}

export interface MonthlySalesData {
  month: string;       // e.g. 'Jan', 'Feb', 'Mar'
  year: number;        // e.g. 2026
  salesAmount: number; // GMV total for month in LKR
  orderCount: number;  // total orders count for month
  commission: number;  // 10% platform earnings
}

export interface AnalyticsSummary {
  totalSales: number;        // AC-64: Total sales GMV in LKR
  platformCommission: number; // 10% net platform commission
  totalVendors: number;      // AC-65: Total verified vendors
  totalOrders: number;       // Total order transaction count
  averageOrderValue: number; // Average GMV per order
}

export interface AnalyticsFilter {
  dateRange: DateRangeFilter;
  category: string; // 'All' or specific category
  district: string; // 'All' or Sri Lanka district
}

export interface SalesAnalyticsResponse {
  summary: AnalyticsSummary;
  monthlySales: MonthlySalesData[];
  transactions: SalesTransaction[];
  categories: string[];
  districts: string[];
  filter: AnalyticsFilter;
}

