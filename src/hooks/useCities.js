import { useEffect, useState } from 'react';
import { firestoreQuery, getCollection, getDocument } from '../firebase/firestore';

export const useCityDetail = (citySlug) => {
    const [city, setCity] = useState(null);
    const [loading, setLoading] = useState(Boolean(citySlug));
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!citySlug) {
            setCity(null);
            setLoading(false);
            setError(null);
            return undefined;
        }

        let isMounted = true;

        const loadCity = async () => {
            try {
                setLoading(true);
                setError(null);

                const documentMatch = await getDocument('cities', citySlug);
                const slugMatches = documentMatch
                    ? []
                    : await getCollection('cities', [firestoreQuery.where('slug', '==', citySlug), firestoreQuery.limit(1)]);

                if (isMounted) {
                    setCity(documentMatch || slugMatches[0] || null);
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

        loadCity();

        return () => {
            isMounted = false;
        };
    }, [citySlug]);

    return { city, loading, error };
};

export const useCitiesByRegion = (regionId) => {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(Boolean(regionId));
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!regionId) {
            setCities([]);
            setLoading(false);
            setError(null);
            return undefined;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        getCollection('cities', [firestoreQuery.where('regionId', '==', regionId)])
            .then((data) => {
                if (isMounted) {
                    setCities(data.sort((first, second) => (first.name || '').localeCompare(second.name || '', 'tr')));
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
    }, [regionId]);

    return { cities, loading, error };
};