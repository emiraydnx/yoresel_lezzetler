import { Link } from 'react-router-dom';
import { useTopRegions } from '../hooks/useRegions';
import { useTopFoods } from '../hooks/useFoods';
import { useTopRestaurants } from '../hooks/useRestaurants';
import TurkeyMap from '../components/map/TurkeyMap';
import GourmetReviewCard from '../components/home/GourmetReviewCard';
import { regionColors } from '../data/turkeyRegionsGeo';
import { useFeaturedGourmetReviews } from '../hooks/useReviews';

const formatSlug = (value = '') =>
  value
    .replace(/_/g, '-')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getRating = (item) => Number(item?.averageRating || 0);
const getReviewCount = (item) => Number(item?.reviewCount || 0);

const RatingBadge = ({ rating, reviewCount }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="font-semibold text-amber-700">★ {rating ? rating.toFixed(1) : 'Yeni'}</span>
    <span className="text-slate-400">/</span>
    <span className="text-slate-500">{reviewCount} yorum</span>
  </div>
);

const SectionHeader = ({ title, description, linkTo, linkText }) => (
  <div className="flex flex-col gap-3 border-b pb-3 md:flex-row md:items-end md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>
    </div>
    {linkTo && (
      <Link className="text-sm font-medium text-red-700 hover:text-red-900" to={linkTo}>
        {linkText}
      </Link>
    )}
  </div>
);

const HomePage = () => {
  const { regions: topRegions, loading: topRegionsLoading, error: topRegionsError } = useTopRegions(3);
  const { foods, loading: foodsLoading, error: foodsError } = useTopFoods(8);
  const { restaurants, loading: restaurantsLoading, error: restaurantsError } = useTopRestaurants(4);
  const {
    reviews: gourmetReviews,
    loading: gourmetReviewsLoading,
    error: gourmetReviewsError,
  } = useFeaturedGourmetReviews(3);

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium text-emerald-700">Yöresel Lezzet Rehberi</p>
        <h1 className="mt-2 text-3xl font-bold">Yöresel Lezzetler</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Türkiye'nin bölgelerine, şehirlerine ve öne çıkan restoranlarına göre yöresel lezzetleri keşfet.
        </p>
      </section>

      <TurkeyMap />

      <section className="space-y-4">
        <SectionHeader
          description="Kullanıcı puanları ve yorum sayılarına göre lezzetleriyle öne çıkan bölgeler."
          title="Lezzetleriyle Öne Çıkan Bölgeler"
        />
        {topRegionsLoading && <p className="text-sm text-slate-500">Bölge sıralaması hazırlanıyor...</p>}
        {topRegionsError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{topRegionsError.message}</p>}
        {!topRegionsLoading && !topRegions.length && (
          <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">
            Firestore regions collection'ında gösterilecek bölge bulunamadı.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {topRegions.map((region, index) => (
            <Link
              className="rounded border bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"
              key={region.id}
              to={`/regions/${region.slug || region.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">#{index + 1} Bölge</p>
                  <h3 className="mt-1 font-semibold text-slate-950">{region.name}</h3>
                </div>
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: region.color || regionColors[region.id] || '#94a3b8' }} />
              </div>
              <p className="mt-4 text-sm text-slate-600">Öne çıkan lezzet: {region.topFoodName}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <RatingBadge rating={region.averageRating} reviewCount={region.totalReviews} />
                <span className="text-slate-500">{region.foodCount} lezzet</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Türkiye genelindeki kullanıcı değerlendirmelerine göre en yüksek puan alan yöresel lezzetler."
          linkText="Tümünü Gör"
          linkTo="/top-foods"
          title="En Sevilen Lezzetler"
        />
        {foodsLoading && <p className="text-sm text-slate-500">Lezzetler yükleniyor...</p>}
        {foodsError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{foodsError.message}</p>}
        {!foodsLoading && !foods.length && (
          <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">
            Firestore foods collection'ında averageRating alanı olan lezzet bulunamadı.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {foods.slice(0, 6).map((food) => (
            <Link
              className="overflow-hidden rounded border bg-white transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"
              key={food.id}
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
                <div>
                  <h3 className="font-semibold text-slate-950">{food.name || 'Lezzet bilgisi bekleniyor'}</h3>
                  <p className="mt-1 text-sm text-slate-500">{formatSlug(food.cityId)} yöresel lezzeti</p>
                </div>
                <RatingBadge rating={getRating(food)} reviewCount={getReviewCount(food)} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Konum, puan ve yorum sayısıyla Türkiye genelinde öne çıkan restoranlar."
          linkText="Tümünü Gör"
          linkTo="/top-restaurants"
          title="En Yüksek Puanlı Restoranlar"
        />
        {restaurantsLoading && <p className="text-sm text-slate-500">Restoranlar yükleniyor...</p>}
        {restaurantsError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{restaurantsError.message}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {restaurants.map((restaurant) => (
            <Link
              className="flex gap-4 rounded border bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"
              key={restaurant.id}
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
                <h3 className="font-semibold text-slate-950">{restaurant.name}</h3>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {restaurant.address || `${formatSlug(restaurant.cityId)} konumunda`}
                </p>
                <div className="mt-3">
                  <RatingBadge rating={getRating(restaurant)} reviewCount={getReviewCount(restaurant)} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Takip edilen gurmelerin yemekler hakkındaki puanlı yorumları ve kullanıcı yanıtları."
          linkText="Tüm Yorumlar"
          linkTo="/reviews"
          title="Gurmelerden Öne Çıkan Yorumlar"
        />
        {gourmetReviewsLoading && <p className="text-sm text-slate-500">Gurme yorumları yükleniyor...</p>}
        {gourmetReviewsError && (
          <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{gourmetReviewsError.message}</p>
        )}
        {!gourmetReviewsLoading && !gourmetReviews.length && (
          <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">
            Henüz öne çıkan gurme yorumu yok. Firestore reviews collection içinde isFeatured true olan yorumlar
            eklendiğinde bu alan otomatik dolacak.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {gourmetReviews.map((review) => (
            <GourmetReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
