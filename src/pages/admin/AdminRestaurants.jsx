import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminCollection } from '../../hooks/useAdminCollection';

const emptyForm = {
    address: '',
    averageRating: 0,
    cityId: '',
    description: '',
    imageUrl: '',
    latitude: '',
    longitude: '',
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

const normalizeRestaurant = ({ latitude, longitude, ...form }) => {
    const payload = {
        ...form,
        averageRating: Number(form.averageRating || 0),
        reviewCount: Number(form.reviewCount || 0),
        slug: form.slug || toSlug(form.name),
    };

    if (latitude !== '' && longitude !== '') {
        payload.location = [Number(latitude), Number(longitude)];
    }

    return payload;
};

const AdminRestaurants = () => {
    const {
        createItem,
        deleteItem,
        error,
        items: restaurants,
        loading,
        submitting,
        updateItem,
    } = useAdminCollection('restaurants');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: value,
            ...(name === 'name' && !editingId ? { slug: toSlug(value) } : {}),
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const payload = normalizeRestaurant(form);

        if (editingId) {
            await updateItem(editingId, payload);
        } else {
            await createItem(payload);
        }

        setForm(emptyForm);
        setEditingId(null);
    };

    const handleEdit = (restaurant) => {
        const point = restaurant.location || restaurant.geoPoint;

        setEditingId(restaurant.id);
        setForm({
            address: restaurant.address || '',
            averageRating: restaurant.averageRating || 0,
            cityId: restaurant.cityId || '',
            description: restaurant.description || '',
            imageUrl: restaurant.imageUrl || '',
            latitude: Array.isArray(point) ? point[0] : point?.latitude || '',
            longitude: Array.isArray(point) ? point[1] : point?.longitude || '',
            name: restaurant.name || '',
            regionId: restaurant.regionId || '',
            reviewCount: restaurant.reviewCount || 0,
            slug: restaurant.slug || restaurant.id,
        });
    };

    const handleDelete = async (restaurant) => {
        if (window.confirm(`${restaurant.name || restaurant.id} kaydi silinsin mi?`)) {
            await deleteItem(restaurant.id);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-sm font-medium text-emerald-700">Admin / Restaurants</p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-950">Restoran Yonetimi</h1>
                    <p className="mt-2 text-sm text-slate-600">restaurants collection icin temel CRUD ekrani.</p>
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
                    <input className="mt-1 w-full rounded border px-3 py-2" name="regionId" onChange={handleChange} value={form.regionId} />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    Adres
                    <input className="mt-1 w-full rounded border px-3 py-2" name="address" onChange={handleChange} value={form.address} />
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
                    Latitude
                    <input className="mt-1 w-full rounded border px-3 py-2" name="latitude" onChange={handleChange} step="0.0001" type="number" value={form.latitude} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Longitude
                    <input className="mt-1 w-full rounded border px-3 py-2" name="longitude" onChange={handleChange} step="0.0001" type="number" value={form.longitude} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Ortalama Puan
                    <input className="mt-1 w-full rounded border px-3 py-2" min="0" max="5" name="averageRating" onChange={handleChange} step="0.1" type="number" value={form.averageRating} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Yorum Sayisi
                    <input className="mt-1 w-full rounded border px-3 py-2" min="0" name="reviewCount" onChange={handleChange} type="number" value={form.reviewCount} />
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
            {loading && <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Restoranlar yukleniyor...</p>}

            <div className="overflow-hidden rounded border bg-white">
                <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                    <span>Restoran</span>
                    <span>Sehir</span>
                    <span>Puan</span>
                    <span>Islem</span>
                </div>
                {restaurants.map((restaurant) => (
                    <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b px-4 py-3 text-sm last:border-b-0" key={restaurant.id}>
                        <div>
                            <p className="font-medium text-slate-950">{restaurant.name}</p>
                            <p className="text-xs text-slate-500">{restaurant.address || restaurant.slug || restaurant.id}</p>
                        </div>
                        <span className="text-slate-600">{restaurant.cityId || '-'}</span>
                        <span className="text-slate-600">{Number(restaurant.averageRating || 0).toFixed(1)} / {Number(restaurant.reviewCount || 0)} yorum</span>
                        <div className="flex gap-2">
                            <button className="rounded border px-3 py-1 text-xs" onClick={() => handleEdit(restaurant)} type="button">Duzenle</button>
                            <button className="rounded border border-red-200 px-3 py-1 text-xs text-red-700" onClick={() => handleDelete(restaurant)} type="button">Sil</button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AdminRestaurants;