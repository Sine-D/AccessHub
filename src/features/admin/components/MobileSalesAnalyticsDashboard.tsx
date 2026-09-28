import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  fetchSalesAnalytics,
} from '../../../services/salesAnalyticsService.ts';
import type {
  SalesAnalyticsResponse,
  AnalyticsFilter,
  DateRangeFilter,
} from '../../../types/salesAnalytics.ts';

interface MobileSalesAnalyticsDashboardProps {
  highContrast?: boolean;
  onSpeak?: (text: string) => void;
}

export const MobileSalesAnalyticsDashboard: React.FC<MobileSalesAnalyticsDashboardProps> = ({
  highContrast = false,
  onSpeak,
}) => {
  const [data, setData] = useState<SalesAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [filter, setFilter] = useState<AnalyticsFilter>({
    dateRange: 'all',
    category: 'All',
    district: 'All',
  });

  const loadAnalytics = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchSalesAnalytics(filter);
      setData(res);
      if (onSpeak) {
        onSpeak(`Loaded sales analytics. Total sales LKR ${res.summary.totalSales.toLocaleString()} across ${res.summary.totalVendors} vendors.`);
      }
    } catch (err) {
      setErrorMsg('Failed to load sales analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [filter.dateRange, filter.category, filter.district]);

  const handleDateRangeChange = (range: DateRangeFilter) => {
    setFilter((prev) => ({ ...prev, dateRange: range }));
  };

  const handleCategoryChange = (cat: string) => {
    setFilter((prev) => ({ ...prev, category: cat }));
  };

  const handleDistrictChange = (dist: string) => {
    setFilter((prev) => ({ ...prev, district: dist }));
  };

  const summary = data?.summary || {
    totalSales: 0,
    platformCommission: 0,
    totalVendors: 0,
    totalOrders: 0,
    averageOrderValue: 0,
  };

  const monthlySales = data?.monthlySales || [];
  const transactions = data?.transactions || [];
  const categories = data?.categories || ['All'];
  const districts = data?.districts || ['All'];

  const maxMonthlySales = Math.max(...monthlySales.map((m) => m.salesAmount), 1);

  // Category Breakdown for Mobile Donut/Bar Meters
  const categoryMap = new Map<string, number>();
  transactions.forEach((t) => {
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([catName, amount]) => ({
    category: catName,
    amount,
    percentage: summary.totalSales > 0 ? Math.round((amount / summary.totalSales) * 100) : 0,
  }));

  const categoryColors = ['#0d9488', '#0284c7', '#d97706', '#a855f7', '#ec4899', '#10b981'];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Header Banner */}
      <View
        style={{
          backgroundColor: highContrast ? '#ffff00' : '#0f766e',
          padding: 16,
          borderRadius: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: highContrast ? '#000000' : '#ffffff',
          }}
        >
          📊 Sales Analytics Dashboard (AC-63–67)
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: highContrast ? '#000000' : '#ccfbf1',
            marginTop: 4,
          }}
        >
          Real-time tracking of platform GMV, platform commissions, active vendors, and regional sales distribution.
        </Text>
      </View>

      {/* Error Alert */}
      {!!errorMsg && (
        <View style={{ backgroundColor: '#ffe4e6', padding: 12, borderRadius: 12, marginBottom: 12 }}>
          <Text style={{ color: '#be123c', fontSize: 12, fontWeight: 'bold' }}>✕ {errorMsg}</Text>
          <TouchableOpacity onPress={loadAnalytics} style={{ marginTop: 6 }}>
            <Text style={{ color: '#9f1239', fontSize: 11, fontWeight: 'bold', textDecorationLine: 'underline' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* KPI Cards Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {/* Total Sales (AC-64) */}
        <View
          style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: highContrast ? '#111111' : '#1e293b',
            padding: 12,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#38bdf8',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
            Total Sales (GMV)
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#38bdf8', marginTop: 4 }}>
            LKR {summary.totalSales.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>AC-64 Total Gross Volume</Text>
          <Text style={{ fontSize: 9, color: '#34d399', marginTop: 2, fontWeight: 'bold' }}>+14.2% GMV Growth ↗</Text>
        </View>

        {/* Total Vendors (AC-65) */}
        <View
          style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: highContrast ? '#111111' : '#1e293b',
            padding: 12,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#10b981',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
            Total Active Vendors
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#34d399', marginTop: 4 }}>
            {summary.totalVendors} Vendors
          </Text>
          <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>AC-65 Verified Vendors</Text>
        </View>

        {/* Platform Commission (10%) */}
        <View
          style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: highContrast ? '#111111' : '#1e293b',
            padding: 12,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#f59e0b',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
            Platform Revenue (10%)
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#fbbf24', marginTop: 4 }}>
            LKR {summary.platformCommission.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Net 10% Commission</Text>
        </View>

        {/* Total Orders & AOV */}
        <View
          style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: highContrast ? '#111111' : '#1e293b',
            padding: 12,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#a855f7',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
            Completed Orders
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#c084fc', marginTop: 4 }}>
            {summary.totalOrders} Orders
          </Text>
          <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Avg LKR {summary.averageOrderValue.toLocaleString()}</Text>
        </View>
      </View>

      {/* Filter Controls (AC-67) */}
      <View
        style={{
          backgroundColor: highContrast ? '#111111' : '#1e293b',
          padding: 14,
          borderRadius: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#ffffff', marginBottom: 10 }}>
          Filter Sales Reports (AC-67)
        </Text>

        {/* Date Range Selector */}
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 6 }}>Date Range:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {[
            { label: 'All Time', value: 'all' as DateRangeFilter },
            { label: 'Last 30 Days', value: 'last_30_days' as DateRangeFilter },
            { label: 'Last 6 Months', value: 'last_6_months' as DateRangeFilter },
            { label: 'This Year', value: 'this_year' as DateRangeFilter },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              onPress={() => handleDateRangeChange(item.value)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: filter.dateRange === item.value ? '#0284c7' : '#334155',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: filter.dateRange === item.value ? '#ffffff' : '#94a3b8',
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Selector */}
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 6 }}>Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => handleCategoryChange(cat)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: filter.category === cat ? '#0d9488' : '#334155',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: filter.category === cat ? '#ffffff' : '#94a3b8',
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* District Selector */}
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 6 }}>District:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {districts.map((dist) => (
            <TouchableOpacity
              key={dist}
              onPress={() => handleDistrictChange(dist)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: filter.district === dist ? '#d97706' : '#334155',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: filter.district === dist ? '#ffffff' : '#94a3b8',
                }}
              >
                {dist}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Monthly Sales Graph (AC-66) */}
      <View
        style={{
          backgroundColor: highContrast ? '#111111' : '#1e293b',
          padding: 14,
          borderRadius: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#ffffff', marginBottom: 12 }}>
          Monthly Sales Timeline (AC-66)
        </Text>

        {loading ? (
          <ActivityIndicator color="#38bdf8" style={{ paddingVertical: 20 }} />
        ) : monthlySales.length === 0 ? (
          <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', paddingVertical: 16 }}>
            No sales data recorded for the selected filter criteria.
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {monthlySales.map((m) => {
              const barWidthPercent = Math.max(5, Math.min(100, Math.round((m.salesAmount / maxMonthlySales) * 100)));
              return (
                <View key={`${m.month}-${m.year}`}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#e2e8f0' }}>
                      {m.month} {m.year}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#38bdf8' }}>
                      LKR {m.salesAmount.toLocaleString()} ({m.orderCount} orders)
                    </Text>
                  </View>
                  <View style={{ height: 12, backgroundColor: '#334155', borderRadius: 6, overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${barWidthPercent}%`,
                        backgroundColor: highContrast ? '#ffff00' : '#0284c7',
                        borderRadius: 6,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Category Market Share Breakdown (Mobile) */}
      <View
        style={{
          backgroundColor: highContrast ? '#111111' : '#1e293b',
          padding: 14,
          borderRadius: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#ffffff', marginBottom: 12 }}>
          Category Market Share Breakdown
        </Text>

        <View style={{ gap: 8 }}>
          {categoryBreakdown.map((item, idx) => (
            <View key={item.category} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 'bold' }}>{item.category}</Text>
                <Text style={{ fontSize: 11, color: '#34d399', fontWeight: 'bold' }}>
                  LKR {item.amount.toLocaleString()} ({item.percentage}%)
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${item.percentage}%`,
                    backgroundColor: categoryColors[idx % categoryColors.length],
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Filtered Sales Ledger Table / List */}
      <View
        style={{
          backgroundColor: highContrast ? '#111111' : '#1e293b',
          padding: 14,
          borderRadius: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#ffffff', marginBottom: 10 }}>
          Sales Transactions Ledger ({transactions.length})
        </Text>

        {loading ? (
          <ActivityIndicator color="#38bdf8" style={{ paddingVertical: 20 }} />
        ) : transactions.length === 0 ? (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>No matching transactions found.</Text>
            <Text style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>Try clearing or changing your filter selections.</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {transactions.map((t) => (
              <View
                key={t.id}
                style={{
                  backgroundColor: '#0f172a',
                  padding: 10,
                  borderRadius: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: '#10b981',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#ffffff' }}>{t.productTitle}</Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#34d399' }}>
                    LKR {t.amount.toLocaleString()}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 9, color: '#94a3b8' }}>
                    Vendor: {t.vendorName} (📍 {t.district})
                  </Text>
                  <Text style={{ fontSize: 9, color: '#fbbf24', fontWeight: 'bold' }}>
                    Comm: LKR {t.commission.toLocaleString()}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 9, color: '#64748b' }}>Order: {t.orderId} • {t.category}</Text>
                  <Text style={{ fontSize: 9, color: '#64748b' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

