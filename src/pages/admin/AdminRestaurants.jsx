import { useState } from 'react';
import { Link } from 'react-router-dom';
import { importRestaurantLocations, searchRestaurantLocations } from '../../firebase/restaurantLocationApi';
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
        refresh,
        submitting,
        updateItem,
    } = useAdminCollection('restaurants');
    const { items: cities } = useAdminCollection('cities');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [apiForm, setApiForm] = useState({
        cityId: '',
        pageSize: 10,
        query: 'restoran',
        radiusKm: 50,
    });
    const [apiCandidates, setApiCandidates] = useState([]);
    const [selectedPlaceIds, setSelectedPlaceIds] = useState([]);
    const [apiSearchMeta, setApiSearchMeta] = useState(null);
    const [apiLoading, setApiLoading] = useState(false);
    const [apiImporting, setApiImporting] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [apiResult, setApiResult] = useState(null);

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

    const handleApiFormChange = (event) => {
        const { name, value } = event.target;

        setApiForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleApiSearch = async (event) => {
        event.preventDefault();
        setApiLoading(true);
        setApiError(null);
        setApiResult(null);
        setApiCandidates([]);
        setSelectedPlaceIds([]);

        try {
            const selectedCity = cities.find((city) => city.id === apiForm.cityId);

            if (!selectedCity) {
                throw new Error('Önce bir Şehir seç.');
            }

            const data = await searchRestaurantLocations({
                city: selectedCity,
                pageSize: Number(apiForm.pageSize || 10),
                query: apiForm.query,
                radiusMeters: Number(apiForm.radiusKm || 50) * 1000,
            });

            setApiCandidates(data.restaurants || []);
            setSelectedPlaceIds((data.restaurants || []).map((restaurant) => restaurant.sourcePlaceId));
            setApiSearchMeta({
                city: data.city,
                query: data.query,
            });
        } catch (err) {
            setApiError(err);
        } finally {
            setApiLoading(false);
        }
    };

    const toggleCandidate = (sourcePlaceId) => {
        setSelectedPlaceIds((current) =>
            current.includes(sourcePlaceId)
                ? current.filter((id) => id !== sourcePlaceId)
                : [...current, sourcePlaceId]
        );
    };

    const handleApiImport = async () => {
        const selectedRestaurants = apiCandidates.filter((restaurant) =>
            selectedPlaceIds.includes(restaurant.sourcePlaceId)
        );

        if (!selectedRestaurants.length) {
            setApiError(new Error('İçe aktarmak için en az bir restoran seç.'));
            return;
        }

        setApiImporting(true);
        setApiError(null);
        setApiResult(null);

        try {
            const selectedCity = cities.find((city) => city.id === apiForm.cityId);

            if (!selectedCity) {
                throw new Error('Önce bir Şehir seç.');
            }

            const result = await importRestaurantLocations({
                city: selectedCity,
                restaurants: selectedRestaurants,
            });

            setApiResult(result);
            setSelectedPlaceIds([]);
            setApiCandidates([]);
            setApiSearchMeta(null);
            await refresh();
        } catch (err) {
            setApiError(err);
        } finally {
            setApiImporting(false);
        }
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
        if (window.confirm(`${restaurant.name || restaurant.id} kaydı silinsin mi?`)) {
            await deleteItem(restaurant.id);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-sm font-medium text-emerald-700">Admin / Restaurants</p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-950">Restoran Yönetimi</h1>
                    <p className="mt-2 text-sm text-slate-600">restaurants collection için temel CRUD ekranı.</p>
                </div>
                <Link className="text-sm font-medium text-red-700 hover:text-red-900" to="/admin">
                    Admin panele dön
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
                    Açıklama
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
            {loading && <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Restoranlar yükleniyor...</p>}

            <section className="rounded border bg-white p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-emerald-700">API ile restoran konumu</p>
                        <h2 className="mt-1 text-lg font-bold text-slate-950">OpenStreetMap adaylarini cek</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            Bu arac sadece restoran adi, adres, koordinat ve OpenStreetMap id alanlarini alir. Puan ve yorumlar
                            Firestore reviews akisiyle yonetilmeye devam eder.
                        </p>
                    </div>
                </div>

                <form className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_120px_120px_auto]" onSubmit={handleApiSearch}>
                    <label className="text-sm font-medium text-slate-700">
                        Şehir
                        <select
                            className="mt-1 w-full rounded border px-3 py-2"
                            name="cityId"
                            onChange={handleApiFormChange}
                            required
                            value={apiForm.cityId}
                        >
                            <option value="">Şehir seç</option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                    {city.name || city.id}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                        Arama
                        <input
                            className="mt-1 w-full rounded border px-3 py-2"
                            name="query"
                            onChange={handleApiFormChange}
                            placeholder="restoran, kebapci, lokanta"
                            value={apiForm.query}
                        />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                        Limit
                        <input
                            className="mt-1 w-full rounded border px-3 py-2"
                            max="20"
                            min="1"
                            name="pageSize"
                            onChange={handleApiFormChange}
                            type="number"
                            value={apiForm.pageSize}
                        />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                        Yaricap km
                        <input
                            className="mt-1 w-full rounded border px-3 py-2"
                            max="100"
                            min="1"
                            name="radiusKm"
                            onChange={handleApiFormChange}
                            type="number"
                            value={apiForm.radiusKm}
                        />
                    </label>
                    <div className="flex items-end">
                        <button
                            className="w-full rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                            disabled={apiLoading || apiImporting}
                            type="submit"
                        >
                            {apiLoading ? 'Aranıyor...' : 'API ile ara'}
                        </button>
                    </div>
                </form>

                {apiError && <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{apiError.message}</p>}
                {apiResult && (
                    <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                        {apiResult.created} yeni restoran eklendi, {apiResult.updated} restoran güncellendi.
                    </p>
                )}
                {apiSearchMeta && !apiLoading && apiCandidates.length > 0 && (
                    <div className="mt-4 rounded border border-slate-200">
                        <div className="flex flex-col gap-2 border-b bg-slate-50 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
                            <span className="text-slate-600">
                                Sorgu: <span className="font-medium text-slate-900">{apiSearchMeta.query}</span>
                            </span>
                            <button
                                className="rounded bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-60"
                                disabled={apiImporting || selectedPlaceIds.length === 0}
                                onClick={handleApiImport}
                                type="button"
                            >
                                {apiImporting ? 'Aktarılıyor...' : `${selectedPlaceIds.length} restoranı aktar`}
                            </button>
                        </div>
                        <div className="divide-y">
                            {apiCandidates.map((restaurant) => (
                                <label
                                    className="grid cursor-pointer grid-cols-[auto_1fr] gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                                    key={restaurant.sourcePlaceId}
                                >
                                    <input
                                        checked={selectedPlaceIds.includes(restaurant.sourcePlaceId)}
                                        className="mt-1"
                                        onChange={() => toggleCandidate(restaurant.sourcePlaceId)}
                                        type="checkbox"
                                    />
                                    <span>
                                        <span className="flex items-start gap-3">
                                            {restaurant.imageUrl && (
                                                <img
                                                    alt={restaurant.name}
                                                    className="h-12 w-12 rounded object-cover"
                                                    src={restaurant.imageUrl}
                                                />
                                            )}
                                            <span className="min-w-0">
                                                <span className="block font-medium text-slate-950">{restaurant.name}</span>
                                                <span className="mt-1 block text-xs text-slate-500">
                                                    {restaurant.address || 'OSM kaydında adres bilgisi yok'}
                                                </span>
                                            </span>
                                        </span>
                                        <span className="mt-1 block text-xs text-slate-400">
                                            OSM ID: {restaurant.sourcePlaceId}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                {apiSearchMeta && !apiLoading && apiCandidates.length === 0 && (
                    <p className="mt-4 rounded border border-dashed p-3 text-sm text-slate-500">OpenStreetMap bu sorgu için restoran döndürmedi.</p>
                )}
            </section>

            <div className="overflow-hidden rounded border bg-white">
                <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                    <span>Restoran</span>
                    <span>Şehir</span>
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
                            <button className="rounded border px-3 py-1 text-xs" onClick={() => handleEdit(restaurant)} type="button">Düzenle</button>
                            <button className="rounded border border-red-200 px-3 py-1 text-xs text-red-700" onClick={() => handleDelete(restaurant)} type="button">Sil</button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AdminRestaurants;
