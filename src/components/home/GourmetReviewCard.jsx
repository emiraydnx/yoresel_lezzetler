import { Link } from 'react-router-dom';

const formatFollowerCount = (count = 0) => {
  const numericCount = Number(count || 0);

  if (numericCount >= 1000) {
    return `${(numericCount / 1000).toFixed(1)} bin`;
  }

  return String(numericCount);
};

const Avatar = ({ name = 'K', photoURL }) => {
  if (photoURL) {
    return <img alt={name} className="h-12 w-12 rounded-full object-cover" src={photoURL} />;
  }

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-800">
      {name.charAt(0).toUpperCase()}
    </span>
  );
};

const GourmetReviewCard = ({ review }) => {
  const userName = review.userName || 'Kullanici';
  const userProfilePath = `/users/${review.userId || review.id}`;
  const rating = Number(review.rating || 0);
  const foodName = review.foodName || 'Yemek bilgisi bekleniyor';
  const restaurantName = review.restaurantName || 'Restoran bilgisi bekleniyor';
  const foodPath = `/foods/${review.foodId || review.foodSlug || '#'}`;
  const restaurantPath = `/restaurants/${review.restaurantId || review.restaurantSlug || '#'}`;
  const locationText = [review.districtName, review.cityName].filter(Boolean).join('/');

  return (
    <article className="rounded border bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <Link aria-label={`${userName} profilini goruntule`} to={userProfilePath}>
          <Avatar name={userName} photoURL={review.userPhotoURL} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link className="font-semibold text-slate-950 hover:text-red-800" to={userProfilePath}>
              {userName}
            </Link>
            {review.userIsVerified && (
              <span className="rounded bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">Onayli</span>
            )}
          </div>
          <p className="text-xs text-slate-500">{review.userTitle || 'Yoresel lezzet yorumcusu'}</p>
          <p className="mt-1 text-xs font-medium text-slate-600">{formatFollowerCount(review.followerCount)} takipci</p>
        </div>
        <span className="rounded bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-700">
          {rating ? `★ ${rating.toFixed(1)}` : 'Yeni'}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-900">
          <Link className="hover:text-red-800" to={foodPath}>
            {foodName}
          </Link>
          <span className="font-normal text-slate-500"> / </span>
          <Link className="hover:text-red-800" to={restaurantPath}>
            {restaurantName}
          </Link>
        </p>
        {locationText && (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <span aria-hidden="true">📍</span>
            <span>{locationText}</span>
          </p>
        )}
        <Link className="mt-2 block" to={`/reviews/${review.id}`}>
          <p className="line-clamp-4 text-sm leading-6 text-slate-600">{review.comment || 'Yorum metni bekleniyor.'}</p>
          <p className="mt-4 text-sm font-medium text-red-700">{Number(review.replyCount || 0)} yanit</p>
        </Link>
      </div>
    </article>
  );
};

export default GourmetReviewCard;
