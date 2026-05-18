import { useEffect, useState } from 'react';
import { firestoreQuery, getCollection, getDocument } from '../firebase/firestore';
import { regions as staticRegions } from '../data/turkeyRegionsGeo';

const toNumber = (value) => Number(value || 0);

const getRestaurantScore = (restaurant) =>
  restaurant.featuredScore ?? toNumber(restaurant.averageRating) * 100 + toNumber(restaurant.reviewCount);

const sortRestaurantsByScore = (restaurants) =>
  [...restaurants].sort((first, second) => {
    const scoreDifference = getRestaurantScore(second) - getRestaurantScore(first);
    return scoreDifference || toNumber(second.reviewCount) - toNumber(first.reviewCount);
  });

export const useTopRestaurants = (resultLimit = 6) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getCollection('restaurants')
      .then((data) => {
        if (isMounted) {
          setRestaurants(sortRestaurantsByScore(data).slice(0, resultLimit));
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
            sortRestaurantsByScore(data)
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
            sortRestaurantsByScore(data)
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

export const useCityMapRestaurants = (cityId) => useRestaurantsByCity(cityId, 80);

export const useTopRestaurantsByRegion = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadTopRestaurantsByRegion = async () => {
      try {
        setLoading(true);
        setError(null);

        const restaurants = await getCollection('restaurants');
        const rankedRestaurants = sortRestaurantsByScore(restaurants);

        const regionRows = staticRegions.map((region) => ({
          ...region,
          restaurant: rankedRestaurants.find((restaurant) => restaurant.regionId === region.id) || null,
        }));

        if (isMounted) {
          setRegions(regionRows);
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

    loadTopRestaurantsByRegion();

    return () => {
      isMounted = false;
    };
  }, []);

  return { regions, loading, error };
};
