import { useState } from 'react';
import { Link } from 'react-router-dom';
import StartRating from './StartRating';

const getSubmitErrorMessage = (error) => {
    if (error?.code === 'permission-denied') {
        return 'Yorum gonderilemedi. E-posta dogruladiysan cikis yapip tekrar giris yap veya sayfayi yenile.';
    }

    return error?.message || 'Yorum gonderilemedi.';
};

const ReviewForm = ({ currentUser, disabled = false, onSubmit }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitState, setSubmitState] = useState({ status: 'idle', message: '' });
    const isSubmitting = disabled || submitState.status === 'loading';

    const resetMessage = () => {
        if (submitState.status !== 'loading') {
            setSubmitState({ status: 'idle', message: '' });
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!currentUser) {
            return;
        }

        if (!comment.trim()) {
            setSubmitState({ status: 'error', message: 'Yorum metni zorunlu.' });
            return;
        }

        try {
            setSubmitState({ status: 'loading', message: 'Yorum gonderiliyor...' });

            if (currentUser.emailVerified === false) {
                await currentUser.reload?.();

                if (currentUser.emailVerified === false) {
                    setSubmitState({
                        status: 'error',
                        message: 'Yorum gonderebilmek icin once e-posta adresini dogrulaman gerekiyor.',
                    });
                    return;
                }
            }

            await currentUser.getIdToken?.(true);
            await onSubmit({ rating, comment: comment.trim() });
            setComment('');
            setRating(5);
            setSubmitState({ status: 'success', message: 'Yorumun gonderildi. Admin onayindan sonra yayinda gorunecek.' });
        } catch (err) {
            setSubmitState({ status: 'error', message: getSubmitErrorMessage(err) });
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
                        disabled={isSubmitting}
                        interactive
                        onChange={(nextRating) => {
                            setRating(nextRating);
                            resetMessage();
                        }}
                        rating={rating}
                        showReviewCount={false}
                    />
                </div>
            </div>

            <textarea
                className="mt-4 min-h-28 w-full rounded border px-3 py-2 text-sm"
                disabled={isSubmitting}
                onChange={(event) => {
                    setComment(event.target.value);
                    resetMessage();
                }}
                placeholder="Deneyimini kisaca yaz..."
                value={comment}
            />
            {submitState.message && (
                <p
                    aria-live="polite"
                    className={
                        submitState.status === 'success'
                            ? 'mt-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700'
                            : 'mt-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700'
                    }
                >
                    {submitState.message}
                </p>
            )}
            <button className="mt-3 rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Gonderiliyor...' : 'Yorumu Gonder'}
            </button>
        </form>
    );
};

export default ReviewForm;
