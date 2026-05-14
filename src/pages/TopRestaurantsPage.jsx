import { Link } from 'react-router-dom';
import StartRating from '../components/UI/StartRating';
import { useTopRestaurants } from '../hooks/useRestaurants';

const TopRestaurantsPage = () => {
    const { restaurants, loading, error } = useTopRestaurants(80);

    return (
        <section className="space-y-6">
            <div>
                <p className="text-sm font-medium text-emerald-700">Restoran siralamasi</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950">En Yuksek Puanli Restoranlar</h1>
                <p className="mt-3 max-w-3xl text-slate-600">
                    Firestore restaurants collection verileri averageRating alanina gore listelenir.
                </p>
            </div>

            {loading && <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Restoranlar yukleniyor...</p>}
            {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}
            {!loading && !restaurants.length && (
                <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Gosterilecek restoran bulunamadi.</p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {restaurants.map((restaurant, index) => (
                    <Link className="flex gap-4 rounded border bg-white p-4 hover:border-slate-400" key={restaurant.id} to={`/restaurants/${restaurant.slug || restaurant.id}`}>
                        {restaurant.imageUrl ? (
                            <img alt={restaurant.name} className="h-20 w-20 rounded object-cover" src={restaurant.imageUrl} />
                        ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded bg-slate-200 text-xs font-semibold text-slate-600">
                                #{index + 1}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h2 className="font-semibold text-slate-950">{restaurant.name}</h2>
                            <p className="mt-1 truncate text-sm text-slate-500">{restaurant.address || 'Adres bilgisi bekleniyor'}</p>
                            <StartRating className="mt-3" rating={restaurant.averageRating} reviewCount={restaurant.reviewCount} />
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default TopRestaurantsPage;