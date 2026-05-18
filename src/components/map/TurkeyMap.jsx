import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { regionColors, regionStats, regions, provinceToRegion } from '../../data/turkeyRegionsGeo';
import { useFoodsByCity } from '../../hooks/useFoods';
import { useCityMapRestaurants } from '../../hooks/useRestaurants';
import turkeyProvincesGeo from '../../data/turkey-provinces.json';

const turkeyFeatures = Array.isArray(turkeyProvincesGeo.features) ? turkeyProvincesGeo.features : [];

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 360;
const MAP_BOUNDS = {
  minLng: turkeyProvincesGeo.bbox?.[0] || 25.6,
  minLat: turkeyProvincesGeo.bbox?.[1] || 35.7,
  maxLng: turkeyProvincesGeo.bbox?.[2] || 45.0,
  maxLat: turkeyProvincesGeo.bbox?.[3] || 42.2,
};

const projectCoordinate = ([lng, lat]) => {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * VIEWBOX_WIDTH;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * VIEWBOX_HEIGHT;

  return [x, y];
};

const getRingPath = (ring) =>
  ring
    .map((coordinate, index) => {
      const [x, y] = projectCoordinate(coordinate);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

const getFeaturePath = (feature) => {
  if (feature.geometry.type === 'Polygon') {
    return `${feature.geometry.coordinates.map(getRingPath).join(' ')} Z`;
  }

  if (feature.geometry.type === 'MultiPolygon') {
    return feature.geometry.coordinates
      .map((polygon) => `${polygon.map(getRingPath).join(' ')} Z`)
      .join(' ');
  }

  return '';
};

const getFeatureCoordinates = (feature) => {
  if (feature.geometry.type === 'Polygon') {
    return feature.geometry.coordinates.flat();
  }

  if (feature.geometry.type === 'MultiPolygon') {
    return feature.geometry.coordinates.flat(2);
  }

  return [];
};

const getProjectedBounds = (features) => {
  const points = features.flatMap((feature) => getFeatureCoordinates(feature).map(projectCoordinate));

  if (!points.length) {
    return { minX: 0, minY: 0, maxX: VIEWBOX_WIDTH, maxY: VIEWBOX_HEIGHT };
  }

  return points.reduce(
    (bounds, [x, y]) => ({
      minX: Math.min(bounds.minX, x),
      minY: Math.min(bounds.minY, y),
      maxX: Math.max(bounds.maxX, x),
      maxY: Math.max(bounds.maxY, y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
};

const getFeatureCenter = (feature) => {
  const bounds = getProjectedBounds([feature]);

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
};

const getRegionFeatures = (regionId) =>
  turkeyFeatures.filter((feature) => provinceToRegion[feature.properties.name] === regionId);

const getRegionZoomTransform = (regionId) => {
  if (!regionId) {
    return { scale: 1, translateX: 0, translateY: 4 };
  }

  const regionFeatures = getRegionFeatures(regionId);
  const bounds = getProjectedBounds(regionFeatures);
  const padding = 72;
  const regionWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const regionHeight = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.min(
    3.2,
    Math.max(1.4, Math.min((VIEWBOX_WIDTH - padding) / regionWidth, (VIEWBOX_HEIGHT - padding) / regionHeight))
  );
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return {
    scale,
    translateX: VIEWBOX_WIDTH / 2 - centerX * scale,
    translateY: VIEWBOX_HEIGHT / 2 - centerY * scale,
  };
};

const cityIdOverrides = {
  Afyon: 'afyonkarahisar',
  'K. MaraÅŸ': 'kahramanmaras',
  'K. Maras': 'kahramanmaras',
  MaraÅŸ: 'kahramanmaras',
  Maras: 'kahramanmaras',
};

const toCityId = (provinceName = '') => {
  if (cityIdOverrides[provinceName]) {
    return cityIdOverrides[provinceName];
  }

  return provinceName
    .toLocaleLowerCase('tr-TR')
    .replace(/ç|Ã§/g, 'c')
    .replace(/ğ|ÄŸ/g, 'g')
    .replace(/ı|Ä±/g, 'i')
    .replace(/ö|Ã¶/g, 'o')
    .replace(/ş|ÅŸ/g, 's')
    .replace(/ü|Ã¼/g, 'u')
    .replace(/\./g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
};

const getRating = (item) => Number(item?.averageRating || 0);
const getReviewCount = (item) => Number(item?.reviewCount || 0);
const getRestaurantPath = (restaurant) => `/restaurants/${restaurant.slug || restaurant.id}`;

const RatingLine = ({ item }) => (
  <p className="mt-1 text-xs text-slate-500">
    <span className="font-semibold text-amber-700">{getRating(item) ? `${getRating(item).toFixed(1)}/5` : 'Yeni'}</span>
    <span> - {getReviewCount(item)} yorum</span>
  </p>
);

const TurkeyMap = () => {
  const navigate = useNavigate();
  const [activeRegion, setActiveRegion] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const visibleRegion = activeRegion || selectedRegion;
  const selectedFeatures = selectedRegion ? getRegionFeatures(selectedRegion.id) : [];
  const zoomTransform = getRegionZoomTransform(selectedRegion?.id);
  const selectedCityId = selectedProvince ? toCityId(selectedProvince) : '';
  const { foods: cityFoods, loading: foodsLoading, error: foodsError } = useFoodsByCity(selectedCityId, 5);
  const {
    restaurants: cityRestaurants,
    loading: restaurantsLoading,
    error: restaurantsError,
  } = useCityMapRestaurants(selectedCityId);

  const handleMouseMove = (event) => {
    const bounds = event.currentTarget.closest('[data-map-container]')?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    setTooltipPosition({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  };

  const handleProvinceClick = (region, provinceName) => {
    setSelectedRegion(region);
    setActiveRegion(region);
    setSelectedProvince(provinceName);
    setIsMenuClosing(false);
  };

  const handleRegionPageClick = () => {
    if (selectedRegion) {
      navigate(`/regions/${selectedRegion.slug}`);
    }
  };

  const handleResetMap = () => {
    setSelectedRegion(null);
    setActiveRegion(null);
    setSelectedProvince(null);
    setIsMenuClosing(false);
  };

  const handleCloseCityMenu = () => {
    setIsMenuClosing(true);
    window.setTimeout(() => {
      setSelectedProvince(null);
      setIsMenuClosing(false);
    }, 360);
  };

  return (
    <section className={selectedProvince ? 'fixed inset-0 z-50 flex flex-col bg-slate-50 p-4' : 'space-y-4'}>
      <style>
        {`
          @keyframes cityPanelIn {
            from { transform: translateX(110%); }
            to { transform: translateX(0); }
          }

          @keyframes cityPanelOut {
            from { transform: translateX(0); }
            to { transform: translateX(110%); }
          }
        `}
      </style>

      <div
        className={`relative overflow-hidden rounded-lg bg-white p-3 shadow-sm transition-all duration-500 ${
          selectedProvince ? 'min-h-0 flex-1 pr-0 lg:mr-[420px]' : ''
        }`}
        data-map-container
        onMouseLeave={() => setActiveRegion(selectedRegion)}
      >
        {selectedRegion && (
          <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
            <button
              className="rounded bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              onClick={handleResetMap}
              type="button"
            >
              Tum Turkiye
            </button>
            <button
              className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
              onClick={handleRegionPageClick}
              type="button"
            >
              Bolge Sayfasi
            </button>
          </div>
        )}

        <svg
          aria-label="Turkiye sehir restoran haritasi"
          className={`${selectedProvince ? 'h-full min-h-[520px]' : 'h-[480px]'} w-full transition-all duration-500`}
          role="img"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        >
          <defs>
            <filter id="provinceShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.22" />
            </filter>
            <filter id="selectedProvinceShadow" x="-35%" y="-35%" width="170%" height="170%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#111827" floodOpacity="0.28" />
              <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.2" />
            </filter>
          </defs>
          <style>
            {`
              .province-shape:focus,
              .province-shape:focus-visible {
                outline: none;
              }
            `}
          </style>

          <g
            style={{
              transform: `translate(${zoomTransform.translateX}px, ${zoomTransform.translateY}px) scale(${zoomTransform.scale})`,
              transformBox: 'fill-box',
              transformOrigin: '0 0',
              transition: 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {turkeyFeatures.map((feature) => {
              const provinceName = feature.properties.name;
              const regionId = provinceToRegion[provinceName];
              const region = regions.find((item) => item.id === regionId);
              const isActive = activeRegion?.id === regionId;
              const isSelected = selectedRegion?.id === regionId;
              const isSelectedProvince = selectedProvince === provinceName;
              const hasSelectedRegion = Boolean(selectedRegion);
              const fillColor = regionColors[regionId] || '#94a3b8';

              return (
                <path
                  aria-label={region ? `${provinceName}, ${region.name}` : provinceName}
                  className="province-shape"
                  d={getFeaturePath(feature)}
                  fill={fillColor}
                  filter={isSelectedProvince ? 'url(#selectedProvinceShadow)' : isActive ? 'url(#provinceShadow)' : 'none'}
                  key={feature.properties.id || provinceName}
                  onClick={() => region && handleProvinceClick(region, provinceName)}
                  onKeyDown={(event) => {
                    if (region && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      handleProvinceClick(region, provinceName);
                    }
                  }}
                  onMouseEnter={() => region && setActiveRegion(region)}
                  onMouseMove={handleMouseMove}
                  role="button"
                  stroke={isSelectedProvince ? '#020617' : isActive ? '#111827' : fillColor}
                  strokeLinejoin="round"
                  strokeWidth={isSelectedProvince ? 1.55 : isActive || isSelected ? 0.95 : 0.45}
                  style={{
                    cursor: region ? 'pointer' : 'default',
                    opacity: hasSelectedRegion && !isSelected ? 0.1 : isSelectedProvince ? 1 : isActive || isSelected ? 0.92 : 0.76,
                    transition: 'filter 180ms ease, opacity 160ms ease, stroke 160ms ease, stroke-width 160ms ease',
                  }}
                  tabIndex={region ? 0 : -1}
                />
              );
            })}

            {!selectedProvince &&
              selectedFeatures.map((feature) => {
                const provinceName = feature.properties.name;
                const center = getFeatureCenter(feature);

                return (
                  <g
                    key={`city-${provinceName}`}
                    pointerEvents="none"
                    style={{
                      opacity: selectedRegion ? 1 : 0,
                      transition: 'opacity 260ms ease 180ms',
                    }}
                    transform={`translate(${center.x.toFixed(2)} ${center.y.toFixed(2)})`}
                  >
                    <circle fill="#111827" r="2.8" stroke="#ffffff" strokeWidth="1" />
                    <text
                      fill="#111827"
                      fontSize="8"
                      fontWeight="700"
                      paintOrder="stroke"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      textAnchor="middle"
                      y="-6"
                    >
                      {provinceName}
                    </text>
                  </g>
                );
              })}

          </g>
        </svg>

        {visibleRegion && !selectedRegion && (
          <div
            className="pointer-events-none absolute z-10 w-56 rounded-md border bg-white/95 p-3 text-sm shadow-lg"
            style={{
              left: Math.min(tooltipPosition.x + 14, 620),
              top: Math.max(tooltipPosition.y - 24, 12),
            }}
          >
            <p className="font-semibold text-slate-900">{visibleRegion.name}</p>
            <p className="mt-1 text-xs text-slate-500">{regionStats[visibleRegion.id]?.cityCount} sehir</p>
            <div className="mt-3 flex items-center justify-between rounded bg-slate-50 px-2 py-1">
              <span className="text-xs text-slate-600">One cikan</span>
              <span className="text-xs font-medium text-slate-900">{regionStats[visibleRegion.id]?.highlight}</span>
            </div>
            <p className="mt-2 text-xs text-amber-700">{regionStats[visibleRegion.id]?.rating} kullanici puani</p>
          </div>
        )}

        {selectedRegion && (
          <div className="absolute bottom-4 right-4 z-20 max-w-xs rounded-md border bg-white/95 p-3 text-sm shadow-lg">
            <p className="font-semibold text-slate-900">{selectedProvince || selectedRegion.name}</p>
            <p className="mt-1 text-xs text-slate-600">
              {selectedProvince
                ? 'Restoranlar performans icin harita uzerinde pinlenmeden panelde listelenir.'
                : `${selectedFeatures.length} sehir gosteriliyor. Bir sehre tiklayarak restoranlari gor.`}
            </p>
          </div>
        )}
      </div>

      {selectedProvince && (
        <aside
          className="fixed bottom-4 right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-[400px] overflow-hidden rounded-lg border bg-white shadow-2xl"
          style={{
            animation: `${isMenuClosing ? 'cityPanelOut' : 'cityPanelIn'} 360ms cubic-bezier(0.22, 1, 0.36, 1) both`,
          }}
        >
          <div className="flex items-start justify-between gap-4 border-b p-5">
            <div>
              <p className="text-xs font-semibold uppercase text-red-700">Sehir rehberi</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">{selectedProvince}</h2>
              <p className="mt-1 text-sm text-slate-500">{selectedRegion?.name}</p>
              <Link className="mt-3 inline-flex text-sm font-medium text-red-700 hover:text-red-900" to={`/cities/${selectedCityId}`}>
                Sehir sayfasina git
              </Link>
            </div>
            <button
              aria-label="Sehir menusunu kapat"
              className="flex h-9 w-9 items-center justify-center rounded border text-xl leading-none text-slate-700 transition hover:bg-slate-50"
              onClick={handleCloseCityMenu}
              type="button"
            >
              x
            </button>
          </div>

          <div className="h-[calc(100%-88px)] space-y-6 overflow-y-auto p-5">
            <section>
              <h3 className="font-semibold text-slate-950">Populer Restoranlar</h3>
              {restaurantsLoading && <p className="mt-3 text-sm text-slate-500">Restoranlar yukleniyor...</p>}
              {restaurantsError && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{restaurantsError.message}</p>}
              {!restaurantsLoading && !cityRestaurants.length && (
                <p className="mt-3 rounded border border-dashed bg-white p-3 text-sm text-slate-500">
                  Bu sehir icin restoran kaydi bekleniyor.
                </p>
              )}
              <div className="mt-3 space-y-3">
                {cityRestaurants.map((restaurant) => (
                  <Link
                    className="block rounded border p-3 transition hover:border-slate-400 hover:bg-slate-50"
                    key={restaurant.id}
                    to={getRestaurantPath(restaurant)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{restaurant.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{restaurant.address || `${selectedProvince} konumunda`}</p>
                      </div>
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">Panel</span>
                    </div>
                    <RatingLine item={restaurant} />
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-slate-950">Sehirde One Cikan Lezzetler</h3>
              {foodsLoading && <p className="mt-3 text-sm text-slate-500">Yemekler yukleniyor...</p>}
              {foodsError && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{foodsError.message}</p>}
              {!foodsLoading && !cityFoods.length && (
                <p className="mt-3 rounded border border-dashed bg-white p-3 text-sm text-slate-500">
                  Bu sehir icin lezzet kaydi bekleniyor.
                </p>
              )}
              <div className="mt-3 space-y-3">
                {cityFoods.map((food) => (
                  <Link
                    className="block rounded border p-3 transition hover:border-slate-400 hover:bg-slate-50"
                    key={food.id}
                    to={food.slug ? `/foods/${food.slug}` : `/foods/${food.id}`}
                  >
                    <p className="font-medium text-slate-900">{food.name}</p>
                    <RatingLine item={food} />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </aside>
      )}
    </section>
  );
};

export default TurkeyMap;
