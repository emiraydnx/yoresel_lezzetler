const assert = require('node:assert/strict');
const test = require('node:test');
const {
  calculateFollowerStats,
  calculateRatingStats,
  getAffectedFollowUserIds,
  getAffectedReviewTargets,
} = require('./stats');

test('calculateRatingStats uses only approved reviews', () => {
  const stats = calculateRatingStats([
    { rating: 5, status: 'approved' },
    { rating: 3, status: 'approved' },
    { rating: 1, status: 'pending' },
  ]);

  assert.deepEqual(stats, {
    averageRating: 4,
    reviewCount: 2,
  });
});

test('getAffectedReviewTargets returns previous and next approved targets', () => {
  const targets = getAffectedReviewTargets(
    { rating: 4, status: 'approved', targetId: 'adana-kebap', targetType: 'food' },
    { rating: 5, status: 'approved', targetId: 'cigerci', targetType: 'restaurant' }
  );

  assert.deepEqual(targets, [
    { collectionName: 'foods', targetId: 'adana-kebap', targetType: 'food' },
    { collectionName: 'restaurants', targetId: 'cigerci', targetType: 'restaurant' },
  ]);
});

test('getAffectedFollowUserIds tracks active follow owner changes', () => {
  assert.deepEqual(
    getAffectedFollowUserIds(
      { followingId: 'user-a', status: 'active' },
      { followingId: 'user-b', status: 'active' }
    ),
    ['user-a', 'user-b']
  );
});

test('calculateFollowerStats counts active follows', () => {
  assert.deepEqual(
    calculateFollowerStats([
      { status: 'active' },
      { status: 'inactive' },
      { status: 'active' },
    ]),
    { followerCount: 2 }
  );
});
