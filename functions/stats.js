const TARGET_COLLECTIONS = {
  food: 'foods',
  restaurant: 'restaurants',
};

const ACTIVE_FOLLOW_STATUS = 'active';
const APPROVED_REVIEW_STATUS = 'approved';

const uniqueValues = (values) => [...new Set(values.filter(Boolean))];

const normalizeReviewTarget = (review = {}) => {
  const targetType = review.targetType;
  const targetId = review.targetId || review.foodId || review.restaurantId;

  if (!TARGET_COLLECTIONS[targetType] || !targetId) {
    return null;
  }

  return {
    collectionName: TARGET_COLLECTIONS[targetType],
    targetId,
    targetType,
  };
};

const reviewAffectsStats = (before = null, after = null) => {
  if (!before && !after) {
    return false;
  }

  if (!before || !after) {
    return before?.status === APPROVED_REVIEW_STATUS || after?.status === APPROVED_REVIEW_STATUS;
  }

  return [
    'status',
    'rating',
    'targetId',
    'targetType',
    'foodId',
    'restaurantId',
  ].some((field) => before[field] !== after[field]);
};

const getAffectedReviewTargets = (before = null, after = null) => {
  if (!reviewAffectsStats(before, after)) {
    return [];
  }

  const candidates = [before, after]
    .filter((review) => review?.status === APPROVED_REVIEW_STATUS)
    .map(normalizeReviewTarget)
    .filter(Boolean);

  const deduped = new Map();

  candidates.forEach((target) => {
    deduped.set(`${target.targetType}:${target.targetId}`, target);
  });

  return [...deduped.values()];
};

const calculateRatingStats = (reviews) => {
  const approvedReviews = reviews.filter((review) => review?.status === APPROVED_REVIEW_STATUS);
  const reviewCount = approvedReviews.length;
  const averageRating = reviewCount
    ? approvedReviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviewCount
    : 0;

  return {
    averageRating: Number(averageRating.toFixed(2)),
    reviewCount,
  };
};

const getAffectedFollowUserIds = (before = null, after = null) => {
  const beforeActive = before?.status === ACTIVE_FOLLOW_STATUS;
  const afterActive = after?.status === ACTIVE_FOLLOW_STATUS;

  if (
    before?.followingId === after?.followingId &&
    beforeActive === afterActive
  ) {
    return [];
  }

  return uniqueValues([
    beforeActive ? before?.followingId : '',
    afterActive ? after?.followingId : '',
  ]);
};

const calculateFollowerStats = (follows) => ({
  followerCount: follows.filter((follow) => follow?.status === ACTIVE_FOLLOW_STATUS).length,
});

module.exports = {
  ACTIVE_FOLLOW_STATUS,
  APPROVED_REVIEW_STATUS,
  TARGET_COLLECTIONS,
  calculateFollowerStats,
  calculateRatingStats,
  getAffectedFollowUserIds,
  getAffectedReviewTargets,
  normalizeReviewTarget,
};
