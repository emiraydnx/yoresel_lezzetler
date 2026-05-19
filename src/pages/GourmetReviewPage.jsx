import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createReviewReply, useReviewDetail, useReviewReplies } from '../hooks/useReviews';

const Avatar = ({ name = 'K', photoURL, size = 'h-11 w-11' }) => {
  if (photoURL) {
    return <img alt={name} className={`${size} rounded-full object-cover`} src={photoURL} />;
  }

  return (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-800`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
};

const formatNumber = (value = 0) => Number(value || 0).toLocaleString('tr-TR');

const GourmetReviewPage = () => {
  const { reviewId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const { review, author, loading, error } = useReviewDetail(reviewId);
  const [replyText, setReplyText] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    replies,
    loading: repliesLoading,
    error: repliesError,
  } = useReviewReplies(reviewId, refreshKey);

  if (loading) {
    return (
      <section className="rounded border bg-white p-6">
        <p className="text-sm text-slate-500">Yorum yükleniyor...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded border border-red-200 bg-red-50 p-6">
        <h1 className="text-2xl font-bold text-red-800">Yorum yüklenemedi</h1>
        <p className="mt-2 text-sm text-red-700">{error.message}</p>
      </section>
    );
  }

  if (!review) {
    return (
      <section className="rounded border bg-white p-6">
        <h1 className="text-2xl font-bold">Yorum bulunamadı</h1>
        <Link className="mt-4 inline-flex rounded bg-slate-900 px-4 py-2 text-sm text-white" to="/">
          Ana Sayfaya Dön
        </Link>
      </section>
    );
  }

  const authorName = author?.displayName || review.userName || 'Kullanıcı';
  const authorPhotoURL = author?.photoURL || review.userPhotoURL || '';
  const authorTitle = author?.title || review.userTitle || 'Yöresel lezzet yorumcusu';
  const followerCount = author?.followerCount || review.followerCount || 0;
  const rating = Number(review.rating || 0);
  const foodPath = `/foods/${review.foodId || review.foodSlug || ''}`;
  const restaurantPath = `/restaurants/${review.restaurantId || review.restaurantSlug || ''}`;
  const locationText = [review.districtName, review.cityName].filter(Boolean).join('/');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser || !replyText.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      await createReviewReply({
        reviewId,
        userId: currentUser.uid,
        userName: userProfile?.displayName || currentUser.email || 'Kullanıcı',
        userPhotoURL: userProfile?.photoURL || '',
        comment: replyText.trim(),
      });
      setReplyText('');
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <Link className="text-sm font-medium text-red-700 hover:text-red-900" to="/">
        Ana sayfaya dön
      </Link>

      <article className="rounded border bg-white p-6">
        <div className="flex items-start gap-4">
          <Link to={`/users/${review.userId}`}>
            <Avatar name={authorName} photoURL={authorPhotoURL} size="h-14 w-14" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link className="text-lg font-semibold text-slate-950 hover:text-red-800" to={`/users/${review.userId}`}>
                {authorName}
              </Link>
              {author?.isVerified && (
                <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">Onayli hesap</span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {authorTitle} · {formatNumber(followerCount)} takipci
            </p>
            <p className="mt-4 text-sm font-semibold text-slate-900">
              <Link className="hover:text-red-800" to={foodPath}>
                {review.foodName || 'Yemek bilgisi bekleniyor'}
              </Link>
              <span className="font-normal text-slate-500"> / </span>
              <Link className="hover:text-red-800" to={restaurantPath}>
                {review.restaurantName || 'Restoran bilgisi bekleniyor'}
              </Link>
              {locationText && <span className="font-normal text-slate-500"> · {locationText}</span>}
            </p>
            <p className="mt-3 leading-7 text-slate-700">{review.comment || 'Yorum metni bekleniyor.'}</p>
          </div>
          <span className="rounded bg-amber-50 px-3 py-2 font-semibold text-amber-700">
            {rating ? `★ ${rating.toFixed(1)}` : 'Yeni'}
          </span>
        </div>
      </article>

      <form className="rounded border bg-white p-5" onSubmit={handleSubmit}>
        <h2 className="font-semibold text-slate-950">Yanit Yaz</h2>
        {currentUser ? (
          <>
            <textarea
              className="mt-3 min-h-28 w-full rounded border px-3 py-2 text-sm"
              onChange={(event) => setReplyText(event.target.value)}
              placeholder="Bu yoruma yanıtını yaz..."
              value={replyText}
            />
            {submitError && <p className="mt-2 text-sm text-red-700">{submitError.message}</p>}
            <button className="mt-3 rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60" disabled={submitting} type="submit">
              {submitting ? 'Gönderiliyor...' : 'Yanıtı Gönder'}
            </button>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Yanıt yazmak için <Link className="font-medium text-red-700" to="/login">giriş yap</Link>.
          </p>
        )}
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-950">Kullanıcı Yanıtları</h2>
        {repliesLoading && <p className="text-sm text-slate-500">Yanıtlar yükleniyor...</p>}
        {repliesError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{repliesError.message}</p>}
        {!repliesLoading && !replies.length && <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Bu yoruma henüz yanıt yazılmadı.</p>}
        {replies.map((reply) => (
          <article className="flex gap-3 rounded border bg-white p-4" key={reply.id}>
            <Avatar name={reply.userName || 'Kullanıcı'} photoURL={reply.userPhotoURL} />
            <div>
              <p className="font-medium text-slate-900">{reply.userName || 'Kullanıcı'}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{reply.comment}</p>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
};

export default GourmetReviewPage;
