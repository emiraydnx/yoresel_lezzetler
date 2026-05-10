import { useEffect, useMemo, useState } from 'react';
import {
  createDocument,
  firestoreQuery,
  getCollection,
  updateDocument,
} from '../firebase/firestore';

export const useFollowState = (currentUserId, targetUserId) => {
  const [followDoc, setFollowDoc] = useState(null);
  const [loading, setLoading] = useState(Boolean(currentUserId && targetUserId));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canFollow = useMemo(
    () => Boolean(currentUserId && targetUserId && currentUserId !== targetUserId),
    [currentUserId, targetUserId]
  );

  useEffect(() => {
    if (!canFollow) {
      setFollowDoc(null);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadFollow = async () => {
      try {
        setLoading(true);
        setError(null);
        const docs = await getCollection('follows', [
          firestoreQuery.where('followerId', '==', currentUserId),
          firestoreQuery.where('followingId', '==', targetUserId),
          firestoreQuery.limit(1),
        ]);

        if (isMounted) {
          setFollowDoc(docs[0] || null);
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

    loadFollow();

    return () => {
      isMounted = false;
    };
  }, [canFollow, currentUserId, targetUserId]);

  const isFollowing = followDoc?.status === 'active';

  const toggleFollow = async () => {
    if (!canFollow || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (followDoc) {
        const nextStatus = isFollowing ? 'inactive' : 'active';
        await updateDocument('follows', followDoc.id, { status: nextStatus });
        setFollowDoc((current) => ({ ...current, status: nextStatus }));
        return;
      }

      const createdId = await createDocument('follows', {
        followerId: currentUserId,
        followingId: targetUserId,
        status: 'active',
      });
      setFollowDoc({
        id: createdId,
        followerId: currentUserId,
        followingId: targetUserId,
        status: 'active',
      });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    canFollow,
    error,
    isFollowing,
    loading,
    submitting,
    toggleFollow,
  };
};
