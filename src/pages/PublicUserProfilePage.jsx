import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDocument } from '../firebase/firestore';
import { useFollowState } from '../hooks/useFollows';
import { useUserReviews } from '../hooks/useReviews';

const formatNumber = (value = 0) => Number(value || 0).toLocaleString('tr-TR');

const PublicUserProfilePage = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const { reviews, loading: reviewsLoading, error: reviewsError } = useUserReviews(userId);
  const {
    canFollow,
    error: followError,
    isFollowing,
    loading: followLoading,
    submitting: followSubmitting,
    toggleFollow,
  } = useFollowState(currentUser?.uid, userId);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        const userProfile = await getDocument('users', userId);

        if (isMounted) {
          setProfile(userProfile);
        }
      } catch (err) {
        if (isMounted) {
          setProfileError(err);
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (profileLoading) {
    return (
      <section className="rounded border bg-white p-6">
        <p className="text-sm text-slate-500">Kullanici profili yukleniyor...</p>
      </section>
    );
  }

  if (profileError) {
    return (
      <section className="rounded border border-red-200 bg-red-50 p-6">
        <h1 className="text-2xl font-bold text-red-800">Kullanici yuklenemedi</h1>
        <p className="mt-2 text-sm text-red-700">{profileError.message}</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="rounded border bg-white p-6">
        <h1 className="text-2xl font-bold">Kullanici bulunamadi</h1>
        <Link className="mt-4 inline-flex rounded bg-slate-900 px-4 py-2 text-sm text-white" to="/">
          Ana Sayfaya Don
        </Link>
      </section>
    );
  }

  const displayName = profile.displayName || profile.name || 'Kullanici';
  const title = profile.title || 'Yoresel lezzet yorumcusu';
  const followerCount = Number(profile.followerCount || 0);

  return (
    <section className="space-y-6">
      <div className="rounded border bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {profile.photoURL ? (
              <img alt={displayName} className="h-20 w-20 rounded-full object-cover" src={profile.photoURL} />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-800">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-950">{displayName}</h1>
                {profile.isVerified && (
                  <span className="rounded bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">Onayli hesap</span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">{title}</p>
              <p className="mt-2 text-sm font-medium text-slate-700">{formatNumber(followerCount)} takipci</p>
            </div>
          </div>
          {currentUser ? (
            <button
              className={`rounded px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${isFollowing ? 'border bg-white text-slate-700' : 'bg-slate-900 text-white'}`}
              disabled={!canFollow || followLoading || followSubmitting}
              onClick={toggleFollow}
              type="button"
            >
              {currentUser.uid === userId ? 'Kendi profilin' : isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
            </button>
          ) : (
            <Link className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" to="/login">
              Takip icin giris yap
            </Link>
          )}
        </div>
        {followError && <p className="mt-4 text-sm text-red-700">{followError.message}</p>}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-950">Kullanici Yorumlari</h2>
        {reviewsLoading && <p className="text-sm text-slate-500">Yorumlar yukleniyor...</p>}
        {reviewsError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{reviewsError.message}</p>}
        {!reviewsLoading && !reviews.length && (
          <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">
            Bu kullanicinin henuz herkese acik yorumu yok.
          </p>
        )}
        {reviews.map((review) => {
          const rating = Number(review.rating || 0);

          return (
            <article className="rounded border bg-white p-5" key={review.id}>
              <p className="text-sm font-semibold text-slate-900">{review.foodName || 'Yemek bilgisi bekleniyor'}</p>
              <p className="mt-2 text-sm text-slate-500">
                <Link className="font-medium text-slate-700 hover:text-red-800" to={`/foods/${review.foodId || review.foodSlug || ''}`}>
                  {review.foodName || 'Yemek'}
                </Link>
                {' / '}
                <Link className="font-medium text-slate-700 hover:text-red-800" to={`/restaurants/${review.restaurantId || review.restaurantSlug || ''}`}>
                  {review.restaurantName || 'Restoran'}
                </Link>
                {review.cityName && ` · ${review.cityName}`}
                {rating ? ` · ★ ${rating.toFixed(1)}` : ''}
              </p>
              <p className="mt-3 leading-7 text-slate-700">{review.comment || 'Yorum metni bekleniyor.'}</p>
              <Link className="mt-4 inline-flex text-sm font-medium text-red-700 hover:text-red-900" to={`/reviews/${review.id}`}>
                Yorumu ve yanitlari gor
              </Link>
            </article>
          );
        })}
      </section>
    </section>
  );
};

export default PublicUserProfilePage;
