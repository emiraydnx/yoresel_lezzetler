import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminCollection } from '../../hooks/useAdminCollection';

const emptyForm = {
    cityName: '',
    comment: '',
    foodId: '',
    foodName: '',
    isFeatured: false,
    rating: 5,
    restaurantId: '',
    restaurantName: '',
    status: 'approved',
    targetId: '',
    targetType: 'food',
    userId: '',
    userName: '',
};

const normalizeReview = (form, selectedTarget) => {
    const targetName = selectedTarget?.name || '';

    return {
        ...form,
        cityId: selectedTarget?.cityId || form.cityId || '',
        cityName: form.cityName || '',
        foodId: form.targetType === 'food' ? form.targetId : '',
        foodName: form.targetType === 'food' ? targetName : '',
        isFeatured: Boolean(form.isFeatured),
        rating: Number(form.rating || 0),
        restaurantId: form.targetType === 'restaurant' ? form.targetId : '',
        restaurantName: form.targetType === 'restaurant' ? targetName : '',
    };
};

const AdminReviews = () => {
    const { createItem, deleteItem, error, items: reviews, loading, submitting, updateItem } = useAdminCollection('reviews', 'status');
    const { items: foods, loading: foodsLoading } = useAdminCollection('foods');
    const { items: restaurants, loading: restaurantsLoading } = useAdminCollection('restaurants');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');

    const targetOptions = useMemo(
        () => (form.targetType === 'food' ? foods : restaurants),
        [foods, form.targetType, restaurants]
    );
    const selectedTarget = targetOptions.find((item) => item.id === form.targetId);
    const targetLoading = form.targetType === 'food' ? foodsLoading : restaurantsLoading;
    const hasLegacyTarget = form.targetId && !selectedTarget;

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value,
            ...(name === 'targetType'
                ? {
                    foodId: '',
                    foodName: '',
                    restaurantId: '',
                    restaurantName: '',
                    targetId: '',
                }
                : {}),
        }));
    };

    const handleTargetChange = (event) => {
        const targetId = event.target.value;
        const target = targetOptions.find((item) => item.id === targetId);

        setForm((current) => ({
            ...current,
            cityName: current.cityName || target?.cityName || target?.cityId || '',
            foodId: current.targetType === 'food' ? targetId : '',
            foodName: current.targetType === 'food' ? target?.name || '' : '',
            restaurantId: current.targetType === 'restaurant' ? targetId : '',
            restaurantName: current.targetType === 'restaurant' ? target?.name || '' : '',
            targetId,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const payload = normalizeReview(form, selectedTarget);

        if (editingId) {
            await updateItem(editingId, payload);
            setStatusMessage('Yorum güncellendi. Cloud Functions deploy edildiyse ilgili puan ve yorum sayısı otomatik yenilenir.');
        } else {
            await createItem(payload);
            setStatusMessage('Yorum eklendi. Onaylı kayıtlar için istatistikleri Cloud Functions günceller.');
        }

        setForm(emptyForm);
        setEditingId(null);
    };

    const handleEdit = (review) => {
        setEditingId(review.id);
        setForm({
            cityName: review.cityName || '',
            comment: review.comment || '',
            foodId: review.foodId || '',
            foodName: review.foodName || '',
            isFeatured: Boolean(review.isFeatured),
            rating: review.rating || 5,
            restaurantId: review.restaurantId || '',
            restaurantName: review.restaurantName || '',
            status: review.status || 'approved',
            targetId: review.targetId || review.foodId || review.restaurantId || '',
            targetType: review.targetType || 'food',
            userId: review.userId || '',
            userName: review.userName || '',
        });
    };

    const handleDelete = async (review) => {
        if (window.confirm(`${review.userName || review.userId || review.id} yorumu silinsin mi?`)) {
            await deleteItem(review.id);
            setStatusMessage('Yorum silindi. Cloud Functions deploy edildiyse ilgili istatistikler otomatik yenilenir.');
        }
    };

    const handleQuickStatus = async (review, status) => {
        await updateItem(review.id, { status });
        setStatusMessage(
            status === 'approved'
                ? 'Yorum onaylandı. Ortalama puan ve yorum sayısını Cloud Functions günceller.'
                : 'Yorum reddedildi. Ortalama puan ve yorum sayısını Cloud Functions günceller.'
        );
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-sm font-medium text-emerald-700">Admin / Reviews</p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-950">Yorum Yönetimi</h1>
                    <p className="mt-2 text-sm text-slate-600">reviews collection için onay, düzenleme, ekleme ve silme.</p>
                </div>
                <Link className="text-sm font-medium text-red-700 hover:text-red-900" to="/admin">
                    Admin panele dön
                </Link>
            </div>

            <form className="grid gap-4 rounded border bg-white p-5 md:grid-cols-2" onSubmit={handleSubmit}>
                <label className="text-sm font-medium text-slate-700">
                    User ID
                    <input className="mt-1 w-full rounded border px-3 py-2" name="userId" onChange={handleChange} required value={form.userId} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Kullanıcı Adı
                    <input className="mt-1 w-full rounded border px-3 py-2" name="userName" onChange={handleChange} value={form.userName} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Target Type
                    <select className="mt-1 w-full rounded border px-3 py-2" name="targetType" onChange={handleChange} value={form.targetType}>
                        <option value="food">food</option>
                        <option value="restaurant">restaurant</option>
                    </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Target ID
                    <select
                        className="mt-1 w-full rounded border px-3 py-2"
                        disabled={targetLoading}
                        name="targetId"
                        onChange={handleTargetChange}
                        required
                        value={form.targetId}
                    >
                        <option value="">{targetLoading ? 'Hedefler yükleniyor...' : 'Doküman ID seç'}</option>
                        {hasLegacyTarget && <option value={form.targetId}>Mevcut hedef: {form.targetId}</option>}
                        {targetOptions.map((target) => (
                            <option key={target.id} value={target.id}>
                                {target.name || target.slug || target.id} ({target.id})
                            </option>
                        ))}
                    </select>
                    <span className="mt-1 block text-xs text-slate-500">
                        Production istatistikleri dokuman ID uzerinden Cloud Functions hesaplar.
                    </span>
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Food ID
                    <input className="mt-1 w-full rounded border bg-slate-50 px-3 py-2" name="foodId" readOnly value={form.foodId} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Food Name
                    <input className="mt-1 w-full rounded border bg-slate-50 px-3 py-2" name="foodName" readOnly value={form.foodName} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Restaurant ID
                    <input className="mt-1 w-full rounded border bg-slate-50 px-3 py-2" name="restaurantId" readOnly value={form.restaurantId} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Restaurant Name
                    <input className="mt-1 w-full rounded border bg-slate-50 px-3 py-2" name="restaurantName" readOnly value={form.restaurantName} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Şehir
                    <input className="mt-1 w-full rounded border px-3 py-2" name="cityName" onChange={handleChange} value={form.cityName} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Durum
                    <select className="mt-1 w-full rounded border px-3 py-2" name="status" onChange={handleChange} value={form.status}>
                        <option value="approved">approved</option>
                        <option value="pending">pending</option>
                        <option value="rejected">rejected</option>
                    </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Puan
                    <input className="mt-1 w-full rounded border px-3 py-2" min="1" max="5" name="rating" onChange={handleChange} step="0.5" type="number" value={form.rating} />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input checked={form.isFeatured} name="isFeatured" onChange={handleChange} type="checkbox" />
                    Öne çıkan yorum
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    Yorum
                    <textarea className="mt-1 min-h-28 w-full rounded border px-3 py-2" name="comment" onChange={handleChange} required value={form.comment} />
                </label>
                <div className="flex gap-3 md:col-span-2">
                    <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60" disabled={submitting} type="submit">
                        {editingId ? 'Güncelle' : 'Ekle'}
                    </button>
                    {editingId && (
                        <button className="rounded border px-4 py-2 text-sm" onClick={() => { setEditingId(null); setForm(emptyForm); }} type="button">
                            Vazgec
                        </button>
                    )}
                </div>
            </form>

            {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}
            {statusMessage && <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{statusMessage}</p>}
            {loading && <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Yorumlar yükleniyor...</p>}

            <div className="space-y-3">
                {reviews.map((review) => (
                    <article className="rounded border bg-white p-4" key={review.id}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-slate-950">{review.userName || review.userId || 'Kullanıcı'}</p>
                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{review.status || 'approved'}</span>
                                    {review.isFeatured && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">featured</span>}
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                    {review.targetType || '-'} / {review.targetId || '-'} / {Number(review.rating || 0).toFixed(1)}
                                </p>
                                <p className="mt-3 leading-6 text-slate-700">{review.comment || 'Yorum metni yok.'}</p>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                                <button className="rounded border px-3 py-1 text-xs" onClick={() => handleQuickStatus(review, 'approved')} type="button">Onayla</button>
                                <button className="rounded border px-3 py-1 text-xs" onClick={() => handleQuickStatus(review, 'rejected')} type="button">Reddet</button>
                                <button className="rounded border px-3 py-1 text-xs" onClick={() => handleEdit(review)} type="button">Düzenle</button>
                                <button className="rounded border border-red-200 px-3 py-1 text-xs text-red-700" onClick={() => handleDelete(review)} type="button">Sil</button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default AdminReviews;
