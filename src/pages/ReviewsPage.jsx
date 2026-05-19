import GourmetReviewCard from '../components/home/GourmetReviewCard';
import { useRecentReviews } from '../hooks/useReviews';

const ReviewsPage = () => {
    const { reviews, loading, error } = useRecentReviews(60);

    return (
        <section className="space-y-6">
            <div>
                <p className="text-sm font-medium text-emerald-700">Gurme yorumlari</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950">Son Yorumlar</h1>
                <p className="mt-3 max-w-3xl text-slate-600">
                    Firestore reviews collection içindeki onaylı yorumlar kullanıcı bilgileriyle birlikte listelenir.
                </p>
            </div>

            {loading && <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Yorumlar yükleniyor...</p>}
            {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}
            {!loading && !reviews.length && (
                <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Henüz onaylı yorum bulunmuyor.</p>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                {reviews.map((review) => (
                    <GourmetReviewCard key={review.id} review={review} />
                ))}
            </div>
        </section>
    );
};

export default ReviewsPage;