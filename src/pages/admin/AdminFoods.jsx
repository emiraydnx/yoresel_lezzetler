import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminCollection } from '../../hooks/useAdminCollection';

const emptyForm = {
    averageRating: 0,
    cityId: '',
    description: '',
    imageUrl: '',
    isFeatured: true,
    name: '',
    regionId: '',
    reviewCount: 0,
    slug: '',
};

const toSlug = (value = '') =>
    value
        .toLocaleLowerCase('tr-TR')
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

const normalizeFood = (form) => ({
    ...form,
    averageRating: Number(form.averageRating || 0),
    reviewCount: Number(form.reviewCount || 0),
    slug: form.slug || toSlug(form.name),
});

const AdminFoods = () => {
    const { createItem, deleteItem, error, items: foods, loading, submitting, updateItem } = useAdminCollection('foods');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value,
            ...(name === 'name' && !editingId ? { slug: toSlug(value) } : {}),
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const payload = normalizeFood(form);

        if (editingId) {
            await updateItem(editingId, payload);
        } else {
            await createItem(payload);
        }

        setForm(emptyForm);
        setEditingId(null);
    };

    const handleEdit = (food) => {
        setEditingId(food.id);
        setForm({
            averageRating: food.averageRating || 0,
            cityId: food.cityId || '',
            description: food.description || '',
            imageUrl: food.imageUrl || '',
            isFeatured: Boolean(food.isFeatured),
            name: food.name || '',
            regionId: food.regionId || '',
            reviewCount: food.reviewCount || 0,
            slug: food.slug || food.id,
        });
    };

    const handleDelete = async (food) => {
        if (window.confirm(`${food.name || food.id} kaydi silinsin mi?`)) {
            await deleteItem(food.id);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-sm font-medium text-emerald-700">Admin / Foods</p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-950">Lezzet Yonetimi</h1>
                    <p className="mt-2 text-sm text-slate-600">foods collection icin listeleme, ekleme, duzenleme ve silme.</p>
                </div>
                <Link className="text-sm font-medium text-red-700 hover:text-red-900" to="/admin">
                    Admin panele don
                </Link>
            </div>

            <form className="grid gap-4 rounded border bg-white p-5 md:grid-cols-2" onSubmit={handleSubmit}>
                <label className="text-sm font-medium text-slate-700">
                    Ad
                    <input className="mt-1 w-full rounded border px-3 py-2" name="name" onChange={handleChange} required value={form.name} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Slug
                    <input className="mt-1 w-full rounded border px-3 py-2" name="slug" onChange={handleChange} required value={form.slug} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    City ID
                    <input className="mt-1 w-full rounded border px-3 py-2" name="cityId" onChange={handleChange} required value={form.cityId} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Region ID
                    <input className="mt-1 w-full rounded border px-3 py-2" name="regionId" onChange={handleChange} required value={form.regionId} />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    Aciklama
                    <textarea className="mt-1 min-h-24 w-full rounded border px-3 py-2" name="description" onChange={handleChange} value={form.description} />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    Image URL
                    <input className="mt-1 w-full rounded border px-3 py-2" name="imageUrl" onChange={handleChange} value={form.imageUrl} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Ortalama Puan
                    <input className="mt-1 w-full rounded border px-3 py-2" min="0" max="5" name="averageRating" onChange={handleChange} step="0.1" type="number" value={form.averageRating} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Yorum Sayisi
                    <input className="mt-1 w-full rounded border px-3 py-2" min="0" name="reviewCount" onChange={handleChange} type="number" value={form.reviewCount} />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input checked={form.isFeatured} name="isFeatured" onChange={handleChange} type="checkbox" />
                    One cikan lezzet
                </label>
                <div className="flex gap-3 md:col-span-2">
                    <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60" disabled={submitting} type="submit">
                        {editingId ? 'Guncelle' : 'Ekle'}
                    </button>
                    {editingId && (
                        <button className="rounded border px-4 py-2 text-sm" onClick={() => { setEditingId(null); setForm(emptyForm); }} type="button">
                            Vazgec
                        </button>
                    )}
                </div>
            </form>

            {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}
            {loading && <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Lezzetler yukleniyor...</p>}

            <div className="overflow-hidden rounded border bg-white">
                <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                    <span>Lezzet</span>
                    <span>Sehir</span>
                    <span>Puan</span>
                    <span>Islem</span>
                </div>
                {foods.map((food) => (
                    <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b px-4 py-3 text-sm last:border-b-0" key={food.id}>
                        <div>
                            <p className="font-medium text-slate-950">{food.name}</p>
                            <p className="text-xs text-slate-500">{food.slug || food.id}</p>
                        </div>
                        <span className="text-slate-600">{food.cityId || '-'}</span>
                        <span className="text-slate-600">{Number(food.averageRating || 0).toFixed(1)} / {Number(food.reviewCount || 0)} yorum</span>
                        <div className="flex gap-2">
                            <button className="rounded border px-3 py-1 text-xs" onClick={() => handleEdit(food)} type="button">Duzenle</button>
                            <button className="rounded border border-red-200 px-3 py-1 text-xs text-red-700" onClick={() => handleDelete(food)} type="button">Sil</button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AdminFoods;