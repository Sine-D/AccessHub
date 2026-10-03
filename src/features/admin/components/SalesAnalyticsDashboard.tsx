import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Filter,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  MapPin,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import {
  AnalyticsFilter,
  SalesAnalyticsResponse,
} from '../../../types/salesAnalytics';
import { fetchSalesAnalytics } from '../../../services/salesAnalyticsService';
import { MonthlySalesChart } from './MonthlySalesChart';
import { Exploded3DPieChart } from './Exploded3DPieChart';

export const SalesAnalyticsDashboard: React.FC = () => {
  const { speakText, settings } = useAccessibility();

  const [analyticsData, setAnalyticsData] = useState<SalesAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<AnalyticsFilter>({
    dateRange: 'all',
    category: 'All',
    district: 'All',
  });

  const loadData = async (activeFilter: AnalyticsFilter = filter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSalesAnalytics(activeFilter);
      setAnalyticsData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch sales analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filter);
  }, [filter]);

  const handleFilterChange = (key: keyof AnalyticsFilter, value: string) => {
    const nextFilter = { ...filter, [key]: value };
    setFilter(nextFilter);
    speakText(`Filter updated: ${key} set to ${value}`);
  };

  const handleResetFilters = () => {
    const reset = { dateRange: 'all' as const, category: 'All', district: 'All' };
    setFilter(reset);
    speakText('Sales analytics filters reset to default');
  };

  const summary = analyticsData?.summary || {
    totalSales: 0,
    platformCommission: 0,
    totalVendors: 0,
    totalOrders: 0,
    averageOrderValue: 0,
  };

  const transactions = analyticsData?.transactions || [];

  // Category Breakdown for 3D Exploded Pie Chart
  const categoryMap = new Map<string, number>();
  transactions.forEach((t) => {
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([catName, amount]) => ({
    category: catName,
    amount,
    percentage: summary.totalSales > 0 ? Math.round((amount / summary.totalSales) * 100) : 0,
  }));

  // District Breakdown for Regional Meter Bars
  const districtMap = new Map<string, number>();
  transactions.forEach((t) => {
    districtMap.set(t.district, (districtMap.get(t.district) || 0) + t.amount);
  });

  const districtBreakdown = Array.from(districtMap.entries()).map(([distName, amount]) => ({
    district: distName,
    amount,
    percentage: summary.totalSales > 0 ? Math.round((amount / summary.totalSales) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-teal-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-7 h-7 text-teal-400" />
            <h2 className="text-xl font-extrabold tracking-tight">Sales Analytics Dashboard</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-black border border-teal-400/30 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Real-World Charts</span>
            </span>
          </div>
          <p className="text-xs text-slate-300 pt-1 max-w-xl">
            Track gross sales GMV, active vendors, monthly revenue graph, category market share, and filtered reports.
          </p>
        </div>

        <button
          onClick={() => loadData(filter)}
          disabled={loading}
          className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center space-x-1.5 transition-all shadow-md self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-extrabold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar (AC-67) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Filter Reports
            </h3>
          </div>

          {(filter.dateRange !== 'all' || filter.category !== 'All' || filter.district !== 'All') && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-extrabold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* 1. Date Range Filter */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Time Range</label>
            <select
              value={filter.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none"
            >
              <option value="all">All Time History</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year (2026)</option>
            </select>
          </div>

          {/* 2. Category Filter */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category / Sector</label>
            <select
              value={filter.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none"
            >
              {(analyticsData?.categories || ['All']).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Sri Lanka District Filter */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Sri Lanka District</label>
            <select
              value={filter.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none"
            >
              {(analyticsData?.districts || ['All']).map((dist) => (
                <option key={dist} value={dist}>
                  {dist} District
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metric Summary Cards (AC-64, AC-65) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales (AC-64) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Sales</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            LKR {summary.totalSales.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-teal-600 dark:text-teal-400">Gross Merchandise Volume</span>
            <span className="font-extrabold text-emerald-500 flex items-center">
              +14.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Platform Net Commission (10%) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Platform Earnings</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            LKR {summary.platformCommission.toLocaleString()}
          </div>
          <p className="text-[11px] font-bold text-slate-500">
            10% Platform Revenue Share
          </p>
        </div>

        {/* Total Vendors (AC-65) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Vendors</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {summary.totalVendors} Vendors
          </div>
          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            Active Verified Disabled Artisans
          </p>
        </div>

        {/* Total Orders & Average Order Value */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {summary.totalOrders} Orders
          </div>
          <p className="text-[11px] font-bold text-slate-500">
            Avg Order: LKR {summary.averageOrderValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Multi-Series Line Chart with Alternating Shaded Column Bands (AC-66) */}
      <MonthlySalesChart
        monthlySales={analyticsData?.monthlySales || []}
        highContrast={settings.highContrast}
        onAnnounce={(text) => speakText(text)}
      />

      {/* Grid: 3D Exploded Pie Chart & Regional Sri Lanka Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Real-World 3D Exploded Pie Chart with Leader Callout Pointer Lines */}
        <Exploded3DPieChart
          data={categoryBreakdown}
          highContrast={settings.highContrast}
        />

        {/* Regional Sri Lanka District Sales Meter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Sri Lanka District Distribution
              </h3>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {districtBreakdown.map((item) => (
              <div key={item.district} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 dark:text-slate-200">📍 {item.district} District</span>
                  <span className="text-teal-600 dark:text-teal-400 font-black">
                    LKR {item.amount.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Recent Sales Transactions Ledger ({analyticsData?.transactions.length || 0})
            </h3>
          </div>
        </div>

        {analyticsData?.transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold">No sales transactions matched the selected filter criteria.</p>
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-extrabold text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Product / Service</th>
                  <th className="py-2.5 px-3">Vendor / Seller</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Amount (LKR)</th>
                  <th className="py-2.5 px-3">10% Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(analyticsData?.transactions || []).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold">
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{t.orderId}</td>
                    <td className="py-3 px-3 text-slate-900 dark:text-white">{t.productTitle}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{t.vendorName}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">📍 {t.district}</td>
                    <td className="py-3 px-3 text-teal-600 dark:text-teal-400 font-black">
                      LKR {t.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-black">
                      LKR {t.commission.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
