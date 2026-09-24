import test from 'node:test';
import assert from 'node:assert/strict';
import {
  submitContentReport,
  fetchModerationQueue,
  approveModeratedContent,
  removeModeratedContent,
  subscribeToRemovalUpdates,
  resetModerationStore,
  getMemoryModerationItems,
} from '../src/services/fraudModerationService.ts';

// Test suite for Suspicious / Fraud Review Moderation (AC-252 to AC-263)

test.beforeEach(() => {
  resetModerationStore();
});

test('AC-252, AC-253, AC-254, AC-255: Unified moderation queue displays flagged reviews, duplicate photos & listings', async () => {
  const response = await fetchModerationQueue('admin', { page: 1, pageSize: 10, typeFilter: 'all', statusFilter: 'flagged' });

  assert.ok(response.items.length >= 3, 'Queue must display flagged items');

  const flaggedReview = response.items.find((i) => i.contentType === 'flagged_review');
  const duplicatePhoto = response.items.find((i) => i.contentType === 'duplicate_photo');
  const flaggedListing = response.items.find((i) => i.contentType === 'flagged_listing');

  assert.ok(flaggedReview, 'AC-253: Flagged review must appear in queue');
  assert.ok(duplicatePhoto, 'AC-254: Duplicate photo submission must appear in queue');
  assert.ok(flaggedListing, 'AC-255: Flagged marketplace listing must appear in queue');

  assert.equal(flaggedReview.status, 'flagged');
  assert.ok(duplicatePhoto.photoHash, 'Duplicate photo must have a hash reference');
  assert.ok(duplicatePhoto.duplicateCount > 1, 'Duplicate photo must indicate match count');
});

test('AC-256: Pagination divides dataset into bounded pages', async () => {
  const page1 = await fetchModerationQueue('admin', { page: 1, pageSize: 2, typeFilter: 'all', statusFilter: 'flagged' });
  const page2 = await fetchModerationQueue('admin', { page: 2, pageSize: 2, typeFilter: 'all', statusFilter: 'flagged' });

  assert.equal(page1.items.length, 2, 'Page 1 must contain exactly 2 items');
  assert.equal(page1.page, 1);
  assert.ok(page1.totalPages >= 2);

  assert.notEqual(page1.items[0].id, page2.items[0].id, 'Page 1 and Page 2 must not contain identical first items');
});

test('AC-259: Content automatically flagged after 3 DISTINCT user reports', async () => {
  const contentId = 'rev-test-unique-threshold';

  // Report 1: User A
  const r1 = await submitContentReport(contentId, 'flagged_review', 'user-A', 'Spam comment');
  assert.equal(r1.distinctReporters, 1);
  assert.equal(r1.flagged, false, 'Should not flag after 1 report');

  // Report 2: User B
  const r2 = await submitContentReport(contentId, 'flagged_review', 'user-B', 'Misleading rating');
  assert.equal(r2.distinctReporters, 2);
  assert.equal(r2.flagged, false, 'Should not flag after 2 reports');

  // Report 3: User C (3rd DISTINCT user -> Threshold satisfied!)
  const r3 = await submitContentReport(contentId, 'flagged_review', 'user-C', 'Fake profile');
  assert.equal(r3.distinctReporters, 3);
  assert.equal(r3.flagged, true, 'AC-259: Must automatically flag after 3 distinct user reports');
});

test('AC-259: Multiple reports from the SAME user do NOT satisfy the threshold', async () => {
  const contentId = 'rev-test-same-user-spam';

  // User A reports 5 times in a row
  await submitContentReport(contentId, 'flagged_review', 'user-A', 'Spam 1');
  await submitContentReport(contentId, 'flagged_review', 'user-A', 'Spam 2');
  await submitContentReport(contentId, 'flagged_review', 'user-A', 'Spam 3');
  await submitContentReport(contentId, 'flagged_review', 'user-A', 'Spam 4');
  const res = await submitContentReport(contentId, 'flagged_review', 'user-A', 'Spam 5');

  assert.equal(res.distinctReporters, 1, 'Only 1 distinct user report should be counted');
  assert.equal(res.flagged, false, 'Multiple reports from same user must NOT trigger automatic flagging threshold');
});

test('AC-260, AC-261: Non-admin users are rejected by authorization security checks', async () => {
  const nonAdminRoles = ['buyer', 'seller', 'freelancer', 'user', 'guest', ''];

  for (const role of nonAdminRoles) {
    await assert.rejects(
      async () => await fetchModerationQueue(role),
      /UNAUTHORIZED_ADMIN_REQUIRED/,
      `Non-admin role "${role}" must be rejected from fetching moderation queue`
    );

    await assert.rejects(
      async () => await approveModeratedContent('mod-rev-101', role),
      /UNAUTHORIZED_ADMIN_REQUIRED/,
      `Non-admin role "${role}" must be rejected from approving content`
    );

    await assert.rejects(
      async () => await removeModeratedContent('mod-rev-101', role),
      /UNAUTHORIZED_ADMIN_REQUIRED/,
      `Non-admin role "${role}" must be rejected from removing content`
    );
  }
});

test('AC-257: Accessible Approve Content marks item as approved', async () => {
  const contentId = 'rev-901';
  const approved = await approveModeratedContent(contentId, 'admin');

  assert.equal(approved, true);

  const items = getMemoryModerationItems();
  const target = items.find((i) => i.contentId === contentId);
  assert.equal(target?.status, 'approved', 'Approved item status must transition to approved');
});

test('AC-258, AC-262: Accessible Remove Content purges flagged content from system', async () => {
  const contentId = 'rev-904';
  const removed = await removeModeratedContent(contentId, 'admin');

  assert.equal(removed, true);

  const items = getMemoryModerationItems();
  const target = items.find((i) => i.contentId === contentId);
  assert.equal(target?.status, 'removed', 'AC-262: Removed content status must transition to removed');
});

test('AC-263: Real-time removal update fires subscriber callbacks', async () => {
  let subscriberNotified = false;
  let notifiedContentId = '';

  const unsubscribe = subscribeToRemovalUpdates((id) => {
    subscriberNotified = true;
    notifiedContentId = id;
  });

  const targetId = 'rev-901';
  await removeModeratedContent(targetId, 'admin');

  assert.equal(subscriberNotified, true, 'AC-263: Subscriber must be notified when content is removed');
  assert.equal(notifiedContentId, targetId);

  unsubscribe();
});

