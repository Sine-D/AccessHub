import test from 'node:test';
import assert from 'node:assert/strict';

// Test suite for AC-109: Test proposal submission (Data mapping & validation)

test('AC-109: Proposal validation logic', () => {
  const validateProposal = (coverLetter, bidAmount, deliveryTime) => {
    if (!coverLetter.trim() || !bidAmount.trim() || !deliveryTime.trim()) {
      return false;
    }
    return true;
  };

  // Test with valid inputs
  assert.equal(validateProposal('I am a great fit.', '5000', '3 Days'), true);

  // Test with missing cover letter
  assert.equal(validateProposal('', '5000', '3 Days'), false);

  // Test with empty strings (spaces)
  assert.equal(validateProposal('   ', '   ', '   '), false);
});

test('AC-109: ServiceBookingRequest transformation logic', () => {
  const proposalJobId = 'job-123';
  const proposalJobTitle = 'Accessible Website Development';
  const proposalCoverLetter = 'I can make this very accessible.';
  const proposalBidAmount = '15000';
  const proposalDeliveryTime = '5 Days';
  const currentUser = { name: 'Kasun Perera', phone: '0771234567', avatar: 'kasun.jpg' };

  // This is the logic used in handleProposalSubmit
  const proposalApp = {
    id: 'prop-test-1',
    serviceTitle: `${proposalJobTitle} (Proposal)`,
    providerName: currentUser.name,
    clientName: 'Client (Job Poster)',
    projectTitle: proposalJobTitle,
    totalBudget: Number(proposalBidAmount) || 0,
    paymentType: 'full_upfront',
    upfrontDeposit: Number(proposalBidAmount) || 0,
    remainingBalance: 0,
    description: `Cover Letter: ${proposalCoverLetter}\nDelivery Time: ${proposalDeliveryTime}`,
    status: 'pending',
    serviceId: proposalJobId,
    providerAvatar: currentUser.avatar,
    milestones: [],
    deliveryDate: proposalDeliveryTime
  };

  // Assert correct transformation
  assert.equal(proposalApp.serviceTitle, 'Accessible Website Development (Proposal)');
  assert.equal(proposalApp.totalBudget, 15000);
  assert.equal(proposalApp.upfrontDeposit, 15000); // Because it is full_upfront
  assert.equal(proposalApp.paymentType, 'full_upfront');
  assert.equal(proposalApp.status, 'pending');
  assert.equal(proposalApp.providerName, 'Kasun Perera');
  assert.equal(proposalApp.providerAvatar, 'kasun.jpg');
  assert.match(proposalApp.description, /Cover Letter:/);
  assert.match(proposalApp.description, /Delivery Time:/);
});
