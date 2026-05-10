import { useEffect, useState } from 'react';
import { firestoreQuery, getCollection } from '../firebase/firestore';

const toNumber = (value) => Number(value || 0);

const calculateRegionStats = (region, foods) => {
  const regionFoods = foods.filter((food) => food.regionId === region.id);
  const totalReviews = regionFoods.reduce((total, food) => total + toNumber(food.reviewCount), 0);
  const averageRating = regionFoods.length
    ? regionFoods.reduce((total, food) => total + toNumber(food.averageRating), 0) / regionFoods.length
    : 0;
  const topFood = [...regionFoods].sort((first, second) => {
    const ratingDifference = toNumber(second.averageRating) - toNumber(first.averageRating);
    return ratingDifference || toNumber(second.reviewCount) - toNumber(first.reviewCount);
  })[0];

  return {
    averageRating,
    foodCount: regionFoods.length,
    topFoodId: topFood?.id || '',
    topFoodName: topFood?.name || '',
    totalReviews,
  };
};

export const useRegions = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getCollection('Regions', [firestoreQuery.orderBy('name', 'asc')])
      .then((data) => {
        if (isMounted) {
          setRegions(data);
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
  }, []);

  return { regions, loading, error };
};

export const useTopRegions = (resultLimit = 3) => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadTopRegions = async () => {
      try {
        setLoading(true);
        setError(null);

        const [regionDocs, foodDocs] = await Promise.all([
          getCollection('Regions'),
          getCollection('foods'),
        ]);

        const rankedRegions = regionDocs
          .map((region) => {
            const derivedStats = calculateRegionStats(region, foodDocs);
            const averageRating = region.averageRating ?? derivedStats.averageRating;
            const totalReviews = region.reviewCount ?? region.totalReviews ?? derivedStats.totalReviews;
            const foodCount = region.foodCount ?? derivedStats.foodCount;
            const score = region.featuredScore ?? toNumber(averageRating) * 100 + toNumber(totalReviews);

            return {
              ...region,
              averageRating: toNumber(averageRating),
              foodCount: toNumber(foodCount),
              topFoodId: region.topFoodId || derivedStats.topFoodId,
              topFoodName: region.topFoodName || derivedStats.topFoodName || 'Veri bekleniyor',
              totalReviews: toNumber(totalReviews),
              score: toNumber(score),
            };
          })
          .sort((first, second) => second.score - first.score)
          .slice(0, resultLimit);

        if (isMounted) {
          setRegions(rankedRegions);
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

    loadTopRegions();

    return () => {
      isMounted = false;
    };
  }, [resultLimit]);

  return { regions, loading, error };
};
