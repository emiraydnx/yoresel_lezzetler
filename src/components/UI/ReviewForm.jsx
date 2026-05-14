import { useState } from 'react';
import { Link } from 'react-router-dom';
import StartRating from './StartRating';

const ReviewForm = ({ currentUser, disabled = false, onSubmit }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!currentUser) {
            return;
        }

        if (!comment.trim()) {
            setError('Yorum metni zorunlu.');
            setSuccessMessage('');
            return;
        }

        try {
            setError('');
            setSuccessMessage('');
            await onSubmit({ rating, comment: comment.trim() });
            setComment('');
            setRating(5);
            setSuccessMessage('Yorumun gonderildi. Admin onayindan sonra yayinda gorunecek.');
        } catch (err) {
            setError(err.message || 'Yorum gonderilemedi.');
            setSuccessMessage('');
        }
    };

    if (!currentUser) {
        return (
            <div className="rounded border border-dashed bg-white p-5 text-sm text-slate-600">
                Yorum yazmak icin{' '}
                <Link className="font-medium text-red-700 hover:text-red-900" to="/login">
                    giris yap
                </Link>
                .
            </div>
        );
    }

    return (
        <form className="rounded border bg-white p-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-semibold text-slate-950">Yorum Yaz</h2>
                    <p className="mt-1 text-sm text-slate-500">Yorum onaydan sonra herkese acik gorunur.</p>
                </div>
                <div className="text-sm font-medium text-slate-700">
                    Puan
                    <StartRating
                        className="mt-1"
                        disabled={disabled}
                        interactive
                        onChange={setRating}
                        rating={rating}
                        showReviewCount={false}
                    />
                </div>
            </div>

            <textarea
                className="mt-4 min-h-28 w-full rounded border px-3 py-2 text-sm"
                disabled={disabled}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Deneyimini kisaca yaz..."
                value={comment}
            />
            {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
            {successMessage && <p className="mt-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{successMessage}</p>}
            <button className="mt-3 rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60" disabled={disabled} type="submit">
                {disabled ? 'Gonderiliyor...' : 'Yorumu Gonder'}
            </button>
        </form>
    );
};

export default ReviewForm;