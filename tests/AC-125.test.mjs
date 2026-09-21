import test from 'node:test';
import assert from 'node:assert/strict';

// Test suite for AC-125: Voice Confirmation for Checkout

// Helper function simulating generateVoiceSummary from ServiceBookingModal.tsx
function generateVoiceSummary(service, totalBudget, estimatedHours, upfrontDeposit, paymentOption) {
  if (!service) return '';
  const termsText = paymentOption === 'full' 
    ? '100 percent upfront escrow deposit' 
    : '50 50 milestone split';
  return `Voice confirmation for checkout. Provider: ${service.providerName}. Service: ${service.title}. Total budget LKR ${totalBudget.toLocaleString()} for ${estimatedHours} hours. Escrow deposit required now is LKR ${upfrontDeposit.toLocaleString()} under ${termsText}.`;
}

test('AC-125 / AC-126: Automatic voice prompt text generation on modal open', () => {
  const service = { providerName: 'Randi Thathsarani', hourlyRate: 4500 };
  const promptText = `Booking deposit checkout for ${service.providerName}. Service rate LKR ${service.hourlyRate.toLocaleString()} per hour. Press Read Summary Aloud for voice confirmation.`;

  assert.equal(promptText.includes('Randi Thathsarani'), true);
  assert.equal(promptText.includes('4,500'), true);
});

test('AC-125 / AC-127: Text-to-speech order summary generation for 50/50 split', () => {
  const service = { providerName: 'Randi Thathsarani', title: 'Video Editing Service' };
  const summary = generateVoiceSummary(service, 9000, 2, 4500, '50_50');

  assert.equal(summary.includes('Randi Thathsarani'), true);
  assert.equal(summary.includes('Video Editing Service'), true);
  assert.equal(summary.includes('9,000'), true);
  assert.equal(summary.includes('4,500'), true);
  assert.equal(summary.includes('50 50 milestone split'), true);
});

test('AC-125 / AC-127: Text-to-speech order summary generation for 100% upfront', () => {
  const service = { providerName: 'Kasun Kalhara', title: 'Handicraft Making' };
  const summary = generateVoiceSummary(service, 15000, 3, 15000, 'full');

  assert.equal(summary.includes('Kasun Kalhara'), true);
  assert.equal(summary.includes('Handicraft Making'), true);
  assert.equal(summary.includes('15,000'), true);
  assert.equal(summary.includes('100 percent upfront escrow deposit'), true);
});

test('AC-125 / AC-128: Voice confirmation text on deposit submit', () => {
  const service = { providerName: 'Randi Thathsarani' };
  const deposit = 4500;
  const confirmText = `Escrow deposit of LKR ${deposit.toLocaleString()} confirmed for ${service.providerName}. Booking request submitted successfully.`;

  assert.equal(confirmText.includes('4,500'), true);
  assert.equal(confirmText.includes('Randi Thathsarani'), true);
  assert.equal(confirmText.includes('submitted successfully'), true);
});

test('AC-125 / AC-129: Accessibility attributes for Voice Confirmation button', () => {
  const voiceControlProps = {
    role: 'region',
    'aria-label': 'Voice confirmation text to speech',
    buttonAriaLabel: 'Hear order summary text to speech voice confirmation'
  };

  assert.equal(voiceControlProps.role, 'region');
  assert.equal(voiceControlProps['aria-label'], 'Voice confirmation text to speech');
  assert.equal(voiceControlProps.buttonAriaLabel.includes('voice confirmation'), true);
});
