const { initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const {
  ACTIVE_FOLLOW_STATUS,
  APPROVED_REVIEW_STATUS,
  calculateFollowerStats,
  calculateRatingStats,
  getAffectedFollowUserIds,
  getAffectedReviewTargets,
} = require('./stats');

initializeApp();

const db = getFirestore();

const snapshotData = (snapshot) => (snapshot?.exists ? snapshot.data() : null);

const resolveTargetReference = async ({ collectionName, targetId }) => {
  const directRef = db.collection(collectionName).doc(targetId);
  const directSnapshot = await directRef.get();

  if (directSnapshot.exists) {
    return {
      data: directSnapshot.data(),
      ref: directRef,
    };
  }

  const slugSnapshot = await db
    .collection(collectionName)
    .where('slug', '==', targetId)
    .limit(1)
    .get();

  if (slugSnapshot.empty) {
    return null;
  }

  const matchedDoc = slugSnapshot.docs[0];

  return {
    data: matchedDoc.data(),
    ref: matchedDoc.ref,
  };
};

const getApprovedReviewsForTarget = async ({ targetType, targetId, targetSlug }) => {
  const targetIds = [...new Set([targetId, targetSlug].filter(Boolean))];
  const snapshots = await Promise.all(
    targetIds.map((id) =>
      db
        .collection('reviews')
        .where('targetType', '==', targetType)
        .where('targetId', '==', id)
        .where('status', '==', APPROVED_REVIEW_STATUS)
        .get()
    )
  );

  const reviewsById = new Map();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      reviewsById.set(doc.id, doc.data());
    });
  });

  return [...reviewsById.values()];
};

const syncTargetRating = async (target) => {
  const resolvedTarget = await resolveTargetReference(target);

  if (!resolvedTarget) {
    logger.warn('Review target document could not be resolved', target);
    return;
  }

  const reviews = await getApprovedReviewsForTarget({
    targetId: resolvedTarget.ref.id,
    targetSlug: resolvedTarget.data.slug,
    targetType: target.targetType,
  });
  const stats = calculateRatingStats(reviews);

  await resolvedTarget.ref.set(
    {
      ...stats,
      statsUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};

exports.syncReviewTargetStats = onDocumentWritten('reviews/{reviewId}', async (event) => {
  const before = snapshotData(event.data?.before);
  const after = snapshotData(event.data?.after);
  const targets = getAffectedReviewTargets(before, after);

  if (!targets.length) {
    return;
  }

  await Promise.all(targets.map(syncTargetRating));
});

exports.syncUserFollowerCount = onDocumentWritten('follows/{followId}', async (event) => {
  const before = snapshotData(event.data?.before);
  const after = snapshotData(event.data?.after);
  const userIds = getAffectedFollowUserIds(before, after);

  if (!userIds.length) {
    return;
  }

  await Promise.all(
    userIds.map(async (userId) => {
      const activeFollowsSnapshot = await db
        .collection('follows')
        .where('followingId', '==', userId)
        .where('status', '==', ACTIVE_FOLLOW_STATUS)
        .get();
      const stats = calculateFollowerStats(activeFollowsSnapshot.docs.map((doc) => doc.data()));

      await db
        .collection('users')
        .doc(userId)
        .set(
          {
            ...stats,
            statsUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    })
  );
});
