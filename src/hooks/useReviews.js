import { useEffect, useState } from 'react';
import {
  createDocument,
  firestoreQuery,
  getCollection,
  getDocument,
  updateDocument,
} from '../firebase/firestore';

const toMillis = (value) => {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return Number(value) || 0;
};

const enrichReviewWithUser = async (review) => {
  const user = review.userId ? await getDocument('users', review.userId) : null;

  return {
    ...review,
    userName: user?.displayName || review.userName || 'Kullanıcı',
    userPhotoURL: user?.photoURL || review.userPhotoURL || '',
    userTitle: user?.title || review.userTitle || 'Yöresel lezzet yorumcusu',
    followerCount: Number(user?.followerCount || review.followerCount || 0),
    userIsVerified: Boolean(user?.isVerified),
  };
};

export const getReviewsByTarget = (targetType, targetId) =>
  getCollection('reviews', [
    firestoreQuery.where('targetType', '==', targetType),
    firestoreQuery.where('targetId', '==', targetId),
  ]).then((reviews) =>
    reviews
      .filter((review) => !review.status || review.status === 'approved')
      .sort((first, second) => toMillis(second.createdAt) - toMillis(first.createdAt))
  );

export const createReview = ({ userId, targetType, targetId, rating, comment }) =>
  createDocument('reviews', {
    userId,
    targetType,
    targetId,
    rating,
    comment,
    status: 'pending',
  });

export const recalculateTargetRating = async (targetType, targetId) => {
  if (!targetType || !targetId) {
    return null;
  }

  const collectionName = targetType === 'food' ? 'foods' : targetType === 'restaurant' ? 'restaurants' : '';

  if (!collectionName) {
    return null;
  }

  const approvedReviews = await getReviewsByTarget(targetType, targetId);
  const reviewCount = approvedReviews.length;
  const averageRating = reviewCount
    ? approvedReviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviewCount
    : 0;

  await updateDocument(collectionName, targetId, {
    averageRating: Number(averageRating.toFixed(2)),
    reviewCount,
  });

  return {
    averageRating,
    reviewCount,
  };
};

export const useReviewsByTarget = (targetType, targetId, refreshKey = 0) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(Boolean(targetType && targetId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!targetType || !targetId) {
      setReviews([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let isMounted = true;

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const reviewDocs = await getReviewsByTarget(targetType, targetId);
        const enrichedReviews = await Promise.all(reviewDocs.map(enrichReviewWithUser));

        if (isMounted) {
          setReviews(enrichedReviews);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [targetType, targetId, refreshKey]);

  return { reviews, loading, error };
};

export const useRecentReviews = (resultLimit = 30) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const reviewDocs = await getCollection('reviews', [
          firestoreQuery.orderBy('createdAt', 'desc'),
          firestoreQuery.limit(resultLimit),
        ]);
        const approvedReviews = reviewDocs
          .filter((review) => !review.status || review.status === 'approved')
          .sort((first, second) => toMillis(second.createdAt) - toMillis(first.createdAt));
        const enrichedReviews = await Promise.all(approvedReviews.map(enrichReviewWithUser));

        if (isMounted) {
          setReviews(enrichedReviews);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [resultLimit]);

  return { reviews, loading, error };
};

export const useFeaturedGourmetReviews = (resultLimit = 3) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const reviewDocs = await getCollection('reviews', [
          firestoreQuery.where('isFeatured', '==', true),
          firestoreQuery.limit(30),
        ]);

        const approvedReviews = reviewDocs
          .filter((review) => !review.status || review.status === 'approved')
          .sort((first, second) => {
            const ratingDifference = Number(second.rating || 0) - Number(first.rating || 0);
            return ratingDifference || Number(second.replyCount || 0) - Number(first.replyCount || 0);
          })
          .slice(0, resultLimit);

        const enrichedReviews = await Promise.all(approvedReviews.map(enrichReviewWithUser));

        if (isMounted) {
          setReviews(enrichedReviews);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [resultLimit]);

  return { reviews, loading, error };
};

export const useReviewDetail = (reviewId) => {
  const [review, setReview] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(Boolean(reviewId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reviewId) {
      setReview(null);
      setAuthor(null);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadReview = async () => {
      try {
        setLoading(true);
        setError(null);

        const reviewDoc = await getDocument('reviews', reviewId);
        const userDoc = reviewDoc?.userId ? await getDocument('users', reviewDoc.userId) : null;

        if (isMounted) {
          setReview(reviewDoc);
          setAuthor(userDoc);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReview();

    return () => {
      isMounted = false;
    };
  }, [reviewId]);

  return { review, author, loading, error };
};

export const useReviewReplies = (reviewId, refreshKey = 0) => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(Boolean(reviewId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reviewId) {
      setReplies([]);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadReplies = async () => {
      try {
        setLoading(true);
        setError(null);

        const replyDocs = await getCollection('reviewReplies', [
          firestoreQuery.where('reviewId', '==', reviewId),
        ]);

        if (isMounted) {
          setReplies(
            replyDocs
              .filter((reply) => !reply.status || reply.status === 'approved')
              .sort((first, second) => toMillis(second.createdAt) - toMillis(first.createdAt))
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReplies();

    return () => {
      isMounted = false;
    };
  }, [reviewId, refreshKey]);

  return { replies, loading, error };
};

export const createReviewReply = ({ reviewId, userId, userName, userPhotoURL, comment }) =>
  createDocument('reviewReplies', {
    reviewId,
    userId,
    userName,
    userPhotoURL,
    comment,
    status: 'approved',
  });

export const useUserReviews = (userId) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setReviews([]);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const reviewDocs = await getCollection('reviews', [
          firestoreQuery.where('userId', '==', userId),
        ]);

        if (isMounted) {
          setReviews(
            reviewDocs
              .filter((review) => !review.status || review.status === 'approved')
              .sort((first, second) => toMillis(second.createdAt) - toMillis(first.createdAt))
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { reviews, loading, error };
};
