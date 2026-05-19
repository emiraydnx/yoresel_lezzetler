import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReviewForm from '../components/UI/ReviewForm';
import StartRating from '../components/UI/StartRating';
import { useAuth } from '../context/AuthContext';
import { useCityDetail } from '../hooks/useCities';
import { useFoodDetail } from '../hooks/useFoods';
import { createReview, useReviewsByTarget } from '../hooks/useReviews';
import { useRestaurantsByCity } from '../hooks/useRestaurants';

const EmptyState = ({ children }) => (
    <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">{children}</p>
);

const ReviewList = ({ error, loading, reviews }) => (
    <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-950">Kullanıcı Yorumları</h2>
        {loading && <EmptyState>Yorumlar yükleniyor...</EmptyState>}
        {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}
        {!loading && !reviews.length && <EmptyState>Bu lezzet için onaylı yorum bulunmuyor.</EmptyState>}
        {reviews.map((review) => (
            <article className="rounded border bg-white p-5" key={review.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link className="font-semibold text-slate-950 hover:text-red-800" to={`/users/${review.userId}`}>
                        {review.userName || 'Kullanıcı'}
                    </Link>
                    <span className="rounded bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                        {Number(review.rating || 0) ? `${Number(review.rating).toFixed(1)}/5` : 'Yeni'}
                    </span>
                </div>
                <p className="mt-3 leading-7 text-slate-700">{review.comment || 'Yorum metni bekleniyor.'}</p>
                <Link className="mt-4 inline-flex text-sm font-medium text-red-700 hover:text-red-900" to={`/reviews/${review.id}`}>
                    Yorumu aç
                </Link>
            </article>
        ))}
    </section>
);

const FoodDetailPage = () => {
    const { foodSlug } = useParams();
    const { currentUser, userProfile } = useAuth();
    const { food, loading, error } = useFoodDetail(foodSlug);
    const { city } = useCityDetail(food?.cityId);
    const { restaurants } = useRestaurantsByCity(food?.cityId, 4);
    const [refreshKey, setRefreshKey] = useState(0);
    const [submitError, setSubmitError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const {
        reviews,
        loading: reviewsLoading,
        error: reviewsError,
    } = useReviewsByTarget('food', food?.id, refreshKey);

    if (loading) {
        return <EmptyState>Lezzet detayı yükleniyor...</EmptyState>;
    }

    if (error) {
        return (
            <section className="rounded border border-red-200 bg-red-50 p-6">
                <h1 className="text-2xl font-bold text-red-800">Lezzet yüklenemedi</h1>
                <p className="mt-2 text-sm text-red-700">{error.message}</p>
            </section>
        );
    }

    if (!food) {
        return (
            <section className="rounded border bg-white p-6">
                <h1 className="text-2xl font-bold">Lezzet bulunamadı</h1>
                <Link className="mt-4 inline-flex rounded bg-slate-900 px-4 py-2 text-sm text-white" to="/">
                    Ana Sayfaya Dön
                </Link>
            </section>
        );
    }

    const handleReviewSubmit = async ({ rating, comment }) => {
        try {
            setSubmitting(true);
            setSubmitError(null);
            await createReview({
                userId: currentUser.uid,
                userName: userProfile?.displayName || currentUser.email || 'Kullanıcı',
                userPhotoURL: userProfile?.photoURL || '',
                targetType: 'food',
                targetId: food.id,
                foodId: food.id,
                foodName: food.name || '',
                foodSlug: food.slug || food.id,
                cityId: food.cityId || '',
                cityName: city?.name || '',
                rating,
                comment,
            });
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setSubmitError(err);
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="space-y-8">
            <article className="overflow-hidden rounded border bg-white">
                {food.imageUrl ? (
                    <img alt={food.name} className="h-72 w-full object-cover" src={food.imageUrl} />
                ) : (
                    <div className="flex h-56 w-full items-center justify-center bg-stone-200 text-lg font-semibold text-stone-600">
                        {food.name || 'Yöresel lezzet'}
                    </div>
                )}
                <div className="p-6">
                    <p className="text-sm font-medium text-emerald-700">{city?.name || food.cityId || 'Şehir bilgisi bekleniyor'}</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-950">{food.name}</h1>
                    <p className="mt-4 max-w-3xl leading-7 text-slate-700">{food.description || 'Bu lezzet için açıklama bekleniyor.'}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-4">
                        <StartRating rating={food.averageRating} reviewCount={food.reviewCount} />
                        {city && (
                            <Link className="text-sm font-medium text-red-700 hover:text-red-900" to={`/cities/${city.slug || city.id}`}>
                                {city.name} rehberine git
                            </Link>
                        )}
                    </div>
                </div>
            </article>

            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-950">Bu Lezzeti Deneyebilecegin Restoranlar</h2>
                {!restaurants.length && <EmptyState>Bu şehir için restoran kaydı bekleniyor.</EmptyState>}
                <div className="grid gap-4 md:grid-cols-2">
                    {restaurants.map((restaurant) => (
                        <Link className="rounded border bg-white p-4 hover:border-slate-400" key={restaurant.id} to={`/restaurants/${restaurant.slug || restaurant.id}`}>
                            <h3 className="font-semibold text-slate-950">{restaurant.name}</h3>
                            <p className="mt-1 text-sm text-slate-500">{restaurant.address || city?.name || 'Konum bekleniyor'}</p>
                            <StartRating className="mt-3" rating={restaurant.averageRating} reviewCount={restaurant.reviewCount} />
                        </Link>
                    ))}
                </div>
            </section>

            <ReviewForm currentUser={currentUser} disabled={submitting} onSubmit={handleReviewSubmit} />
            {submitError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError.message}</p>}
            <ReviewList error={reviewsError} loading={reviewsLoading} reviews={reviews} />
        </section>
    );
};

export default FoodDetailPage;