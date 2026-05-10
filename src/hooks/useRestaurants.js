import { useEffect, useState } from 'react';
import { firestoreQuery, getCollection } from '../firebase/firestore';

export const useTopRestaurants = (resultLimit = 6) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getCollection('restaurants', [
      firestoreQuery.orderBy('averageRating', 'desc'),
      firestoreQuery.limit(resultLimit),
    ])
      .then((data) => {
        if (isMounted) {
          setRestaurants(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [resultLimit]);

  return { restaurants, loading, error };
};

export const useRestaurantsByCity = (cityId, resultLimit = 5) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cityId) {
      setRestaurants([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getCollection('restaurants', [firestoreQuery.where('cityId', '==', cityId)])
      .then((data) => {
        if (isMounted) {
          setRestaurants(
            data
              .sort((first, second) => {
                const ratingDifference = Number(second.averageRating || 0) - Number(first.averageRating || 0);
                return ratingDifference || Number(second.reviewCount || 0) - Number(first.reviewCount || 0);
              })
              .slice(0, resultLimit)
          );
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cityId, resultLimit]);

  return { restaurants, loading, error };
};
