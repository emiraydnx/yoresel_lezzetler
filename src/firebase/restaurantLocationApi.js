import {
  GeoPoint,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './config';

const OPENSTREETMAP_SOURCE = 'openstreetmap';
const DEFAULT_RADIUS_METERS = 50000;
const MAX_RADIUS_METERS = 100000;
const MAX_SEARCH_LIMIT = 30;
const searchOpenStreetMapRestaurants = httpsCallable(functions, 'searchOpenStreetMapRestaurants');

const toSlug = (value = '') =>
  value
    .toLocaleLowerCase('tr-TR')
    .replace(/\u00e7/g, 'c')
    .replace(/\u011f/g, 'g')
    .replace(/\u0131/g, 'i')
    .replace(/\u00f6/g, 'o')
    .replace(/\u015f/g, 's')
    .replace(/\u00fc/g, 'u')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const getCoordinatePair = (location) => {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const getCityCoordinates = (city) => {
  const point = city?.geoPoint || city?.location;

  if (point?.latitude !== undefined && point?.longitude !== undefined) {
    return getCoordinatePair(point);
  }

  if (Array.isArray(point) && point.length === 2) {
    return getCoordinatePair({ latitude: point[0], longitude: point[1] });
  }

  return null;
};

const getExistingRestaurantRefBySourcePlaceId = async (sourcePlaceId) => {
  const snapshot = await getDocs(
    query(
      collection(db, 'restaurants'),
      where('source', '==', OPENSTREETMAP_SOURCE),
      where('sourcePlaceId', '==', sourcePlaceId),
      limit(1)
    )
  );

  return snapshot.empty ? null : snapshot.docs[0].ref;
};

const getAvailableRestaurantRef = async (baseSlug) => {
  for (let index = 0; index < 20; index += 1) {
    const slug = index === 0 ? baseSlug : `${baseSlug}_${index + 1}`;
    const restaurantRef = doc(db, 'restaurants', slug);
    const snapshot = await getDoc(restaurantRef);

    if (!snapshot.exists()) {
      return { ref: restaurantRef, slug };
    }
  }

  const fallbackSlug = `${baseSlug}_${Date.now()}`;

  return {
    ref: doc(db, 'restaurants', fallbackSlug),
    slug: fallbackSlug,
  };
};

const sanitizeRestaurantForImport = (restaurant, city) => {
  const coordinates = Array.isArray(restaurant.location)
    ? getCoordinatePair({ latitude: restaurant.location[0], longitude: restaurant.location[1] })
    : null;

  if (!restaurant.sourcePlaceId || !restaurant.name || !coordinates) {
    throw new Error('Her restoran icin sourcePlaceId, name ve location zorunludur.');
  }

  return {
    address: String(restaurant.address || ''),
    cityId: city.id,
    cuisine: String(restaurant.cuisine || ''),
    externalTypes: Array.isArray(restaurant.externalTypes) ? restaurant.externalTypes.slice(0, 12) : [],
    geoPoint: new GeoPoint(coordinates.latitude, coordinates.longitude),
    imageUrl: String(restaurant.imageUrl || ''),
    imageUrls: Array.isArray(restaurant.imageUrls) ? restaurant.imageUrls.filter(Boolean).slice(0, 6) : [],
    location: [coordinates.latitude, coordinates.longitude],
    name: String(restaurant.name || ''),
    osmType: String(restaurant.osmType || ''),
    phone: String(restaurant.phone || ''),
    primaryType: String(restaurant.primaryType || 'restaurant'),
    regionId: city.regionId || '',
    slug: toSlug(restaurant.slug || `${restaurant.name}_${city.id}`),
    source: OPENSTREETMAP_SOURCE,
    sourcePlaceId: String(restaurant.sourcePlaceId),
    website: String(restaurant.website || ''),
  };
};

export const searchRestaurantLocations = async ({ city, pageSize, query: searchQuery, radiusMeters }) => {
  if (!city?.id) {
    throw new Error('Sehir secimi zorunludur.');
  }

  const safeLimit = Math.max(1, Math.min(Number(pageSize || 10), MAX_SEARCH_LIMIT));
  const safeRadius = Math.max(1000, Math.min(Number(radiusMeters || DEFAULT_RADIUS_METERS), MAX_RADIUS_METERS));
  const coordinates = getCityCoordinates(city);

  if (!coordinates) {
    throw new Error(`${city?.name || city?.id || 'Secilen sehir'} icin geoPoint/location alani bekleniyor.`);
  }

  const result = await searchOpenStreetMapRestaurants({
    city: {
      id: city.id,
      name: city.name || city.id,
      regionId: city.regionId || '',
      coordinates,
    },
    pageSize: safeLimit,
    query: String(searchQuery || ''),
    radiusMeters: safeRadius,
  });

  return result.data;
};

export const importRestaurantLocations = async ({ city, restaurants }) => {
  if (!city?.id) {
    throw new Error('Sehir secimi zorunludur.');
  }

  const selectedRestaurants = Array.isArray(restaurants) ? restaurants.slice(0, MAX_SEARCH_LIMIT) : [];

  if (!selectedRestaurants.length) {
    throw new Error('Ice aktarilacak restoran listesi bos.');
  }

  const result = {
    created: 0,
    updated: 0,
    items: [],
  };

  for (const restaurant of selectedRestaurants) {
    const sanitized = sanitizeRestaurantForImport(restaurant, city);
    const existingRef = await getExistingRestaurantRefBySourcePlaceId(sanitized.sourcePlaceId);
    const target = existingRef
      ? { ref: existingRef, slug: sanitized.slug, exists: true }
      : { ...(await getAvailableRestaurantRef(sanitized.slug)), exists: false };
    const timestampFields = {
      externalUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const payload = target.exists
      ? {
        ...sanitized,
        ...timestampFields,
      }
      : {
        ...sanitized,
        averageRating: 0,
        createdAt: serverTimestamp(),
        description: '',
        imageUrl: sanitized.imageUrl || '',
        imageUrls: sanitized.imageUrls || [],
        reviewCount: 0,
        slug: target.slug,
        ...timestampFields,
      };

    await setDoc(target.ref, payload, { merge: true });

    if (target.exists) {
      result.updated += 1;
    } else {
      result.created += 1;
    }

    result.items.push({
      id: target.ref.id,
      name: sanitized.name,
      slug: target.slug,
      status: target.exists ? 'updated' : 'created',
    });
  }

  return result;
};
