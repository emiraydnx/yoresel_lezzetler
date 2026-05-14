import { useEffect, useState } from 'react';
import { firestoreQuery, getCollection, getDocument } from '../firebase/firestore';


const toNumber = (value) => Number(value || 0);

const getFoodScore = (food) =>
  food.featuredScore ?? toNumber(food.averageRating) * 100 + toNumber(food.reviewCount);

export const useTopFoods = (resultLimit = 6) => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getCollection('foods')
      .then((data) => {
        if (isMounted) {
          setFoods(
            data
              .sort((first, second) => {
                const scoreDifference = getFoodScore(second) - getFoodScore(first);
                return scoreDifference || toNumber(second.averageRating) - toNumber(first.averageRating);
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
  }, [resultLimit]);

  return { foods, loading, error };
};

export const useFoodsByCity = (cityId, resultLimit = 5) => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cityId) {
      setFoods([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getCollection('foods', [firestoreQuery.where('cityId', '==', cityId)])
      .then((data) => {
        if (isMounted) {
          setFoods(
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

  return { foods, loading, error };
};

export const useFoodsByRegion = (regionId, resultLimit = 12) => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(Boolean(regionId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!regionId) {
      setFoods([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getCollection('foods', [firestoreQuery.where('regionId', '==', regionId)])
      .then((data) => {
        if (isMounted) {
          setFoods(
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

  return { foods, loading, error };
};

export const useFoodDetail = (foodSlug) => {
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(Boolean(foodSlug));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!foodSlug) {
      setFood(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let isMounted = true;

    const loadFood = async () => {
      try {
        setLoading(true);
        setError(null);

        const documentMatch = await getDocument('foods', foodSlug);
        const slugMatches = documentMatch
          ? []
          : await getCollection('foods', [firestoreQuery.where('slug', '==', foodSlug), firestoreQuery.limit(1)]);

        if (isMounted) {
          setFood(documentMatch || slugMatches[0] || null);
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

    loadFood();

    return () => {
      isMounted = false;
    };
  }, [foodSlug]);

  return { food, loading, error };
};