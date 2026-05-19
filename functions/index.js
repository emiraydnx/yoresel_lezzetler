const { initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');
const { defineSecret } = require('firebase-functions/params');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { HttpsError, onCall } = require('firebase-functions/v2/https');
const {
  ACTIVE_FOLLOW_STATUS,
  APPROVED_REVIEW_STATUS,
  calculateFollowerStats,
  calculateRatingStats,
  getAffectedFollowUserIds,
  getAffectedReviewTargets,
} = require('./stats');

initializeApp();

const db = getFirestore();
const recaptchaSecretKey = defineSecret('RECAPTCHA_SECRET_KEY');
const RECAPTCHA_SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const OPENSTREETMAP_SOURCE = 'openstreetmap';
const DEFAULT_RADIUS_METERS = 50000;
const MAX_RADIUS_METERS = 100000;
const MAX_SEARCH_LIMIT = 30;

const snapshotData = (snapshot) => (snapshot?.exists ? snapshot.data() : null);

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

const getCityCoordinates = (city = {}) => {
  if (city.coordinates) {
    return getCoordinatePair(city.coordinates);
  }

  const point = city.geoPoint || city.location;

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
    throw new HttpsError('invalid-argument', `${city?.name || city?.id || 'Secilen sehir'} icin koordinat bekleniyor.`);
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

const assertAdmin = async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Admin islemi icin giris yapmalisin.');
  }

  const userSnapshot = await db.collection('users').doc(request.auth.uid).get();

  if (userSnapshot.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Bu islem sadece admin kullanicilar icindir.');
  }
};

const verifyCaptchaToken = async (token) => {
  const response = await fetch(RECAPTCHA_SITEVERIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      secret: recaptchaSecretKey.value(),
      response: token,
    }),
  });

  if (!response.ok) {
    logger.error('reCAPTCHA siteverify request failed', {
      status: response.status,
      statusText: response.statusText,
    });
    throw new HttpsError('internal', 'reCAPTCHA dogrulamasi su anda yapilamiyor.');
  }

  return response.json();
};

exports.verifyRegistrationCaptcha = onCall({ secrets: [recaptchaSecretKey] }, async (request) => {
  const token = request.data?.token;

  if (!token || typeof token !== 'string') {
    throw new HttpsError('invalid-argument', 'Lutfen reCAPTCHA dogrulamasini tamamlayin.');
  }

  const verification = await verifyCaptchaToken(token);

  if (!verification.success) {
    logger.warn('reCAPTCHA verification failed', {
      errorCodes: verification['error-codes'],
      hostname: verification.hostname,
    });
    throw new HttpsError('failed-precondition', 'reCAPTCHA dogrulamasi basarisiz oldu. Lutfen tekrar deneyin.');
  }

  return { success: true };
});

exports.searchOpenStreetMapRestaurants = onCall(async (request) => {
  await assertAdmin(request);

  const city = request.data?.city || {};

  if (!city.id || typeof city.id !== 'string') {
    throw new HttpsError('invalid-argument', 'Sehir secimi zorunludur.');
  }

  const safeLimit = Math.max(1, Math.min(Number(request.data?.pageSize || 10), MAX_SEARCH_LIMIT));
  const safeRadius = Math.max(
    1000,
    Math.min(Number(request.data?.radiusMeters || DEFAULT_RADIUS_METERS), MAX_RADIUS_METERS)
  );
  const searchQuery = String(request.data?.query || '');
  const overpassQuery = buildOverpassQuery({ city, radiusMeters: safeRadius });
  const body = new URLSearchParams({ data: overpassQuery });

  let response;

  try {
    response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'yoresel-lezzetler-admin-import/1.0',
      },
      body,
    });
  } catch (error) {
    logger.error('Overpass request failed', { message: error.message });
    throw new HttpsError('unavailable', `OpenStreetMap Overpass istegi basarisiz oldu: ${error.message}`);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    logger.warn('Overpass returned an error', {
      status: response.status,
      remark: payload.remark,
    });
    throw new HttpsError(
      'unavailable',
      payload.remark || 'OpenStreetMap Overpass restoran aramasi basarisiz oldu.'
    );
  }

  const restaurants = filterRestaurantsByQuery({
    restaurants: (payload.elements || [])
      .map((element) => normalizeOverpassElement({ element, city }))
      .filter(Boolean),
    searchQuery,
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
});

const resolveTargetReference = async ({ collectionName, targetId }) => {
  const directRef = db.collection(collectionName).doc(targetId);
  const directSnapshot = await directRef.get();

  if (directSnapshot.exists) {
    return {
      data: directSnapshot.data(),
      ref: directRef,
    };
  }

  const slugSnapshot = await db
    .collection(collectionName)
    .where('slug', '==', targetId)
    .limit(1)
    .get();

  if (slugSnapshot.empty) {
    return null;
  }

  const matchedDoc = slugSnapshot.docs[0];

  return {
    data: matchedDoc.data(),
    ref: matchedDoc.ref,
  };
};

const getApprovedReviewsForTarget = async ({ targetType, targetId, targetSlug }) => {
  const targetIds = [...new Set([targetId, targetSlug].filter(Boolean))];
  const snapshots = await Promise.all(
    targetIds.map((id) =>
      db
        .collection('reviews')
        .where('targetType', '==', targetType)
        .where('targetId', '==', id)
        .where('status', '==', APPROVED_REVIEW_STATUS)
        .get()
    )
  );

  const reviewsById = new Map();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      reviewsById.set(doc.id, doc.data());
    });
  });

  return [...reviewsById.values()];
};

const syncTargetRating = async (target) => {
  const resolvedTarget = await resolveTargetReference(target);

  if (!resolvedTarget) {
    logger.warn('Review target document could not be resolved', target);
    return;
  }

  const reviews = await getApprovedReviewsForTarget({
    targetId: resolvedTarget.ref.id,
    targetSlug: resolvedTarget.data.slug,
    targetType: target.targetType,
  });
  const stats = calculateRatingStats(reviews);

  await resolvedTarget.ref.set(
    {
      ...stats,
      statsUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};

exports.syncReviewTargetStats = onDocumentWritten('reviews/{reviewId}', async (event) => {
  const before = snapshotData(event.data?.before);
  const after = snapshotData(event.data?.after);
  const targets = getAffectedReviewTargets(before, after);

  if (!targets.length) {
    return;
  }

  await Promise.all(targets.map(syncTargetRating));
});

exports.syncUserFollowerCount = onDocumentWritten('follows/{followId}', async (event) => {
  const before = snapshotData(event.data?.before);
  const after = snapshotData(event.data?.after);
  const userIds = getAffectedFollowUserIds(before, after);

  if (!userIds.length) {
    return;
  }

  await Promise.all(
    userIds.map(async (userId) => {
      const activeFollowsSnapshot = await db
        .collection('follows')
        .where('followingId', '==', userId)
        .where('status', '==', ACTIVE_FOLLOW_STATUS)
        .get();
      const stats = calculateFollowerStats(activeFollowsSnapshot.docs.map((doc) => doc.data()));

      await db
        .collection('users')
        .doc(userId)
        .set(
          {
            ...stats,
            statsUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    })
  );
});
