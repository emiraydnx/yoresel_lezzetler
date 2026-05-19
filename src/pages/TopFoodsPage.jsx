import { Link } from 'react-router-dom';
import StartRating from '../components/UI/StartRating';
import { useTopFoods } from '../hooks/useFoods';

const TopFoodsPage = () => {
    const { foods, loading, error } = useTopFoods(80);

    return (
        <section className="space-y-6">
            <div>
                <p className="text-sm font-medium text-emerald-700">Lezzet sıralaması</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950">En Sevilen Lezzetler</h1>
                <p className="mt-3 max-w-3xl text-slate-600">
                    Firestore foods collection verileri averageRating, reviewCount ve featuredScore alanlarına göre sıralanır.
                </p>
            </div>

            {loading && <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Lezzetler yükleniyor...</p>}
            {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}
            {!loading && !foods.length && (
                <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Gösterilecek lezzet bulunamadı.</p>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                {foods.map((food, index) => (
                    <Link className="rounded border bg-white p-4 hover:border-slate-400" key={food.id} to={`/foods/${food.slug || food.id}`}>
                        <p className="text-xs font-semibold uppercase text-slate-400">#{index + 1}</p>
                        <h2 className="mt-1 font-semibold text-slate-950">{food.name}</h2>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{food.description || 'Açıklama bekleniyor.'}</p>
                        <StartRating className="mt-3" rating={food.averageRating} reviewCount={food.reviewCount} />
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default TopFoodsPage;