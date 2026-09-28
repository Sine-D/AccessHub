import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchSalesAnalytics,
  calculateAnalyticsSummary,
  generateMonthlySalesGraph,
  filterSalesTransactions,
} from '../src/services/salesAnalyticsService.ts';

const mockTransactions = [
  {
    id: 'tx-test-1',
    orderId: 'ord-100',
    vendorId: 'v-1',
    vendorName: 'Vendor One',
    category: 'Handcrafted Decor',
    district: 'Colombo',
    productTitle: 'Tactile Desk Clock',
    amount: 10000,
    commission: 1000,
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-test-2',
    orderId: 'ord-101',
    vendorId: 'v-2',
    vendorName: 'Vendor Two',
    category: 'Wood & Wooden Crafts',
    district: 'Galle',
    productTitle: 'Carved Wooden Elephant',
    amount: 20000,
    commission: 2000,
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-test-3',
    orderId: 'ord-102',
    vendorId: 'v-1',
    vendorName: 'Vendor One',
    category: 'Handcrafted Decor',
    district: 'Colombo',
    productTitle: 'Custom Coaster Set',
    amount: 5000,
    commission: 500,
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
  },
];

test('AC-64: Calculate total sales GMV and platform commission correctly', () => {
  const summary = calculateAnalyticsSummary(mockTransactions);

  assert.equal(summary.totalSales, 35000); // 10000 + 20000 + 5000
  assert.equal(summary.platformCommission, 3500); // 10% of 35000
  assert.equal(summary.totalOrders, 3);
  assert.equal(summary.averageOrderValue, 11667); // 35000 / 3
});

test('AC-65: Aggregate total unique verified vendors correctly', () => {
  const summary = calculateAnalyticsSummary(mockTransactions);

  // v-1 and v-2 => 2 unique vendors
  assert.equal(summary.totalVendors, 2);
});

test('AC-66: Generate monthly sales graph timeline data', () => {
  const monthlyData = generateMonthlySalesGraph(mockTransactions);

  assert.ok(Array.isArray(monthlyData));
  assert.ok(monthlyData.length >= 6); // At least 6 past months initialized

  const totalGraphSales = monthlyData.reduce((sum, m) => sum + m.salesAmount, 0);
  assert.equal(totalGraphSales, 35000);
});

test('AC-67: Filter reports by date range, category, and district', () => {
  // Category Filter
  const categoryFilter = {
    dateRange: 'all',
    category: 'Wood & Wooden Crafts',
    district: 'All',
  };
  const filteredCategory = filterSalesTransactions(mockTransactions, categoryFilter);
  assert.equal(filteredCategory.length, 1);
  assert.equal(filteredCategory[0].vendorName, 'Vendor Two');

  // District Filter
  const districtFilter = {
    dateRange: 'all',
    category: 'All',
    district: 'Colombo',
  };
  const filteredDistrict = filterSalesTransactions(mockTransactions, districtFilter);
  assert.equal(filteredDistrict.length, 2);

  // Date Range Filter (last 30 days)
  const last30DaysFilter = {
    dateRange: 'last_30_days',
    category: 'All',
    district: 'All',
  };
  const filtered30Days = filterSalesTransactions(mockTransactions, last30DaysFilter);
  assert.equal(filtered30Days.length, 2); // Excludes tx-test-3 (40 days old)
});

test('AC-63 & Service Endpoint: fetchSalesAnalytics returns complete response structure', async () => {
  const response = await fetchSalesAnalytics({
    dateRange: 'all',
    category: 'All',
    district: 'All',
  });

  assert.ok(response.summary);
  assert.ok(response.summary.totalSales > 0);
  assert.ok(response.summary.totalVendors > 0);
  assert.ok(Array.isArray(response.monthlySales));
  assert.ok(Array.isArray(response.transactions));
  assert.ok(Array.isArray(response.categories));
  assert.ok(Array.isArray(response.districts));
  assert.ok(response.categories.includes('All'));
  assert.ok(response.districts.includes('All'));
});

test('Empty filter result handling', () => {
  const emptyFilter = {
    dateRange: 'all',
    category: 'NonExistentCategory',
    district: 'All',
  };

  const filtered = filterSalesTransactions(mockTransactions, emptyFilter);
  assert.equal(filtered.length, 0);

  const summary = calculateAnalyticsSummary(filtered);
  assert.equal(summary.totalSales, 0);
  assert.equal(summary.platformCommission, 0);
  assert.equal(summary.totalVendors, 0);
  assert.equal(summary.totalOrders, 0);
  assert.equal(summary.averageOrderValue, 0);
});

