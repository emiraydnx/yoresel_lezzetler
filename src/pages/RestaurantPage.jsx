import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReviewForm from '../components/UI/ReviewForm';
import StartRating from '../components/UI/StartRating';
import { useAuth } from '../context/AuthContext';
import { useCityDetail } from '../hooks/useCities';
import { useFoodsByCity } from '../hooks/useFoods';
import { createReview, useReviewsByTarget } from '../hooks/useReviews';
import { useRestaurantDetail } from '../hooks/useRestaurants';

const EmptyState = ({ children }) => (
    <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">{children}</p>
);

const getCoordinate = (restaurant) => {
    const point = restaurant?.geoPoint || restaurant?.location;

    if (!point) {
        return null;
    }

    if (typeof point.latitude === 'number' && typeof point.longitude === 'number') {
        return { latitude: point.latitude, longitude: point.longitude };
    }

    if (Array.isArray(point) && point.length === 2) {
        return { latitude: point[0], longitude: point[1] };
    }

    return null;
};

const RestaurantPage = () => {
    const { restaurantSlug } = useParams();
    const { currentUser, userProfile } = useAuth();
    const { restaurant, loading, error } = useRestaurantDetail(restaurantSlug);
    const { city } = useCityDetail(restaurant?.cityId);
    const { foods } = useFoodsByCity(restaurant?.cityId, 6);
    const [refreshKey, setRefreshKey] = useState(0);
    const [submitError, setSubmitError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const {
        reviews,
        loading: reviewsLoading,
        error: reviewsError,
    } = useReviewsByTarget('restaurant', restaurant?.id, refreshKey);

    if (loading) {
        return <EmptyState>Restoran detayi yukleniyor...</EmptyState>;
    }

    if (error) {
        return (
            <section className="rounded border border-red-200 bg-red-50 p-6">
                <h1 className="text-2xl font-bold text-red-800">Restoran yuklenemedi</h1>
                <p className="mt-2 text-sm text-red-700">{error.message}</p>
            </section>
        );
    }

    if (!restaurant) {
        return (
            <section className="rounded border bg-white p-6">
                <h1 className="text-2xl font-bold">Restoran bulunamadi</h1>
                <Link className="mt-4 inline-flex rounded bg-slate-900 px-4 py-2 text-sm text-white" to="/">
                    Ana Sayfaya Don
                </Link>
            </section>
        );
    }

    const coordinate = getCoordinate(restaurant);

    const handleReviewSubmit = async ({ rating, comment }) => {
        try {
            setSubmitting(true);
            setSubmitError(null);
            await createReview({
                userId: currentUser.uid,
                userName: userProfile?.displayName || currentUser.email || 'Kullanici',
                userPhotoURL: userProfile?.photoURL || '',
                targetType: 'restaurant',
                targetId: restaurant.id,
                restaurantId: restaurant.id,
                restaurantName: restaurant.name || '',
                restaurantSlug: restaurant.slug || restaurant.id,
                cityId: restaurant.cityId || '',
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
                {restaurant.imageUrl ? (
                    <img alt={restaurant.name} className="h-72 w-full object-cover" src={restaurant.imageUrl} />
                ) : (
                    <div className="flex h-56 w-full items-center justify-center bg-slate-200 text-lg font-semibold text-slate-600">
                        {restaurant.name || 'Restoran'}
                    </div>
                )}
                <div className="p-6">
                    <p className="text-sm font-medium text-emerald-700">{city?.name || restaurant.cityId || 'Sehir bilgisi bekleniyor'}</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-950">{restaurant.name}</h1>
                    <p className="mt-3 max-w-3xl leading-7 text-slate-700">{restaurant.description || restaurant.address || 'Restoran aciklamasi bekleniyor.'}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-4">
                        <StartRating rating={restaurant.averageRating} reviewCount={restaurant.reviewCount} />
                        {city && (
                            <Link className="text-sm font-medium text-red-700 hover:text-red-900" to={`/cities/${city.slug || city.id}`}>
                                {city.name} rehberine git
                            </Link>
                        )}
                    </div>
                </div>
            </article>

            <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
                <div className="rounded border bg-white p-5">
                    <h2 className="font-semibold text-slate-950">Konum</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{restaurant.address || 'Adres bilgisi bekleniyor.'}</p>
                    {coordinate ? (
                        <p className="mt-3 rounded bg-slate-50 p-3 text-sm text-slate-700">
                            Enlem: {coordinate.latitude.toFixed(4)} / Boylam: {coordinate.longitude.toFixed(4)}
                        </p>
                    ) : (
                        <p className="mt-3 rounded bg-slate-50 p-3 text-sm text-slate-500">Harita icin geoPoint/location alani bekleniyor.</p>
                    )}
                </div>

                <div className="rounded border bg-white p-5">
                    <h2 className="font-semibold text-slate-950">Sehirde One Cikan Lezzetler</h2>
                    {!foods.length && <p className="mt-3 text-sm text-slate-500">Bu sehir icin lezzet kaydi bekleniyor.</p>}
                    <div className="mt-3 space-y-3">
                        {foods.map((food) => (
                            <Link className="block rounded border p-3 text-sm hover:border-slate-400" key={food.id} to={`/foods/${food.slug || food.id}`}>
                                <span className="font-medium text-slate-900">{food.name}</span>
                                <StartRating className="mt-1" rating={food.averageRating} reviewCount={food.reviewCount} />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <ReviewForm currentUser={currentUser} disabled={submitting} onSubmit={handleReviewSubmit} />
            {submitError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError.message}</p>}

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-950">Restoran Yorumlari</h2>
                {reviewsLoading && <EmptyState>Yorumlar yukleniyor...</EmptyState>}
                {reviewsError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{reviewsError.message}</p>}
                {!reviewsLoading && !reviews.length && <EmptyState>Bu restoran icin onayli yorum bulunmuyor.</EmptyState>}
                {reviews.map((review) => (
                    <article className="rounded border bg-white p-5" key={review.id}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Link className="font-semibold text-slate-950 hover:text-red-800" to={`/users/${review.userId}`}>
                                {review.userName || 'Kullanici'}
                            </Link>
                            <span className="rounded bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                                {Number(review.rating || 0) ? `${Number(review.rating).toFixed(1)}/5` : 'Yeni'}
                            </span>
                        </div>
                        <p className="mt-3 leading-7 text-slate-700">{review.comment || 'Yorum metni bekleniyor.'}</p>
                        <Link className="mt-4 inline-flex text-sm font-medium text-red-700 hover:text-red-900" to={`/reviews/${review.id}`}>
                            Yorumu ac
                        </Link>
                    </article>
                ))}
            </section>
        </section>
    );
};

export default RestaurantPage;