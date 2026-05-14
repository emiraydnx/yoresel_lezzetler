import { useEffect, useState } from 'react';
import { firestoreQuery, getCollection, getDocument } from '../firebase/firestore';

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

export const useRestaurantsByRegion = (regionId, resultLimit = 12) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(Boolean(regionId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!regionId) {
      setRestaurants([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getCollection('restaurants', [firestoreQuery.where('regionId', '==', regionId)])
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
  }, [regionId, resultLimit]);

  return { restaurants, loading, error };
};

export const useRestaurantDetail = (restaurantSlug) => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(Boolean(restaurantSlug));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantSlug) {
      setRestaurant(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let isMounted = true;

    const loadRestaurant = async () => {
      try {
        setLoading(true);
        setError(null);

        const documentMatch = await getDocument('restaurants', restaurantSlug);
        const slugMatches = documentMatch
          ? []
          : await getCollection('restaurants', [
            firestoreQuery.where('slug', '==', restaurantSlug),
            firestoreQuery.limit(1),
          ]);

        if (isMounted) {
          setRestaurant(documentMatch || slugMatches[0] || null);
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

    loadRestaurant();

    return () => {
      isMounted = false;
    };
  }, [restaurantSlug]);

  return { restaurant, loading, error };
};