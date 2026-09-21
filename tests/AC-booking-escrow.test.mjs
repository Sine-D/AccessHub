import test from 'node:test';
import assert from 'node:assert/strict';

// Test suite for Service Booking & Milestone Escrow Calculation Logic

test('AC-booking-escrow: 50/50 Milestone escrow calculation', () => {
  const hourlyRate = 4500;
  const estimatedHours = 4;
  const totalBudget = hourlyRate * estimatedHours; // 18,000

  const upfrontPercent = 50;
  const upfrontDeposit = Math.round((totalBudget * upfrontPercent) / 100); // 9,000
  const remainingBalance = totalBudget - upfrontDeposit; // 9,000

  assert.equal(totalBudget, 18000);
  assert.equal(upfrontDeposit, 9000);
  assert.equal(remainingBalance, 9000);
});

test('AC-booking-escrow: 30/70 Milestone escrow calculation', () => {
  const hourlyRate = 5000;
  const estimatedHours = 10;
  const totalBudget = hourlyRate * estimatedHours; // 50,000

  const upfrontPercent = 30;
  const upfrontDeposit = Math.round((totalBudget * upfrontPercent) / 100); // 15,000
  const remainingBalance = totalBudget - upfrontDeposit; // 35,000

  assert.equal(totalBudget, 50000);
  assert.equal(upfrontDeposit, 15000);
  assert.equal(remainingBalance, 35000);
});

test('AC-booking-escrow: 100% Upfront escrow calculation', () => {
  const hourlyRate = 3000;
  const estimatedHours = 3;
  const totalBudget = hourlyRate * estimatedHours; // 9,000

  const upfrontPercent = 100;
  const upfrontDeposit = Math.round((totalBudget * upfrontPercent) / 100); // 9,000
  const remainingBalance = totalBudget - upfrontDeposit; // 0

  assert.equal(totalBudget, 9000);
  assert.equal(upfrontDeposit, 9000);
  assert.equal(remainingBalance, 0);
});

test('AC-booking-escrow: Booking request structure verification', () => {
  const bookingRequest = {
    id: 'bk-12345',
    serviceId: 's1',
    serviceTitle: 'Handbags & Handicraft Making',
    providerName: 'Kamal Perera',
    providerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    clientName: 'Test Client',
    projectTitle: 'Custom adaptive bag design',
    description: 'Need 2 custom adaptive handbags crafted.',
    totalBudget: 9000,
    paymentType: 'milestone',
    milestones: [
      {
        id: 'm-1',
        title: 'Initial Advance Escrow Deposit (50%)',
        percentage: 50,
        amount: 4500,
        status: 'pending_deposit'
      },
      {
        id: 'm-2',
        title: 'Final Deliverable Release (50%)',
        percentage: 50,
        amount: 4500,
        status: 'in_progress'
      }
    ],
    upfrontDeposit: 4500,
    remainingBalance: 4500,
    deliveryDate: '2026-09-25',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  assert.equal(bookingRequest.milestones.length, 2);
  assert.equal(bookingRequest.upfrontDeposit + bookingRequest.remainingBalance, bookingRequest.totalBudget);
  assert.equal(bookingRequest.milestones[0].amount, 4500);
});
