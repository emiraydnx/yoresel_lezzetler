import { Link, useParams } from 'react-router-dom';
import StartRating from '../components/UI/StartRating';
import { useCityDetail } from '../hooks/useCities';
import { useFoodsByCity } from '../hooks/useFoods';
import { useRestaurantsByCity } from '../hooks/useRestaurants';

const EmptyState = ({ children }) => (
    <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">{children}</p>
);

const FoodCard = ({ food }) => (
    <Link
        className="overflow-hidden rounded border bg-white transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"
        to={`/foods/${food.slug || food.id}`}
    >
        {food.imageUrl ? (
            <img alt={food.name} className="h-36 w-full object-cover" src={food.imageUrl} />
        ) : (
            <div className="flex h-36 w-full items-center justify-center bg-stone-200 text-sm font-medium text-stone-600">
                {food.name || 'Lezzet'}
            </div>
        )}
        <div className="space-y-3 p-4">
            <h3 className="font-semibold text-slate-950">{food.name || 'Lezzet bilgisi bekleniyor'}</h3>
            <p className="line-clamp-2 text-sm leading-6 text-slate-600">{food.description || 'Aciklama bekleniyor.'}</p>
            <StartRating rating={food.averageRating} reviewCount={food.reviewCount} />
        </div>
    </Link>
);

const RestaurantCard = ({ restaurant }) => (
    <Link
        className="flex gap-4 rounded border bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"
        to={`/restaurants/${restaurant.slug || restaurant.id}`}
    >
        {restaurant.imageUrl ? (
            <img alt={restaurant.name} className="h-20 w-20 rounded object-cover" src={restaurant.imageUrl} />
        ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded bg-slate-200 text-xs font-semibold text-slate-600">
                Restoran
            </div>
        )}
        <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-950">{restaurant.name || 'Restoran bilgisi bekleniyor'}</h3>
            <p className="mt-1 truncate text-sm text-slate-500">{restaurant.address || 'Adres bilgisi bekleniyor'}</p>
            <StartRating className="mt-3" rating={restaurant.averageRating} reviewCount={restaurant.reviewCount} />
        </div>
    </Link>
);

const CityPage = () => {
    const { citySlug } = useParams();
    const { city, loading: cityLoading, error: cityError } = useCityDetail(citySlug);
    const { foods, loading: foodsLoading, error: foodsError } = useFoodsByCity(city?.id, 50);
    const {
        restaurants,
        loading: restaurantsLoading,
        error: restaurantsError,
    } = useRestaurantsByCity(city?.id, 50);

    if (cityLoading) {
        return <EmptyState>Sehir bilgisi yukleniyor...</EmptyState>;
    }

    if (cityError) {
        return (
            <section className="rounded border border-red-200 bg-red-50 p-6">
                <h1 className="text-2xl font-bold text-red-800">Sehir yuklenemedi</h1>
                <p className="mt-2 text-sm text-red-700">{cityError.message}</p>
            </section>
        );
    }

    if (!city) {
        return (
            <section className="rounded border bg-white p-6">
                <h1 className="text-2xl font-bold">Sehir bulunamadi</h1>
                <Link className="mt-4 inline-flex rounded bg-slate-900 px-4 py-2 text-sm text-white" to="/">
                    Haritaya Don
                </Link>
            </section>
        );
    }

    return (
        <section className="space-y-8">
            <div className="rounded border bg-white p-6">
                <p className="text-sm font-medium text-emerald-700">Sehir rehberi</p>
                <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-950">{city.name}</h1>
                        <p className="mt-3 max-w-3xl leading-7 text-slate-600">{city.description || 'Bu sehir icin aciklama bekleniyor.'}</p>
                    </div>
                    {city.regionId && (
                        <Link className="rounded border px-4 py-2 text-sm font-medium hover:bg-slate-50" to={`/regions/${city.regionId}`}>
                            Bolgeye Git
                        </Link>
                    )}
                </div>
            </div>

            <section className="space-y-4">
                <div className="flex items-end justify-between border-b pb-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">Yoresel Lezzetler</h2>
                        <p className="mt-1 text-sm text-slate-600">Firestore foods collection icinde cityId alanina gore listelenir.</p>
                    </div>
                </div>
                {foodsLoading && <EmptyState>Lezzetler yukleniyor...</EmptyState>}
                {foodsError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{foodsError.message}</p>}
                {!foodsLoading && !foods.length && <EmptyState>Bu sehir icin henuz lezzet kaydi yok.</EmptyState>}
                <div className="grid gap-4 md:grid-cols-3">
                    {foods.map((food) => (
                        <FoodCard food={food} key={food.id} />
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-end justify-between border-b pb-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">Restoranlar</h2>
                        <p className="mt-1 text-sm text-slate-600">Firestore restaurants collection icinde cityId alanina gore listelenir.</p>
                    </div>
                </div>
                {restaurantsLoading && <EmptyState>Restoranlar yukleniyor...</EmptyState>}
                {restaurantsError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{restaurantsError.message}</p>}
                {!restaurantsLoading && !restaurants.length && <EmptyState>Bu sehir icin henuz restoran kaydi yok.</EmptyState>}
                <div className="grid gap-4 md:grid-cols-2">
                    {restaurants.map((restaurant) => (
                        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                    ))}
                </div>
            </section>
        </section>
    );
};

export default CityPage;