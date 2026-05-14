import { useCallback, useEffect, useState } from 'react';
import { createDocument, deleteDocument, getCollection, updateDocument } from '../firebase/firestore';

const removeEmptyValues = (data) =>
    Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

const sortByField = (items, sortField) =>
    [...items].sort((first, second) => String(first[sortField] || '').localeCompare(String(second[sortField] || ''), 'tr'));

export const useAdminCollection = (collectionName, sortField = 'name') => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCollection(collectionName);
            setItems(sortByField(data, sortField));
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [collectionName, sortField]);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getCollection(collectionName);

                if (isMounted) {
                    setItems(sortByField(data, sortField));
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

        load();

        return () => {
            isMounted = false;
        };
    }, [collectionName, sortField]);

    const createItem = async (data) => {
        setSubmitting(true);
        setError(null);

        try {
            await createDocument(collectionName, removeEmptyValues(data));
            await loadItems();
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    const updateItem = async (id, data) => {
        setSubmitting(true);
        setError(null);

        try {
            await updateDocument(collectionName, id, removeEmptyValues(data));
            await loadItems();
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    const deleteItem = async (id) => {
        setSubmitting(true);
        setError(null);

        try {
            await deleteDocument(collectionName, id);
            await loadItems();
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    return {
        createItem,
        deleteItem,
        error,
        items,
        loading,
        refresh: loadItems,
        submitting,
        updateItem,
    };
};