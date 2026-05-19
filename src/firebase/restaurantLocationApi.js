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
import { db } from './config';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const OPENSTREETMAP_SOURCE = 'openstreetmap';
const DEFAULT_RADIUS_METERS = 50000;
const MAX_RADIUS_METERS = 100000;
const MAX_SEARCH_LIMIT = 30;

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

const getElementCoordinates = (element) => {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return { latitude: element.lat, longitude: element.lon };
  }

  if (element.center) {
    return getCoordinatePair({
      latitude: element.center.lat,
      longitude: element.center.lon,
    });
  }

  return null;
};

const normalizeUrl = (value = '') => {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  if (/^www\./i.test(trimmedValue)) {
    return `https://${trimmedValue}`;
  }

  return '';
};

const normalizeWikimediaImage = (value = '') => {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue || /^category:/i.test(trimmedValue)) {
    return '';
  }

  const fileName = trimmedValue.replace(/^file:/i, '').trim();

  return fileName
    ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`
    : '';
};

const uniqueValues = (values) => [...new Set(values.filter(Boolean))];

const getAddressFromTags = (tags = {}, city) => {
  if (tags['addr:full']) {
    return tags['addr:full'];
  }

  const streetLine = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  const districtLine = [
    tags['addr:neighbourhood'],
    tags['addr:suburb'],
    tags['addr:quarter'],
    tags['addr:district'],
  ].filter(Boolean);
  const cityLine = [
    tags['addr:postcode'],
    tags['addr:city'] || city?.name,
    tags['addr:province'],
    tags['addr:state'],
  ].filter(Boolean);

  return uniqueValues([streetLine, ...districtLine, ...cityLine]).join(', ');
};

const getImageUrlsFromTags = (tags = {}) =>
  uniqueValues([
    normalizeUrl(tags.image),
    normalizeUrl(tags['contact:image']),
    normalizeUrl(tags['image:0']),
    normalizeUrl(tags['image:1']),
    normalizeWikimediaImage(tags.wikimedia_commons),
    normalizeWikimediaImage(tags['wikimedia_commons:1']),
  ]);

const buildOverpassQuery = ({ city, radiusMeters }) => {
  const coordinates = getCityCoordinates(city);

  if (!coordinates) {
    throw new Error(`${city?.name || city?.id || 'Seçilen şehir'} için geoPoint/location alanı bekleniyor.`);
  }

  const lat = coordinates.latitude.toFixed(6);
  const lon = coordinates.longitude.toFixed(6);

  return `
[out:json][timeout:25];
(
  node["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
  way["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
  relation["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
);
out center tags;
`;
};

const normalizeOverpassElement = ({ element, city }) => {
  const coordinates = getElementCoordinates(element);
  const tags = element.tags || {};
  const name = tags.name || tags['name:tr'] || tags['name:en'] || '';

  if (!element.id || !element.type || !name || !coordinates) {
    return null;
  }

  const sourcePlaceId = `${element.type}/${element.id}`;
  const imageUrls = getImageUrlsFromTags(tags);

  return {
    address: getAddressFromTags(tags, city),
    cityId: city.id,
    cuisine: tags.cuisine || '',
    externalTypes: ['amenity:restaurant', tags.cuisine ? `cuisine:${tags.cuisine}` : ''].filter(Boolean),
    location: [coordinates.latitude, coordinates.longitude],
    name,
    osmType: element.type,
    phone: tags.phone || tags['contact:phone'] || '',
    primaryType: 'restaurant',
    regionId: city.regionId || '',
    imageUrl: imageUrls[0] || '',
    imageUrls,
    slug: toSlug(`${name}_${city.id}`),
    source: OPENSTREETMAP_SOURCE,
    sourcePlaceId,
    website: tags.website || tags['contact:website'] || '',
  };
};

const getSearchText = (restaurant) =>
  [restaurant.name, restaurant.address, restaurant.cuisine]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('tr-TR');

const filterRestaurantsByQuery = ({ restaurants, searchQuery }) => {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('tr-TR');

  if (!normalizedQuery || ['restoran', 'restaurant', 'lokanta'].includes(normalizedQuery)) {
    return restaurants;
  }

  return restaurants.filter((restaurant) => getSearchText(restaurant).includes(normalizedQuery));
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
    throw new Error('Her restoran için sourcePlaceId, name ve location zorunludur.');
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
    throw new Error('Şehir seçimi zorunludur.');
  }

  const safeLimit = Math.max(1, Math.min(Number(pageSize || 10), MAX_SEARCH_LIMIT));
  const safeRadius = Math.max(1000, Math.min(Number(radiusMeters || DEFAULT_RADIUS_METERS), MAX_RADIUS_METERS));
  const overpassQuery = buildOverpassQuery({ city, radiusMeters: safeRadius });
  const body = new URLSearchParams({ data: overpassQuery });

  let response;

  try {
    response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body,
    });
  } catch (error) {
    throw new Error(`OpenStreetMap Overpass istegi basarisiz oldu: ${error.message}`);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.remark || 'OpenStreetMap Overpass restoran aramasi basarisiz oldu.');
  }

  const restaurants = filterRestaurantsByQuery({
    restaurants: (payload.elements || [])
      .map((element) => normalizeOverpassElement({ element, city }))
      .filter(Boolean),
    searchQuery: String(searchQuery || ''),
  }).slice(0, safeLimit);

  return {
    city: {
      id: city.id,
      name: city.name || city.id,
      regionId: city.regionId || '',
    },
    query: [searchQuery || 'restoran', city.name || city.id].filter(Boolean).join(' '),
    radiusMeters: safeRadius,
    restaurants,
    source: OPENSTREETMAP_SOURCE,
  };
};

export const importRestaurantLocations = async ({ city, restaurants }) => {
  if (!city?.id) {
    throw new Error('Şehir seçimi zorunludur.');
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
