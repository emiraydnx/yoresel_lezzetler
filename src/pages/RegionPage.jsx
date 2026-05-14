import { Link, useParams } from 'react-router-dom';
import StartRating from '../components/UI/StartRating';
import { regions as staticRegions } from '../data/turkeyRegionsGeo';
import { useCitiesByRegion } from '../hooks/useCities';
import { useFoodsByRegion } from '../hooks/useFoods';
import { useRegionDetail } from '../hooks/useRegions';
import { useRestaurantsByRegion } from '../hooks/useRestaurants';

const EmptyState = ({ children }) => (
  <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">{children}</p>
);

const RegionPage = () => {
  const { regionSlug } = useParams();
  const staticRegion = staticRegions.find((item) => item.slug === regionSlug || item.id === regionSlug);
  const { region, loading: regionLoading, error: regionError } = useRegionDetail(regionSlug);
  const activeRegion = region || staticRegion;
  const regionId = activeRegion?.id || regionSlug;
  const { cities, loading: citiesLoading, error: citiesError } = useCitiesByRegion(regionId);
  const { foods, loading: foodsLoading, error: foodsError } = useFoodsByRegion(regionId, 12);
  const {
    restaurants,
    loading: restaurantsLoading,
    error: restaurantsError,
  } = useRestaurantsByRegion(regionId, 8);

  if (regionLoading && !staticRegion) {
    return <EmptyState>Bolge bilgisi yukleniyor...</EmptyState>;
  }

  if (regionError && !staticRegion) {
    return (
      <section className="rounded border border-red-200 bg-red-50 p-6">
        <h1 className="text-2xl font-bold text-red-800">Bolge yuklenemedi</h1>
        <p className="mt-2 text-sm text-red-700">{regionError.message}</p>
      </section>
    );
  }

  if (!activeRegion) {
    return (
      <section className="rounded border bg-white p-6">
        <h1 className="text-2xl font-bold">Bolge bulunamadi</h1>
        <Link className="mt-4 inline-flex rounded bg-slate-900 px-4 py-2 text-sm text-white" to="/">
          Haritaya Don
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="rounded border bg-white p-6">
        <p className="text-sm font-medium text-emerald-700">Bolge rehberi</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{activeRegion.name}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          {activeRegion.description ||
            'Bu sayfa Firestore cities, foods ve restaurants collection verilerini regionId uzerinden bir araya getirir.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded bg-slate-100 px-3 py-2">{cities.length} sehir</span>
          <span className="rounded bg-slate-100 px-3 py-2">{foods.length} lezzet</span>
          <span className="rounded bg-slate-100 px-3 py-2">{restaurants.length} restoran</span>
        </div>
      </div>

      <section className="space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-xl font-bold text-slate-950">Sehirler</h2>
          <p className="mt-1 text-sm text-slate-600">cities collection icinde regionId eslesen sehirler.</p>
        </div>
        {citiesLoading && <EmptyState>Sehirler yukleniyor...</EmptyState>}
        {citiesError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{citiesError.message}</p>}
        {!citiesLoading && !cities.length && <EmptyState>Bu bolge icin sehir kaydi bulunamadi.</EmptyState>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cities.map((city) => (
            <Link className="rounded border bg-white p-4 hover:border-slate-400 hover:bg-slate-50" key={city.id} to={`/cities/${city.slug || city.id}`}>
              <h3 className="font-semibold text-slate-950">{city.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{city.description || 'Aciklama bekleniyor.'}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-xl font-bold text-slate-950">Populer Lezzetler</h2>
          <p className="mt-1 text-sm text-slate-600">foods collection icinde regionId eslesen ve puana gore siralanan kayitlar.</p>
        </div>
        {foodsLoading && <EmptyState>Lezzetler yukleniyor...</EmptyState>}
        {foodsError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{foodsError.message}</p>}
        {!foodsLoading && !foods.length && <EmptyState>Bu bolge icin lezzet kaydi bulunamadi.</EmptyState>}
        <div className="grid gap-4 md:grid-cols-3">
          {foods.map((food) => (
            <Link className="rounded border bg-white p-4 hover:border-slate-400" key={food.id} to={`/foods/${food.slug || food.id}`}>
              <h3 className="font-semibold text-slate-950">{food.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{food.description || 'Aciklama bekleniyor.'}</p>
              <StartRating className="mt-3" rating={food.averageRating} reviewCount={food.reviewCount} />
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-xl font-bold text-slate-950">Restoranlar</h2>
          <p className="mt-1 text-sm text-slate-600">restaurants collection icinde regionId eslesen restoranlar.</p>
        </div>
        {restaurantsLoading && <EmptyState>Restoranlar yukleniyor...</EmptyState>}
        {restaurantsError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{restaurantsError.message}</p>}
        {!restaurantsLoading && !restaurants.length && <EmptyState>Bu bolge icin restoran kaydi bulunamadi.</EmptyState>}
        <div className="grid gap-4 md:grid-cols-2">
          {restaurants.map((restaurant) => (
            <Link className="rounded border bg-white p-4 hover:border-slate-400" key={restaurant.id} to={`/restaurants/${restaurant.slug || restaurant.id}`}>
              <h3 className="font-semibold text-slate-950">{restaurant.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{restaurant.address || 'Adres bilgisi bekleniyor'}</p>
              <StartRating className="mt-3" rating={restaurant.averageRating} reviewCount={restaurant.reviewCount} />
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
};

export default RegionPage;